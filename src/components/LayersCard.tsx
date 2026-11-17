import React from 'react';
import { ObsSceneItem } from '../obs/types';
import { TipIcon } from './TooltipManager';

interface LayersCardProps {
  connected: boolean;
  currentScene: string;
  items: ObsSceneItem[];
  onToggleItem: (sceneItemId: number, enabled: boolean) => Promise<void>;
}

export const LayersCard: React.FC<LayersCardProps> = ({
  connected,
  currentScene,
  items,
  onToggleItem,
}) => {
  return (
    <section
      aria-labelledby="heading-lapisan"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <h2 id="heading-lapisan" className="text-lg font-bold text-stone-900 dark:text-stone-100">
            4. Logo &amp; Lapisan
          </h2>
          <TipIcon
            label="Logo dan Lapisan"
            tip="Hidupkan atau matikan item seperti Logo Masjid, QR Infaq atau Teks pada Scene yang sedang aktif."
          />
        </div>
      </div>

      <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
        Paparan semasa: <span className="font-semibold text-stone-900 dark:text-stone-100">{currentScene || '–'}</span>
      </p>

      {!connected ? (
        <p className="text-stone-600 dark:text-stone-400 py-4">
          Belum bersambung ke OBS.
        </p>
      ) : items.length === 0 ? (
        <p className="text-stone-600 dark:text-stone-400 py-4">
          Paparan ini tidak mempunyai lapisan.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => {
            const enabled = !!item.sceneItemEnabled;
            return (
              <li
                key={item.sceneItemId}
                className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700"
              >
                <span className="font-medium text-stone-900 dark:text-stone-100 break-words min-w-0">
                  {item.sourceName}
                </span>

                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`${enabled ? 'Matikan' : 'Hidupkan'} ${item.sourceName}`}
                  onClick={() => onToggleItem(item.sceneItemId, !enabled)}
                  data-tip={`Klik untuk ${enabled ? 'menyembunyikan' : 'memaparkan'} "${item.sourceName}" pada skrin.`}
                  className={`min-h-12 min-w-20 px-4 rounded-xl font-bold text-sm transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                    enabled
                      ? 'accent-btn'
                      : 'bg-stone-200 text-stone-700 hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600'
                  }`}
                >
                  {enabled ? 'HIDUP' : 'MATI'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
