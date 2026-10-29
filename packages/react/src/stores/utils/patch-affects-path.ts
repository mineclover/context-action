export type StorePathSegment = string | number;

/** Observation-only patch shape. No draft engine or mutable patch arrays required. */
export interface StorePathPatch {
  readonly op: string;
  /** Array segments or an RFC 6901 JSON Pointer (empty string means root). */
  readonly path: readonly unknown[] | string;
  readonly from?: readonly unknown[] | string;
  readonly value?: unknown;
}

function isPrefix(prefix: readonly string[], value: readonly string[]): boolean {
  return prefix.length <= value.length && prefix.every((segment, index) => segment === value[index]);
}

/** Unknown paths must invalidate conservatively, never silently skip an update. */
function normalizePatchPath(path: unknown): readonly string[] | null {
  if (typeof path === 'string') {
    if (path === '') return [];
    if (!path.startsWith('/') || /~(?:[^01]|$)/.test(path)) return null;
    return path.slice(1).split('/').map(segment => segment.replace(/~1/g, '/').replace(/~0/g, '~'));
  }
  if (!Array.isArray(path)) return null;
  const segments: string[] = [];
  for (const segment of path) {
    if (typeof segment !== 'string' && typeof segment !== 'number') return null;
    // Object/array property access treats numeric 1 and string '1' identically.
    // Do not parse numeric strings: property '01' is different from index 1.
    segments.push(String(segment));
  }
  return segments;
}

function affectsTarget(path: readonly string[], target: readonly string[], structural: boolean): boolean {
  if (isPrefix(path, target) || isPrefix(target, path)) return true;
  // Insertion/removal can shift every later array index. Mutative also signals
  // splice/truncation through a replacement of the collection's length property.
  return (structural || path[path.length - 1] === 'length') && isPrefix(path.slice(0, -1), target);
}

/**
 * Determines whether a patch can change the value observed at a path.
 * Both readonly segment arrays and JSON Pointers are supported. Collection
 * add/remove/copy/move operations invalidate descendants because indexes shift;
 * move also invalidates its source. This does not apply or validate a patch.
 */
export function patchesAffectPath(
  patches: readonly StorePathPatch[] | null,
  targetPath: readonly StorePathSegment[],
): boolean {
  if (!patches || patches.length === 0) return true;

  const target = targetPath.map(String);
  for (const patch of patches) {
    const path = normalizePatchPath(patch.path);
    if (path === null) return true;
    switch (patch.op) {
      case 'add':
      case 'remove':
      case 'copy':
      case 'move':
        if (affectsTarget(path, target, true)) return true;
        if (patch.op === 'move') {
          const source = normalizePatchPath(patch.from);
          if (source === null || affectsTarget(source, target, true)) return true;
        }
        break;
      case 'replace':
      case 'test':
        if (affectsTarget(path, target, false)) return true;
        break;
      default:
        return true;
    }
  }
  return false;
}
