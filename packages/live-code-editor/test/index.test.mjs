import assert from 'node:assert/strict';
import test from 'node:test';
import { isPreviewBridgeMessage } from '../dist/index.js';

test('accepts a ready preview acknowledgement', () => {
  assert.equal(
    isPreviewBridgeMessage({
      type: 'context-action.preview.ready',
      revision: 4,
    }),
    true
  );
});

test('accepts an error preview acknowledgement', () => {
  assert.equal(
    isPreviewBridgeMessage({
      type: 'context-action.preview.error',
      revision: 4,
      message: 'Script failed',
    }),
    true
  );
});

test('rejects stale or malformed bridge payloads', () => {
  assert.equal(
    isPreviewBridgeMessage({
      type: 'context-action.preview.ready',
      revision: -1,
    }),
    false
  );
  assert.equal(
    isPreviewBridgeMessage({
      type: 'context-action.preview.error',
      revision: 4,
    }),
    false
  );
  assert.equal(isPreviewBridgeMessage(null), false);
});
