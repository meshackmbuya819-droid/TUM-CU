import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Church,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Shield,
  Layers,
  Sparkles,
  Users,
  AlertCircle,
  X,
  Camera,
  Upload,
  Eye,
  EyeOff,
  Phone,
  ArrowUpDown,
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { MinistryBackgroundModal } from '@/components/MinistryBackgroundModal';

export interface Ministry {
  id: string;
  name: string;
  code: string;
  short_name?: string;
  category: string;
  description: string | null;
  detailed_description?: string | null;
  meeting_day?: string;
  meeting_time?: string;
  meeting_venue?: string;
  contact_info?: string | null;
  is_active?: boolean;
  show_on_landing?: boolean;
  landing_image_url?: string | null;
  background_image_url?: string | null;
  landing_caption?: string | null;
  display_order?: number;
  leader_id?: string;
  leader_name?: string;
  active_members_count?: number;
}

const DEFAULT_CONSTITUTIONAL_MINISTRIES: Ministry[] = [
  {
    id: 'min-pw',
    name: 'Praise & Worship Ministry',
    code: 'worship',
    short_name: 'Worship',
    category: 'worship',
    description: 'Leading the congregation in vibrant, Spirit-filled praise, worship, and vocal ministry.',
    detailed_description: 'Coordinates worship sessions during Sunday Main Services, Midweek Fellowships, Keshas, and outreach events. Cultivates heart-level worship and musical excellence.',
    meeting_day: 'Friday & Saturday',
    meeting_time: '4:30 PM - 7:00 PM',
    meeting_venue: 'Main Sanctuary',
    contact_info: '+254 700 111 222 (Leader)',
    is_active: true,
    show_on_landing: true,
    landing_image_url: '/community/community-2.jpg',
    background_image_url: '/community/community-2.jpg',
    landing_caption: 'Worshiping in unity and divine truth',
    display_order: 1,
    active_members_count: 24,
  },
  {
    id: 'min-intercessory',
    name: 'Intercessory & Prayer Ministry',
    code: 'intercessory',
    short_name: 'Prayer',
    category: 'prayer',
    description: 'Standing in the gap for the Christian Union, the university administration, the nation, and revival.',
    detailed_description: 'Maintains unbroken 24/7 prayer chains, morning devotionals, and Friday night vigils (Keshas). The spiritual engine of the Christian Union.',
    meeting_day: 'Daily & Wednesday Kesha',
    meeting_time: '6:00 AM - 7:00 AM / 9:00 PM',
    meeting_venue: 'Upper Prayer Room',
    contact_info: '+254 700 333 444',
    is_active: true,
    show_on_landing: true,
    landing_image_url: '/community/community-1.jpg',
    background_image_url: '/community/community-1.jpg',
    landing_caption: 'Seeking God in continuous prayer and intercession',
    display_order: 2,
    active_members_count: 32,
  },
  {
    id: 'min-media',
    name: 'Media, IT & Communications Ministry',
    code: 'media',
    short_name: 'Media',
    category: 'media',
    description: 'Audio engineering, livestreaming, graphic design, social media ministry, and IT infrastructure.',
    detailed_description: 'Handles online broadcasts, sermon recordings, digital banners, website maintenance, photography, and sound equipment operation.',
    meeting_day: 'Thursday',
    meeting_time: '5:00 PM - 6:30 PM',
    meeting_venue: 'Media Studio / AV Booth',
    contact_info: 'media@tumcu.org',
    is_active: true,
    show_on_landing: true,
    landing_image_url: '/community/community-4.jpg',
    background_image_url: '/community/community-4.jpg',
    landing_caption: 'Proclaiming the Gospel through modern media and audio-visuals',
    display_order: 3,
    active_members_count: 18,
  },
  {
    id: 'min-discipleship',
    name: 'Discipleship & Bible Study Ministry',
    code: 'discipleship',
    short_name: 'BEST',
    category: 'discipleship',
    description: 'Nurturing believers in foundational Christian doctrines, BEST classes, and weekly Bible studies.',
    detailed_description: 'Equipping members to handle God’s Word with fidelity, conducting Bible Study Leader orientations, and running spiritual mentorship cohorts.',
    meeting_day: 'Tuesday',
    meeting_time: '5:00 PM - 6:30 PM',
    meeting_venue: 'LH 01 & LH 02',
    contact_info: '+254 700 555 666',
    is_active: true,
    show_on_landing: true,
    landing_image_url: '/community/community-3.jpg',
    background_image_url: '/community/community-3.jpg',
    landing_caption: 'Rooted and grounded in the Word of God',
    display_order: 4,
    active_members_count: 45,
  },
  {
    id: 'min-evangelism',
    name: 'Missions & Evangelism Ministry',
    code: 'missions',
    short_name: 'Missions',
    category: 'evangelism',
    description: 'Campus evangelism, door-to-door hospital outreach, annual mission trips, and street ministry.',
    detailed_description: 'Mobilizes believers for cross-cultural missions, annual August/December outreach camps, street witnessing, and coastal secondary school missions.',
    meeting_day: 'Saturday & Sunday',
    meeting_time: '2:00 PM - 5:00 PM',
    meeting_venue: 'Assembly Point',
    contact_info: '+254 700 777 888',
    is_active: true,
    show_on_landing: true,
    landing_image_url: '/community/community-5.jpg',
    background_image_url: '/community/community-5.jpg',
    landing_caption: 'Reaching the lost with the good news of Christ',
    display_order: 5,
    active_members_count: 38,
  },
];

