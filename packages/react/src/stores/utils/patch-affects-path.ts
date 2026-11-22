export type StorePathSegment = string | number;

/** Observation-only patch shape. No draft engine or mutable patch arrays required. */
export interface StorePathPatch {
  readonly op: string;
  /** Array segments or an RFC 6901 JSON Pointer (empty string means root). */
  readonly path: readonly unknown[] | string;
  readonly from?: readonly unknown[] | string;
  readonly value?: unknown;
}

const ARRAY_INDEX_SEGMENT_RE = /^(?:0|[1-9]\d*)$/;

/**
 * Returns true when a normalized path segment can address an array element
 * whose insertion/removal shifts sibling numeric indices (`0`, `1`, ..., or `'-'`).
 * Non-numeric object keys (for example `'row-1'`) do not shift sibling keys.
 */
export function isArrayIndexSegment(segment: string): boolean {
  return segment === '-' || ARRAY_INDEX_SEGMENT_RE.test(segment);
}

/**
 * Normalizes array path segments or an RFC 6901 JSON Pointer into string segments.
 * Returns `null` when a path is malformed or contains opaque non-string/number keys so
 * callers fall back conservatively to full invalidation.
 */
export function normalizePatchPath(path: unknown): readonly string[] | null {
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

/**
 * Returns true when modifying `path` can shift or truncate sibling indices under its
 * parent container (structural numeric array element edits or `'length'` truncation).
 */
export function mayShiftSiblingIndexes(
  path: readonly string[],
  structural: boolean,
): boolean {
  if (path.length === 0) return false;
  const last = path[path.length - 1];
  if (last === 'length') return true;
  return structural && last !== undefined && isArrayIndexSegment(last);
}

function isPrefix(prefix: readonly string[], value: readonly string[]): boolean {
  return prefix.length <= value.length && prefix.every((segment, index) => segment === value[index]);
}

function affectsTarget(path: readonly string[], target: readonly string[], structural: boolean): boolean {
  if (isPrefix(path, target) || isPrefix(target, path)) return true;
  return mayShiftSiblingIndexes(path, structural) && isPrefix(path.slice(0, -1), target);
}

/**
 * Determines whether a patch can change the value observed at a path.
 * Both readonly segment arrays and JSON Pointers are supported. Array index
 * add/remove/copy/move and `'length'` truncation invalidate siblings because
 * indices shift; non-numeric object property edits only invalidate ancestors
 * and descendants of the mutated key.
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
