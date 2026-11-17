import React, { useEffect, useRef, useState } from 'react';
import { Circle, Play, Square } from 'lucide-react';
import { calcDropPercent, formatDuration } from '../utils/obsAudio';
import { TipIcon } from './TooltipManager';

interface LiveCardProps {
  connected: boolean;
  streaming: boolean;
  recording: boolean;
  durationMs: number;
  skippedFrames: number;
  totalFrames: number;
  cpuUsage: number | null;
  fps: number | null;
  checklistCompleted: number;
  checklistTotal: number;
  onStartStream: () => Promise<void>;
  onStopStream: () => Promise<void>;
  onToggleRecord: () => Promise<void>;
}

export const LiveCard: React.FC<LiveCardProps> = ({
  connected,
  streaming,
  recording,
  durationMs,
  skippedFrames,
  totalFrames,
  cpuUsage,
  fps,
  checklistCompleted,
  checklistTotal,
  onStartStream,
  onStopStream,
  onToggleRecord,
}) => {
  const [armedAction, setArmedAction] = useState<'start' | 'stop' | null>(null);
  const [busy, setBusy] = useState(false);
  const armTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (armTimerRef.current) clearTimeout(armTimerRef.current);
    };
  }, []);

  // Reset armed state if stream state changes underneath
  useEffect(() => {
    setArmedAction(null);
    if (armTimerRef.current) {
      clearTimeout(armTimerRef.current);
      armTimerRef.current = null;
    }
  }, [streaming]);

  const handleTwoStep = async (action: 'start' | 'stop', fn: () => Promise<void>) => {
    if (busy) return;
    if (armedAction === action) {
      if (armTimerRef.current) {
        clearTimeout(armTimerRef.current);
        armTimerRef.current = null;
      }
      setArmedAction(null);
      setBusy(true);
      try {
        await fn();
      } finally {
        setBusy(false);
      }
      return;
    }

    setArmedAction(action);
    if (armTimerRef.current) clearTimeout(armTimerRef.current);
    armTimerRef.current = setTimeout(() => {
      setArmedAction(null);
      armTimerRef.current = null;
    }, 4000);
  };

  const dropPct = calcDropPercent(skippedFrames, totalFrames);
  const unstableNet = dropPct > 2;

  return (
    <section
      aria-labelledby="heading-siaran"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <h2 id="heading-siaran" className="text-lg font-bold text-stone-900 dark:text-stone-100">
            1. Siaran
          </h2>
          <TipIcon
            label="Siaran"
            tip="Butang utama untuk memulakan atau menamatkan siaran langsung (Stream). Kedua-dua butang memerlukan dua kali klik dalam 4 saat untuk elak tersilap tekan."
            hint="Petua: Semak meter audio & Senarai Semak dahulu sebelum mula."
          />
        </div>

        <div
          role="status"
          aria-live="polite"
          data-testid="live-badge"
          className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-base font-extrabold tracking-wide ${
            streaming
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200'
          }`}
        >
          <span
            className={`w-3 h-3 rounded-full ${
              streaming ? 'bg-white' : 'bg-stone-500 dark:bg-stone-400'
            }`}
            aria-hidden="true"
          />
          <span>{streaming ? 'SEDANG BERSIARAN' : 'TIDAK BERSIARAN'}</span>
        </div>
      </div>

      {!streaming && checklistCompleted < checklistTotal && (
        <p className="mb-4 text-sm font-medium text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5">
          Peringatan: Senarai semak sebelum siaran baru {checklistCompleted} daripada {checklistTotal} selesai. Sila semak sebelum mula siaran.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          type="button"
          disabled={!connected || streaming || busy}
          onClick={() => handleTwoStep('start', onStartStream)}
          data-tip="Mulakan siaran langsung ke YouTube/Facebook. Klik dua kali dalam 4 saat untuk sahkan."
          data-tip-title="Mula Siaran (Stream)"
          data-tip-hint="Pengesahan 2 langkah mengelakkan siaran bermula secara tidak sengaja."
          className={`min-h-14 px-6 py-3 rounded-xl font-bold text-base sm:text-lg inline-flex items-center justify-center gap-2.5 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-45 disabled:cursor-not-allowed ${
            armedAction === 'start'
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'accent-btn'
          }`}
        >
          <Play className="w-5 h-5" aria-hidden="true" />
          <span>
            {armedAction === 'start' ? 'Klik sekali lagi untuk sahkan' : 'MULA SIARAN'}
          </span>
        </button>

        <button
          type="button"
          disabled={!connected || !streaming || busy}
          onClick={() => handleTwoStep('stop', onStopStream)}
          data-tip="Tamatkan siaran langsung. Klik dua kali dalam 4 saat untuk mengesahkan."
          className={`min-h-14 px-6 py-3 rounded-xl font-bold text-base sm:text-lg inline-flex items-center justify-center gap-2.5 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-45 disabled:cursor-not-allowed ${
            armedAction === 'stop'
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-red-700 hover:bg-red-800 text-white'
          }`}
        >
          <Square className="w-5 h-5" aria-hidden="true" />
          <span>
            {armedAction === 'stop' ? 'Klik sekali lagi untuk sahkan' : 'TAMAT SIARAN'}
          </span>
        </button>

        <button
          type="button"
          disabled={!connected || busy}
          onClick={onToggleRecord}
          data-tip="Rakaman (Record): simpan salinan video di komputer ini sebagai sandaran jika internet terputus."
          className={`min-h-14 px-5 py-3 rounded-xl font-semibold text-base border inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-emerald-600 disabled:opacity-45 disabled:cursor-not-allowed ${
            recording
              ? 'bg-red-50 border-red-400 text-red-800 hover:bg-red-100 dark:bg-red-950/60 dark:border-red-700 dark:text-red-200'
              : 'bg-stone-50 border-stone-300 text-stone-900 hover:bg-stone-100 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-100 dark:hover:bg-stone-700'
          }`}
        >
          <Circle
            className={`w-4 h-4 ${recording ? 'fill-red-600 text-red-600' : ''}`}
            aria-hidden="true"
          />
          <span>{recording ? 'Henti Rakaman' : 'Mula Rakaman'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
        <div className="py-1">
          <div className="text-xs font-medium text-stone-600 dark:text-stone-400">
            Tempoh siaran
          </div>
          <div className="text-xl font-bold font-mono-tabular text-stone-900 dark:text-stone-100 mt-0.5">
            {formatDuration(durationMs)}
          </div>
        </div>

        <div className="py-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400">
            <span>Bingkai gugur</span>
          </div>
          <div
            className={`text-xl font-bold font-mono-tabular mt-0.5 ${
              unstableNet
                ? 'text-red-700 dark:text-red-400'
                : 'text-stone-900 dark:text-stone-100'
            }`}
          >
            {dropPct.toFixed(1)}%
          </div>
          {unstableNet && (
            <div className="text-xs font-semibold text-red-700 dark:text-red-400 mt-0.5">
              Internet tidak stabil
            </div>
          )}
        </div>

        <div className="py-1">
          <div className="text-xs font-medium text-stone-600 dark:text-stone-400">CPU OBS</div>
          <div className="text-xl font-bold font-mono-tabular text-stone-900 dark:text-stone-100 mt-0.5">
            {cpuUsage != null ? `${Math.round(cpuUsage)}%` : '–'}
          </div>
        </div>

        <div className="py-1">
          <div className="text-xs font-medium text-stone-600 dark:text-stone-400">FPS</div>
          <div className="text-xl font-bold font-mono-tabular text-stone-900 dark:text-stone-100 mt-0.5">
            {fps != null ? Math.round(fps) : '–'}
          </div>
        </div>

        <div className="py-1">
          <div className="text-xs font-medium text-stone-600 dark:text-stone-400">Rakaman</div>
          <div
            className={`text-xl font-bold mt-0.5 ${
              recording
                ? 'text-red-700 dark:text-red-400'
                : 'text-stone-900 dark:text-stone-100'
            }`}
          >
            {recording ? 'Merakam' : 'Mati'}
          </div>
        </div>
      </div>
    </section>
  );
};
