import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { MonitorType, ObsAudioInput } from '../obs/types';
import { dbToMeterPercent } from '../utils/obsAudio';
import { TipIcon } from './TooltipManager';

interface AudioCardProps {
  connected: boolean;
  audioInputs: ObsAudioInput[];
  meterLevelsRef: React.MutableRefObject<Record<string, number>>;
  onToggleMute: (inputName: string, nextMuted: boolean) => Promise<void>;
  onVolumeChange: (inputName: string, db: number) => Promise<void>;
  onMonitorChange: (inputName: string, monitorType: MonitorType) => Promise<void>;
  onDisableAllMonitors: (inputNames: string[]) => Promise<void>;
}

const MONITOR_OPTIONS: Array<{ value: MonitorType; label: string }> = [
  { value: 'OBS_MONITORING_TYPE_NONE', label: 'None (Disyorkan)' },
  { value: 'OBS_MONITORING_TYPE_MONITOR_ONLY', label: 'Monitor Only (Mute Output)' },
  { value: 'OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT', label: 'Monitor and Output' },
];

export const AudioCard: React.FC<AudioCardProps> = ({
  connected,
  audioInputs,
  meterLevelsRef,
  onToggleMute,
  onVolumeChange,
  onMonitorChange,
  onDisableAllMonitors,
}) => {
  const maskRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const peakRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const labelRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const peakHoldRef = useRef<Record<string, number>>({});
  const volumeTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const monitorActiveInputs = audioInputs.filter(
    (a) => a.monitorType !== 'OBS_MONITORING_TYPE_NONE'
  );

  // Smooth 60fps meter bar updates via DOM refs without triggering React state churn
  useEffect(() => {
    let rafId = 0;
    const tick = () => {
      for (const input of audioInputs) {
        const maskEl = maskRefs.current[input.name];
        const peakEl = peakRefs.current[input.name];
        const lblEl = labelRefs.current[input.name];
        if (!maskEl || !lblEl) continue;

        let db = meterLevelsRef.current[input.name];
        if (input.muted || db == null) {
          db = -100;
        }
        const pct = dbToMeterPercent(db);
        maskEl.style.width = `${100 - pct}%`;

        const prevPeak = peakHoldRef.current[input.name] ?? 0;
        const nextPeak = Math.max(pct, prevPeak - 0.45);
        peakHoldRef.current[input.name] = nextPeak;

        if (peakEl) {
          peakEl.style.left = `calc(${nextPeak}% - 3px)`;
          peakEl.style.opacity = nextPeak > 1 ? '1' : '0';
        }

        if (input.muted) {
          lblEl.textContent = 'Disenyapkan';
          lblEl.className = 'text-sm font-mono-tabular text-red-700 dark:text-red-400 font-semibold';
        } else if (db < -59) {
          lblEl.textContent = 'Tiada bunyi';
          lblEl.className = 'text-sm font-mono-tabular text-stone-500 dark:text-stone-400';
        } else if (db > -3) {
          lblEl.textContent = `${Math.round(db)} dB · Terlalu kuat!`;
          lblEl.className = 'text-sm font-mono-tabular text-red-700 dark:text-red-400 font-bold';
        } else {
          lblEl.textContent = `${Math.round(db)} dB`;
          lblEl.className = 'text-sm font-mono-tabular text-stone-700 dark:text-stone-300 font-medium';
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [audioInputs, meterLevelsRef]);

  return (
    <section
      aria-labelledby="heading-audio"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <h2 id="heading-audio" className="text-lg font-bold text-stone-900 dark:text-stone-100">
            5. Audio
          </h2>
          <TipIcon
            label="Kawalan Audio"
            tip="Pantau paras bunyi yang dihantar ke siaran. Paras hijau hingga kuning adalah baik. Jika kerap ke kawasan merah, perlahankan suara di mixer atau gelangsar ini."
          />
        </div>
        <span className="text-sm text-stone-600 dark:text-stone-400">
          Sasaran paras sihat: hijau hingga kuning (−20 hingga −9 dB)
        </span>
      </div>

      {monitorActiveInputs.length > 0 && (
        <div
          role="alert"
          data-testid="monitor-warning"
          className="mb-5 p-4 rounded-xl border border-red-400 dark:border-red-700 bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-100 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3 min-w-0">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-bold text-base">
                Monitor menghantar bunyi semula ke speaker — ini punca bunyi berganda
              </p>
              <p className="text-sm text-red-800 dark:text-red-200 mt-0.5">
                Sumber terlibat: {monitorActiveInputs.map((i) => i.name).join(', ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDisableAllMonitors(monitorActiveInputs.map((i) => i.name))}
            data-tip="Tetapkan semua Monitor audio kepada None supaya bunyi tidak bergema."
            className="min-h-12 px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-red-600"
          >
            Matikan monitor
          </button>
        </div>
      )}

      {!connected ? (
        <p className="text-stone-600 dark:text-stone-400 py-4">
          Belum bersambung ke OBS.
        </p>
      ) : audioInputs.length === 0 ? (
        <p className="text-stone-600 dark:text-stone-400 py-4">
          Tiada input audio dijumpai dalam OBS.
        </p>
      ) : (
        <div className="space-y-4 mt-4">
          {audioInputs.map((input) => {
            const hasMonitor = input.monitorType !== 'OBS_MONITORING_TYPE_NONE';
            return (
              <div
                key={input.name}
                className={`p-4 rounded-xl border ${
                  hasMonitor
                    ? 'border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-950/30'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-base text-stone-900 dark:text-stone-100 break-words">
                    {input.name}
                  </span>
                  <span
                    ref={(el) => {
                      labelRefs.current[input.name] = el;
                    }}
                    className="text-sm font-mono-tabular text-stone-600 dark:text-stone-400"
                  >
                    –
                  </span>
                </div>

                {/* Meter 0-100 (green -> yellow -> red) */}
                <div
                  className="relative h-4 rounded-lg overflow-hidden"
                  style={{
                    background:
                      'linear-gradient(90deg, #16a34a 0% 62%, #eab308 62% 88%, #dc2626 88% 100%)',
                  }}
                  aria-hidden="true"
                >
                  <div
                    ref={(el) => {
                      maskRefs.current[input.name] = el;
                    }}
                    className="absolute right-0 top-0 bottom-0 bg-stone-200 dark:bg-stone-700 transition-[width] duration-75 ease-linear"
                    style={{ width: '100%' }}
                  />
                  <div
                    ref={(el) => {
                      peakRefs.current[input.name] = el;
                    }}
                    className="absolute top-0 bottom-0 w-[3px] bg-stone-900 dark:bg-white opacity-0"
                    style={{ left: '0%' }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono-tabular text-stone-500 dark:text-stone-400 mt-1 mb-3">
                  <span>-60</span>
                  <span>-40</span>
                  <span>-20</span>
                  <span>-9</span>
                  <span>0 dB</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    aria-pressed={input.muted}
                    onClick={() => onToggleMute(input.name, !input.muted)}
                    data-tip="Mute: senyapkan atau hidupkan semula sumber bunyi ini dalam siaran."
                    className={`min-h-12 min-w-28 px-4 rounded-xl font-bold inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                      input.muted
                        ? 'bg-red-700 text-white hover:bg-red-800'
                        : 'bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700'
                    }`}
                  >
                    {input.muted ? (
                      <>
                        <VolumeX className="w-5 h-5" aria-hidden="true" />
                        <span>Senyap (Mute)</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-5 h-5" aria-hidden="true" />
                        <span>Hidup</span>
                      </>
                    )}
                  </button>

                  <div className="flex-1 min-w-[180px] flex items-center gap-3">
                    <label htmlFor={`vol-${input.name}`} className="sr-only">
                      Kelantangan {input.name}
                    </label>
                    <input
                      id={`vol-${input.name}`}
                      type="range"
                      min={-60}
                      max={0}
                      step={0.5}
                      value={input.db}
                      onChange={(e) => {
                        const nextDb = parseFloat(e.target.value);
                        clearTimeout(volumeTimersRef.current[input.name]);
                        volumeTimersRef.current[input.name] = setTimeout(() => {
                          onVolumeChange(input.name, nextDb);
                        }, 60);
                        onVolumeChange(input.name, nextDb);
                      }}
                      className="flex-1 h-8 accent-emerald-700 dark:accent-emerald-500 cursor-pointer"
                    />
                    <span className="min-w-16 text-right font-mono-tabular font-semibold text-sm text-stone-900 dark:text-stone-100">
                      {input.db.toFixed(1)} dB
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <label
                    htmlFor={`mon-${input.name}`}
                    className="text-sm font-medium text-stone-700 dark:text-stone-300"
                  >
                    Monitor:
                  </label>
                  <select
                    id={`mon-${input.name}`}
                    value={input.monitorType}
                    onChange={(e) =>
                      onMonitorChange(input.name, e.target.value as MonitorType)
                    }
                    className="min-h-11 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus-visible:outline-2 focus-visible:outline-emerald-600"
                  >
                    {MONITOR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <TipIcon
                    label={`Monitor ${input.name}`}
                    tip="Monitor menentukan sama ada OBS memainkan bunyi keluar ke speaker komputer. Untuk masjid, tetapkan kepada None supaya tidak bergema."
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
