import test from 'node:test';
import assert from 'node:assert/strict';
import {
  autoMapTextInputs,
  calcDropPercent,
  dbToMeterPercent,
  extractPeakDb,
  formatDuration,
  isAudioInputKind,
  isTextInputKind,
  mulToDb,
  resolveDailyChecklistTicks,
} from './obsAudio';

test('audio and text inputKind detection', () => {
  assert.equal(isAudioInputKind('wasapi_input_capture'), true);
  assert.equal(isAudioInputKind('wasapi_output_capture'), true);
  assert.equal(isAudioInputKind('coreaudio_input_capture'), true);
  assert.equal(isAudioInputKind('pulse_input_capture'), true);
  assert.equal(isAudioInputKind('alsa_input_capture'), true);
  assert.equal(isAudioInputKind('dshow_input'), true);
  assert.equal(isAudioInputKind('ffmpeg_source'), true);
  assert.equal(isAudioInputKind('browser_source'), true);
  assert.equal(isAudioInputKind('image_source'), false);
  assert.equal(isAudioInputKind('text_gdiplus_v3'), false);

  assert.equal(isTextInputKind('text_gdiplus_v3'), true);
  assert.equal(isTextInputKind('text_ft2_source_v2'), true);
  assert.equal(isTextInputKind('image_source'), false);
});

test('dB and meter 0-100 scaling', () => {
  assert.equal(mulToDb(0), -100);
  assert.equal(Math.round(mulToDb(1)), 0);
  assert.equal(Math.round(mulToDb(0.1)), -20);
  assert.equal(dbToMeterPercent(-60), 0);
  assert.equal(dbToMeterPercent(-30), 50);
  assert.equal(dbToMeterPercent(0), 100);
  assert.equal(dbToMeterPercent(-80), 0);
  assert.equal(dbToMeterPercent(3), 100);

  const peakDb = extractPeakDb([
    [0.05, 0.1, 0.1],
    [0.02, 0.05, 0.05],
  ]);
  assert.ok(Math.abs(peakDb - -20) < 0.01);
});

test('autoMapTextInputs matches Tajuk, Penceramah, and Berjalan regexes', () => {
  const inputs = ['Teks Tajuk Kuliah', 'Nama Ustaz', 'Teks Berjalan Bawah'];
  const { mapping, changed } = autoMapTextInputs(inputs, {});
  assert.equal(changed, true);
  assert.equal(mapping.Tajuk, 'Teks Tajuk Kuliah');
  assert.equal(mapping.Penceramah, 'Nama Ustaz');
  assert.equal(mapping.Berjalan, 'Teks Berjalan Bawah');

  const { mapping: pruned } = autoMapTextInputs(['Teks Tajuk Kuliah'], mapping);
  assert.equal(pruned.Tajuk, 'Teks Tajuk Kuliah');
  assert.equal(pruned.Penceramah, undefined);
  assert.equal(pruned.Berjalan, undefined);
});

test('formatDuration and calcDropPercent', () => {
  assert.equal(formatDuration(0), '00:00:00');
  assert.equal(formatDuration(3661000), '01:01:01');
  assert.equal(calcDropPercent(5, 200), 2.5);
  assert.equal(calcDropPercent(0, 0), 0);
});

test('resolveDailyChecklistTicks resets on a new day', () => {
  assert.deepEqual(
    resolveDailyChecklistTicks({ d: '2026-11-17', t: [0, 2, 7] }, '2026-11-17'),
    [0, 2, 7]
  );
  assert.deepEqual(
    resolveDailyChecklistTicks({ d: '2026-11-16', t: [0, 2, 7] }, '2026-11-17'),
    []
  );
});
