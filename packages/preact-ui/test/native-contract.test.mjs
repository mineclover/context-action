// Logic-only tests with a minimal Node double. These are NOT browser/Preact tests.
import assert from 'node:assert/strict';
import test from 'node:test';
import { claimHydrationRoot, claimMountRoot, assertUnmanagedAncestors } from '../.native-check/ownership.js';
import { createDisposalScope } from '../.native-check/disposal-scope.js';

class NodeDouble {
  nodeType = 1;
  parentNode = null;
  children = [];
  hasChildNodes() { return this.children.length > 0; }
  append(child) { child.parentNode = this; this.children.push(child); }
}
const root = () => new NodeDouble();

test('empty root lease can be released and reclaimed', () => {
  const node = root(); const release = claimMountRoot(node); release();
  claimMountRoot(node)();
});
test('duplicate root is rejected', () => {
  const node = root(); const release = claimMountRoot(node);
  assert.throws(() => claimMountRoot(node), /already owns/); release();
});
test('existing children are not removed', () => {
  const node = root(); const child = root(); node.append(child);
  assert.throws(() => claimMountRoot(node), /empty/);
  assert.equal(node.children[0], child);
});
test('light-DOM ancestor overlap is rejected', () => {
  const node = root(); const release = claimMountRoot(node);
  const child = root(); node.append(child);
  assert.throws(() => claimMountRoot(child), /already owns/); release();
});
test('light-DOM descendant overlap is rejected for hydration', () => {
  const parent = root(); const child = root(); parent.append(child);
  const release = claimMountRoot(child);
  parent.append(root()); // Keep the hydration parent populated.
  assert.throws(() => claimHydrationRoot(parent), /already owns/);
  release();
});
test('template host preflight rejects a managed ancestor', () => {
  const node = root(); const release = claimMountRoot(node);
  const child = root(); node.append(child);
  assert.throws(() => assertUnmanagedAncestors(child), /already owns/); release();
});
test('parent traversal stops at a shadow-style root', () => {
  const node = root(); const release = claimMountRoot(node);
  const host = root(); node.append(host);
  const shadow = root(); shadow.nodeType = 11; shadow.host = host;
  const child = root(); shadow.append(child);
  claimMountRoot(child)(); release();
});
test('an empty shadow-style root is accepted', () => {
  const shadow = root(); shadow.nodeType = 11; shadow.host = root();
  claimMountRoot(shadow)();
});
test('a plain fragment-like node is rejected', () => {
  const fragment = root(); fragment.nodeType = 11;
  assert.throws(() => claimMountRoot(fragment), /Element or ShadowRoot/);
});
test('an old release cannot revoke a newer lease', () => {
  const node = root(); const old = claimMountRoot(node); old();
  const current = claimMountRoot(node); old();
  assert.throws(() => claimMountRoot(node), /already owns/); current();
});
test('scope disposes in LIFO order exactly once', () => {
  const order = []; const scope = createDisposalScope();
  scope.add(() => order.push('model')); scope.add(() => order.push('source'));
  scope.add(() => order.push('view')); scope.dispose(); scope.dispose();
  assert.deepEqual(order, ['view', 'source', 'model']);
});
test('scope attempts remaining cleanup and aggregates errors', () => {
  const scope = createDisposalScope(); let cleaned = false;
  scope.add(() => { cleaned = true; });
  scope.add(() => { throw new Error('cleanup'); });
  assert.throws(() => scope.dispose(), AggregateError);
  assert.equal(cleaned, true); assert.equal(scope.disposed, true); scope.dispose();
});
test('scope immediately cleans resources added after disposal', () => {
  const scope = createDisposalScope(); scope.dispose(); let cleaned = 0;
  scope.add(() => { cleaned++; }); assert.equal(cleaned, 1);
});
