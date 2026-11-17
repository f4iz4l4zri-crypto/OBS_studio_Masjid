import React from 'react';
import { Palette, RotateCcw, X } from 'lucide-react';
import {
  ACCENT_THEMES,
  DashboardStyleConfig,
  DEFAULT_STYLE_CONFIG,
  LAYOUT_PRESETS,
  OVERLAY_VISUAL_STYLES,
} from '../utils/templates';

interface StyleCustomizerDialogProps {
  open: boolean;
  config: DashboardStyleConfig;
  onChange: (next: DashboardStyleConfig) => void;
  onClose: () => void;
}

export const StyleCustomizerDialog: React.FC<StyleCustomizerDialogProps> = ({
  open,
  config,
  onChange,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="style-dlg-title"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <Palette className="w-6 h-6 accent-label" aria-hidden="true" />
            <h2 id="style-dlg-title" className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Ubah Suai Gaya &amp; Paparan Dashboard
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup tetapan gaya"
            className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm text-stone-600 dark:text-stone-400 mb-5">
          Pilih tema warna, susun atur butang, gaya overlay dan kad yang mahu dipaparkan. Semua perubahan disimpan secara automatik pada pelayar ini.
        </p>

        <div className="space-y-6">
          {/* 1. Accent Color Theme */}
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-2.5">
              1. Tema Warna Panel
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ACCENT_THEMES.map((theme) => {
                const selected = config.accent === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChange({ ...config, accent: theme.id })}
                    className={`min-h-14 p-3 rounded-xl border text-left flex items-start gap-3 transition-colors ${
                      selected
                        ? 'accent-active-card border-2'
                        : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <span
                      className="w-7 h-7 rounded-lg shrink-0 mt-0.5 border border-black/15"
                      style={{ backgroundColor: theme.swatchHex }}
                      aria-hidden="true"
                    />
                    <div>
                      <div className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {theme.name}
                      </div>
                      <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                        {theme.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Layout & Button Size */}
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-2.5">
              2. Gaya Susunan &amp; Saiz Butang
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {LAYOUT_PRESETS.map((preset) => {
                const selected = config.layout === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChange({ ...config, layout: preset.id })}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      selected
                        ? 'accent-active-card border-2'
                        : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <div className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {preset.name}
                    </div>
                    <div className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                      {preset.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Overlay Style */}
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-2.5">
              3. Contoh Gaya Overlay Siaran (Tajuk &amp; QR)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {OVERLAY_VISUAL_STYLES.map((st) => {
                const selected = config.overlayStyle === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChange({ ...config, overlayStyle: st.id })}
                    className={`min-h-12 p-2.5 rounded-xl border text-left transition-colors ${
                      selected
                        ? 'accent-active-card border-2'
                        : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <div className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {st.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Visible Sections */}
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-2">
              4. Bahagian yang Dipaparkan
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={config.showPreview}
                  onChange={(e) => onChange({ ...config, showPreview: e.target.checked })}
                  className="w-5 h-5 rounded accent-emerald-700"
                />
                <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  Papar Pratonton Skrin &amp; Template Keluar
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={config.showChecklist}
                  onChange={(e) => onChange({ ...config, showChecklist: e.target.checked })}
                  className="w-5 h-5 rounded accent-emerald-700"
                />
                <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  Papar Senarai Semak Sebelum Siaran
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={config.showGuide}
                  onChange={(e) => onChange({ ...config, showGuide: e.target.checked })}
                  className="w-5 h-5 rounded accent-emerald-700"
                />
                <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  Papar Panduan Ringkas &amp; Penyelesaian Masalah
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_STYLE_CONFIG)}
            className="min-h-12 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-semibold inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Set Semula Gaya Lalai</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-12 px-6 rounded-xl accent-btn font-bold"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
