import {
  canonicalEntityId,
  createSymbolSnapshotEntry,
  normalizeRepositoryPath,
  type SymbolSnapshotEntry,
} from '@context-action/sem-foundation-contracts';
import type { SemEntity } from './sem-json';

export function foundationCanonicalEntityId(entity: {
  id?: string;
  parentId?: string;
  name: string;
  type: string;
  file: string;
}): string {
  return canonicalEntityId(entity);
}

export function foundationNormalizeRepositoryPath(value: string): string {
  return normalizeRepositoryPath(value);
}

/** Converts one parsed SEM entity to the shared complete-snapshot entry shape. */
export function foundationSymbolSnapshotEntry(
  entity: SemEntity,
  projectId: string,
): SymbolSnapshotEntry {
  return createSymbolSnapshotEntry(entity, projectId);
}
