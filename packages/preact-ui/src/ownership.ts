export type MountRoot = Element | ShadowRoot;

// Tracks this module's leases, not arbitrary third-party renderers or DOM writes.
const owners = new WeakMap<Node, object>();
// WeakMap entries cannot be enumerated, so retain the currently leased roots
// in a small companion set to reject a new parent root that would overlap an
// already-managed descendant. Releases remove their entry and do not retain
// detached DOM trees.
const managedRoots = new Set<Node>();

function isWithin(root: Node, candidate: Node): boolean {
  for (let current: Node | null = candidate; current; current = current.parentNode) {
    if (current === root) return true;
  }
  return false;
}

export function assertUnmanagedAncestors(
  node: Node,
  options: { readonly rejectManagedDescendants?: boolean } = {},
): void {
  for (let current: Node | null = node; current; current = current.parentNode) {
    if (owners.has(current)) {
      throw new Error('A managed DOM root already owns this light-DOM region');
    }
  }
  if (options.rejectManagedDescendants) {
    for (const managedRoot of managedRoots) {
      if (isWithin(node, managedRoot)) {
        throw new Error('A managed DOM root already owns this light-DOM region');
      }
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
  managedRoots.add(root);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (owners.get(root) === token) {
      owners.delete(root);
      managedRoots.delete(root);
    }
  };
}

/** Claim a server-populated root for the explicit hydration path. */
export function claimHydrationRoot(root: MountRoot): () => void {
  if (root.nodeType !== 1 && !(root.nodeType === 11 && 'host' in root)) {
    throw new TypeError('A hydration root must be an Element or ShadowRoot');
  }
  assertUnmanagedAncestors(root, { rejectManagedDescendants: true });
  if (!root.hasChildNodes()) {
    throw new Error('Hydration root must contain server-rendered children');
  }
  const token = {};
  owners.set(root, token);
  managedRoots.add(root);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (owners.get(root) === token) {
      owners.delete(root);
      managedRoots.delete(root);
    }
  };
}
