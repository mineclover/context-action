import type { RepositoryRevision } from './revision';
import type { SemEntity } from './sem-json';

interface FoundationContracts {
  canonicalEntityId?: (entity: {
    id?: string;
    parentId?: string;
    name: string;
    type: string;
    file: string;
  }) => string;
  entitySymbol?: (entityId: string, filePath?: string) => string;
  normalizeRepositoryPath?: (value: string) => string;
}

interface FoundationRepository {
  RepositoryRevisionReader?: new () => {
    read(cwd: string): RepositoryRevision;
  };
}

function optionalRequire<T>(name: string): T | undefined {
  try {
    return require(name) as T;
  } catch {
    return undefined;
  }
}

export function foundationCanonicalEntityId(entity: {
  id?: string;
  parentId?: string;
  name: string;
  type: string;
  file: string;
}): string {
  const shared = optionalRequire<FoundationContracts>('@sem-foundation/contracts');
  if (shared?.canonicalEntityId !== undefined) {
    return shared.canonicalEntityId(entity);
  }
  return entity.parentId === undefined
    ? `${normalizeRepositoryPath(entity.file)}::${entity.type}::${entity.name}`
    : `${entity.parentId}::${entity.name}`;
}

export function foundationNormalizeRepositoryPath(value: string): string {
  const shared = optionalRequire<FoundationContracts>('@sem-foundation/contracts');
  if (shared?.normalizeRepositoryPath !== undefined) {
    return shared.normalizeRepositoryPath(value);
  }
  return normalizeRepositoryPath(value);
}

export function foundationRevisionReader(): { read(cwd: string): RepositoryRevision } | undefined {
  const shared = optionalRequire<FoundationRepository>('@sem-foundation/repository');
  if (shared?.RepositoryRevisionReader === undefined) return undefined;
  return new shared.RepositoryRevisionReader();
}

export function normalizeSemEntityForFoundation(entity: SemEntity): SemEntity {
  return {
    ...entity,
    file: foundationNormalizeRepositoryPath(entity.file),
    id: entity.id ?? foundationCanonicalEntityId(entity),
  };
}

/** Converts one parsed SEM entity to the shared complete-snapshot entry shape. */
export function foundationSymbolSnapshotEntry(
  entity: SemEntity,
  projectId: string,
): {
  projectId: string;
  entityId: string;
  filePath: string;
  symbol: string;
  kind: string;
  name: string;
  startLine: number;
  endLine: number;
  parentId?: string;
} {
  if (typeof projectId !== 'string' || projectId.length === 0) {
    throw new TypeError('projectId must be non-empty text');
  }
  if (entity.startLine === undefined || entity.endLine === undefined) {
    throw new TypeError('SEM entity must include startLine and endLine for a complete snapshot');
  }
  if (entity.endLine < entity.startLine) {
    throw new TypeError('SEM entity endLine must not precede startLine');
  }
  const normalized = normalizeSemEntityForFoundation(entity);
  const startLine = entity.startLine;
  const endLine = entity.endLine;
  const entityId = normalized.id;
  if (entityId === undefined) throw new TypeError('SEM entity must have a canonical id');
  const shared = optionalRequire<FoundationContracts>('@sem-foundation/contracts');
  const symbol = shared?.entitySymbol?.(entityId, normalized.file)
    ?? entitySymbolFallback(entityId, normalized.file);
  return {
    projectId,
    entityId,
    filePath: normalized.file,
    symbol,
    kind: normalized.type,
    name: normalized.name,
    startLine,
    endLine,
    ...(normalized.parentId === undefined ? {} : { parentId: normalized.parentId }),
  };
}

function entitySymbolFallback(entityId: string, filePath: string): string {
  const separator = entityId.indexOf('::');
  if (separator >= 0) return entityId.slice(separator + 2);
  return entityId.startsWith(`${filePath}::`)
    ? entityId.slice(filePath.length + 2)
    : entityId;
}

function normalizeRepositoryPath(value: string): string {
  const normalized = value.replaceAll('\\', '/');
  const segments: string[] = [];
  for (const segment of normalized.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      if (segments.length === 0) throw new Error(`repository path escapes its root: ${value}`);
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return segments.join('/');
}
