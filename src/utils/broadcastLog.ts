import { lsGet, lsSet } from './storage';

export type LogCategory =
  | 'stream'
  | 'scene'
  | 'template'
  | 'text'
  | 'layer'
  | 'audio'
  | 'connection';

export interface BroadcastLogEntry {
  id: string;
  timestamp: number;
  category: LogCategory;
  title: string;
  detail?: string;
}

export type LogFilter = 'all' | 'stream' | 'visual' | 'audio_text';

const LOG_STORAGE_KEY = 'mj_log';
const MAX_LOG_ENTRIES = 200;

export function createLogEntry(
  category: LogCategory,
  title: string,
  detail?: string,
  timestamp: number = Date.now()
): BroadcastLogEntry {
  const rand = Math.random().toString(36).slice(2, 7);
  return {
    id: `log_${timestamp}_${rand}`,
    timestamp,
    category,
    title,
    detail,
  };
}

export function appendLogEntry(
  entries: BroadcastLogEntry[],
  entry: BroadcastLogEntry,
  maxEntries: number = MAX_LOG_ENTRIES
): BroadcastLogEntry[] {
  const next = [entry, ...entries];
  if (next.length > maxEntries) {
    return next.slice(0, maxEntries);
  }
  return next;
}

export function filterLogEntries(
  entries: BroadcastLogEntry[],
  filter: LogFilter
): BroadcastLogEntry[] {
  if (filter === 'all') return entries;
  if (filter === 'stream') {
    return entries.filter((e) => e.category === 'stream' || e.category === 'connection');
  }
  if (filter === 'visual') {
    return entries.filter(
      (e) => e.category === 'scene' || e.category === 'template' || e.category === 'layer'
    );
  }
  return entries.filter((e) => e.category === 'audio' || e.category === 'text');
}

export function formatLogTime(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatLogDate(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatLogExportText(
  entries: BroadcastLogEntry[],
  mosqueName: string
): string {
  const header = `REKOD SIARAN — ${mosqueName.toUpperCase()}\nDijana pada: ${formatLogDate(Date.now())} ${formatLogTime(Date.now())}\n----------------------------------------`;
  if (entries.length === 0) {
    return `${header}\n(Tiada rekod aktiviti)`;
  }
  const lines = entries
    .slice()
    .reverse()
    .map((e) => {
      const time = formatLogTime(e.timestamp);
      const date = formatLogDate(e.timestamp);
      return `[${date} ${time}] ${e.title}${e.detail ? ` — ${e.detail}` : ''}`;
    });
  return `${header}\n${lines.join('\n')}`;
}

export function loadBroadcastLogs(): BroadcastLogEntry[] {
  const raw = lsGet<BroadcastLogEntry[]>(LOG_STORAGE_KEY, []);
  return Array.isArray(raw) ? raw : [];
}

export function saveBroadcastLogs(entries: BroadcastLogEntry[]): void {
  lsSet(LOG_STORAGE_KEY, entries);
}
