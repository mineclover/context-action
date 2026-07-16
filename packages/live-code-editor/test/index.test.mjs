import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertWorkspaceTextSourceLength,
  isPreviewBridgeMessage,
  languageForWorkspacePath,
  MAX_TEXT_SOURCE_LENGTH,
  normalizeWorkspacePath,
  selectWorkspaceActivePath,
  WorkspaceToolError,
} from '../dist/index.js';

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

test('normalizes workspace paths and rejects traversal', () => {
  assert.equal(normalizeWorkspacePath('src\\./main.js'), 'src/main.js');
  assert.throws(
    () => normalizeWorkspacePath('../main.js'),
    (error) =>
      error instanceof WorkspaceToolError &&
      error.code === 'WORKSPACE_PATH_INVALID'
  );
});

test('keeps source limits and active-file selection framework-neutral', () => {
  assert.equal(languageForWorkspacePath('styles.css'), 'css');
  assert.equal(
    selectWorkspaceActivePath([
      { path: 'README.md', language: 'markdown', source: '' },
      { path: 'app.js', language: 'javascript', source: '' },
    ]),
    'README.md'
  );
  assert.throws(
    () => assertWorkspaceTextSourceLength('x'.repeat(MAX_TEXT_SOURCE_LENGTH + 1)),
    (error) =>
      error instanceof WorkspaceToolError &&
      error.code === 'WORKSPACE_SOURCE_LIMIT'
  );
});
