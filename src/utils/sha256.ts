const K: number[] = [];
const H0: number[] = [];

(() => {
  const primes: number[] = [];
  for (let n = 2; primes.length < 64; n++) {
    let isPrime = true;
    for (let d = 2; d * d <= n; d++) {
      if (n % d === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes.push(n);
  }
  const frac32 = (x: number) => Math.floor((x - Math.floor(x)) * 4294967296) >>> 0;
  for (let i = 0; i < 64; i++) {
    K.push(frac32(Math.cbrt(primes[i])));
  }
  for (let i = 0; i < 8; i++) {
    H0.push(frac32(Math.sqrt(primes[i])));
  }
})();

const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

/**
 * Pure JavaScript SHA-256 implementation (works on non-HTTPS LAN origins
 * where window.crypto.subtle is unavailable).
 */
export function sha256Bytes(bytes: Uint8Array): Uint8Array {
  const len = bytes.length;
  const paddedLen = ((len + 9 + 63) >> 6) << 6;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[len] = 0x80;

  const dv = new DataView(padded.buffer);
  const bitLen = len * 8;
  dv.setUint32(paddedLen - 4, bitLen >>> 0, false);
  dv.setUint32(paddedLen - 8, Math.floor(bitLen / 4294967296) >>> 0, false);

  const h = H0.slice();
  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = dv.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const a = w[i - 15];
      const b = w[i - 2];
      const s0 = rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3);
      const s1 = rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;

      hh = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }

    h[0] = (h[0] + a) >>> 0;
    h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0;
    h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0;
    h[5] = (h[5] + f) >>> 0;
    h[6] = (h[6] + g) >>> 0;
    h[7] = (h[7] + hh) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) {
    outView.setUint32(i * 4, h[i], false);
  }
  return out;
}

export function utf8ToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function sha256Base64Sync(input: string): string {
  return bytesToBase64(sha256Bytes(utf8ToBytes(input)));
}

export async function sha256Base64(input: string): Promise<string> {
  const raw = utf8ToBytes(input);
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    try {
      const buf = await globalThis.crypto.subtle.digest('SHA-256', raw.buffer as ArrayBuffer);
      return bytesToBase64(new Uint8Array(buf));
    } catch {
      return bytesToBase64(sha256Bytes(raw));
    }
  }
  return bytesToBase64(sha256Bytes(raw));
}

/**
 * obs-websocket v5 authentication:
 * secret = base64(sha256(password + salt))
 * authentication = base64(sha256(secret + challenge))
 */
export async function computeObsAuth(
  password: string,
  salt: string,
  challenge: string
): Promise<string> {
  const secret = await sha256Base64(password + salt);
  return sha256Base64(secret + challenge);
}

export function computeObsAuthSync(
  password: string,
  salt: string,
  challenge: string
): string {
  const secret = sha256Base64Sync(password + salt);
  return sha256Base64Sync(secret + challenge);
}
