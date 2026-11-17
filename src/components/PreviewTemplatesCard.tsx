import React, { useMemo, useState } from 'react';
import { Check, Eye, QrCode, Sparkles, SlidersHorizontal } from 'lucide-react';
import { ObsSceneItem } from '../obs/types';
import { QrOverlayInfo, TextDraft } from '../utils/storage';
import {
  getPreviewLayerFlags,
  OUTPUT_TEMPLATES,
  OutputTemplate,
  OVERLAY_VISUAL_STYLES,
  OverlayVisualStyleId,
} from '../utils/templates';
import { TipIcon } from './TooltipManager';

interface PreviewTemplatesCardProps {
  connected: boolean;
  streaming: boolean;
  mosqueName: string;
  currentScene: string;
  sceneItems: ObsSceneItem[];
  draft: TextDraft;
  overlayStyle: OverlayVisualStyleId;
  onOverlayStyleChange: (style: OverlayVisualStyleId) => void;
  qrInfo: QrOverlayInfo;
  onQrInfoChange: (info: QrOverlayInfo) => void;
  onApplyTemplate: (template: OutputTemplate) => Promise<void>;
  onQuickToggleCategory: (category: 'qr' | 'ticker' | 'title' | 'logo', enable: boolean) => Promise<void>;
}

/** Deterministic local 11x11 SVG QR-style matrix (zero external requests) */
const QR_PATTERN = [
  '11110101111',
  '10010011001',
  '10110101101',
  '10010111001',
  '11110011111',
  '00001010000',
  '10110110101',
  '11110010110',
  '10010101001',
  '10110110111',
  '11110101001',
];

