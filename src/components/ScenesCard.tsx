import React from 'react';
import { TipIcon } from './TooltipManager';

interface ScenesCardProps {
  connected: boolean;
  scenes: string[];
  currentScene: string;
  onSelectScene: (sceneName: string) => Promise<void>;
}

export const ScenesCard: React.FC<ScenesCardProps> = ({
  connected,
  scenes,
  currentScene,
  onSelectScene,
}) => {
  return (
    <section
      aria-labelledby="heading-paparan"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <h2 id="heading-paparan" className="text-lg font-bold text-stone-900 dark:text-stone-100">
          2. Pilih Paparan (Scene)
        </h2>
        <TipIcon
          label="Pilih Paparan"
          tip="Scene ialah susunan skrin yang dilihat penonton seperti Kuliah, Khutbah atau Sebentar Lagi. Klik untuk tukar serta-merta walaupun semasa siaran berjalan."
        />
      </div>

      {!connected ? (
        <p className="text-stone-600 dark:text-stone-400 py-4">
          Belum bersambung ke OBS. Buka Sambungan atau cuba Mod Demo.
        </p>
      ) : scenes.length === 0 ? (
        <p className="text-stone-600 dark:text-stone-400 py-4">
          Tiada Scene dijumpai dalam OBS.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {scenes.map((sceneName) => {
            const isActive = sceneName === currentScene;
            return (
              <button
                key={sceneName}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  if (!isActive) onSelectScene(sceneName);
                }}
                data-tip={
                  isActive
                    ? 'Paparan (Scene) ini sedang disiarkan kepada penonton.'
                    : `Tukar skrin siaran kepada "${sceneName}" serta-merta.`
                }
                className={`min-h-16 px-4 py-3 rounded-xl border-2 text-left flex flex-col justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                  isActive
                    ? 'accent-active-card text-stone-950 dark:text-white font-bold'
                    : 'border-stone-300 bg-stone-50 text-stone-900 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700 font-semibold'
                }`}
              >
                <span
                  className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${
                    isActive
                      ? 'accent-label'
                      : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {isActive ? 'AKTIF SEKARANG' : 'Tukar ke paparan'}
                </span>
                <span className="text-base break-words">{sceneName}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
