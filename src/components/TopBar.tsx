import React, { useState } from 'react';
import { Check, ClipboardList, Moon, Palette, Pencil, Settings, Sun } from 'lucide-react';
import { ConnectionPhase } from '../obs/types';

interface TopBarProps {
  mosqueName: string;
  onMosqueNameChange: (name: string) => void;
  phase: ConnectionPhase;
  statusMessage: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenLog: () => void;
  onOpenStyleSettings: () => void;
  onOpenSettings: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  mosqueName,
  onMosqueNameChange,
  phase,
  statusMessage,
  theme,
  onToggleTheme,
  onOpenLog,
  onOpenStyleSettings,
  onOpenSettings,
}) => {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(mosqueName);

  const commitName = () => {
    const trimmed = draftName.trim() || 'Masjid Jeram';
    onMosqueNameChange(trimmed);
    setDraftName(trimmed);
    setEditing(false);
  };

  const dotColor =
    phase === 'connected' || phase === 'demo'
      ? 'bg-emerald-500'
      : phase === 'connecting' || phase === 'reconnecting'
      ? 'bg-amber-400'
      : 'bg-red-500';

  return (
    <header className="md:sticky md:top-0 z-30 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
      {phase === 'demo' && (
        <div className="bg-amber-600 dark:bg-amber-700 text-white px-4 py-1.5 text-sm font-medium text-center">
          Mod Demo aktif — data contoh untuk latihan sahaja. Tekan Sambungan untuk sambung ke OBS sebenar.
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl accent-active-card border flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 accent-label" fill="currentColor">
              <path d="M12 2L9.5 5.5C7 7 5 9.5 5 13v7h14v-7c0-3.5-2-6-4.5-7.5L12 2zm0 9a2.5 2.5 0 012.5 2.5V18h-5v-4.5A2.5 2.5 0 0112 11z" />
            </svg>
          </div>

          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                commitName();
              }}
              className="flex items-center gap-2"
            >
              <label htmlFor="mosque-name-input" className="sr-only">
                Nama masjid
              </label>
              <input
                id="mosque-name-input"
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitName}
                autoFocus
                className="min-h-11 px-3 py-1.5 rounded-lg border border-emerald-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold text-base w-48 sm:w-64 focus-visible:outline-2 focus-visible:outline-emerald-600"
              />
              <button
                type="submit"
                aria-label="Simpan nama masjid"
                className="min-h-11 px-3 rounded-lg accent-btn inline-flex items-center gap-1.5 font-medium whitespace-nowrap"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                Simpan
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 truncate">
                {mosqueName}
              </h1>
              <button
                type="button"
                onClick={() => {
                  setDraftName(mosqueName);
                  setEditing(true);
                }}
                aria-label="Ubah nama masjid"
                data-tip="Klik untuk menukar nama masjid yang dipaparkan di panel ini."
                className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-emerald-600 shrink-0"
              >
                <Pencil className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <div
            className="flex items-center gap-2 text-sm sm:text-base font-medium text-stone-700 dark:text-stone-200 px-2"
            role="status"
            aria-live="polite"
          >
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${dotColor}`}
              aria-hidden="true"
            />
            <span className="whitespace-nowrap">{statusMessage}</span>
          </div>

          <button
            type="button"
            onClick={onOpenLog}
            data-tip="Lihat catatan masa sebenar semua aktiviti siaran (mula siaran, tukar paparan, template dan audio)."
            data-tip-title="Rekod Siaran"
            className="min-h-12 px-3.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 inline-flex items-center gap-2 font-semibold whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            <ClipboardList className="w-5 h-5 accent-label" aria-hidden="true" />
            <span>Rekod</span>
          </button>

          <button
            type="button"
            onClick={onOpenStyleSettings}
            data-tip="Ubah suai tema warna, saiz butang, gaya overlay dan bahagian yang dipaparkan pada dashboard."
            data-tip-title="Gaya & Paparan"
            className="min-h-12 px-3.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 inline-flex items-center gap-2 font-semibold whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            <Palette className="w-5 h-5 accent-label" aria-hidden="true" />
            <span>Gaya</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Tukar ke mod terang' : 'Tukar ke mod gelap'}
            data-tip="Tukar paparan antara mod terang dan mod gelap."
            className="min-h-12 min-w-12 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5" aria-hidden="true" />
            )}
            <span className="hidden lg:inline">
              {theme === 'dark' ? 'Mod Terang' : 'Mod Gelap'}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            data-tip="Buka tetapan sambungan OBS (alamat IP, port 4455, kata laluan atau Mod Demo)."
            className="min-h-12 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 inline-flex items-center gap-2 font-semibold whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            <Settings className="w-5 h-5" aria-hidden="true" />
            <span>Sambungan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
