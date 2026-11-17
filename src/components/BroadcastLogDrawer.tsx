import React, { useEffect, useState } from 'react';
import { ClipboardList, Copy, Download, Trash2, X } from 'lucide-react';
import {
  BroadcastLogEntry,
  filterLogEntries,
  formatLogDate,
  formatLogExportText,
  formatLogTime,
  LogCategory,
  LogFilter,
} from '../utils/broadcastLog';

interface BroadcastLogDrawerProps {
  open: boolean;
  mosqueName: string;
  entries: BroadcastLogEntry[];
  onClose: () => void;
  onClear: () => void;
}

const FILTER_OPTIONS: Array<{ id: LogFilter; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'stream', label: 'Siaran' },
  { id: 'visual', label: 'Paparan & Template' },
  { id: 'audio_text', label: 'Audio & Teks' },
];

const CATEGORY_LABEL: Record<LogCategory, { text: string; tone: string }> = {
  stream: {
    text: 'Siaran',
    tone: 'text-red-700 dark:text-red-400',
  },
  scene: {
    text: 'Paparan',
    tone: 'accent-label',
  },
  template: {
    text: 'Template',
    tone: 'accent-label',
  },
  layer: {
    text: 'Lapisan',
    tone: 'text-stone-700 dark:text-stone-300',
  },
  text: {
    text: 'Teks',
    tone: 'text-stone-700 dark:text-stone-300',
  },
  audio: {
    text: 'Audio',
    tone: 'text-amber-700 dark:text-amber-400',
  },
  connection: {
    text: 'Sambungan',
    tone: 'text-stone-600 dark:text-stone-400',
  },
};

export const BroadcastLogDrawer: React.FC<BroadcastLogDrawerProps> = ({
  open,
  mosqueName,
  entries,
  onClose,
  onClear,
}) => {
  const [filter, setFilter] = useState<LogFilter>('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = filterLogEntries(entries, filter);

  const handleCopy = async () => {
    const text = formatLogExportText(entries, mosqueName);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored if blocked
    }
  };

  const handleDownload = () => {
    const text = formatLogExportText(entries, mosqueName);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekod-siaran-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-drawer-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <ClipboardList className="w-6 h-6 accent-label shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <h2
                id="log-drawer-title"
                className="text-lg font-bold text-stone-900 dark:text-stone-100 truncate"
              >
                Rekod Siaran (Broadcast Log)
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                {entries.length} catatan aktiviti sesi ini
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Rekod Siaran"
            className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Category Filter Bar */}
        <div className="px-5 py-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tapis rekod siaran">
            {FILTER_OPTIONS.map((opt) => {
              const active = filter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(opt.id)}
                  className={`min-h-10 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'accent-btn'
                      : 'bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Log Timeline List */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-stone-500 dark:text-stone-400 text-sm">
              Tiada catatan aktiviti untuk paparan ini.
            </div>
          ) : (
            <ol className="divide-y divide-stone-200 dark:divide-stone-800">
              {filtered.map((entry) => {
                const meta = CATEGORY_LABEL[entry.category];
                return (
                  <li key={entry.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                        <span className={meta.tone}>{meta.text}</span>
                        <span aria-hidden="true" className="text-stone-400">
                          ·
                        </span>
                        <span className="text-stone-500 dark:text-stone-400 font-normal">
                          {formatLogDate(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base font-semibold text-stone-900 dark:text-stone-100 mt-0.5">
                        {entry.title}
                      </p>
                      {entry.detail && (
                        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-0.5 break-words">
                          {entry.detail}
                        </p>
                      )}
                    </div>

                    <time
                      dateTime={new Date(entry.timestamp).toISOString()}
                      className="text-xs font-mono-tabular font-semibold text-stone-600 dark:text-stone-400 shrink-0 pt-0.5"
                    >
                      {formatLogTime(entry.timestamp)}
                    </time>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={entries.length === 0}
              onClick={handleCopy}
              className="min-h-11 px-3.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-45"
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
              <span>{copied ? 'Disalin!' : 'Salin'}</span>
            </button>

            <button
              type="button"
              disabled={entries.length === 0}
              onClick={handleDownload}
              className="min-h-11 px-3.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-45"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Muat Turun</span>
            </button>
          </div>

          <button
            type="button"
            disabled={entries.length === 0}
            onClick={onClear}
            className="min-h-11 px-3.5 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-800 dark:text-red-200 text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-45"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            <span>Kosongkan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
