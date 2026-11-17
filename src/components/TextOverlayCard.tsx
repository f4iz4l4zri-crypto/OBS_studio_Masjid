import React, { useState } from 'react';
import { ChevronDown, Eraser, Save, Send, Trash2 } from 'lucide-react';
import { TextFieldKey, TextInputMapping } from '../utils/obsAudio';
import { TextDraft, TextPreset } from '../utils/storage';
import { TipIcon } from './TooltipManager';

interface TextOverlayCardProps {
  connected: boolean;
  draft: TextDraft;
  onDraftChange: (next: TextDraft) => void;
  availableTextInputs: string[];
  mapping: TextInputMapping;
  onMappingChange: (next: TextInputMapping) => void;
  presets: TextPreset[];
  onSavePreset: (name: string) => void;
  onDeletePreset: (name: string) => void;
  onSendToScreen: (values: TextDraft) => Promise<void>;
  onClearScreen: () => Promise<void>;
}

const FIELD_KEYS: Array<{ key: TextFieldKey; label: string }> = [
  { key: 'Tajuk', label: 'Sumber teks untuk Tajuk' },
  { key: 'Penceramah', label: 'Sumber teks untuk Penceramah' },
  { key: 'Berjalan', label: 'Sumber teks untuk Teks Berjalan' },
];

