import type { Patches } from '@context-action/mutative';

export type StorePathSegment = string | number;

function isPrefix(prefix: readonly StorePathSegment[], value: readonly StorePathSegment[]): boolean {
  return prefix.length <= value.length && prefix.every((segment, index) => segment === value[index]);
}

function isArrayLengthPath(path: readonly StorePathSegment[]): boolean {
  return path.length > 0 && path[path.length - 1] === 'length';
}

/**
 * Determines whether a patch can change the value observed at a path.
 * Collection add/remove operations invalidate all descendants because
 * numeric array indexes after the edit may refer to different entities.
 */
export function patchesAffectPath(
  patches: Patches | null,
  targetPath: readonly StorePathSegment[],
): boolean {
  if (!patches || patches.length === 0) return true;

  // Mutative represents splice/truncate operations as a replacement at the
  // first shifted index plus a replacement of the array's `length` property.
  // The length patch is the reliable structural signal: every descendant
  // index under that array may now point at a different entity (or disappear).
  const structurallyChangedArrays = patches
    .filter((patch) => isArrayLengthPath(patch.path as StorePathSegment[]))
    .map((patch) => (patch.path as StorePathSegment[]).slice(0, -1));

  if (structurallyChangedArrays.some((arrayPath) => isPrefix(arrayPath, targetPath))) {
    return true;
  }

  return patches.some((patch) => {
    const patchPath = patch.path as StorePathSegment[];
    if (patchPath.length === 0) return true;
    if (isPrefix(patchPath, targetPath) || isPrefix(targetPath, patchPath)) return true;

    if (patch.op === 'add' || patch.op === 'remove' || String(patch.op) === 'move') {
      const parentPath = patchPath.slice(0, -1);
      if (isPrefix(parentPath, targetPath)) return true;
    }

    return false;
  });
}
