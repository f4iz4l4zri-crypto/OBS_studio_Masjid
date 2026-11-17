export const AUDIO_KIND_REGEX =
  /(wasapi_input_capture|wasapi_output_capture|wasapi_|coreaudio_|pulse_|alsa_|jack_|dshow_input|av_capture|ffmpeg_source|vlc_source|browser_source|sck_audio|pipewire|oss_)/;

export const TEXT_KIND_REGEX = /^text_/;

export type TextFieldKey = 'Tajuk' | 'Penceramah' | 'Berjalan';

export interface TextInputMapping {
  Tajuk?: string;
  Penceramah?: string;
  Berjalan?: string;
}

export const TEXT_FIELD_PATTERNS: Record<TextFieldKey, RegExp> = {
  Tajuk: /tajuk|title|program|kuliah/i,
  Penceramah: /penceramah|speaker|ustaz/i,
  Berjalan: /berjalan|ticker|scroll|running|marquee/i,
};

export function isAudioInputKind(kind: string | undefined): boolean {
  return Boolean(kind && AUDIO_KIND_REGEX.test(kind));
}

export function isTextInputKind(kind: string | undefined): boolean {
  return Boolean(kind && TEXT_KIND_REGEX.test(kind));
}

/**
 * Convert OBS linear amplitude multiplier (0..1+) to decibels.
 */
export function mulToDb(mul: number): number {
  if (!Number.isFinite(mul) || mul <= 0) return -100;
  return 20 * Math.log10(mul);
}

/**
 * Convert decibels (-60..0 dB) to a 0..100 display percentage.
 */
export function dbToMeterPercent(dbValue: number): number {
  if (!Number.isFinite(dbValue) || dbValue <= -60) return 0;
  if (dbValue >= 0) return 100;
  return Math.max(0, Math.min(100, ((dbValue + 60) / 60) * 100));
}

/**
 * Convert OBS InputVolumeMeters channel array [magnitude, peak, inputPeak]
 * to peak dB and 0..100 meter percentage.
 */
export function extractPeakDb(inputLevelsMul: number[][] | undefined): number {
  if (!inputLevelsMul || inputLevelsMul.length === 0) return -100;
  let maxDb = -100;
  for (const ch of inputLevelsMul) {
    if (!Array.isArray(ch) || ch.length === 0) continue;
    const peakMul = ch.length > 1 ? ch[1] : ch[0];
    const d = mulToDb(peakMul);
    if (d > maxDb) maxDb = d;
  }
  return maxDb;
}

export function autoMapTextInputs(
  availableTextInputs: string[],
  existingMapping: TextInputMapping
): { mapping: TextInputMapping; changed: boolean } {
  const next: TextInputMapping = { ...existingMapping };
  let changed = false;

  // Drop mapped names that no longer exist
  const keys: TextFieldKey[] = ['Tajuk', 'Penceramah', 'Berjalan'];
  for (const key of keys) {
    const current = next[key];
    if (current && !availableTextInputs.includes(current)) {
      delete next[key];
      changed = true;
    }
  }

  // Auto-match missing keys
  for (const key of keys) {
    if (next[key]) continue;
    const used = new Set(Object.values(next).filter(Boolean));
    const match = availableTextInputs.find(
      (name) => TEXT_FIELD_PATTERNS[key].test(name) && !used.has(name)
    );
    if (match) {
      next[key] = match;
      changed = true;
    }
  }

  return { mapping: next, changed };
}

export function formatDuration(ms: number): string {
  const safeMs = Number.isFinite(ms) && ms > 0 ? ms : 0;
  const totalSec = Math.floor(safeMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function calcDropPercent(skippedFrames: number, totalFrames: number): number {
  if (!totalFrames || totalFrames <= 0 || !skippedFrames || skippedFrames <= 0) {
    return 0;
  }
  return (skippedFrames / totalFrames) * 100;
}

export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function resolveDailyChecklistTicks(
  stored: { d?: string; t?: number[] } | null | undefined,
  todayKey: string = getLocalDateKey()
): number[] {
  if (!stored || stored.d !== todayKey || !Array.isArray(stored.t)) {
    return [];
  }
  return stored.t.filter((n) => Number.isInteger(n) && n >= 0);
}
