import { foundationCanonicalEntityId, foundationNormalizeRepositoryPath } from './sem-foundation';

/** Maximum number of JSON items accepted in any SEM result collection. */
export const MAX_SEM_JSON_ARRAY_ITEMS = 65_536;

export interface SemEntity {
  readonly id?: string;
  readonly parentId?: string;
  readonly name: string;
  readonly type: string;
  readonly file: string;
  readonly startLine?: number;
  readonly endLine?: number;
  readonly depth?: number;
}

export interface SemImpactEntity extends SemEntity {
  readonly depth: number;
}

export interface SemDiffChange extends SemEntity {
  readonly changeType: string;
  readonly oldStartLine?: number;
  readonly oldEndLine?: number;
  readonly oldEntityName?: string;
  readonly oldFilePath?: string;
  readonly beforeContent?: string;
  readonly afterContent?: string;
  readonly structuralChange?: boolean;
  readonly commitSha?: string;
  readonly author?: string;
}

export interface SemDiffResult {
  readonly summary: Readonly<Record<string, number>>;
  readonly changes: readonly SemDiffChange[];
}

export interface SemImpactResult {
  readonly entity: SemEntity;
  readonly dependencies: readonly SemEntity[];
  readonly dependents: readonly SemEntity[];
  readonly impact: {
    readonly depth: number;
    readonly total: number;
    readonly entities: readonly SemImpactEntity[];
  };
  readonly tests: readonly SemEntity[];
  readonly testsTruncated: boolean;
}

export interface SemContextEntry extends SemEntity {
  readonly role: string;
  readonly tokens: number;
  readonly content: string;
}

export interface SemContextResult {
  readonly entity: string;
  readonly entityId: string;
  readonly budget: number;
  readonly totalTokens: number;
  readonly truncated: boolean;
  readonly targetOmitted: boolean;
  readonly entries: readonly SemContextEntry[];
}

export class SemSchemaError extends Error {
  public constructor(
    message: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'SemSchemaError';
  }
}

type JsonObject = Record<string, unknown>;

function object(value: unknown, path: string): JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new SemSchemaError(`${path} must be an object`, value);
  }
  return value as JsonObject;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function requiredString(value: unknown, path: string): string {
  const result = optionalString(value);
  if (
    result === undefined
    || result.length === 0
    || result.includes('\0')
    || !isWellFormedText(result)
    || result.trim().length === 0
  ) {
    throw new SemSchemaError(`${path} must be a non-empty string`, value);
  }
  return result;
}

function optionalNonEmptyString(value: unknown, path: string): string | undefined {
  if (value === undefined) return undefined;
  return requiredString(value, path);
}

function isWellFormedText(value: string): boolean {
  return Buffer.from(value, 'utf8').toString('utf8') === value;
}

function optionalInteger(value: unknown, path: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  throw new SemSchemaError(`${path} must be an integer`, value);
}

function optionalPositiveInteger(value: unknown, path: string): number | undefined {
  const result = optionalInteger(value, path);
  if (result === undefined) return undefined;
  if (result < 1) throw new SemSchemaError(`${path} must be positive`, value);
  return result;
}

function optionalNonNegativeInteger(value: unknown, path: string): number | undefined {
  const result = optionalInteger(value, path);
  if (result === undefined) return undefined;
  if (result < 0) throw new SemSchemaError(`${path} must be non-negative`, value);
  return result;
}

function requiredNonNegativeInteger(value: unknown, path: string): number {
  const result = optionalInteger(value, path);
  if (result === undefined || result < 0) {
    throw new SemSchemaError(`${path} must be a non-negative integer`, value);
  }
  return result;
}

function array(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new SemSchemaError(`${path} must be an array`, value);
  if (value.length > MAX_SEM_JSON_ARRAY_ITEMS) {
    throw new SemSchemaError(
      `${path} exceeds ${MAX_SEM_JSON_ARRAY_ITEMS} items`,
      value,
    );
  }
  return value;
}

function parseSemEntityValue(
  value: unknown,
  path: string,
  invalidRange: 'reject' | 'omit'
): SemEntity {
  const input = object(value, path);
  const name = requiredString(input.name ?? input.entityName, `${path}.name`);
  const type = requiredString(input.type ?? input.entityType, `${path}.type`);
  const file = foundationNormalizeRepositoryPath(
    requiredString(input.file ?? input.filePath, `${path}.file`)
  );
  if (file.length === 0) {
    throw new SemSchemaError(`${path}.file must resolve to a non-empty repository path`, value);
  }
  const parentId = input.parentId !== undefined
    ? optionalNonEmptyString(input.parentId, `${path}.parentId`)
    : optionalNonEmptyString(input.parent_id, `${path}.parent_id`);
  const explicitId = input.id !== undefined
    ? optionalNonEmptyString(input.id, `${path}.id`)
    : optionalNonEmptyString(input.entityId, `${path}.entityId`);
  const id = explicitId ?? foundationCanonicalEntityId({ parentId, name, type, file });
  const lines = Array.isArray(input.lines) ? input.lines : undefined;
  let startLine = optionalPositiveInteger(
    input.startLine ?? input.start_line ?? lines?.[0],
    `${path}.startLine`
  );
  let endLine = optionalPositiveInteger(
    input.endLine ?? input.end_line ?? lines?.[1],
    `${path}.endLine`
  );
  if (startLine !== undefined && endLine !== undefined && endLine < startLine) {
    if (invalidRange === 'reject') {
      throw new SemSchemaError(`${path}.endLine must not precede startLine`, value);
    }
    startLine = undefined;
    endLine = undefined;
  }
  return {
    id,
    ...(parentId === undefined ? {} : { parentId }),
    name,
    type,
    file,
    startLine,
    endLine,
    depth: optionalNonNegativeInteger(input.depth, `${path}.depth`),
  };
}

