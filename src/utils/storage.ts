import { getLocalDateKey, resolveDailyChecklistTicks, TextInputMapping } from './obsAudio';

export interface SavedConnection {
  host: string;
  port: number;
  pass: string;
  rem: boolean;
}

export interface TextPreset {
  name: string;
  Tajuk: string;
  Penceramah: string;
  Berjalan: string;
}

export interface TextDraft {
  Tajuk: string;
  Penceramah: string;
  Berjalan: string;
}

const KEYS = {
  conn: 'mj_conn',
  chk: 'mj_chk',
  map: 'mj_map',
  presets: 'mj_presets',
  mosque: 'mj_mosque',
  theme: 'mj_theme',
  draft: 'mj_draft',
} as const;

export function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function lsSet<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export function lsRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

export function loadSavedConnection(): SavedConnection | null {
  return lsGet<SavedConnection | null>(KEYS.conn, null);
}

export function saveConnection(conn: SavedConnection): void {
  if (conn.rem) {
    lsSet(KEYS.conn, conn);
  } else {
    lsSet(KEYS.conn, { host: conn.host, port: conn.port, pass: '', rem: false });
  }
}

export function clearSavedConnection(): void {
  lsRemove(KEYS.conn);
}

export function loadChecklistTicks(): number[] {
  const stored = lsGet<{ d?: string; t?: number[] } | null>(KEYS.chk, null);
  return resolveDailyChecklistTicks(stored, getLocalDateKey());
}

export function saveChecklistTicks(ticks: number[]): void {
  lsSet(KEYS.chk, { d: getLocalDateKey(), t: ticks });
}

export function loadTextMapping(): TextInputMapping {
  return lsGet<TextInputMapping>(KEYS.map, {});
}

export function saveTextMapping(map: TextInputMapping): void {
  lsSet(KEYS.map, map);
}

const DEFAULT_PRESETS: TextPreset[] = [
  {
    name: 'Kuliah Maghrib',
    Tajuk: 'Kuliah Maghrib — Tafsir Surah Al-Kahfi',
    Penceramah: 'Ustaz Mohd Yasin',
    Berjalan: 'Selamat datang ke siaran langsung masjid. Jom salurkan sumbangan infaq anda.',
  },
  {
    name: 'Khutbah Jumaat',
    Tajuk: 'Khutbah Jumaat — Memakmurkan Rumah Allah',
    Penceramah: 'Khatib Bertugas',
    Berjalan: 'Siaran Langsung Solat Jumaat. Sila matikan atau senyapkan telefon bimbit anda.',
  },
];

export function loadPresets(): TextPreset[] {
  const raw = window.localStorage.getItem(KEYS.presets);
  if (raw === null) {
    lsSet(KEYS.presets, DEFAULT_PRESETS);
    return DEFAULT_PRESETS;
  }
  return lsGet<TextPreset[]>(KEYS.presets, []);
}

export function savePresets(presets: TextPreset[]): void {
  lsSet(KEYS.presets, presets);
}

export function loadMosqueName(): string {
  return lsGet<string>(KEYS.mosque, 'Masjid Jeram');
}

export function saveMosqueName(name: string): void {
  lsSet(KEYS.mosque, name);
}

export function loadTheme(): 'light' | 'dark' {
  const saved = lsGet<'light' | 'dark' | null>(KEYS.theme, null);
  if (saved === 'dark' || saved === 'light') return saved;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function saveTheme(theme: 'light' | 'dark'): void {
  lsSet(KEYS.theme, theme);
}

import { DashboardStyleConfig, DEFAULT_STYLE_CONFIG } from './templates';

export interface QrOverlayInfo {
  title: string;
  bankLabel: string;
}

const DEFAULT_QR_INFO: QrOverlayInfo = {
  title: 'Jom Infaq Masjid',
  bankLabel: 'Tabung Pembangunan & Kuliah',
};

export function loadTextDraft(): TextDraft {
  return lsGet<TextDraft>(KEYS.draft, { Tajuk: '', Penceramah: '', Berjalan: '' });
}

export function saveTextDraft(draft: TextDraft): void {
  lsSet(KEYS.draft, draft);
}

export function loadStyleConfig(): DashboardStyleConfig {
  const stored = lsGet<Partial<DashboardStyleConfig>>('mj_style', {});
  return { ...DEFAULT_STYLE_CONFIG, ...stored };
}

export function saveStyleConfig(config: DashboardStyleConfig): void {
  lsSet('mj_style', config);
}

export function loadQrInfo(): QrOverlayInfo {
  const stored = lsGet<Partial<QrOverlayInfo>>('mj_qr_info', {});
  return { ...DEFAULT_QR_INFO, ...stored };
}

export function saveQrInfo(info: QrOverlayInfo): void {
  lsSet('mj_qr_info', info);
}

