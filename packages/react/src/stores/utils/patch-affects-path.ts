import type { Patches } from '@context-action/mutative';

export type StorePathSegment = string | number;

function isPrefix(prefix: readonly StorePathSegment[], value: readonly StorePathSegment[]): boolean {
  return prefix.length <= value.length && prefix.every((segment, index) => segment === value[index]);
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

  return patches.some((patch) => {
    const patchPath = patch.path as StorePathSegment[];
    if (patchPath.length === 0) return true;
    if (isPrefix(patchPath, targetPath) || isPrefix(targetPath, patchPath)) return true;

    if (patch.op === 'add' || patch.op === 'remove') {
      const parentPath = patchPath.slice(0, -1);
      if (isPrefix(parentPath, targetPath)) return true;
    }

    return false;
  });
}
