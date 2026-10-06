import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  FileCode,
  File,
  RotateCcw,
  Sparkles,
  Download,
  Info,
} from 'lucide-react';
import { Button } from '@/components/Button';
import {
  fetchCalendarInfo,
  uploadCustomCalendar,
  resetCustomCalendar,
  type DownloadableCalendarInfo,
} from '@/features/events/events.api';

interface UploadCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UploadCalendarModal({ isOpen, onClose, onSuccess }: UploadCalendarModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [title, setTitle] = useState('');
  const [semester, setSemester] = useState('Semester 1 (September – December 2026)');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [notes, setNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: calendarInfo, isLoading: isInfoLoading } = useQuery<DownloadableCalendarInfo>({
    queryKey: ['downloadable-calendar-info'],
    queryFn: fetchCalendarInfo,
    enabled: isOpen,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadCustomCalendar,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['downloadable-calendar-info'] });
      setSuccessMessage(`Successfully uploaded "${data.filename}" as official downloadable calendar!`);
      setSelectedFile(null);
      setFileBase64('');
      setErrorMessage(null);
      setTimeout(() => {
        setSuccessMessage(null);
        if (onSuccess) onSuccess();
        onClose();
      }, 1800);
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.message || err.message || 'Failed to upload calendar file');
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetCustomCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downloadable-calendar-info'] });
      setSuccessMessage('Reset downloadable calendar to system-generated calendar.');
      setErrorMessage(null);
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.message || err.message || 'Failed to reset calendar');
    },
  });

  if (!isOpen) return null;

  const handleProcessFile = (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 25MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFileBase64(result);
      setSelectedFile(file);
      if (!title) {
        // Generate a clean default title
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
        setTitle(`TUMCU Semester 1 Calendar (${file.name.endsWith('.pdf') ? 'PDF' : 'Official'})`);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the selected file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileBase64 || !selectedFile) {
      setErrorMessage('Please select a calendar document to upload.');
      return;
    }

    uploadMutation.mutate({
      fileData: fileBase64,
      filename: selectedFile.name,
      title: title || 'TUMCU Official Semester 1 Calendar',
      semester,
      academic_year: academicYear,
      notes,
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (filename: string) => {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.pdf')) return <FileText className="text-red-500" size={24} />;
    if (lower.endsWith('.ics')) return <Calendar className="text-emerald-500" size={24} />;
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv')) {
      return <FileSpreadsheet className="text-emerald-600" size={24} />;
    }
    return <File className="text-primary-600" size={24} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-950 via-primary-900 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <Upload className="text-emerald-400" size={20} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Upload Downloadable Calendar</h2>
              <p className="text-xs text-slate-300">
                Provide the leadership-approved semester calendar file for student downloads
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Current Active Calendar Banner */}
          {calendarInfo && (
            <div
              className={`p-4 rounded-2xl border text-xs ${
                calendarInfo.is_custom
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">{getFileIcon(calendarInfo.filename)}</div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{calendarInfo.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          calendarInfo.is_custom
                            ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {calendarInfo.is_custom ? 'Custom Admin Upload' : 'System Generated'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {calendarInfo.file_format} • {calendarInfo.formatted_size}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600 dark:text-slate-400 font-mono text-[11px] truncate max-w-sm">
                      File: {calendarInfo.filename}
                    </p>
                    {calendarInfo.uploaded_at && (
                      <p className="mt-0.5 text-slate-500 dark:text-slate-400 text-[11px]">
                        Uploaded {new Date(calendarInfo.uploaded_at).toLocaleDateString()} by{' '}
                        <span className="font-semibold">{calendarInfo.uploaded_by_name}</span>
                      </p>
                    )}
                  </div>
                </div>

                {calendarInfo.is_custom && (
                  <button
                    type="button"
                    onClick={() => resetMutation.mutate()}
                    disabled={resetMutation.isPending}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0"
                    title="Revert to dynamic system generated ICS calendar"
                  >
                    <RotateCcw size={12} />
                    <span>{resetMutation.isPending ? 'Reverting…' : 'Revert to default'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-primary-500 bg-slate-50/50 dark:bg-slate-800/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.ics,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700">
                    {getFileIcon(selectedFile.name)}
                  </div>
                  <span className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-100 max-w-xs truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatBytes(selectedFile.size)} • Click or drop another file to replace
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 mb-2">
                    <Upload size={22} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Drop approved calendar file here, or{' '}
                    <span className="text-primary-600 dark:text-emerald-400 underline">browse</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Supports official PDF, iCalendar (.ics), Excel (.xlsx), Word (.docx) • Max 25MB
                  </span>
                </div>
              )}
            </div>

            {/* Title & Metadata Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Calendar Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. TUMCU Semester 1 2026/2027 Calendar"
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Semester Period
                </label>
                <input
                  type="text"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="e.g. Semester 1 (Sep - Dec 2026)"
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Executive Notes & Sign-off (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Official semester calendar ratified by TUMCU Executive Committee. Includes all Friday and Sunday services."
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={uploadMutation.isPending}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!selectedFile || uploadMutation.isPending}
                className="text-xs gap-1.5 font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {uploadMutation.isPending ? (
                  <>Uploading & Saving…</>
                ) : (
                  <>
                    <Upload size={14} /> Upload & Set as Official Calendar
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