export function parseSemEntity(value: unknown, path = 'entity'): SemEntity {
  return parseSemEntityValue(value, path, 'reject');
}

export function parseSemDiff(value: unknown): SemDiffResult {
  const input = object(value, 'diff');
  const summary = object(input.summary, 'diff.summary');
  const summaryValues: Record<string, number> = {};
  for (const [key, item] of Object.entries(summary))
    summaryValues[key] = requiredNonNegativeInteger(item, `diff.summary.${key}`);
  const changes = array(input.changes, 'diff.changes').map((item, index) => {
    const change = object(item, `diff.changes[${index}]`);
    const oldStartLine = optionalPositiveInteger(
      change.oldStartLine,
      `diff.changes[${index}].oldStartLine`
    );
    const oldEndLine = optionalPositiveInteger(
      change.oldEndLine,
      `diff.changes[${index}].oldEndLine`
    );
    if (oldStartLine !== undefined && oldEndLine !== undefined && oldEndLine < oldStartLine) {
      throw new SemSchemaError(
        `diff.changes[${index}].oldEndLine must not precede oldStartLine`,
        item
      );
    }
    return {
      ...parseSemEntity(change, `diff.changes[${index}]`),
      changeType: requiredString(change.changeType, `diff.changes[${index}].changeType`),
      oldStartLine,
      oldEndLine,
      oldEntityName: optionalString(change.oldEntityName),
      oldFilePath: optionalString(change.oldFilePath),
      beforeContent: optionalString(change.beforeContent),
      afterContent: optionalString(change.afterContent),
      structuralChange:
        typeof change.structuralChange === 'boolean' ? change.structuralChange : undefined,
      commitSha: optionalString(change.commitSha),
      author: optionalString(change.author),
    } satisfies SemDiffChange;
  });
  return { summary: summaryValues, changes };
}

function parseEntityList(value: unknown, path: string): readonly SemEntity[] {
  return array(value, path).map((item, index) => parseSemEntity(item, `${path}[${index}]`));
}

export function parseSemImpact(value: unknown): SemImpactResult {
  const input = object(value, 'impact');
  const impact = object(input.impact, 'impact.impact');
  const rawImpactEntities = array(impact.entities, 'impact.impact.entities');
  const entities = rawImpactEntities.map((item, index) => {
    const entity = object(item, `impact.impact.entities[${index}]`);
    return {
      ...parseSemEntity(entity, `impact.impact.entities[${index}]`),
      depth: requiredNonNegativeInteger(entity.depth, `impact.impact.entities[${index}].depth`),
    } satisfies SemImpactEntity;
  });
  return {
    entity: parseSemEntity(input.entity, 'impact.entity'),
    dependencies: parseEntityList(input.dependencies ?? [], 'impact.dependencies'),
    dependents: parseEntityList(input.dependents ?? [], 'impact.dependents'),
    impact: {
      depth: requiredNonNegativeInteger(impact.depth, 'impact.impact.depth'),
      total: requiredNonNegativeInteger(impact.total, 'impact.impact.total'),
      entities,
    },
    tests: parseEntityList(input.tests ?? [], 'impact.tests'),
    testsTruncated: input.tests_truncated === true || input.testsTruncated === true,
  };
}

export function parseSemContext(value: unknown): SemContextResult {
  const input = object(value, 'context');
  const entries = array(input.entries, 'context.entries').map((item, index) => {
    const entry = object(item, `context.entries[${index}]`);
    return {
      ...parseSemEntity(entry, `context.entries[${index}]`),
      role: requiredString(entry.role, `context.entries[${index}].role`),
      tokens: requiredNonNegativeInteger(entry.tokens, `context.entries[${index}].tokens`),
      content: requiredString(entry.content, `context.entries[${index}].content`),
    } satisfies SemContextEntry;
  });
  return {
    entity: requiredString(input.entity, 'context.entity'),
    entityId: requiredString(input.entityId, 'context.entityId'),
    budget: requiredNonNegativeInteger(input.budget, 'context.budget'),
    totalTokens: requiredNonNegativeInteger(
      input.total_tokens ?? input.totalTokens,
      'context.total_tokens'
    ),
    truncated: input.truncated === true,
    targetOmitted: input.target_omitted === true || input.targetOmitted === true,
    entries,
  };
}

export function parseSemEntities(value: unknown): readonly SemEntity[] {
  return array(value, 'entities').map((item, index) =>
    parseSemEntityValue(item, `entities[${index}]`, 'omit')
  );
}
