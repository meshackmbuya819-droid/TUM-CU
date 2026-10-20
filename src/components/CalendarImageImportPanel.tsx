import React, { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FileImage, FileText, Loader2, RefreshCw, ShieldCheck, UploadCloud, XCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import { approveCalendarImport, extractCalendarImage, fetchPendingCalendarImports, rejectCalendarImport } from '@/features/events/events.api';
import { useAuthStore } from '@/store/auth.store';

function fileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read this file.'));
    reader.onerror = () => reject(new Error('Could not read this file.'));
    reader.readAsDataURL(file);
  });
}

export function CalendarImageImportPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const { hasPermission, isSuperAdmin } = useAuthStore();
  const canImport = isSuperAdmin() || hasPermission('events.create');
  const canReview = isSuperAdmin() || hasPermission('events.approve');
  const canView = isSuperAdmin() || hasPermission('events.view') || hasPermission('events.approve');
  const pendingQuery = useQuery({ queryKey: ['calendar-imports', 'pending'], queryFn: fetchPendingCalendarImports, enabled: canView });

  const extractMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Choose a calendar image or PDF first.');
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'].includes(file.type)) throw new Error('Use a JPG, PNG, WEBP, GIF or PDF file.');
      if (file.size > 10 * 1024 * 1024) throw new Error('File must be 10 MB or smaller.');
      return extractCalendarImage({ imageData: await fileAsDataUrl(file), mimeType: file.type, filename: file.name });
    },
    onSuccess: (result) => {
      setNotice(`${result.extracted_events.length} event(s) extracted and queued for official approval.`);
      setError(''); setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['calendar-imports', 'pending'] });
    },
    onError: (err: any) => { setError(err?.response?.data?.message || err?.message || 'Could not extract events.'); setNotice(''); },
  });

  const approveMutation = useMutation({
    mutationFn: approveCalendarImport,
    onSuccess: (result) => {
      setNotice(`${result.count} event(s) approved and synchronized to TECUMP.`); setError('');
      queryClient.invalidateQueries({ queryKey: ['calendar-imports', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['public-events'] });
      queryClient.invalidateQueries({ queryKey: ['events', 'public'] });
      queryClient.invalidateQueries({ queryKey: ['public-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (err: any) => { setError(err?.response?.data?.message || err?.message || 'Approval failed.'); setNotice(''); },
  });
  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectCalendarImport(id, 'Rejected after authorized official review'),
    onSuccess: () => { setNotice('Import rejected. No events were published.'); setError(''); queryClient.invalidateQueries({ queryKey: ['calendar-imports', 'pending'] }); },
    onError: (err: any) => { setError(err?.response?.data?.message || err?.message || 'Rejection failed.'); setNotice(''); },
  });

  if (!canImport && !canReview && !canView) return null;
  return <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5 space-y-4">
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-white p-2 text-[#006633]">{file?.type === 'application/pdf' ? <FileText size={21} /> : <FileImage size={21} />}</div>
      <div className="min-w-0 flex-1">
        <h3 className="font-black text-slate-900">Extract events from a calendar image or PDF</h3>
        <p className="mt-1 text-sm text-slate-600">Upload a clear poster, photograph, or PDF calendar. Extracted dates, titles, speakers and venues stay private until an authorised official approves them.</p>
      </div>
    </div>
    {canImport && <div className="grid grid-cols-1 gap-3">
      <label className="block text-sm font-bold text-slate-800" htmlFor="calendar-image-file">Choose event poster, calendar image or PDF</label>
      <input id="calendar-image-file" ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf" onChange={(e) => { setFile(e.target.files?.[0] || null); setNotice(''); setError(''); }} className="block w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:font-bold file:text-emerald-900" />
      {file && <p className="text-xs text-slate-600">Selected: {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
      <button type="button" onClick={() => extractMutation.mutate()} disabled={!file || extractMutation.isPending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#006633] px-5 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none">
        {extractMutation.isPending ? <><Loader2 size={17} className="animate-spin" /> Reading file and extracting events…</> : <><UploadCloud size={17} /> Extract events</>}
      </button>
      <p className="text-xs leading-5 text-slate-600">Select an image or PDF first. The extraction button activates when a supported file is selected. Extracted events are kept private until approved.</p>
    </div>}
    {!canImport && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Your account can view calendar imports, but it does not have permission to upload/extract files. Ask the TECUMP system administrator to grant the existing <strong>events.create</strong> permission to the appropriate role.</p>}
    {notice && <p role="status" className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-emerald-800">{notice}</p>}
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">{error}</p>}

    {canView && <div className="border-t border-emerald-200 pt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2"><ShieldCheck size={17} className="text-[#006633]" /><h4 className="font-extrabold text-slate-900">Awaiting official approval</h4><span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-700">{pendingQuery.data?.length ?? 0}</span></div>
        <button onClick={() => pendingQuery.refetch()} className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900"><RefreshCw size={13} /> Refresh</button>
      </div>
      {pendingQuery.isLoading ? <p className="text-sm text-slate-600">Loading pending imports…</p> : pendingQuery.isError ? <p className="text-sm text-rose-700">Could not load pending imports. Check your access and try refreshing.</p> : !pendingQuery.data?.length ? <p className="rounded-xl bg-white/80 p-3 text-sm text-slate-600">No calendar imports are awaiting approval.</p> : <div className="space-y-3">
        {pendingQuery.data.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0"><p className="break-words font-bold text-slate-900">{item.source_filename}</p><p className="mt-1 text-xs text-slate-500">{item.extracted_events.length} extracted event(s) · {new Date(item.created_at).toLocaleString()}</p></div>
            {canReview && <div className="flex shrink-0 gap-2"><Button onClick={() => approveMutation.mutate(item.id)} disabled={approveMutation.isPending || rejectMutation.isPending || item.extracted_events.some((event) => event.sync_action === 'needs_review')} className="gap-1"><CheckCircle2 size={14} /> Approve & publish</Button><Button onClick={() => rejectMutation.mutate(item.id)} disabled={approveMutation.isPending || rejectMutation.isPending} variant="outline" className="gap-1"><XCircle size={14} /> Reject</Button></div>}
          </div>
          {item.extracted_events.some((event) => event.sync_action === 'needs_review') && <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">One or more events match multiple existing records. Approval is blocked until those duplicate titles are resolved in Events Management, so no event is changed accidentally.</p>}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {item.extracted_events.map((event, index) => <div key={`${event.date}-${event.title}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="mb-2 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-[11px] font-extrabold ${event.sync_action === 'update' ? 'bg-blue-100 text-blue-800' : event.sync_action === 'needs_review' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>{event.sync_action === 'update' ? 'Proposed update' : event.sync_action === 'needs_review' ? 'Possible duplicate' : 'New event'}</span>{event.event_type && <span className="text-xs text-slate-500">{event.event_type.replace(/_/g, ' ')}</span>}</div>
              <p className="font-bold text-slate-900">{event.title}</p><p className="mt-1 text-slate-700">{event.date}{event.start_time ? ` · ${event.start_time}` : ''}{event.end_time ? `–${event.end_time}` : ''}</p>
              {event.matched_event && <p className="mt-1 rounded-md bg-blue-50 p-2 text-xs text-blue-900">Matches existing event: <strong>{event.matched_event.title}</strong> ({event.matched_event.date}){event.matched_event.status ? ` · ${event.matched_event.status}` : ''}. Approval will update this event instead of creating a duplicate.</p>}
              {event.venue && <p className="text-slate-600">Venue: {event.venue}</p>}{event.speaker && <p className="text-slate-600">Speaker: {event.speaker}</p>}{event.description && <p className="mt-1 text-slate-600">{event.description}</p>}
              <p className="mt-1 text-xs text-amber-700">AI extraction confidence: {Math.round((event.confidence ?? 0.5) * 100)}% — verify details before approval.</p>
            </div>)}
          </div>
        </article>)}
      </div>}
      {(approveMutation.isPending || rejectMutation.isPending) && <p className="mt-2 inline-flex items-center gap-2 text-xs text-slate-600"><Loader2 size={13} className="animate-spin" /> Saving official decision…</p>}
    </div>}
  </section>;
}
