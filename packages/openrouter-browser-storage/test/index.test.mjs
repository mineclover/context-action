import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import {
  clearStoredOpenRouterApiKey,
  getStoredOpenRouterApiKey,
  OPENROUTER_API_KEY_STORAGE_KEY,
  saveOpenRouterApiKey,
  subscribeStoredOpenRouterApiKey,
} from '../dist/index.js';

const originalWindow = globalThis.window;
const values = new Map();
const listeners = new Map();
const storage = {
  getItem(key) {
    return values.get(key) ?? null;
  },
  setItem(key, value) {
    values.set(key, String(value));
  },
  removeItem(key) {
    values.delete(key);
  },
  clear() {
    values.clear();
  },
};

before(() => {
  globalThis.window = {
    localStorage: storage,
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
  };
});

after(() => {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
});

test('uses one normalized localStorage key and notifies same-tab subscribers', () => {
  let notificationCount = 0;
  const unsubscribe = subscribeStoredOpenRouterApiKey(() => {
    notificationCount += 1;
  });

  assert.equal(OPENROUTER_API_KEY_STORAGE_KEY, 'context-action.openrouter.api-key');
  assert.equal(saveOpenRouterApiKey('  sk-or-test  '), 'sk-or-test');
  assert.equal(storage.getItem(OPENROUTER_API_KEY_STORAGE_KEY), 'sk-or-test');
  assert.equal(getStoredOpenRouterApiKey(), 'sk-or-test');
  assert.equal(notificationCount, 1);

  clearStoredOpenRouterApiKey();
  assert.equal(getStoredOpenRouterApiKey(), '');
  assert.equal(notificationCount, 2);
  unsubscribe();
});

test('accepts a same-origin storage event from another tab', () => {
  let notificationCount = 0;
  const unsubscribe = subscribeStoredOpenRouterApiKey(() => {
    notificationCount += 1;
  });
  const storageListener = listeners.get('storage');

  storage.setItem(OPENROUTER_API_KEY_STORAGE_KEY, 'sk-or-external');
  storageListener({
    key: OPENROUTER_API_KEY_STORAGE_KEY,
    storageArea: storage,
  });

  assert.equal(getStoredOpenRouterApiKey(), 'sk-or-external');
  assert.equal(notificationCount, 1);
  unsubscribe();
});
