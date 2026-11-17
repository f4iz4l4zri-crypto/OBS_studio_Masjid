import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifySceneItem,
  getPreviewLayerFlags,
  OUTPUT_TEMPLATES,
  resolveTemplateLayerActions,
} from './templates';
import { ObsSceneItem } from '../obs/types';

const sampleItems: ObsSceneItem[] = [
  { sceneItemId: 1, sourceName: 'Kamera PTZ Mimbar', sceneItemEnabled: true },
  { sceneItemId: 2, sourceName: 'Logo Masjid', sceneItemEnabled: true },
  { sceneItemId: 3, sourceName: 'Teks Tajuk', sceneItemEnabled: true },
  { sceneItemId: 4, sourceName: 'Teks Penceramah', sceneItemEnabled: true },
  { sceneItemId: 5, sourceName: 'Teks Berjalan', sceneItemEnabled: true },
  { sceneItemId: 6, sourceName: 'QR Jom Infaq', sceneItemEnabled: false },
];

test('classifySceneItem identifies mosque OBS layers accurately', () => {
  assert.equal(classifySceneItem('Kamera PTZ Mimbar'), 'camera');
  assert.equal(classifySceneItem('Logo Masjid'), 'logo');
  assert.equal(classifySceneItem('Teks Tajuk'), 'title');
  assert.equal(classifySceneItem('Teks Penceramah'), 'speaker');
  assert.equal(classifySceneItem('Teks Berjalan'), 'ticker');
  assert.equal(classifySceneItem('QR Jom Infaq'), 'qr');
  assert.equal(classifySceneItem('Sumber Asing'), null);
});

test('resolveTemplateLayerActions toggles only changed items for Khutbah Bersih', () => {
  const khutbahTpl = OUTPUT_TEMPLATES.find((t) => t.id === 'khutbah-bersih')!;
  const actions = resolveTemplateLayerActions(sampleItems, khutbahTpl);

  assert.deepEqual(
    actions.map((a) => ({ name: a.sourceName, enabled: a.targetEnabled })),
    [
      { name: 'Teks Penceramah', enabled: false },
      { name: 'Teks Berjalan', enabled: false },
    ]
  );
});

test('resolveTemplateLayerActions enables QR Jom Infaq for Siaran + QR Jom Infaq template', () => {
  const qrTpl = OUTPUT_TEMPLATES.find((t) => t.id === 'infaq-qr')!;
  const actions = resolveTemplateLayerActions(sampleItems, qrTpl);

  assert.deepEqual(
    actions.map((a) => ({ name: a.sourceName, enabled: a.targetEnabled })),
    [{ name: 'QR Jom Infaq', enabled: true }]
  );
});

test('getPreviewLayerFlags reflects active items accurately', () => {
  const flags = getPreviewLayerFlags(sampleItems);
  assert.deepEqual(flags, {
    hasCamera: true,
    hasLogo: true,
    hasTitle: true,
    hasSpeaker: true,
    hasTicker: true,
    hasQr: false,
  });
});
