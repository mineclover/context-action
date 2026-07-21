import assert from 'node:assert/strict';
import {
  createDurableSideEffectRunner,
  runQueueSideEffect,
} from '../dist/index.js';
import {
  createDurableStorePair,
  createInMemoryDurableOperationBackend,
} from './verify-side-effect-support.mjs';

// This is intentionally an in-process provider contract fixture, not a queue
// SDK integration. It models the two provider facts the bridge must preserve:
// an authoritative acknowledgement and a publish whose acknowledgement is
// lost after the broker has accepted the message.
const providerMessages = new Map();
let publishCount = 0;

async function enqueue(message, context) {
  publishCount += 1;
  providerMessages.set(context.key, { message, messageId: `message-${publishCount}` });
  if (context.key === 'queue:orders:ambiguous') {
    throw new Error('broker acknowledgement lost after publish');
  }
  return { messageId: `message-${publishCount}` };
}

function classifyAcknowledgement(acknowledgement) {
  if (!acknowledgement || typeof acknowledgement.messageId !== 'string') {
    return {
      state: 'unknown',
      reason: 'broker acknowledgement did not contain a message id',
    };
  }
  return {
    state: 'completed',
    result: { messageId: acknowledgement.messageId },
  };
}

const { storeA, storeB } = createDurableStorePair(
  createInMemoryDurableOperationBackend()
);
const runnerA = createDurableSideEffectRunner({
  store: storeA,
  ownerId: 'queue-smoke-a',
});
const runnerB = createDurableSideEffectRunner({
  store: storeB,
  ownerId: 'queue-smoke-b',
});

try {
  const completed = await runQueueSideEffect({
    runner: runnerA,
    key: 'queue:orders:42',
    fingerprint: 'orders:42:v1',
    message: { order: '42' },
    enqueue,
    onAcknowledgement: classifyAcknowledgement,
  });
  assert.equal(completed.state, 'completed');
  assert.equal(publishCount, 1);

  const replayed = await runQueueSideEffect({
    runner: runnerB,
    key: 'queue:orders:42',
    fingerprint: 'orders:42:v1',
    message: { order: '42' },
    enqueue: () => {
      throw new Error('a replay must not publish a second queue message');
    },
    onAcknowledgement: classifyAcknowledgement,
  });
  assert.equal(replayed.state, 'replayed');
  assert.equal(publishCount, 1);

  const ambiguous = await runQueueSideEffect({
    runner: runnerA,
    key: 'queue:orders:ambiguous',
    fingerprint: 'orders:ambiguous:v1',
    message: { order: 'ambiguous' },
    enqueue,
    onAcknowledgement: classifyAcknowledgement,
  });
  assert.equal(ambiguous.state, 'unknown');
  assert.equal(publishCount, 2);

  let reconciled = false;
  const recovered = await runnerB.recover(
    'queue:orders:ambiguous',
    async () => {
      const message = providerMessages.get('queue:orders:ambiguous');
      if (!message) {
        return { state: 'failed', reason: 'broker status query did not find the message' };
      }
      reconciled = true;
      return {
        state: 'completed',
        result: { messageId: message.messageId },
        reason: 'provider status query confirmed the published message',
      };
    },
    { reconcilerId: 'queue-smoke-recovery' }
  );
  assert.equal(recovered.state, 'resolved');
  assert.equal(reconciled, true);
  assert.equal(publishCount, 2);

  console.log(JSON.stringify({
    status: 'ok',
    checks: [
      'authoritative-queue-acknowledgement',
      'replay-without-second-publish',
      'lost-acknowledgement-retention',
      'provider-status-reconciliation',
    ],
  }));
} finally {
  providerMessages.clear();
}
