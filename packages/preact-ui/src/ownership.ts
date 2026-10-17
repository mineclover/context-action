/**
 * @module ownership
 *
 * Purpose:
 *   Enforces exclusive, single-owner DOM subtree leases (`MountRoot`) across
 *   `mountPreact`, `hydratePreact`, `mountTemplate`, and `definePreactElement`
 *   without depending on Preact at module load time (`test:native` standalone).
 *
 * Invariants:
 *   - Every leased root must be an `Element` (`nodeType === 1`) or `ShadowRoot`
 *     (`nodeType === 11 && 'host' in root`).
 *   - Ancestor/descendant light-DOM overlap is rejected (`assertUnmanagedAncestors`),
 *     while `ShadowRoot` boundaries naturally isolate their host subtree.
 *   - `claimMountRoot` requires an empty root; `claimHydrationRoot` requires
 *     existing server-rendered children and rejects managed descendants.
 *   - Lease release is idempotent and removes the root from active tracking so
 *     detached DOM trees are never retained in memory.
 */
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

function assertMountRootNode(root: MountRoot, kind: 'mount' | 'hydration'): void {
  if (root.nodeType !== 1 && !(root.nodeType === 11 && 'host' in root)) {
    throw new TypeError(`A ${kind} root must be an Element or ShadowRoot`);
  }
}

function acquireRootLease(root: MountRoot): () => void {
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
  assertMountRootNode(root, 'mount');
  assertUnmanagedAncestors(root);
  if (root.hasChildNodes()) {
    throw new Error('Mount root must be empty; existing DOM is not adopted or hydrated');
  }
  return acquireRootLease(root);
}

/** Claim a server-populated root for the explicit hydration path. */
export function claimHydrationRoot(root: MountRoot): () => void {
  assertMountRootNode(root, 'hydration');
  assertUnmanagedAncestors(root, { rejectManagedDescendants: true });
  if (!root.hasChildNodes()) {
    throw new Error('Hydration root must contain server-rendered children');
  }
  return acquireRootLease(root);
}
