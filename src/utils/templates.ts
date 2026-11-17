import { ObsSceneItem } from '../obs/types';

export type AccentThemeId = 'emerald' | 'indigo' | 'amber' | 'teal';
export type LayoutDensityId = 'standard' | 'studio' | 'large';
export type OverlayVisualStyleId = 'classic' | 'modern' | 'broadcast' | 'floating';

export interface DashboardStyleConfig {
  accent: AccentThemeId;
  layout: LayoutDensityId;
  overlayStyle: OverlayVisualStyleId;
  showPreview: boolean;
  showChecklist: boolean;
  showGuide: boolean;
}

export const DEFAULT_STYLE_CONFIG: DashboardStyleConfig = {
  accent: 'emerald',
  layout: 'standard',
  overlayStyle: 'classic',
  showPreview: true,
  showChecklist: true,
  showGuide: true,
};

export interface AccentThemeMeta {
  id: AccentThemeId;
  name: string;
  description: string;
  swatchHex: string;
}

export const ACCENT_THEMES: AccentThemeMeta[] = [
  {
    id: 'emerald',
    name: 'Zamrud Masjid',
    description: 'Hijau zamrud klasik yang tenang dan jelas.',
    swatchHex: '#047857',
  },
  {
    id: 'indigo',
    name: 'Nilam Siaran',
    description: 'Biru nilam moden untuk gaya studio profesional.',
    swatchHex: '#1d4ed8',
  },
  {
    id: 'amber',
    name: 'Emas Andalusia',
    description: 'Tona emas hangat berinspirasikan seni bina masjid.',
    swatchHex: '#b45309',
  },
  {
    id: 'teal',
    name: 'Teal Kontemporari',
    description: 'Hijau-biru segar dengan kontras tinggi.',
    swatchHex: '#0f766e',
  },
];

export interface LayoutPresetMeta {
  id: LayoutDensityId;
  name: string;
  description: string;
}

export const LAYOUT_PRESETS: LayoutPresetMeta[] = [
  {
    id: 'standard',
    name: 'Seimbang (Lalai)',
    description: 'Saiz kad dan jarak selesa untuk komputer & telefon.',
  },
  {
    id: 'studio',
    name: 'Konsol Studio',
    description: 'Susunan lebih padat supaya lebih banyak kawalan muat dalam satu skrin.',
  },
  {
    id: 'large',
    name: 'Butang Besar (Tablet / Warga Emas)',
    description: 'Teks lebih besar dan butang sentuhan ekstra lebar agar mudah ditekan.',
  },
];

export interface OverlayVisualStyleMeta {
  id: OverlayVisualStyleId;
  name: string;
  description: string;
}

export const OVERLAY_VISUAL_STYLES: OverlayVisualStyleMeta[] = [
  {
    id: 'classic',
    name: 'Klasik Masjid',
    description: 'Bar bawah zamrud dengan kad QR Jom Infaq yang kemas.',
  },
  {
    id: 'modern',
    name: 'Moden Minimal',
    description: 'Garis halus lutsinar tanpa menutupi ruang video.',
  },
  {
    id: 'broadcast',
    name: 'Studio Berita',
    description: 'Kotak tajuk tegas dan jalur teks berjalan penuh di bawah.',
  },
  {
    id: 'floating',
    name: 'Kapsul Terapung',
    description: 'Elemen terapung lembut dengan sudut membulat.',
  },
];

export interface OutputTemplate {
  id: string;
  name: string;
  summary: string;
  tooltip: string;
  /** Which overlay categories should be ON vs OFF when template is applied */
  layers: {
    camera: boolean;
    logo: boolean;
    title: boolean;
    speaker: boolean;
    ticker: boolean;
    qr: boolean;
  };
  /** Optional suggested scene name pattern */
  preferredScenePattern?: RegExp;
}

