export type MountRoot = Element | ShadowRoot;

// Tracks this module's leases, not arbitrary third-party renderers or DOM writes.
const owners = new WeakMap<Node, object>();

export function assertUnmanagedAncestors(node: Node): void {
  for (let current: Node | null = node; current; current = current.parentNode) {
    if (owners.has(current)) {
      throw new Error('A managed DOM root already owns this light-DOM region');
    }
  }
  // parentNode intentionally stops at a ShadowRoot: its host is another boundary.
}

export function claimMountRoot(root: MountRoot): () => void {
  if (root.nodeType !== 1 && !(root.nodeType === 11 && 'host' in root)) {
    throw new TypeError('A mount root must be an Element or ShadowRoot');
  }
  assertUnmanagedAncestors(root);
  if (root.hasChildNodes()) {
    throw new Error('Mount root must be empty; existing DOM is not adopted or hydrated');
  }
  const token = {};
  owners.set(root, token);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (owners.get(root) === token) owners.delete(root);
  };
}