export const PreviewTemplatesCard: React.FC<PreviewTemplatesCardProps> = ({
  connected,
  streaming,
  mosqueName,
  currentScene,
  sceneItems,
  draft,
  overlayStyle,
  onOverlayStyleChange,
  qrInfo,
  onQrInfoChange,
  onApplyTemplate,
  onQuickToggleCategory,
}) => {
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [lastAppliedId, setLastAppliedId] = useState<string | null>(null);
  const [editingQr, setEditingQr] = useState(false);

  const flags = useMemo(() => getPreviewLayerFlags(sceneItems), [sceneItems]);

  const titleText = draft.Tajuk.trim() || 'Kuliah Maghrib — Tafsir Surah Al-Kahfi';
  const speakerText = draft.Penceramah.trim() || 'Ustaz Mohd Yasin';
  const tickerText =
    draft.Berjalan.trim() ||
    `Selamat datang ke siaran langsung ${mosqueName}. Jom salurkan sumbangan infaq anda.`;

  const handleApply = async (tpl: OutputTemplate) => {
    setApplyingId(tpl.id);
    try {
      await onApplyTemplate(tpl);
      setLastAppliedId(tpl.id);
    } finally {
      setApplyingId(null);
    }
  };

  // Overlay visual style classes for Lower Third
  const lowerThirdClass =
    overlayStyle === 'classic'
      ? 'bg-emerald-950/90 border border-emerald-400/60 text-white rounded-xl'
      : overlayStyle === 'modern'
      ? 'bg-stone-950/75 backdrop-blur-sm border-b-2 border-white/80 text-white rounded-md'
      : overlayStyle === 'broadcast'
      ? 'bg-red-900/95 border border-white/25 text-white rounded-none'
      : 'bg-white/95 text-stone-900 border border-stone-200 rounded-2xl shadow-lg';

  const qrBoxClass =
    overlayStyle === 'broadcast'
      ? 'bg-stone-950/95 text-white border border-amber-400/70 rounded-none'
      : overlayStyle === 'modern'
      ? 'bg-stone-950/80 text-white border border-white/30 rounded-lg'
      : 'bg-white/95 text-stone-900 border border-stone-200 rounded-xl shadow-md';

  return (
    <section
      aria-labelledby="heading-pratonton"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <h2 id="heading-pratonton" className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Pratonton Skrin &amp; Template Keluar
          </h2>
          <TipIcon
            label="Pratonton Skrin dan Template Keluar"
            tip="Lihat gambaran bagaimana paparan siaran anda kelihatan kepada penonton (Logo, QR Jom Infaq, Tajuk dan Teks Berjalan). Pilih Template Keluar untuk susunan pantas satu klik."
            hint="Perubahan terus menyegerak dengan kad Logo & Lapisan."
          />
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
          <Eye className="w-4 h-4" aria-hidden="true" />
          <span>Paparan: {currentScene || '–'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left: 16:9 Interactive Screen Preview */}
        <div className="xl:col-span-7 space-y-3">
          <div
            data-testid="broadcast-preview"
            className="relative w-full aspect-video rounded-xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-stone-900 select-none"
          >
            {/* Camera / Standby Backdrop SVG */}
            {flags.hasCamera ? (
              <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-900 to-emerald-950">
                <svg
                  viewBox="0 0 640 360"
                  className="w-full h-full opacity-45"
                  aria-hidden="true"
                >
                  {/* Stylized Mosque Mihrab & Mimbar Scene */}
                  <defs>
                    <radialGradient id="mimbarGlow" cx="50%" cy="35%" r="55%">
                      <stop offset="0%" stopColor="#fde68a" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <rect width="640" height="360" fill="url(#mimbarGlow)" />
                  <path
                    d="M210 360 V175 C210 105 265 70 320 50 C375 70 430 105 430 175 V360"
                    fill="none"
                    stroke="#a7f3d0"
                    strokeOpacity="0.28"
                    strokeWidth="3"
                  />
                  <path
                    d="M245 360 V190 C245 135 285 105 320 90 C355 105 395 135 395 190 V360"
                    fill="#064e3b"
                    fillOpacity="0.25"
                  />
                  {/* Speaker silhouette at mimbar */}
                  <circle cx="320" cy="185" r="24" fill="#d6d3d1" fillOpacity="0.45" />
                  <path
                    d="M275 275 C275 232 295 215 320 215 C345 215 365 232 365 275 Z"
                    fill="#d6d3d1"
                    fillOpacity="0.38"
                  />
                  <rect
                    x="265"
                    y="275"
                    width="110"
                    height="85"
                    rx="4"
                    fill="#44403c"
                    fillOpacity="0.7"
                  />
                </svg>
                <span className="absolute bottom-11 right-3 text-[11px] font-mono-tabular text-white/50">
                  Kamera PTZ Aktif
                </span>
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-950 flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-1.5">
                  <p className="text-xs uppercase tracking-widest text-emerald-300 font-semibold">
                    {mosqueName}
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-white">
                    {currentScene || 'Siaran Akan Bermula Sebentar Lagi'}
                  </p>
                  <p className="text-xs text-stone-300">
                    Kamera dimatikan pada paparan ini (mod pengumuman / rehat)
                  </p>
                </div>
              </div>
            )}

            {/* Top-left: Logo Masjid */}
            {flags.hasLogo && (
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/55 backdrop-blur-xs border border-white/15 text-white">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-emerald-300 shrink-0"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 2L9.5 5.5C7 7 5 9.5 5 13v7h14v-7c0-3.5-2-6-4.5-7.5L12 2zm0 9a2.5 2.5 0 012.5 2.5V18h-5v-4.5A2.5 2.5 0 0112 11z" />
                </svg>
                <div className="leading-tight">
                  <div className="text-xs font-bold">{mosqueName}</div>
                  <div className="text-[10px] text-white/75">
                    {streaming ? 'SIARAN LANGSUNG' : 'PRATONTON'}
                  </div>
                </div>
              </div>
            )}

            {/* Top-right: QR Jom Infaq Card */}
            {flags.hasQr && (
              <div
                data-testid="preview-qr-box"
                className={`absolute top-3 right-3 p-2 flex items-center gap-2 max-w-[190px] ${qrBoxClass}`}
              >
                <div className="bg-white p-1 rounded shrink-0 border border-stone-300">
                  <svg viewBox="0 0 11 11" className="w-11 h-11" aria-hidden="true">
                    {QR_PATTERN.map((row, rIdx) =>
                      row.split('').map((cell, cIdx) =>
                        cell === '1' ? (
                          <rect
                            key={`${rIdx}-${cIdx}`}
                            x={cIdx}
                            y={rIdx}
                            width={1}
                            height={1}
                            fill="#111827"
                          />
                        ) : null
                      )
                    )}
                  </svg>
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="text-[11px] font-extrabold truncate">{qrInfo.title}</div>
                  <div className="text-[10px] opacity-80 line-clamp-2 mt-0.5">
                    {qrInfo.bankLabel}
                  </div>
                </div>
              </div>
            )}

            {/* Lower-Third: Tajuk & Penceramah */}
            {(flags.hasTitle || flags.hasSpeaker) && (
              <div
                data-testid="preview-lower-third"
                className={`absolute left-3 right-3 sm:right-auto sm:max-w-[78%] px-3.5 py-2 ${
                  flags.hasTicker ? 'bottom-10' : 'bottom-3'
                } ${lowerThirdClass}`}
              >
                {flags.hasTitle && (
                  <div className="text-xs sm:text-sm font-bold truncate">{titleText}</div>
                )}
                {flags.hasSpeaker && (
                  <div className="text-[11px] sm:text-xs opacity-90 truncate mt-0.5">
                    {speakerText}
                  </div>
                )}
              </div>
            )}

            {/* Bottom: Teks Berjalan (Ticker) */}
            {flags.hasTicker && (
              <div
                data-testid="preview-ticker"
                className="absolute bottom-0 inset-x-0 h-8 bg-stone-950/90 border-t border-white/15 text-white flex items-center overflow-hidden px-3"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-500 text-stone-950 px-2 py-0.5 rounded mr-2.5 shrink-0 z-10">
                  INFO
                </span>
                <div className="flex-1 overflow-hidden">
                  <span className="animate-ticker text-xs font-medium">{tickerText}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Individual Overlay Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!connected}
                onClick={() => onQuickToggleCategory('qr', !flags.hasQr)}
                data-tip="Hidup atau matikan kad QR Jom Infaq pada skrin siaran dengan serta-merta."
                className={`min-h-11 px-3.5 py-2 rounded-xl border text-sm font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-45 ${
                  flags.hasQr
                    ? 'accent-active-card accent-label'
                    : 'border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700'
                }`}
              >
                <QrCode className="w-4 h-4" aria-hidden="true" />
                <span>{flags.hasQr ? 'QR Infaq: HIDUP' : 'Tunjuk QR Infaq'}</span>
              </button>

              <button
                type="button"
                disabled={!connected}
                onClick={() => onQuickToggleCategory('ticker', !flags.hasTicker)}
                data-tip="Hidup atau matikan bar Teks Berjalan di bahagian bawah skrin."
                className={`min-h-11 px-3.5 py-2 rounded-xl border text-sm font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-45 ${
                  flags.hasTicker
                    ? 'accent-active-card accent-label'
                    : 'border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700'
                }`}
              >
                <span>{flags.hasTicker ? 'Teks Berjalan: HIDUP' : 'Tunjuk Teks Berjalan'}</span>
              </button>

              <button
                type="button"
                disabled={!connected}
                onClick={() => onQuickToggleCategory('title', !flags.hasTitle)}
                data-tip="Hidup atau matikan kotak Tajuk kuliah di skrin."
                className={`min-h-11 px-3.5 py-2 rounded-xl border text-sm font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-45 ${
                  flags.hasTitle
                    ? 'accent-active-card accent-label'
                    : 'border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700'
                }`}
              >
                <span>{flags.hasTitle ? 'Tajuk: HIDUP' : 'Tunjuk Tajuk'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setEditingQr((v) => !v)}
              className="min-h-11 px-3 py-2 rounded-xl text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 inline-flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
              <span>Ubah Info QR</span>
            </button>
          </div>

          {editingQr && (
            <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="qr-title-input"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  Tajuk Kad QR
                </label>
                <input
                  id="qr-title-input"
                  type="text"
                  value={qrInfo.title}
                  onChange={(e) => onQrInfoChange({ ...qrInfo, title: e.target.value })}
                  className="w-full min-h-11 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="qr-bank-input"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1"
                >
                  Keterangan Tabung / Akaun
                </label>
                <input
                  id="qr-bank-input"
                  type="text"
                  value={qrInfo.bankLabel}
                  onChange={(e) => onQrInfoChange({ ...qrInfo, bankLabel: e.target.value })}
                  className="w-full min-h-11 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Template Keluar + Gaya Visual Overlay */}
        <div className="xl:col-span-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Pilihan Template Keluar (1-Klik)
              </h3>
              <TipIcon
                label="Template Keluar"
                tip="Tekan salah satu template untuk hidupkan/matikan lapisan OBS (QR, Teks Berjalan, Tajuk, Kamera) secara automatik mengikut keperluan."
              />
            </div>

            <div className="space-y-2">
              {OUTPUT_TEMPLATES.map((tpl) => {
                const isSelected = lastAppliedId === tpl.id;
                const isBusy = applyingId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    disabled={!connected || applyingId !== null}
                    onClick={() => handleApply(tpl)}
                    data-tip={tpl.tooltip}
                    className={`w-full min-h-14 px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                      isSelected
                        ? 'accent-active-card border-2'
                        : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 accent-label shrink-0" aria-hidden="true" />
                        <span>{tpl.name}</span>
                      </div>
                      <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                        {tpl.summary}
                      </div>
                    </div>
                    {isBusy ? (
                      <span className="text-xs font-semibold accent-label shrink-0">Memakai…</span>
                    ) : isSelected ? (
                      <Check className="w-5 h-5 accent-label shrink-0" aria-hidden="true" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Gaya Reka Bentuk Overlay Skrin
              </h3>
              <TipIcon
                label="Gaya Reka Bentuk Overlay"
                tip="Pilih contoh gaya visual kotak Tajuk dan QR pada pratonton skrin untuk melihat rupa terbaik bagi siaran masjid anda."
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {OVERLAY_VISUAL_STYLES.map((st) => {
                const active = overlayStyle === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onOverlayStyleChange(st.id)}
                    data-tip={st.description}
                    className={`min-h-12 px-3 py-2 rounded-xl border text-left text-sm font-semibold transition-colors ${
                      active
                        ? 'accent-active-card accent-label border-2'
                        : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700'
                    }`}
                  >
                    {st.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