export const OUTPUT_TEMPLATES: OutputTemplate[] = [
  {
    id: 'kuliah-penuh',
    name: 'Kuliah Lengkap',
    summary: 'Kamera + Logo + Tajuk + Penceramah + Teks Berjalan',
    tooltip:
      'Paparkan kamera utama dengan nama penceramah, tajuk kuliah dan teks berjalan di bawah skrin (tanpa QR).',
    layers: {
      camera: true,
      logo: true,
      title: true,
      speaker: true,
      ticker: true,
      qr: false,
    },
    preferredScenePattern: /kuliah/i,
  },
  {
    id: 'infaq-qr',
    name: 'Siaran + QR Jom Infaq',
    summary: 'Aktifkan QR Jom Infaq & Teks Berjalan untuk kutipan derma',
    tooltip:
      'Munculkan kad QR Jom Infaq di penjuru skrin bersama teks berjalan ajakan infaq sambil mengekalkan paparan kuliah.',
    layers: {
      camera: true,
      logo: true,
      title: true,
      speaker: true,
      ticker: true,
      qr: true,
    },
  },
  {
    id: 'khutbah-bersih',
    name: 'Khutbah Bersih',
    summary: 'Kamera + Logo + Tajuk sahaja (tiada teks berjalan / QR)',
    tooltip:
      'Paparan tenang dan fokus untuk Khutbah Jumaat tanpa teks bergerak atau QR yang mengganggu perhatian.',
    layers: {
      camera: true,
      logo: true,
      title: true,
      speaker: false,
      ticker: false,
      qr: false,
    },
    preferredScenePattern: /khutbah/i,
  },
  {
    id: 'rehat-pengumuman',
    name: 'Rehat / Sebentar Lagi',
    summary: 'Logo + Tajuk + Teks Berjalan + QR Jom Infaq (Kamera dimatikan)',
    tooltip:
      'Sesuai sebelum kuliah bermula atau waktu rehat: sembunyikan kamera dan paparkan info program serta QR infaq.',
    layers: {
      camera: false,
      logo: true,
      title: true,
      speaker: false,
      ticker: true,
      qr: true,
    },
    preferredScenePattern: /sebentar|infaq|pengumuman/i,
  },
  {
    id: 'kamera-sahaja',
    name: 'Kamera Bersih Sahaja',
    summary: 'Tutup semua teks, ticker & QR — hanya kamera & logo',
    tooltip:
      'Buang semua tulisan dan QR dari skrin supaya hanya rakaman kamera dan logo masjid kelihatan.',
    layers: {
      camera: true,
      logo: true,
      title: false,
      speaker: false,
      ticker: false,
      qr: false,
    },
  },
];

export type LayerCategory = 'camera' | 'logo' | 'title' | 'speaker' | 'ticker' | 'qr';

export function classifySceneItem(sourceName: string): LayerCategory | null {
  if (/qr|infaq|derma|wakaf/i.test(sourceName)) return 'qr';
  if (/berjalan|ticker|scroll|marquee|running/i.test(sourceName)) return 'ticker';
  if (/penceramah|speaker|ustaz|khatib/i.test(sourceName)) return 'speaker';
  if (/tajuk|title|program|kuliah/i.test(sourceName)) return 'title';
  if (/logo|lencana|badge|masjid/i.test(sourceName) && !/teks/i.test(sourceName)) return 'logo';
  if (/kamera|camera|ptz|webcam|video|hdmi/i.test(sourceName)) return 'camera';
  return null;
}

export interface TemplateAction {
  sceneItemId: number;
  sourceName: string;
  targetEnabled: boolean;
}

/**
 * Pure computation of which OBS scene items need toggling to satisfy a chosen OutputTemplate.
 */
export function resolveTemplateLayerActions(
  items: ObsSceneItem[],
  template: OutputTemplate
): TemplateAction[] {
  const actions: TemplateAction[] = [];
  for (const item of items) {
    const category = classifySceneItem(item.sourceName);
    if (!category) continue;
    const desired = template.layers[category];
    if (Boolean(item.sceneItemEnabled) !== desired) {
      actions.push({
        sceneItemId: item.sceneItemId,
        sourceName: item.sourceName,
        targetEnabled: desired,
      });
    }
  }
  return actions;
}

/**
 * Derive current live preview visibility flags from OBS scene items.
 */
export function getPreviewLayerFlags(items: ObsSceneItem[]): {
  hasCamera: boolean;
  hasLogo: boolean;
  hasTitle: boolean;
  hasSpeaker: boolean;
  hasTicker: boolean;
  hasQr: boolean;
} {
  let hasCamera = false;
  let hasLogo = false;
  let hasTitle = false;
  let hasSpeaker = false;
  let hasTicker = false;
  let hasQr = false;

  for (const item of items) {
    if (!item.sceneItemEnabled) continue;
    const cat = classifySceneItem(item.sourceName);
    if (cat === 'camera') hasCamera = true;
    else if (cat === 'logo') hasLogo = true;
    else if (cat === 'title') hasTitle = true;
    else if (cat === 'speaker') hasSpeaker = true;
    else if (cat === 'ticker') hasTicker = true;
    else if (cat === 'qr') hasQr = true;
  }

  return { hasCamera, hasLogo, hasTitle, hasSpeaker, hasTicker, hasQr };
}