export function AdminMinistriesPage() {
  const { user } = useAuthStore();
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Edit / Create modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [formCategory, setFormCategory] = useState('worship');
  const [formDesc, setFormDesc] = useState('');
  const [formDetailedDesc, setFormDetailedDesc] = useState('');
  const [formDay, setFormDay] = useState('Friday');
  const [formTime, setFormTime] = useState('4:30 PM - 7:00 PM');
  const [formVenue, setFormVenue] = useState('Main Sanctuary');
  const [formContact, setFormContact] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formShowOnLanding, setFormShowOnLanding] = useState(true);
  const [formLandingImage, setFormLandingImage] = useState('');
  const [formLandingCaption, setFormLandingCaption] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Assign Leader modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetMinistry, setTargetMinistry] = useState<Ministry | null>(null);
  const [submittingLeader, setSubmittingLeader] = useState(false);
  const [bgModalMinistry, setBgModalMinistry] = useState<any>(null);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateResults, setCandidateResults] = useState<any[]>([]);
  const [candidateLoading, setCandidateLoading] = useState(false);

  useEffect(() => {
    fetchMinistries();
  }, []);

  async function fetchMinistries() {
    try {
      setLoading(true);
      const res = await api.get<any>('/ministries');
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setMinistries(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load ministries from the server', err);
      setMinistries([]);
      setFeedback('The ministry directory could not be loaded from the server. No demo data is shown.');
    } finally {
      setLoading(false);
    }
  }

  async function loadLeaderCandidates(search = '') {
    setCandidateLoading(true);
    try {
      const res = await api.get<any>('/membership/all-members', {
        params: { search: search.trim() || undefined, page: 1, pageSize: 25, status: 'active' },
      });
      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      setCandidateResults(rows.map((m: any) => {
        const yearMatch = String(m.year_of_study ?? '').match(/\d+/);
        const year = yearMatch ? Number(yearMatch[0]) : 0;
        const eligible = m.status === 'active' && year >= 2;
        return {
          ...m,
          is_eligible: eligible,
          ineligibility_reason: !eligible ? (m.status !== 'active' ? 'Member is not active.' : 'Leadership candidates must be at least Year 2.') : undefined,
          spiritual_standing: m.status === 'active' ? 'Active registered member' : 'Not active',
        };
      }));
    } catch (err) {
      console.error('Failed to load ministry leader candidates', err);
      setCandidateResults([]);
      setFeedback('Could not load real registered member candidates.');
    } finally {
      setCandidateLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingMinistry(null);
    setFormName('');
    setFormCode('');
    setFormShortName('');
    setFormCategory('worship');
    setFormDesc('');
    setFormDetailedDesc('');
    setFormDay('Friday');
    setFormTime('4:30 PM - 7:00 PM');
    setFormVenue('Main Sanctuary');
    setFormContact('');
    setFormIsActive(true);
    setFormShowOnLanding(true);
    setFormLandingImage('/community/community-1.jpg');
    setFormLandingCaption('');
    setFormDisplayOrder(ministries.length + 1);
    setIsModalOpen(true);
  }

  function handleOpenEdit(m: Ministry) {
    setEditingMinistry(m);
    setFormName(m.name || '');
    setFormCode(m.code || '');
    setFormShortName(m.short_name || '');
    setFormCategory(m.category || 'worship');
    setFormDesc(m.description || '');
    setFormDetailedDesc(m.detailed_description || '');
    setFormDay(m.meeting_day || 'Friday');
    setFormTime(m.meeting_time || '4:30 PM - 7:00 PM');
    setFormVenue(m.meeting_venue || 'Main Sanctuary');
    setFormContact(m.contact_info || '');
    setFormIsActive(m.is_active !== false);
    setFormShowOnLanding(m.show_on_landing !== false);
    setFormLandingImage(m.landing_image_url || m.background_image_url || '/community/community-1.jpg');
    setFormLandingCaption(m.landing_caption || '');
    setFormDisplayOrder(m.display_order || 1);
    setIsModalOpen(true);
  }

  async function handleFileUpload(file: File) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds the 15MB limit.');
      return;
    }

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;

        if (editingMinistry) {
          // Direct backend upload endpoint
          const res = await api.post<any>(`/ministries/${editingMinistry.id}/upload-photo`, {
            base64,
            filename: file.name,
            caption: formLandingCaption || formName,
          });
          const uploadedUrl = res.data?.data?.url;
          if (uploadedUrl) {
            setFormLandingImage(uploadedUrl);
          }
        } else {
          // Upload via landing media upload
          const res = await api.post<any>('/landing-media/upload', {
            base64,
            filename: file.name,
          });
          const uploadedUrl = res.data?.data?.url;
          if (uploadedUrl) {
            setFormLandingImage(uploadedUrl);
          }
        }
      } catch (err: any) {
        console.error('Photo upload failed:', err);
        alert(`Photo upload failed: ${err?.message || 'Server error'}`);
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveMinistry(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    setSubmitting(true);

    const payload = {
      name: formName.trim(),
      code: formCode.trim() || formName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      short_name: formShortName.trim() || formName.split(' ')[0],
      category: formCategory,
      description: formDesc.trim() || null,
      detailed_description: formDetailedDesc.trim() || null,
      meeting_day: formDay.trim(),
      meeting_time: formTime.trim(),
      meeting_venue: formVenue.trim(),
      contact_info: formContact.trim() || null,
      is_active: formIsActive ? 1 : 0,
      show_on_landing: formShowOnLanding ? 1 : 0,
      landing_image_url: formLandingImage || null,
      background_image_url: formLandingImage || null,
      landing_caption: formLandingCaption.trim() || null,
      display_order: Number(formDisplayOrder) || 1,
    };

    try {
      if (editingMinistry) {
        await api.put(`/ministries/${editingMinistry.id}`, payload);
        setFeedback(`Ministry "${formName}" updated successfully in database!`);
      } else {
        await api.post('/ministries', payload);
        setFeedback(`New ministry "${formName}" created and persisted!`);
      }

      await fetchMinistries();
      setIsModalOpen(false);
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setFeedback(err?.response?.data?.message || 'The ministry could not be saved. No local-only change was made.');
      return;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteMinistry(m: Ministry) {
    if (!confirm(`Are you sure you want to remove "${m.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/ministries/${m.id}`);
      setFeedback(`Ministry "${m.name}" removed from database.`);
      await fetchMinistries();
    } catch (err: any) {
      setFeedback(err?.response?.data?.message || 'The ministry could not be deleted.');
    }
    setTimeout(() => setFeedback(null), 3500);
  }

  async function handleAssignLeader(member: any) {
    if (!targetMinistry) return;
    if (!member.is_eligible) {
      alert(`Constitutional Ineligibility: ${member.ineligibility_reason}`);
      return;
    }
    setSubmittingLeader(true);
    try {
      await api.post(`/ministries/${targetMinistry.id}/assign-leader`, {
        leader_id: member.id,
      });
      await fetchMinistries();
      setIsAssignModalOpen(false);
      setFeedback(`Leader assigned to ${targetMinistry.name} successfully!`);
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setFeedback(err?.response?.data?.message || 'Leader assignment failed.');
    } finally {
      setSubmittingLeader(false);
    }
  }

  const filtered = ministries.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.leader_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.short_name || '').toLowerCase().includes(search.toLowerCase());

    const matchesCat = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-gradient-to-br from-emerald-950 via-primary-900 to-slate-900 p-6 shadow-xl sm:p-8 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gold-400/20 px-3 py-1 text-xs font-black text-gold-300 border border-gold-400/30">
              <Church size={14} /> TUMCU Constitution Article 16.1
            </div>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
              Constitutional Ministries Hub
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
              Manage all constitutional ministries, persistent landing-page photos, meeting times, venues, and leadership appointments.
            </p>
          </div>

          <Button
            onClick={handleOpenCreate}
            className="gap-1.5 bg-gradient-to-r from-gold-500 to-emerald-600 hover:from-gold-400 hover:to-emerald-500 text-slate-950 font-black shadow-lg"
          >
            <Plus size={16} /> Add Ministry / Fellowship
          </Button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-900 shadow-sm flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative max-w-md w-full">
          <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search ministry name, leader, short name, or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:border-primary-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none"
          >
            <option value="all">All Categories</option>
            <option value="worship">Worship & Music</option>
            <option value="prayer">Intercessory & Prayer</option>
            <option value="media">Media & IT</option>
            <option value="discipleship">Discipleship & BEST</option>
            <option value="evangelism">Missions & Evangelism</option>
            <option value="creative">Creative & Drama</option>
            <option value="service">Hospitality & Welfare</option>
            <option value="fellowship">Fellowship & Mentorship</option>
          </select>

          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
            {filtered.length} {filtered.length === 1 ? 'Ministry' : 'Ministries'}
          </span>
        </div>
      </div>

      {/* Ministries Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => (
          <Card
            key={m.id}
            className="overflow-hidden p-0 border border-slate-200 bg-white shadow-md flex flex-col justify-between hover:shadow-lg transition-all rounded-3xl"
          >
            {/* Ministry Photo Header */}
            <div className="relative h-44 w-full bg-slate-900 overflow-hidden group">
              <img
                src={m.landing_image_url || m.background_image_url || '/community/community-1.jpg'}
                alt={m.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/community/community-1.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-black/30 to-transparent" />

              {/* Status Badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="rounded-full bg-slate-950/80 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-black uppercase text-gold-300 border border-white/20">
                  {m.category}
                </span>

                <div className="flex items-center gap-1.5">
                  {m.show_on_landing !== false ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                      <Eye size={10} /> Landing
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-slate-400 border border-white/10">
                      <EyeOff size={10} /> Hidden
                    </span>
                  )}
                  {m.is_active === false && (
                    <span className="rounded-full bg-rose-950/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/30">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              {/* Ministry Name & Caption Overlay */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <h3 className="text-base font-black leading-tight drop-shadow-sm">{m.name}</h3>
                {m.landing_caption && (
                  <p className="text-[11px] text-slate-200 mt-0.5 line-clamp-1 italic">
                    "{m.landing_caption}"
                  </p>
                )}
              </div>
            </div>

            {/* Ministry Details Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {m.description || 'Dedicated to serving the Christian Union fellowship and student body.'}
                </p>

                {/* Meeting Schedule */}
                <div className="space-y-1.5 pt-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-emerald-700 shrink-0" />
                    <span className="font-semibold">{m.meeting_day || 'Weekly'}</span>
                    <span className="text-slate-400">•</span>
                    <Clock size={12} className="text-slate-500 shrink-0" />
                    <span>{m.meeting_time || 'Check schedule'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-emerald-700 shrink-0" />
                    <span className="truncate">{m.meeting_venue || 'TUM Main Campus'}</span>
                  </div>
                  {m.contact_info && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone size={12} className="shrink-0" />
                      <span className="truncate">{m.contact_info}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Leader & Actions Footer */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Ministry Leader</div>
                    <div className="text-xs font-black text-slate-900">
                      {m.leader_name || <span className="text-amber-600 font-normal">Unassigned</span>}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTargetMinistry(m);
                      setCandidateSearch('');
                      setCandidateResults([]);
                      setIsAssignModalOpen(true);
                      void loadLeaderCandidates('');
                    }}
                    className="text-[11px] font-bold border-slate-200 text-slate-700 hover:bg-slate-100 py-1 px-2.5 h-auto rounded-xl"
                  >
                    <UserCheck size={12} className="mr-1" /> Vet / Assign
                  </Button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-slate-400">
                    Order: #{m.display_order ?? 1}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(m)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                      title="Edit Ministry Details"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMinistry(m)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Delete Ministry"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit / Create Ministry Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl my-8 rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {editingMinistry ? `Edit: ${editingMinistry.name}` : 'Create New Ministry / Fellowship'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Persistent database configuration and landing-page showcase
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveMinistry} className="space-y-4">
                {/* Photo Upload Section */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Camera size={14} className="text-emerald-700" />
                      Ministry Landing Photo & Backdrop
                    </label>
                    {isUploadingPhoto && (
                      <span className="text-[11px] font-bold text-amber-600 animate-pulse">
                        Uploading to persistent storage...
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-4 h-24 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 relative">
                      <img
                        src={formLandingImage || '/community/community-1.jpg'}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/community/community-1.jpg';
                        }}
                      />
                    </div>
                    <div className="sm:col-span-8 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formLandingImage}
                          onChange={(e) => setFormLandingImage(e.target.value)}
                          placeholder="/uploads/tumcu-xxxxx.jpg or /community/community-1.jpg"
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-700 focus:outline-none focus:border-emerald-600"
                        />
                        <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shrink-0 transition">
                          <Upload size={12} />
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleFileUpload(f);
                            }}
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        value={formLandingCaption}
                        onChange={(e) => setFormLandingCaption(e.target.value)}
                        placeholder="Landing page photo caption or theme..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ministry Name *</label>
                    <Input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Praise & Worship Ministry"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Short Name / Code</label>
                    <Input
                      value={formShortName}
                      onChange={(e) => setFormShortName(e.target.value)}
                      placeholder="e.g. Worship or PW"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      <option value="worship">Worship & Music</option>
                      <option value="prayer">Intercessory & Prayer</option>
                      <option value="media">Media & IT</option>
                      <option value="discipleship">Discipleship & Nurture</option>
                      <option value="evangelism">Missions & Evangelism</option>
                      <option value="creative">Creative Arts & Drama</option>
                      <option value="service">Hospitality & Welfare</option>
                      <option value="fellowship">Fellowship & Mentorship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
                    <Input
                      type="number"
                      value={formDisplayOrder}
                      onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                      placeholder="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Short Description</label>
                  <textarea
                    rows={2}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Brief ministry summary displayed on cards..."
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description</label>
                  <textarea
                    rows={3}
                    value={formDetailedDesc}
                    onChange={(e) => setFormDetailedDesc(e.target.value)}
                    placeholder="Comprehensive description of spiritual calling, activities, and practices..."
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Meeting & Venue */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Meeting Day</label>
                    <Input
                      value={formDay}
                      onChange={(e) => setFormDay(e.target.value)}
                      placeholder="e.g. Friday & Saturday"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Meeting Time</label>
                    <Input
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      placeholder="e.g. 4:30 PM - 7:00 PM"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Meeting Venue</label>
                    <Input
                      value={formVenue}
                      onChange={(e) => setFormVenue(e.target.value)}
                      placeholder="e.g. Main Sanctuary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Information</label>
                  <Input
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    placeholder="e.g. +254 700 000 000 or ministry@tumcu.org"
                  />
                </div>

                {/* Visibility Toggles */}
                <div className="flex flex-wrap gap-6 pt-2 pb-1 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Active Ministry Status</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formShowOnLanding}
                      onChange={(e) => setFormShowOnLanding(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Show on Public Landing Page</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={submitting}
                    className="bg-primary-900 text-white font-bold px-6 shadow-md"
                  >
                    Save Ministry
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Leader Modal */}
      <AnimatePresence>
        {isAssignModalOpen && targetMinistry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Assign Leader: {targetMinistry.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Constitutional vetting & eligibility validation (Article 14.3)
                  </p>
                </div>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Constitutional Check Info Box */}
              <div className="rounded-2xl bg-gold-50 p-3 text-xs text-gold-950 border border-gold-200">
                <div className="font-black flex items-center gap-1 mb-1">
                  <Shield size={13} /> Article 14.3 Qualification Criteria:
                </div>
                <p>• Must be at least in Year 2 of study at Technical University of Mombasa.</p>
                <p>• Must be an active, baptized Full Member with exemplary Christian conduct.</p>
              </div>

              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-700">Registered Member Candidates:</div>
                <div className="flex gap-2">
                  <input
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void loadLeaderCandidates(candidateSearch); }}
                    placeholder="Search registered members by name, admission no. or department"
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-600"
                  />
                  <Button size="sm" variant="outline" onClick={() => void loadLeaderCandidates(candidateSearch)} loading={candidateLoading}>Search</Button>
                </div>
                {candidateLoading ? <div className="py-4 text-xs text-slate-500">Loading registered members…</div> : candidateResults.length === 0 ? <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">No registered members found. Search by name or admission number.</div> : candidateResults.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900">{m.full_name}</div>
                      <div className="text-[11px] text-slate-500">{m.admission_number || 'No admission number'} • {m.year_of_study || 'Year not recorded'} • {m.department || 'Department not recorded'}</div>
                      <div className={m.is_eligible ? 'text-[11px] text-emerald-700' : 'text-[11px] text-rose-700'}>{m.is_eligible ? m.spiritual_standing : m.ineligibility_reason}</div>
                    </div>
                    <Button size="sm" variant={m.is_eligible ? 'primary' : 'secondary'} disabled={!m.is_eligible || submittingLeader} loading={submittingLeader} onClick={() => void handleAssignLeader(m)}>Assign</Button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Super Admin Ministry Background Customization Modal */}
      {bgModalMinistry && (
        <MinistryBackgroundModal
          isOpen={Boolean(bgModalMinistry)}
          onClose={() => setBgModalMinistry(null)}
          ministry={bgModalMinistry}
          onSaved={() => {
            fetchMinistries();
          }}
        />
      )}
    </div>
  );
}