export const TextOverlayCard: React.FC<TextOverlayCardProps> = ({
  connected,
  draft,
  onDraftChange,
  availableTextInputs,
  mapping,
  onMappingChange,
  presets,
  onSavePreset,
  onDeletePreset,
  onSendToScreen,
  onClearScreen,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(presets[0]?.name ?? '');
  const [newPresetName, setNewPresetName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sending, setSending] = useState(false);

  const handleLoadPreset = () => {
    const found = presets.find((p) => p.name === selectedPreset);
    if (!found) return;
    onDraftChange({
      Tajuk: found.Tajuk,
      Penceramah: found.Penceramah,
      Berjalan: found.Berjalan,
    });
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPresetName.trim();
    if (!trimmed) return;
    onSavePreset(trimmed);
    setSelectedPreset(trimmed);
    setNewPresetName('');
  };

  const handleDeletePreset = () => {
    if (!selectedPreset) return;
    onDeletePreset(selectedPreset);
    const remaining = presets.filter((p) => p.name !== selectedPreset);
    setSelectedPreset(remaining[0]?.name ?? '');
  };

  return (
    <section
      aria-labelledby="heading-teks"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <h2 id="heading-teks" className="text-lg font-bold text-stone-900 dark:text-stone-100">
          3. Tajuk &amp; Penceramah
        </h2>
        <TipIcon
          label="Tajuk dan Penceramah"
          tip="Taip tajuk kuliah, nama penceramah dan teks berjalan di bawah, kemudian tekan Hantar ke Skrin untuk mengemas kini paparan OBS."
        />
      </div>

      <div className="space-y-3.5">
        <div>
          <label
            htmlFor="field-tajuk"
            className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1"
          >
            Tajuk kuliah / program
          </label>
          <input
            id="field-tajuk"
            type="text"
            value={draft.Tajuk}
            onChange={(e) => onDraftChange({ ...draft, Tajuk: e.target.value })}
            placeholder="Contoh: Kuliah Maghrib — Tafsir Surah Al-Kahfi"
            className="w-full min-h-12 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base focus-visible:outline-2 focus-visible:outline-emerald-600"
          />
        </div>

        <div>
          <label
            htmlFor="field-penceramah"
            className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1"
          >
            Nama penceramah
          </label>
          <input
            id="field-penceramah"
            type="text"
            value={draft.Penceramah}
            onChange={(e) => onDraftChange({ ...draft, Penceramah: e.target.value })}
            placeholder="Contoh: Ustaz Mohd Yasin"
            className="w-full min-h-12 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base focus-visible:outline-2 focus-visible:outline-emerald-600"
          />
        </div>

        <div>
          <label
            htmlFor="field-berjalan"
            className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1"
          >
            Teks Berjalan (bawah skrin)
          </label>
          <textarea
            id="field-berjalan"
            rows={2}
            value={draft.Berjalan}
            onChange={(e) => onDraftChange({ ...draft, Berjalan: e.target.value })}
            placeholder="Contoh: Selamat datang ke siaran langsung masjid."
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base focus-visible:outline-2 focus-visible:outline-emerald-600"
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            disabled={!connected || sending}
            onClick={async () => {
              setSending(true);
              try {
                await onSendToScreen(draft);
              } finally {
                setSending(false);
              }
            }}
            data-tip="Hantar ketiga-tiga teks di atas ke sumber teks OBS yang sepadan."
            data-tip-title="Hantar ke Skrin"
            data-tip-hint="Pratonton skrin juga akan dikemas kini secara automatik."
            className="min-h-12 px-5 py-2.5 rounded-xl accent-btn font-bold inline-flex items-center gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-emerald-600 disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            <span>Hantar ke Skrin</span>
          </button>

          <button
            type="button"
            disabled={!connected || sending}
            onClick={async () => {
              setSending(true);
              try {
                await onClearScreen();
              } finally {
                setSending(false);
              }
            }}
            data-tip="Padamkan teks yang terpapar di skrin siaran OBS buat sementara."
            className="min-h-12 px-5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-semibold inline-flex items-center gap-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-emerald-600 disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <Eraser className="w-4 h-4" aria-hidden="true" />
            <span>Kosongkan</span>
          </button>
        </div>
      </div>

      {/* Preset Simpan / Panggil */}
      <div className="mt-5 pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">
            Preset Tajuk &amp; Penceramah
          </h3>
          <TipIcon
            label="Preset"
            tip="Simpan gabungan tajuk, penceramah dan teks berjalan yang kerap digunakan supaya boleh dipanggil semula dengan satu klik."
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <label htmlFor="preset-select" className="sr-only">
            Pilih preset tersimpan
          </label>
          <select
            id="preset-select"
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            className="flex-1 min-w-[180px] min-h-12 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            {presets.length === 0 ? (
              <option value="">(Tiada preset tersimpan)</option>
            ) : (
              presets.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))
            )}
          </select>

          <button
            type="button"
            disabled={!selectedPreset || presets.length === 0}
            onClick={handleLoadPreset}
            className="min-h-12 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-semibold whitespace-nowrap disabled:opacity-45"
          >
            Guna Preset
          </button>

          <button
            type="button"
            disabled={!selectedPreset || presets.length === 0}
            onClick={handleDeletePreset}
            aria-label="Padam preset dipilih"
            data-tip="Padam preset yang sedang dipilih."
            className="min-h-12 px-4 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-800 dark:text-red-200 font-semibold inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-45"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            <span>Padam</span>
          </button>
        </div>

        <form onSubmit={handleSavePreset} className="flex flex-wrap gap-2">
          <label htmlFor="new-preset-name" className="sr-only">
            Nama preset baharu
          </label>
          <input
            id="new-preset-name"
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Nama preset baharu (cth: Kuliah Subuh)"
            className="flex-1 min-w-[200px] min-h-12 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base focus-visible:outline-2 focus-visible:outline-emerald-600"
          />
          <button
            type="submit"
            disabled={!newPresetName.trim()}
            className="min-h-12 px-4 rounded-xl border border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-semibold inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-45"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            <span>Simpan Preset</span>
          </button>
        </form>
      </div>

      {/* Bahagian Lanjutan (lipat) */}
      <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800">
        <button
          type="button"
          aria-expanded={showAdvanced}
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full min-h-12 flex items-center justify-between gap-2 text-left text-sm font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 py-1 focus-visible:outline-2 focus-visible:outline-emerald-600 rounded-lg"
        >
          <span>Lanjutan: Pemetaan sumber teks OBS</span>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3 pt-2">
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Panel mengesan sumber teks secara automatik. Tukar di sini jika teks muncul pada kotak yang salah dalam OBS.
            </p>
            {FIELD_KEYS.map(({ key, label }) => (
              <div key={key}>
                <label
                  htmlFor={`map-${key}`}
                  className="block text-sm font-medium text-stone-800 dark:text-stone-200 mb-1"
                >
                  {label}
                </label>
                <select
                  id={`map-${key}`}
                  value={mapping[key] ?? ''}
                  onChange={(e) => {
                    const next = { ...mapping };
                    if (e.target.value) next[key] = e.target.value;
                    else delete next[key];
                    onMappingChange(next);
                  }}
                  className="w-full min-h-12 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-base"
                >
                  <option value="">— Tidak dipilih —</option>
                  {availableTextInputs.map((inputName) => (
                    <option key={inputName} value={inputName}>
                      {inputName}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
