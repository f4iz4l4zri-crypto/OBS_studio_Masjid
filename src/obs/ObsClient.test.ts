import test from 'node:test';
import assert from 'node:assert/strict';
import { ObsAuthError, ObsClient, WebSocketLike } from './ObsClient';
import { computeObsAuthSync } from '../utils/sha256';

class FakeSocket implements WebSocketLike {
  readyState = 1;
  sent: Array<{ op: number; d: Record<string, unknown> }> = [];
  onopen: ((ev: unknown) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  onclose: ((ev: { code?: number; reason?: string }) => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  closed = false;

  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }

  close(code?: number, reason?: string): void {
    this.closed = true;
    this.onclose?.({ code, reason });
  }

  pushServer(msg: Record<string, unknown>): void {
    this.onmessage?.({ data: JSON.stringify(msg) });
  }
}

test('ObsClient completes op:0 -> op:1 auth -> op:2 handshake and handles op:6/op:7 and op:5 events', async () => {
  let socket!: FakeSocket;
  const client = new ObsClient({
    wsFactory: () => {
      socket = new FakeSocket();
      return socket;
    },
    requestTimeoutMs: 500,
  });

  const connPromise = client.connect('ws://localhost:4455', 'rahsia123');
  socket.pushServer({
    op: 0,
    d: {
      obsWebSocketVersion: '5.3.0',
      rpcVersion: 1,
      authentication: { challenge: 'chal99', salt: 'salt88' },
    },
  });

  // Wait deterministically for async computeObsAuth -> op:1 send
  const deadline = Date.now() + 500;
  while (socket.sent.length === 0 && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5));
  }
  assert.equal(socket.sent.length, 1);
  assert.equal(socket.sent[0].op, 1);
  assert.equal(socket.sent[0].d.rpcVersion, 1);
  assert.equal(socket.sent[0].d.eventSubscriptions, 2047 | 65536);
  assert.equal(
    socket.sent[0].d.authentication,
    computeObsAuthSync('rahsia123', 'salt88', 'chal99')
  );

  socket.pushServer({ op: 2, d: { negotiatedRpcVersion: 1 } });
  await connPromise;
  assert.equal(client.isConnected, true);

  // Test request/response
  const reqPromise = client.call<{ currentProgramSceneName: string }>('GetSceneList');
  assert.equal(socket.sent.length, 2);
  const reqMsg = socket.sent[1];
  assert.equal(reqMsg.op, 6);
  assert.equal(reqMsg.d.requestType, 'GetSceneList');

  socket.pushServer({
    op: 7,
    d: {
      requestType: 'GetSceneList',
      requestId: reqMsg.d.requestId,
      requestStatus: { result: true, code: 100 },
      responseData: { currentProgramSceneName: 'KULIAH' },
    },
  });
  const res = await reqPromise;
  assert.equal(res.currentProgramSceneName, 'KULIAH');

  // Test event dispatch
  let receivedScene = '';
  client.on('CurrentProgramSceneChanged', (d) => {
    receivedScene = d.sceneName;
  });
  socket.pushServer({
    op: 5,
    d: {
      eventType: 'CurrentProgramSceneChanged',
      eventData: { sceneName: 'KHUTBAH' },
    },
  });
  assert.equal(receivedScene, 'KHUTBAH');

  client.close();
});

test('ObsClient rejects with ObsAuthError("Kata laluan salah") on close code 4009', async () => {
  let socket!: FakeSocket;
  const client = new ObsClient({
    wsFactory: () => {
      socket = new FakeSocket();
      return socket;
    },
    requestTimeoutMs: 500,
  });

  const connPromise = client.connect('ws://localhost:4455', 'salah');
  socket.pushServer({
    op: 0,
    d: {
      rpcVersion: 1,
      authentication: { challenge: 'chal1', salt: 'salt1' },
    },
  });
  await new Promise((r) => setTimeout(r, 15));
  socket.close(4009, 'Authentication failed');

  await assert.rejects(connPromise, (err: unknown) => {
    return err instanceof ObsAuthError && err.message === 'Kata laluan salah';
  });
});

test('ObsClient times out pending op:6 requests cleanly', async () => {
  let socket!: FakeSocket;
  const client = new ObsClient({
    wsFactory: () => {
      socket = new FakeSocket();
      return socket;
    },
    requestTimeoutMs: 60,
  });

  const connPromise = client.connect('ws://localhost:4455', '');
  socket.pushServer({ op: 0, d: { rpcVersion: 1 } });
  await new Promise((r) => setTimeout(r, 10));
  socket.pushServer({ op: 2, d: { negotiatedRpcVersion: 1 } });
  await connPromise;

  await assert.rejects(client.call('GetStats'), /melebihi had masa/i);
  client.close();
});
