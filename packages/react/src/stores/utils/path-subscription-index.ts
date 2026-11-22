import {
  mayShiftSiblingIndexes,
  normalizePatchPath,
  type StorePathPatch,
  type StorePathSegment,
} from './patch-affects-path';

export interface PathSubscriptionEntry {
  readonly listener: () => void;
  active: boolean;
}

interface TrieNode {
  readonly entries: Set<PathSubscriptionEntry>;
  readonly children: Map<string, TrieNode>;
}

interface RegisteredPathBinding {
  readonly segments: readonly string[];
  readonly chain: readonly TrieNode[];
}

function createTrieNode(): TrieNode {
  return {
    entries: new Set(),
    children: new Map(),
  };
}

function isKnownPatchOp(op: string): boolean {
  return (
    op === 'add' ||
    op === 'remove' ||
    op === 'replace' ||
    op === 'copy' ||
    op === 'move' ||
    op === 'test'
  );
}

function isStructuralPatchOp(op: string): boolean {
  return op === 'add' || op === 'remove' || op === 'copy' || op === 'move';
}

/**
 * Prefix-tree index routing Store patch notifications only to affected path subscribers
 * in `O(patches * pathDepth + |affected|)` rather than scanning all subscribers in `O(N)`.
 */
export class PathSubscriptionIndex {
  private readonly root: TrieNode = createTrieNode();
  private readonly activeEntries = new Set<PathSubscriptionEntry>();

  get size(): number {
    return this.activeEntries.size;
  }

  subscribe(
    paths: readonly (readonly StorePathSegment[])[],
    listener: () => void,
  ): () => void {
    if (paths.length === 0) {
      return () => {};
    }

    const entry: PathSubscriptionEntry = {
      listener,
      active: true,
    };
    this.activeEntries.add(entry);

    const bindings: RegisteredPathBinding[] = [];
    const seenNodes = new Set<TrieNode>();

    for (const rawPath of paths) {
      const segments = rawPath.map(String);
      const chain: TrieNode[] = [this.root];
      let cursor = this.root;

      for (const segment of segments) {
        let next = cursor.children.get(segment);
        if (!next) {
          next = createTrieNode();
          cursor.children.set(segment, next);
        }
        chain.push(next);
        cursor = next;
      }

      if (!seenNodes.has(cursor)) {
        seenNodes.add(cursor);
        cursor.entries.add(entry);
        bindings.push({ segments, chain });
      }
    }

    return () => {
      if (!entry.active) return;
      entry.active = false;
      this.activeEntries.delete(entry);

      for (const binding of bindings) {
        const leaf = binding.chain[binding.chain.length - 1];
        if (!leaf) continue;
        leaf.entries.delete(entry);

        // Prune emptied branches from leaf back toward root
        for (let i = binding.segments.length - 1; i >= 0; i -= 1) {
          const child = binding.chain[i + 1];
          const parent = binding.chain[i];
          const segment = binding.segments[i];
          if (
            !child ||
            !parent ||
            segment === undefined ||
            child.entries.size > 0 ||
            child.children.size > 0
          ) {
            break;
          }
          parent.children.delete(segment);
        }
      }
    };
  }

  /**
   * Collects every active `PathSubscriptionEntry` potentially affected by `patches`,
   * preserving full `patchesAffectPath` parity and deduplicating multi-path entries.
   */
  collectAffected(
    patches: readonly StorePathPatch[] | null,
  ): readonly PathSubscriptionEntry[] {
    if (this.activeEntries.size === 0) return [];
    if (!patches || patches.length === 0) {
      return [...this.activeEntries];
    }

    const matched = new Set<PathSubscriptionEntry>();
    let matchedAll = false;

    const collectSubtree = (startNode: TrieNode): void => {
      if (startNode === this.root) {
        matchedAll = true;
        return;
      }
      const stack: TrieNode[] = [startNode];
      while (stack.length > 0) {
        const node = stack.pop();
        if (!node) continue;
        for (const entry of node.entries) {
          matched.add(entry);
        }
        for (const child of node.children.values()) {
          stack.push(child);
        }
      }
    };

    const collectEffectivePath = (effectivePath: readonly string[]): void => {
      if (matchedAll) return;
      if (effectivePath.length === 0) {
        matchedAll = true;
        return;
      }

      let cursor: TrieNode | undefined = this.root;
      for (const entry of cursor.entries) {
        matched.add(entry);
      }

      for (let i = 0; i < effectivePath.length; i += 1) {
        const segment = effectivePath[i];
        if (segment === undefined) break;
        const next: TrieNode | undefined = cursor.children.get(segment);
        if (!next) {
          return;
        }
        cursor = next;
        if (i === effectivePath.length - 1) {
          collectSubtree(cursor);
          return;
        }
        for (const entry of cursor.entries) {
          matched.add(entry);
        }
      }
    };

    for (const patch of patches) {
      if (!patch || typeof patch !== 'object' || !isKnownPatchOp(patch.op)) {
        return [...this.activeEntries];
      }

      const path = normalizePatchPath(patch.path);
      if (path === null) {
        return [...this.activeEntries];
      }

      const structural = isStructuralPatchOp(patch.op);
      const effectivePath = mayShiftSiblingIndexes(path, structural)
        ? path.slice(0, -1)
        : path;
      collectEffectivePath(effectivePath);
      if (matchedAll) {
        return [...this.activeEntries];
      }

      if (patch.op === 'move') {
        const source = normalizePatchPath(patch.from);
        if (source === null) {
          return [...this.activeEntries];
        }
        const effectiveSource = mayShiftSiblingIndexes(source, true)
          ? source.slice(0, -1)
          : source;
        collectEffectivePath(effectiveSource);
        if (matchedAll) {
          return [...this.activeEntries];
        }
      }
    }

    return [...matched];
  }

  clear(): void {
    for (const entry of this.activeEntries) {
      entry.active = false;
    }
    this.activeEntries.clear();
    this.root.entries.clear();
    this.root.children.clear();
  }
}
