import { BaseService } from '../../../core/base.service';
import { Event, EventRegistration } from '../interfaces/events.interface';
import { EventRegistrationsRepository, EventsRepository } from '../repositories/events.repository';
import { BusinessRuleError, NotFoundError } from '../../../utils/errors';

/**
 * Event workflow (Chapter 13):
 *   Create -> Budget -> Approval -> Registration -> QR Ticket -> Attendance -> Reports -> Archive
 */
export class EventsService extends BaseService<Event> {
  constructor(
    private readonly eventsRepository: EventsRepository = new EventsRepository(),
    private readonly registrations: EventRegistrationsRepository = new EventRegistrationsRepository()
  ) {
    super(eventsRepository);
  }

  listPublic(page: number, pageSize: number) {
    return this.eventsRepository.listPublic(page, pageSize);
  }

  private normalizeEventPayload(data: any, userId?: string) {
    const allowedTypes = new Set([
      'weekly_fellowship','service','sunday_service','fellowship','worship_night','missions','mission',
      'evangelism','high_school_mission','retreat','conference','leadership_summit','bible_study',
      'prayer_retreat','training','agm','sgm','meeting','camp','empowerment','discipleship',
      'graduation_thanksgiving','other',
    ]);
    const type = allowedTypes.has(data.event_type) ? data.event_type : 'other';
    const status = data.status === 'cancelled' ? 'archived' : (data.status || 'approved');
    const startAt = data.start_at || (data.date ? `${data.date}T${data.start_time || '17:00'}:00` : new Date().toISOString());
    const endAt = data.end_at || (data.date ? `${data.date}T${data.end_time || '19:00'}:00` : null);
    return {
      id: data.id,
      title: String(data.title || '').trim(),
      event_type: type,
      description: data.description || null,
      speaker: data.speaker || data.preacher || null,
      topic: data.topic || data.theme || null,
      banner_url: data.banner_url || null,
      start_at: startAt,
      end_at: endAt,
      location: data.location || data.venue || null,
      organized_by: data.organized_by || userId,
      status,
      capacity: data.capacity ?? null,
      registration_deadline: data.registration_deadline || null,
    };
  }

  async create(data: Partial<Event>, userId?: string) {
    const payload = this.normalizeEventPayload(data, userId);
    if (!payload.title) throw new BusinessRuleError('Event title is required');
    if (!payload.organized_by) throw new BusinessRuleError('Authenticated organizer is required');
    return super.create(payload as never);
  }

  async update(eventId: string, data: Partial<Event>) {
    const existing = await this.getById(eventId);
    const payload = this.normalizeEventPayload({ ...existing, ...data });
    delete payload.id;
    delete payload.organized_by;
    return super.update(eventId, payload as never);
  }

  async approve(eventId: string) {
    const event = await this.getById(eventId);
    if (event.status !== 'budgeted') {
      throw new BusinessRuleError('An event must be budgeted before it can be approved');
    }
    return this.update(eventId, { status: 'approved' } as never);
  }

  async openRegistration(eventId: string) {
    const event = await this.getById(eventId);
    if (event.status !== 'approved') {
      throw new BusinessRuleError('An event must be approved before registration can open');
    }
    return this.update(eventId, { status: 'registration_open' } as never);
  }

  /** Online/walk-in registration with capacity-aware waitlisting and QR ticket issuance. */
  async register(eventId: string, params: { userId?: string; walkInName?: string }) {
    const event = await this.getById(eventId);
    if (event.status !== 'registration_open') {
      throw new BusinessRuleError('Registration is not currently open for this event');
    }
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      throw new BusinessRuleError('The registration deadline for this event has passed');
    }

    let status: EventRegistration['status'] = 'registered';
    if (event.capacity != null) {
      const confirmedCount = await this.registrations.countByStatus(eventId, 'registered');
      if (confirmedCount >= event.capacity) status = 'waitlisted';
    }

    return this.registrations.create({
      eventId,
      userId: params.userId ?? null,
      walkInName: params.walkInName ?? null,
      registrationType: params.userId ? 'online' : 'walk_in',
      status,
    });
  }

  async checkIn(qrCode: string) {
    const registration = await this.registrations.findByQrCode(qrCode);
    if (!registration) throw new NotFoundError('Registration');
    if (registration.status === 'attended') {
      throw new BusinessRuleError('This ticket has already been used to check in');
    }
    if (registration.status === 'cancelled') {
      throw new BusinessRuleError('This registration has been cancelled');
    }
    await this.registrations.markAttended(registration.id);
    return { ...registration, status: 'attended' as const };
  }

  async cancelRegistration(registrationId: string) {
    return this.registrations.cancel(registrationId);
  }

  async listRegistrations(eventId: string) {
    return this.registrations.listForEvent(eventId);
  }

  async archive(eventId: string) {
    const event = await this.getById(eventId);
    if (!['completed'].includes(event.status)) {
      throw new BusinessRuleError('Only a completed event can be archived');
    }
    return this.update(eventId, { status: 'archived' } as never);
  }
}
