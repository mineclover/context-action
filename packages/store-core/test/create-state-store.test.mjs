import assert from 'node:assert/strict';
import test from 'node:test';
import { createStateStore } from '../dist/index.js';

test('createStateStore keeps snapshots stable and publishes reference values', () => {
  let clock = 100;
  const store = createStateStore('reference', { count: 0 }, { now: () => clock });
  const initial = store.getSnapshot();
  assert.strictEqual(store.getSnapshot(), initial);
  assert.equal(initial.version, 0);
  assert.deepEqual(initial.value, { count: 0 });

  const notifications = [];
  store.subscribe(() => notifications.push(store.getSnapshot()));
  clock = 101;
  const next = { count: 1 };
  store.setValue(next, { label: 'set' });

  assert.strictEqual(store.getSnapshot().value, next);
  assert.equal(store.getSnapshot().version, 1);
  assert.equal(store.getSnapshot().lastUpdate, 101);
  assert.strictEqual(notifications[0], store.getSnapshot());
  assert.notStrictEqual(store.getSnapshot(), initial);
});

test('undefined updater is a no-op and listener failures are isolated', () => {
  const store = createStateStore('reference', 1);
  const observed = [];
  store.subscribe(() => { throw new Error('observer failure'); });
  store.subscribe(() => observed.push(store.getSnapshot().value));
  const before = store.getSnapshot();

  store.update(() => undefined);
  assert.strictEqual(store.getSnapshot(), before);
  store.update(value => value + 1);
  assert.deepEqual(observed, [2]);
  assert.equal(store.getSnapshot().version, 1);
});

test('dispose is idempotent and prevents later publishes', () => {
  const store = createStateStore('reference', { count: 0 });
  let notifications = 0;
  store.subscribe(() => { notifications += 1; });
  store.dispose();
  store.dispose();
  store.setValue({ count: 1 });
  assert.equal(store.isDisposed?.(), true);
  assert.equal(notifications, 0);
  assert.equal(store.getSnapshot().value.count, 0);
});
