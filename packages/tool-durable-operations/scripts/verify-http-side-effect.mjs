import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import {
  createDurableSideEffectRunner,
  runHttpSideEffect,
} from '../dist/index.js';
import {
  createDurableStorePair,
  createInMemoryDurableOperationBackend,
} from './verify-side-effect-support.mjs';

const providerOrders = new Map();
let mutationRequests = 0;
let statusRequests = 0;

const server = createServer((request, response) => {
  const url = new URL(
    request.url ?? '/',
    `http://${request.headers.host ?? '127.0.0.1'}`
  );
  response.setHeader('content-type', 'application/json');

  if (request.method === 'POST' && url.pathname === '/orders') {
    mutationRequests += 1;
    const idempotencyKey = request.headers['idempotency-key'];
    assert.equal(typeof idempotencyKey, 'string');
    const requestId = `provider-request-${mutationRequests}`;
    providerOrders.set(idempotencyKey, { requestId });
    const ambiguous = idempotencyKey === 'http:orders:ambiguous';
    response.statusCode = ambiguous ? 502 : 202;
    response.end(
      JSON.stringify({
        accepted: !ambiguous,
        requestId,
      })
    );
    return;
  }

  if (request.method === 'GET' && url.pathname === '/orders/status') {
    statusRequests += 1;
    const idempotencyKey = url.searchParams.get('idempotencyKey');
    const order = idempotencyKey ? providerOrders.get(idempotencyKey) : undefined;
    if (!order) {
      response.statusCode = 404;
      response.end(JSON.stringify({ found: false }));
      return;
    }
    response.statusCode = 200;
    response.end(JSON.stringify({ found: true, ...order }));
    return;
  }

  response.statusCode = 404;
  response.end(JSON.stringify({ error: 'not found' }));
});

await once(server.listen(0, '127.0.0.1'), 'listening');
const address = server.address();
assert.ok(address && typeof address === 'object');
const baseUrl = `http://127.0.0.1:${address.port}`;

const { storeA, storeB } = createDurableStorePair(
  createInMemoryDurableOperationBackend()
);
const runnerA = createDurableSideEffectRunner({
  store: storeA,
  ownerId: 'http-smoke-a',
});
const runnerB = createDurableSideEffectRunner({
  store: storeB,
  ownerId: 'http-smoke-b',
});

const postOrder = (key, signal) =>
  fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': key,
    },
    body: JSON.stringify({ order: key }),
    signal,
  });

const classifyResponse = async response => {
  const body = await response.json();
  if (response.status === 202) {
    return {
      state: 'completed',
      result: { status: response.status, requestId: body.requestId },
    };
  }
  return {
    state: 'unknown',
    reason: `provider acknowledgement was ambiguous (HTTP ${response.status})`,
    diagnostic: { status: response.status },
  };
};

try {
  const completed = await runHttpSideEffect({
    runner: runnerA,
    key: 'http:orders:42',
    fingerprint: 'orders:42:v1',
    request: context => postOrder(context.key, context.signal),
    onResponse: classifyResponse,
  });
  assert.equal(completed.state, 'completed');
  assert.equal(mutationRequests, 1);

  const replayed = await runHttpSideEffect({
    runner: runnerB,
    key: 'http:orders:42',
    fingerprint: 'orders:42:v1',
    request: () => {
      throw new Error('a replay must not issue a second HTTP mutation');
    },
    onResponse: classifyResponse,
  });
  assert.equal(replayed.state, 'replayed');
  assert.equal(mutationRequests, 1);

  const ambiguous = await runHttpSideEffect({
    runner: runnerA,
    key: 'http:orders:ambiguous',
    fingerprint: 'orders:ambiguous:v1',
    request: context => postOrder(context.key, context.signal),
    onResponse: classifyResponse,
  });
  assert.equal(ambiguous.state, 'unknown');
  assert.equal(mutationRequests, 2);

  const recovered = await runnerB.recover(
    'http:orders:ambiguous',
    async () => {
      const statusResponse = await fetch(
        `${baseUrl}/orders/status?idempotencyKey=${encodeURIComponent('http:orders:ambiguous')}`
      );
      const body = await statusResponse.json();
      if (statusResponse.ok && body.found) {
        return {
          state: 'completed',
          result: { status: statusResponse.status, requestId: body.requestId },
          reason: 'provider status query confirmed the order',
        };
      }
      return {
        state: 'failed',
        reason: 'provider status query did not find the order',
      };
    },
    { reconcilerId: 'http-smoke-recovery' }
  );
  assert.equal(recovered.state, 'resolved');
  assert.equal(mutationRequests, 2);
  assert.equal(statusRequests, 1);

  console.log(JSON.stringify({
    status: 'ok',
    checks: [
      'real-fetch-authoritative-response',
      'idempotency-key-replay-without-second-mutation',
      'ambiguous-response-retention',
      'provider-status-reconciliation',
    ],
  }));
} finally {
  await new Promise((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve()))
  );
}
