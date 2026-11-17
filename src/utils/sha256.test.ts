import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import {
  bytesToBase64,
  computeObsAuth,
  computeObsAuthSync,
  sha256Base64Sync,
  sha256Bytes,
  utf8ToBytes,
} from './sha256';

const samples = [
  '',
  'abc',
  'Masjid Jeram',
  'supersecretpassword+randomSalt123456',
  'KataLaluanPanjangUntukUjianSHA256YangMelebihiSatuBlok64BaitPenuh1234567890!@#',
];

test('pure-JS SHA-256 matches Node crypto and WebCrypto crypto.subtle', async () => {
  for (const input of samples) {
    const pureB64 = sha256Base64Sync(input);
    const nodeB64 = createHash('sha256').update(input, 'utf8').digest('base64');
    assert.equal(pureB64, nodeB64, `Mismatch vs node:crypto for "${input}"`);

    const raw = utf8ToBytes(input);
    const subtleBuf = await webcrypto.subtle.digest('SHA-256', raw);
    const subtleB64 = bytesToBase64(new Uint8Array(subtleBuf));
    assert.equal(pureB64, subtleB64, `Mismatch vs crypto.subtle for "${input}"`);

    const pureRaw = sha256Bytes(raw);
    assert.equal(pureRaw.length, 32);
  }
});

test('computeObsAuthSync matches computeObsAuth (crypto.subtle path)', async () => {
  const password = 'MasjidJeram!2026';
  const salt = 'lM7x9Qp2Zr8=';
  const challenge = 'cH91AbCdEfG=';

  const syncAuth = computeObsAuthSync(password, salt, challenge);
  const asyncAuth = await computeObsAuth(password, salt, challenge);
  assert.equal(syncAuth, asyncAuth);
  assert.equal(syncAuth.length, 44);
});
