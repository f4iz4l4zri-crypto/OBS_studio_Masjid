import { computeObsAuth } from '../utils/sha256';
import { IObsClient, ObsEventHandler, ObsEventMap } from './types';

export class ObsAuthError extends Error {
  readonly isAuthError = true;
  constructor(message: string) {
    super(message);
    this.name = 'ObsAuthError';
  }
}

export interface WebSocketLike {
  readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  onopen: ((ev: unknown) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onclose: ((ev: { code?: number; reason?: string }) => void) | null;
  onmessage: ((ev: { data: string }) => void) | null;
}

export type WebSocketFactory = (url: string, protocol: string) => WebSocketLike;

const DEFAULT_TIMEOUT_MS = 8000;

interface PendingRequest {
  resolve: (data: Record<string, unknown>) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class ObsClient implements IObsClient {
  private ws: WebSocketLike | null = null;
  private pending = new Map<string, PendingRequest>();
  private listeners = new Map<keyof ObsEventMap, Set<(data: never) => void>>();
  private reqCounter = 1;
  private connected = false;
  private manualClose = false;
  private readonly wsFactory: WebSocketFactory;
  private readonly requestTimeoutMs: number;

  constructor(options?: { wsFactory?: WebSocketFactory; requestTimeoutMs?: number }) {
    this.wsFactory =
      options?.wsFactory ??
      ((url: string, protocol: string) => new WebSocket(url, protocol) as unknown as WebSocketLike);
    this.requestTimeoutMs = options?.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  get isConnected(): boolean {
    return this.connected;
  }

  get isManualClose(): boolean {
    return this.manualClose;
  }

  on<K extends keyof ObsEventMap>(event: K, handler: ObsEventHandler<K>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    const wrapped = handler as (data: never) => void;
    set.add(wrapped);
    return () => {
      set?.delete(wrapped);
    };
  }

  private emit<K extends keyof ObsEventMap>(event: K, data: ObsEventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.forEach((fn) => {
      try {
        (fn as ObsEventHandler<K>)(data);
      } catch (err) {
        console.error('OBS event handler error:', err);
      }
    });
  }

  connect(url = 'ws://localhost:4455', password = ''): Promise<void> {
    this.manualClose = false;
    return new Promise((resolve, reject) => {
      let ws: WebSocketLike;
      try {
        ws = this.wsFactory(url, 'obswebsocket.json');
      } catch {
        reject(new Error('Alamat atau port OBS tidak sah.'));
        return;
      }

      this.ws = ws;
      let settled = false;

      const fail = (err: Error) => {
        if (!settled) {
          settled = true;
          reject(err);
        }
      };

      const connectTimer = setTimeout(() => {
        if (!settled) {
          try {
            ws.close();
          } catch {
            // ignore
          }
          fail(new Error('Masa sambungan tamat. Pastikan OBS Studio dibuka.'));
        }
      }, this.requestTimeoutMs);

      ws.onerror = () => {
        clearTimeout(connectTimer);
        fail(
          new Error(
            'Tidak dapat menyambung ke OBS. Pastikan OBS dibuka dan WebSocket Server diaktifkan.'
          )
        );
      };

      ws.onclose = (ev) => {
        clearTimeout(connectTimer);
        const wasConnected = this.connected;
        this.connected = false;
        this.rejectAllPending('Sambungan ke OBS terputus.');

        const code = ev?.code;
        if (code === 4009) {
          const authErr = new ObsAuthError('Kata laluan salah');
          if (!settled) {
            fail(authErr);
          } else if (wasConnected) {
            this.emit('close', { code, reason: ev?.reason, authFailed: true });
          }
          return;
        }

        if (!settled) {
          fail(new Error('Sambungan ditutup sebelum pengesahan selesai.'));
        } else if (wasConnected) {
          this.emit('close', { code, reason: ev?.reason, authFailed: false });
        }
      };

      ws.onmessage = async (ev) => {
        let msg: { op?: number; d?: Record<string, unknown> };
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }

        const op = msg.op;
        const d = (msg.d ?? {}) as Record<string, unknown>;

        if (op === 0) {
          // Hello
          const identify: Record<string, unknown> = {
            rpcVersion: 1,
            eventSubscriptions: 2047 | 65536,
          };

          const auth = d.authentication as { challenge?: string; salt?: string } | undefined;
          if (auth && auth.challenge && auth.salt) {
            if (!password) {
              clearTimeout(connectTimer);
              try {
                ws.close();
              } catch {
                // ignore
              }
              fail(new ObsAuthError('OBS memerlukan kata laluan WebSocket.'));
              return;
            }
            identify.authentication = await computeObsAuth(
              password,
              auth.salt,
              auth.challenge
            );
          }

          ws.send(JSON.stringify({ op: 1, d: identify }));
        } else if (op === 2) {
          // Identified
          clearTimeout(connectTimer);
          this.connected = true;
          if (!settled) {
            settled = true;
            resolve();
          }
        } else if (op === 5) {
          // Event
          const eventType = d.eventType as keyof ObsEventMap | undefined;
          if (eventType) {
            this.emit(eventType, (d.eventData ?? {}) as ObsEventMap[typeof eventType]);
          }
        } else if (op === 7) {
          // RequestResponse
          const requestId = d.requestId as string | undefined;
          if (!requestId) return;
          const req = this.pending.get(requestId);
          if (!req) return;
          this.pending.delete(requestId);
          clearTimeout(req.timer);

          const status = d.requestStatus as
            | { result?: boolean; code?: number; comment?: string }
            | undefined;

          if (status?.result) {
            req.resolve((d.responseData ?? {}) as Record<string, unknown>);
          } else {
            const err = new Error(status?.comment || 'Permintaan OBS gagal.');
            (err as Error & { code?: number }).code = status?.code;
            req.reject(err);
          }
        }
      };
    });
  }

  call<T = Record<string, unknown>>(
    requestType: string,
    requestData: Record<string, unknown> = {}
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.ws) {
        reject(new Error('Belum bersambung ke OBS.'));
        return;
      }

      const requestId =
        typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function'
          ? globalThis.crypto.randomUUID()
          : `req_${Date.now()}_${this.reqCounter++}`;

      const timer = setTimeout(() => {
        if (this.pending.has(requestId)) {
          this.pending.delete(requestId);
          reject(new Error(`Permintaan ${requestType} melebihi had masa 8 saat.`));
        }
      }, this.requestTimeoutMs);

      this.pending.set(requestId, {
        resolve: resolve as (data: Record<string, unknown>) => void,
        reject,
        timer,
      });

      this.ws.send(
        JSON.stringify({
          op: 6,
          d: {
            requestType,
            requestId,
            requestData,
          },
        })
      );
    });
  }

  close(): void {
    this.manualClose = true;
    this.connected = false;
    this.rejectAllPending('Sambungan ditutup oleh pengguna.');
    try {
      this.ws?.close();
    } catch {
      // ignore
    }
    this.ws = null;
  }

  private rejectAllPending(reason: string): void {
    this.pending.forEach((req) => {
      clearTimeout(req.timer);
      req.reject(new Error(reason));
    });
    this.pending.clear();
  }
}
