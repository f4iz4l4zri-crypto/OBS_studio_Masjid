import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendLogEntry,
  createLogEntry,
  filterLogEntries,
  formatLogExportText,
  formatLogTime,
} from './broadcastLog';

test('appendLogEntry prepends newest entries and enforces max cap', () => {
  const e1 = createLogEntry('stream', 'Siaran Dimulakan', undefined, 1000);
  const e2 = createLogEntry('scene', 'Paparan Ditukar', 'KULIAH -> KHUTBAH', 2000);
  const e3 = createLogEntry('template', 'Template Digunakan', 'Siaran + QR Jom Infaq', 3000);

  let list = appendLogEntry([], e1, 2);
  list = appendLogEntry(list, e2, 2);
  list = appendLogEntry(list, e3, 2);

  assert.equal(list.length, 2);
  assert.equal(list[0].title, 'Template Digunakan');
  assert.equal(list[1].title, 'Paparan Ditukar');
});

test('filterLogEntries filters correctly by stream, visual, and audio_text', () => {
  const entries = [
    createLogEntry('stream', 'Siaran Dimulakan', undefined, 1000),
    createLogEntry('scene', 'Paparan Ditukar', 'KHUTBAH JUMAAT', 2000),
    createLogEntry('template', 'Template Digunakan', 'Khutbah Bersih', 3000),
    createLogEntry('audio', 'Audio Disenyapkan', 'Mixer USB', 4000),
    createLogEntry('text', 'Teks Dihantar ke Skrin', 'Tajuk dikemas kini', 5000),
  ];

  assert.equal(filterLogEntries(entries, 'all').length, 5);
  assert.equal(filterLogEntries(entries, 'stream').length, 1);
  assert.equal(filterLogEntries(entries, 'visual').length, 2);
  assert.equal(filterLogEntries(entries, 'audio_text').length, 2);
});

test('formatLogTime and formatLogExportText produce readable chronological output', () => {
  const ts = new Date(2026, 10, 17, 13, 5, 9).getTime();
  assert.equal(formatLogTime(ts), '13:05:09');

  const entries = [
    createLogEntry('template', 'Template Digunakan', 'Kuliah Lengkap', ts + 5000),
    createLogEntry('stream', 'Siaran Dimulakan', 'Mod Demo', ts),
  ];
  const exported = formatLogExportText(entries, 'Masjid Jeram');
  assert.match(exported, /REKOD SIARAN — MASJID JERAM/);
  const idxStart = exported.indexOf('Siaran Dimulakan');
  const idxTpl = exported.indexOf('Template Digunakan');
  assert.ok(idxStart > -1 && idxTpl > idxStart, 'Exported log should be chronological');
});
