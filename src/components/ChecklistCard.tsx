import React from 'react';
import { RotateCcw } from 'lucide-react';
import { TipIcon } from './TooltipManager';

export const CHECKLIST_ITEMS = [
  'Mixer audio dihidupkan dan paras bunyi sihat (tidak terlalu kuat).',
  'Mikrofon imam / penceramah dibuka dan berfungsi.',
  'Kamera PTZ menyala dan menghala ke mimbar atau ruang kuliah.',
  'Sambungan internet (kabel LAN) OK dan stabil.',
  'Aplikasi OBS Studio sudah dibuka pada komputer.',
  'Kabel audio ke UM2 / antara muka audio dipasang kemas.',
  'Monitor audio OBS ditetapkan kepada None (tiada amaran bunyi berganda).',
  'Logo, tajuk kuliah dan nama penceramah sudah disemak.',
] as const;

interface ChecklistCardProps {
  ticks: number[];
  onToggleTick: (index: number) => void;
  onReset: () => void;
}

export const ChecklistCard: React.FC<ChecklistCardProps> = ({
  ticks,
  onToggleTick,
  onReset,
}) => {
  const completedCount = ticks.length;
  const totalCount = CHECKLIST_ITEMS.length;
  const pct = Math.round((completedCount / totalCount) * 100);

  return (
    <section
      aria-labelledby="heading-semak"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <h2 id="heading-semak" className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Senarai Semak Sebelum Siaran
          </h2>
          <TipIcon
            label="Senarai Semak"
            tip="Tanda setiap perkara sebelum memulakan siaran. Senarai ini disimpan untuk hari ini dan akan reset automatik pada hari esok."
          />
        </div>
        <span className="text-sm font-semibold tabular-nums text-stone-700 dark:text-stone-300 whitespace-nowrap">
          {completedCount} / {totalCount} selesai
        </span>
      </div>

      <div
        className="w-full h-2.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden mb-4"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Kemajuan senarai semak"
      >
        <div
          className="h-full accent-bar transition-all duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="divide-y divide-stone-200 dark:divide-stone-800">
        {CHECKLIST_ITEMS.map((itemText, index) => {
          const checked = ticks.includes(index);
          return (
            <li key={index}>
              <label className="flex items-start gap-3 py-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleTick(index)}
                  className="w-6 h-6 mt-0.5 rounded border-stone-400 text-emerald-700 accent-emerald-700 shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-600"
                />
                <span
                  className={`text-base leading-snug ${
                    checked
                      ? 'line-through text-stone-500 dark:text-stone-400'
                      : 'text-stone-900 dark:text-stone-100'
                  }`}
                >
                  {itemText}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
        <span className="text-xs text-stone-600 dark:text-stone-400">
          Reset automatik setiap hari
        </span>
        <button
          type="button"
          onClick={onReset}
          data-tip="Kosongkan semua tanda semak untuk persediaan siaran seterusnya."
          className="min-h-12 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-medium inline-flex items-center gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-emerald-600"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          <span>Set semula</span>
        </button>
      </div>
    </section>
  );
};
