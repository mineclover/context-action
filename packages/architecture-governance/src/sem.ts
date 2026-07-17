import { type SpawnSyncReturns, spawnSync } from 'node:child_process';
import {
  closeSync,
  existsSync,
  openSync,
  readSync,
  realpathSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TextDecoder } from 'node:util';
import type {
  ArchitectureProject,
  SemBinaryChangeStatus,
  SemChangeSet,
  SemChangeType,
  SemEntity,
  SemExecutionFailure,
  SemExecutionLimits,
  SemFailureReason,
  SemImpact,
  SemOperation,
  SemProjectAnalysis,
  SemRelatedEntity,
} from './contracts.js';
import {
  assertKnownFields,
  boundedDiagnosticList,
  diagnosticErrorMessage,
  diagnosticSystemErrorCode,
} from './diagnostics.js';
import {
  InputContractError,
  normalizeArchitectureFileExtensions,
} from './input.js';
import { resolveRepositoryPath } from './paths.js';
import { compileGlobPatterns } from './patterns.js';
import {
  hasVisibleText,
  isWellFormedText,
  toWellFormedText,
  truncateWellFormedText,
} from './text.js';

export const DEFAULT_SEM_TIMEOUT_MS = 120_000;
export const DEFAULT_SEM_MAX_OUTPUT_BYTES = 64 * 1024 * 1024;
export const MAX_SEM_IMPACT_QUERIES_PER_PROJECT = 256;
export const MAX_SEM_EVIDENCE_ITEMS_PER_PROJECT = 65_536;
export const MAX_SEM_EVIDENCE_ITEMS_TOTAL = 65_536;
export const MAX_SEM_CHANGE_EVIDENCE_ITEMS = 65_536;
export const MAX_SEM_EVIDENCE_TEXT_CHARS = 4096;
export const MAX_SEM_EVIDENCE_TEXT_CHARS_TOTAL = 8 * 1024 * 1024;
export const SUPPORTED_SEM_VERSION = '0.21.0';
export const MAX_SEM_VERSION_OUTPUT_CHARS = 4096;
const maximumTimeoutMs = 60 * 60 * 1000;
const maximumOutputBytes = 1024 * 1024 * 1024;
export const MAX_SEM_FAILURE_TEXT_CHARS = 4096;
export const MAX_SEM_FAILURE_COLLECTION_ITEMS = 4096;
export const MAX_SEM_FAILURE_TEXT_CHARS_TOTAL = 8 * 1024 * 1024;
export const MAX_SEM_FAILURE_INPUT_TEXT_CHARS = 64 * 1024;
export const MAX_SEM_FAILURE_INPUT_TEXT_CHARS_TOTAL = 16 * 1024 * 1024;
const MAX_SEM_FAILURE_DECODE_BYTES = (MAX_SEM_FAILURE_TEXT_CHARS + 1) * 4;
const SOURCE_LINE_SCAN_BUFFER_BYTES = 64 * 1024;
const semOperations = new Set<SemOperation>(['version', 'entities', 'impact', 'diff']);
const semFailureReasons = new Set<SemFailureReason>([
  'spawn',
  'timeout',
  'output-limit',
  'query-limit',
  'exit',
  'invalid-json',
  'invalid-output',
]);
const semChangeTypes = new Set<SemChangeType>([
  'added',
  'modified',
  'deleted',
  'moved',
  'renamed',
  'reordered',
]);
const semBinaryChangeStatuses = new Set<SemBinaryChangeStatus>([
  'added',
  'modified',
  'deleted',
  'renamed',
]);

export class SemExecutionError extends InputContractError {
  readonly failure: SemExecutionFailure;

  constructor(failure: SemExecutionFailure) {
    const boundedFailure = boundSemExecutionFailure(failure);
    super(`sem ${boundedFailure.operation} failed (${boundedFailure.reason}) after ${boundedFailure.durationMs}ms`);
    this.name = 'SemExecutionError';
    this.failure = boundedFailure;
  }
}

function positiveInteger(
  value: number | string | undefined,
  fallback: number,
  label: string,
  maximum: number,
): number {
  if (value === undefined) return fallback;
  if (typeof value === 'string' && !/^[1-9]\d*$/.test(value)) {
    throw new InputContractError(`${label} must be a canonical base-10 positive integer`);
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > maximum) {
    throw new InputContractError(`${label} must be an integer between 1 and ${maximum}`);
  }
  return parsed;
}

export function resolveSemExecutionLimits(options: {
  timeoutMs?: number;
  maxOutputBytes?: number;
  env?: NodeJS.ProcessEnv;
} = {}): SemExecutionLimits {
  const input = record(options as unknown, 'sem execution limit options');
  exactModelKeys(
    input,
    ['timeoutMs', 'maxOutputBytes', 'env'],
    'sem execution limit options',
  );
  const env = input.env === undefined
    ? process.env
    : record(input.env, 'sem execution limit options.env') as NodeJS.ProcessEnv;
  if (input.timeoutMs !== undefined && typeof input.timeoutMs !== 'number') {
    throw new InputContractError('SEM timeout option must be a number when provided');
  }
  if (
    input.maxOutputBytes !== undefined
    && typeof input.maxOutputBytes !== 'number'
  ) {
    throw new InputContractError(
      'SEM max output bytes option must be a number when provided',
    );
  }
  if (env.SEM_TIMEOUT_MS !== undefined && typeof env.SEM_TIMEOUT_MS !== 'string') {
    throw new InputContractError('SEM_TIMEOUT_MS environment value must be a string');
  }
  if (
    env.SEM_MAX_OUTPUT_BYTES !== undefined
    && typeof env.SEM_MAX_OUTPUT_BYTES !== 'string'
  ) {
    throw new InputContractError(
      'SEM_MAX_OUTPUT_BYTES environment value must be a string',
    );
  }
  return {
    timeoutMs: positiveInteger(
      input.timeoutMs as number | undefined ?? env.SEM_TIMEOUT_MS,
      DEFAULT_SEM_TIMEOUT_MS,
      'SEM timeout',
      maximumTimeoutMs,
    ),
    maxOutputBytes: positiveInteger(
      input.maxOutputBytes as number | undefined ?? env.SEM_MAX_OUTPUT_BYTES,
      DEFAULT_SEM_MAX_OUTPUT_BYTES,
      'SEM max output bytes',
      maximumOutputBytes,
    ),
  };
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InputContractError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new InputContractError(`${label} must be a non-empty string`);
  }
  if (value.includes('\0')) {
    throw new InputContractError(`${label} must not contain null bytes`);
  }
  if (!isWellFormedText(value)) {
    throw new InputContractError(`${label} must contain well-formed Unicode`);
  }
  if (value.length > MAX_SEM_EVIDENCE_TEXT_CHARS) {
    throw new InputContractError(
      `${label} exceeds ${MAX_SEM_EVIDENCE_TEXT_CHARS} character limit`,
    );
  }
  return value;
}

interface SemEvidenceTextBudget {
  characters: number;
  label: string;
}

function consumeSemEvidenceText(
  value: unknown,
  label: string,
  budget: SemEvidenceTextBudget,
  requireVisible = false,
): void {
  if (typeof value !== 'string') return;
  const validated = requireVisible ? visibleText(value, label) : text(value, label);
  if (
    validated.length
    > MAX_SEM_EVIDENCE_TEXT_CHARS_TOTAL - budget.characters
  ) {
    throw new InputContractError(
      `${budget.label} exceeds ${MAX_SEM_EVIDENCE_TEXT_CHARS_TOTAL} aggregate text character limit`,
    );
  }
  budget.characters += validated.length;
}

function runtimeEvidenceRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function consumeRelatedEntityText(
  value: unknown,
  label: string,
  budget: SemEvidenceTextBudget,
): void {
  const entity = runtimeEvidenceRecord(value);
  if (!entity) return;
  for (const field of ['entityId', 'file', 'name', 'kind'] as const) {
    consumeSemEvidenceText(entity[field], `${label}.${field}`, budget);
  }
}

function consumeSemImpactText(
  value: unknown,
  label: string,
  budget: SemEvidenceTextBudget,
): void {
  const impact = runtimeEvidenceRecord(value);
  if (!impact) return;
  consumeRelatedEntityText(impact.entity, `${label}.entity`, budget);
  for (const field of ['dependencies', 'dependents', 'tests'] as const) {
    const related = impact[field];
    if (!Array.isArray(related)) continue;
    for (const [index, entity] of related.entries()) {
      consumeRelatedEntityText(entity, `${label}.${field}[${index}]`, budget);
    }
  }
}

function consumeSemEntityText(
  value: unknown,
  label: string,
  budget: SemEvidenceTextBudget,
): void {
  const entity = runtimeEvidenceRecord(value);
  if (!entity) return;
  for (const field of ['id', 'file', 'name', 'kind', 'parentId'] as const) {
    consumeSemEvidenceText(entity[field], `${label}.${field}`, budget);
  }
}

function consumeSemAnalysisText(
  value: unknown,
  label: string,
  budget: SemEvidenceTextBudget,
): void {
  const analysis = runtimeEvidenceRecord(value);
  if (!analysis) return;
  consumeSemEvidenceText(
    analysis.projectId,
    `${label}.projectId`,
    budget,
    true,
  );
  consumeSemEvidenceText(analysis.root, `${label}.root`, budget);
  if (Array.isArray(analysis.entities)) {
    for (const [index, value] of analysis.entities.entries()) {
      consumeSemEntityText(value, `${label}.entities[${index}]`, budget);
    }
  }
  if (Array.isArray(analysis.impacts)) {
    for (const [index, impact] of analysis.impacts.entries()) {
      consumeSemImpactText(impact, `${label}.impacts[${index}]`, budget);
    }
  }
}

function consumeSemChangeSetText(
  value: unknown,
  label: string,
  budget: SemEvidenceTextBudget,
): void {
  const changeSet = runtimeEvidenceRecord(value);
  if (!changeSet) return;
  const source = runtimeEvidenceRecord(changeSet.source);
  if (source) {
    consumeSemEvidenceText(source.mode, `${label}.source.mode`, budget);
    consumeSemEvidenceText(source.from, `${label}.source.from`, budget, true);
    consumeSemEvidenceText(source.to, `${label}.source.to`, budget, true);
  }
  if (Array.isArray(changeSet.changes)) {
    for (const [index, value] of changeSet.changes.entries()) {
      const change = runtimeEvidenceRecord(value);
      if (!change) continue;
      for (const field of ['entityId', 'changeType', 'filePath', 'oldFilePath'] as const) {
        consumeSemEvidenceText(
          change[field],
          `${label}.changes[${index}].${field}`,
          budget,
        );
      }
    }
  }
  if (Array.isArray(changeSet.binaryChanges)) {
    for (const [index, value] of changeSet.binaryChanges.entries()) {
      const change = runtimeEvidenceRecord(value);
      if (!change) continue;
      for (const field of ['filePath', 'status', 'oldFilePath'] as const) {
        consumeSemEvidenceText(
          change[field],
          `${label}.binaryChanges[${index}].${field}`,
          budget,
        );
      }
    }
  }
  if (Array.isArray(changeSet.untrackedFiles)) {
    for (const [index, file] of changeSet.untrackedFiles.entries()) {
      consumeSemEvidenceText(
        file,
        `${label}.untrackedFiles[${index}]`,
        budget,
      );
    }
  }
}

function semEntityEvidenceTextCharacters(
  value: readonly unknown[],
  label: string,
): number {
  const budget: SemEvidenceTextBudget = { characters: 0, label };
  for (const [index, entity] of value.entries()) {
    consumeSemEntityText(entity, `${label}[${index}]`, budget);
  }
  return budget.characters;
}

function semImpactEvidenceTextCharacters(
  value: unknown,
  label: string,
): number {
  const budget: SemEvidenceTextBudget = { characters: 0, label };
  consumeSemImpactText(value, label, budget);
  return budget.characters;
}

function visibleText(value: unknown, label: string): string {
  const result = text(value, label);
  if (!hasVisibleText(result)) {
    throw new InputContractError(
      `${label} must be a non-empty string containing visible text`,
    );
  }
  return result;
}

function integer(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value)) {
    throw new InputContractError(`${label} must be a safe integer`);
  }
  return value as number;
}

function sourceLine(value: unknown, label: string): number {
  const line = integer(value, label);
  if (line < 1) {
    throw new InputContractError(`${label} must be at least 1`);
  }
  return line;
}

function normalizedPath(value: string): string {
  return value.replace(/\\/g, '/').split(path.sep).join('/');
}

function normalizedEntityId(value: string): string {
  const separator = value.indexOf('::');
  if (separator < 0) return normalizedPath(value);
  return `${normalizedPath(value.slice(0, separator))}${value.slice(separator)}`;
}

function pathInside(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate);
  return relative === ''
    || (!relative.startsWith(`..${path.sep}`)
      && relative !== '..'
      && !path.isAbsolute(relative));
}

function repositoryRelativeCanonicalPath(
  repositoryRoot: string,
  canonicalPath: string,
): string {
  const relative = normalizedPath(path.relative(repositoryRoot, canonicalPath));
  return relative === '' ? '.' : relative;
}

function canonicalDirectory(candidate: string, label: string): string {
  try {
    const canonical = realpathSync(candidate);
    if (!statSync(canonical).isDirectory()) {
      throw new InputContractError(`${label} must be a directory: ${candidate}`);
    }
    return canonical;
  } catch (error) {
    if (error instanceof InputContractError) throw error;
    throw new InputContractError(
      `Cannot resolve ${label.toLowerCase()} ${candidate}: ${diagnosticErrorMessage(error)}`,
    );
  }
}

function canonicalRepositoryRoot(repositoryRoot: string): string {
  return canonicalDirectory(path.resolve(repositoryRoot), 'Repository root');
}

function canonicalProjectRoot(
  repositoryRoot: string,
  project: ArchitectureProject,
): string {
  const resolved = resolveRepositoryPath(
    repositoryRoot,
    project.root,
    `Analysis project ${project.id} root`,
  );
  const canonical = canonicalDirectory(resolved, `Analysis project ${project.id} root`);
  if (!pathInside(repositoryRoot, canonical)) {
    throw new InputContractError(
      `Analysis project ${project.id} root escapes repository root through symbolic link: ${project.root}`,
    );
  }
  return canonical;
}

function repositoryFile(
  repositoryRoot: string,
  value: string,
  label: string,
): { file: string; resolved: string } {
  const file = normalizedPath(value);
  if (file !== value) {
    throw new InputContractError(
      `${label} must use a normalized forward-slash path: ${value}`,
    );
  }
  if (
    file.includes('\0')
    || path.posix.isAbsolute(file)
    || path.win32.isAbsolute(file)
  ) {
    throw new InputContractError(`${label} must be repository-relative: ${value}`);
  }
  const canonical = path.posix.normalize(file).replace(/^\.\//, '');
  if (canonical === '' || canonical === '.' || canonical !== file) {
    throw new InputContractError(`${label} must be a normalized file path: ${value}`);
  }
  return {
    file,
    resolved: resolveRepositoryPath(repositoryRoot, file, label, false),
  };
}

function existingRepositoryFile(
  repositoryRoot: string,
  value: string,
  label: string,
): { file: string; resolved: string; canonical: string } {
  const validated = repositoryFile(repositoryRoot, value, label);
  let canonical: string;
  try {
    canonical = realpathSync(validated.resolved);
    if (!statSync(canonical).isFile()) {
      throw new InputContractError(`${label} must be a file: ${value}`);
    }
  } catch (error) {
    if (error instanceof InputContractError) throw error;
    throw new InputContractError(
      `Cannot resolve ${label.toLowerCase()} ${value}: ${diagnosticErrorMessage(error)}`,
    );
  }
  if (!pathInside(repositoryRoot, canonical)) {
    throw new InputContractError(
      `${label} escapes repository root through symbolic link: ${value}`,
    );
  }
  return { ...validated, canonical };
}

function entityIdFile(entityId: string, label: string): string {
  const separator = entityId.indexOf('::');
  if (separator <= 0) {
    throw new InputContractError(`${label} must start with a canonical file path: ${entityId}`);
  }
  return entityId.slice(0, separator);
}

function validateEntityFileIdentity(
  repositoryRoot: string,
  entity: SemRelatedEntity,
  label: string,
): void {
  const validated = existingRepositoryFile(repositoryRoot, entity.file, `${label}.file`);
  const idFile = repositoryFile(
    repositoryRoot,
    entityIdFile(entity.entityId, `${label}.entityId`),
    `${label}.entityId file`,
  );
  if (validated.file !== idFile.file) {
    throw new InputContractError(
      `${label} entityId file ${idFile.file} does not match file ${validated.file}`,
    );
  }
}

function sourceLineCountUpTo(
  canonicalFile: string,
  requiredLine: number,
  buffer: Buffer,
  label: string,
  authoredFile: string,
): number {
  let descriptor: number | undefined;
  try {
    descriptor = openSync(canonicalFile, 'r');
    let lineCount = 1;
    let pendingCarriageReturn = false;
    while (lineCount < requiredLine) {
      const bytesRead = readSync(
        descriptor,
        buffer,
        0,
        buffer.length,
        null,
      );
      if (bytesRead === 0) {
        if (pendingCarriageReturn) lineCount += 1;
        return lineCount;
      }
      for (let byteIndex = 0; byteIndex < bytesRead; byteIndex += 1) {
        const byte = buffer[byteIndex];
        if (pendingCarriageReturn) {
          pendingCarriageReturn = false;
          lineCount += 1;
          if (lineCount >= requiredLine) return lineCount;
          if (byte === 0x0a) continue;
        }
        if (byte === 0x0d) {
          pendingCarriageReturn = true;
        } else if (byte === 0x0a) {
          lineCount += 1;
          if (lineCount >= requiredLine) return lineCount;
        }
      }
    }
    return lineCount;
  } catch (error) {
    throw new InputContractError(
      `Cannot read ${label}.file for source line validation ${authoredFile}: ${diagnosticErrorMessage(error)}`,
    );
  } finally {
    if (descriptor !== undefined) {
      try {
        closeSync(descriptor);
      } catch {
        // The read result is already determined; do not replace it with a close diagnostic.
      }
    }
  }
}

function validateProjectEntities(
  repositoryRoot: string,
  projectRoot: string,
  project: ArchitectureProject,
  entities: SemEntity[],
): void {
  const topLevelIds = new Set<string>();
  const sourceLineRequirements = new Map<string, {
    authoredFile: string;
    endLine: number;
    label: string;
  }>();
  for (const [index, entity] of entities.entries()) {
    const label = `sem entities[${index}]`;
    const validated = existingRepositoryFile(repositoryRoot, entity.file, `${label}.file`);
    if (!pathInside(projectRoot, validated.canonical)) {
      throw new InputContractError(
        `${label}.file is outside analysis project ${project.id}: ${entity.file}`,
      );
    }
    if (
      project.fileExtensions !== undefined
      && !project.fileExtensions.some((extension) =>
        validated.file.toLowerCase().endsWith(extension))
    ) {
      throw new InputContractError(
        `${label}.file does not match analysis project ${project.id} fileExtensions: ${entity.file}`,
      );
    }
    const existingRequirement = sourceLineRequirements.get(validated.canonical);
    if (!existingRequirement || entity.endLine > existingRequirement.endLine) {
      sourceLineRequirements.set(validated.canonical, {
        authoredFile: entity.file,
        endLine: entity.endLine,
        label,
      });
    }
    const idFile = repositoryFile(
      repositoryRoot,
      entityIdFile(entity.id, `${label}.id`),
      `${label}.id file`,
    );
    if (idFile.file !== validated.file) {
      throw new InputContractError(
        `${label}.id file ${idFile.file} does not match file ${validated.file}`,
      );
    }
    if (entity.parentId !== undefined) {
      const parentFile = repositoryFile(
        repositoryRoot,
        entityIdFile(entity.parentId, `${label}.parentId`),
        `${label}.parentId file`,
      );
      if (parentFile.file !== validated.file) {
        throw new InputContractError(
          `${label}.parentId file ${parentFile.file} does not match file ${validated.file}`,
        );
      }
    } else {
      const expectedId = `${validated.file}::${entity.kind}::${entity.name}`;
      if (entity.id !== expectedId) {
        throw new InputContractError(
          `${label}.id is ${entity.id}, expected canonical top-level ID ${expectedId}`,
        );
      }
      if (topLevelIds.has(entity.id)) {
        throw new InputContractError(`sem entities contains duplicate top-level ID: ${entity.id}`);
      }
      topLevelIds.add(entity.id);
    }
  }
  const sourceLineBuffer = Buffer.allocUnsafe(SOURCE_LINE_SCAN_BUFFER_BYTES);
  for (const [canonicalFile, requirement] of sourceLineRequirements) {
    const sourceLineCount = sourceLineCountUpTo(
      canonicalFile,
      requirement.endLine,
      sourceLineBuffer,
      requirement.label,
      requirement.authoredFile,
    );
    if (requirement.endLine > sourceLineCount) {
      throw new InputContractError(
        `${requirement.label}.endLine ${requirement.endLine} exceeds source file line count ${sourceLineCount}: ${requirement.authoredFile}`,
      );
    }
  }
}

function validateImpactResponse(
  repositoryRoot: string,
  target: SemEntity,
  impact: SemImpact,
): void {
  validateEntityFileIdentity(repositoryRoot, impact.entity, 'sem impact entity');
  if (
    impact.entity.entityId !== target.id
    || impact.entity.file !== target.file
    || impact.entity.name !== target.name
    || impact.entity.kind !== target.kind
  ) {
    throw new InputContractError(
      `sem impact response entity does not match requested target: ${target.id}`,
    );
  }
  for (const [field, entities] of [
    ['dependencies', impact.dependencies],
    ['dependents', impact.dependents],
    ['tests', impact.tests],
  ] as const) {
    const entityIds = new Set<string>();
    for (const [index, entity] of entities.entries()) {
      if (entityIds.has(entity.entityId)) {
        throw new InputContractError(
          `sem impact ${field} contains duplicate entity ID: ${entity.entityId}`,
        );
      }
      entityIds.add(entity.entityId);
      validateEntityFileIdentity(
        repositoryRoot,
        entity,
        `sem impact ${field}[${index}]`,
      );
    }
  }
}

function validateSemEntityModel(value: unknown, label: string): void {
  const entity = record(value, label);
  exactModelKeys(
    entity,
    ['id', 'file', 'name', 'kind', 'startLine', 'endLine', 'parentId'],
    label,
  );
  text(entity.id, `${label}.id`);
  text(entity.file, `${label}.file`);
  text(entity.name, `${label}.name`);
  text(entity.kind, `${label}.kind`);
  const startLine = sourceLine(entity.startLine, `${label}.startLine`);
  const endLine = sourceLine(entity.endLine, `${label}.endLine`);
  if (endLine < startLine) {
    throw new InputContractError(
      `${label}.endLine must be greater than or equal to startLine`,
    );
  }
  if (entity.parentId !== undefined) {
    text(entity.parentId, `${label}.parentId`);
  }
}

function validateRelatedEntityModel(value: unknown, label: string): void {
  const entity = record(value, label);
  exactModelKeys(entity, ['entityId', 'file', 'name', 'kind'], label);
  text(entity.entityId, `${label}.entityId`);
  text(entity.file, `${label}.file`);
  text(entity.name, `${label}.name`);
  text(entity.kind, `${label}.kind`);
}

function validateRelatedEntityModelArray(value: unknown, label: string): void {
  if (!Array.isArray(value)) {
    throw new InputContractError(`${label} must be an array`);
  }
  for (const [index, entity] of value.entries()) {
    validateRelatedEntityModel(entity, `${label}[${index}]`);
  }
}

function consumeSemEvidenceItems(
  current: number,
  additional: number,
  label: string,
): number {
  if (additional > MAX_SEM_EVIDENCE_ITEMS_PER_PROJECT - current) {
    throw new InputContractError(
      `${label} exceeds ${MAX_SEM_EVIDENCE_ITEMS_PER_PROJECT} aggregate evidence item limit`,
    );
  }
  return current + additional;
}

function semImpactEvidenceItems(value: unknown): number {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return 1;
  }
  const impact = value as Record<string, unknown>;
  let relatedEntities = 0;
  for (const entries of [
    impact.dependencies,
    impact.dependents,
    impact.tests,
  ]) {
    if (Array.isArray(entries)) relatedEntities += entries.length;
  }
  return 1 + relatedEntities;
}

export function semAnalysisCollectionEvidenceItems(value: unknown): number {
  if (!Array.isArray(value)) {
    throw new InputContractError('sem analyses must be an array');
  }
  let evidenceItems = 0;
  const consume = (additional: number): void => {
    if (additional > MAX_SEM_EVIDENCE_ITEMS_TOTAL - evidenceItems) {
      throw new InputContractError(
        `sem analyses exceed ${MAX_SEM_EVIDENCE_ITEMS_TOTAL} global evidence item limit`,
      );
    }
    evidenceItems += additional;
  };
  for (const analysisValue of value) {
    if (
      analysisValue === null
      || typeof analysisValue !== 'object'
      || Array.isArray(analysisValue)
    ) {
      continue;
    }
    const analysis = analysisValue as Record<string, unknown>;
    if (Array.isArray(analysis.entities)) consume(analysis.entities.length);
    if (!Array.isArray(analysis.impacts)) continue;
    consume(analysis.impacts.length);
    for (const impact of analysis.impacts) {
      consume(semImpactEvidenceItems(impact) - 1);
    }
  }
  return evidenceItems;
}

export function semAnalysisCollectionEvidenceTextCharacters(
  value: unknown,
): number {
  if (!Array.isArray(value)) {
    throw new InputContractError('sem analyses must be an array');
  }
  semAnalysisCollectionEvidenceItems(value);
  const budget: SemEvidenceTextBudget = {
    characters: 0,
    label: 'sem analyses',
  };
  for (const [index, analysis] of value.entries()) {
    consumeSemAnalysisText(analysis, `sem analyses[${index}]`, budget);
  }
  return budget.characters;
}

function assertSemEvidenceItemLimit(
  entities: unknown[],
  impacts: unknown[],
  label: string,
): number {
  let evidenceItems = consumeSemEvidenceItems(
    0,
    entities.length,
    label,
  );
  evidenceItems = consumeSemEvidenceItems(
    evidenceItems,
    impacts.length,
    label,
  );
  for (const impact of impacts) {
    evidenceItems = consumeSemEvidenceItems(
      evidenceItems,
      semImpactEvidenceItems(impact) - 1,
      label,
    );
  }
  return evidenceItems;
}

export function semProjectAnalysisEvidenceItems(value: unknown): number {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return 0;
  }
  const analysis = value as Record<string, unknown>;
  if (!Array.isArray(analysis.entities) || !Array.isArray(analysis.impacts)) {
    return 0;
  }
  return assertSemEvidenceItemLimit(
    analysis.entities,
    analysis.impacts,
    'sem project analysis',
  );
}

function validateSemImpactModel(value: unknown, label: string): void {
  const impact = record(value, label);
  exactModelKeys(
    impact,
    ['entity', 'dependencies', 'dependents', 'tests'],
    label,
  );
  validateRelatedEntityModel(impact.entity, `${label}.entity`);
  validateRelatedEntityModelArray(impact.dependencies, `${label}.dependencies`);
  validateRelatedEntityModelArray(impact.dependents, `${label}.dependents`);
  validateRelatedEntityModelArray(impact.tests, `${label}.tests`);
}

function architectureProject(value: unknown, label: string): ArchitectureProject {
  const project = record(value, label);
  exactModelKeys(project, ['id', 'root', 'fileExtensions'], label);
  const fileExtensions = normalizeArchitectureFileExtensions(
    project.fileExtensions,
    `${label}.fileExtensions`,
  );
  return {
    id: visibleText(project.id, `${label}.id`),
    root: text(project.root, `${label}.root`),
    ...(fileExtensions === undefined ? {} : { fileExtensions }),
  };
}

export function assertSemProjectAnalysisIntegrity(options: {
  repositoryRoot: string;
  project: ArchitectureProject;
  analysis: SemProjectAnalysis;
}): void {
  const input = record(options as unknown, 'sem project analysis integrity options');
  exactModelKeys(
    input,
    ['repositoryRoot', 'project', 'analysis'],
    'sem project analysis integrity options',
  );
  const repositoryRoot = canonicalRepositoryRoot(text(
    input.repositoryRoot,
    'sem project analysis integrity options.repositoryRoot',
  ));
  const project = architectureProject(
    input.project,
    'sem project analysis integrity options.project',
  );
  const projectRoot = canonicalProjectRoot(repositoryRoot, project);
  const analysis = record(input.analysis, 'sem project analysis');
  exactModelKeys(
    analysis,
    ['projectId', 'root', 'entities', 'impacts', 'durationMs'],
    'sem project analysis',
  );
  const projectId = visibleText(
    analysis.projectId,
    'sem project analysis.projectId',
  );
  if (projectId !== project.id) {
    throw new InputContractError(
      `sem project analysis projectId is ${projectId}, expected ${project.id}`,
    );
  }
  const analysisRoot = canonicalDirectory(
    text(analysis.root, 'sem project analysis.root'),
    'Sem project analysis root',
  );
  if (analysisRoot !== projectRoot) {
    throw new InputContractError(
      `sem project analysis root is ${analysisRoot}, expected ${projectRoot}`,
    );
  }
  if (!Array.isArray(analysis.entities)) {
    throw new InputContractError('sem project analysis.entities must be an array');
  }
  if (!Array.isArray(analysis.impacts)) {
    throw new InputContractError('sem project analysis.impacts must be an array');
  }
  if (analysis.impacts.length > MAX_SEM_IMPACT_QUERIES_PER_PROJECT) {
    throw new InputContractError(
      `sem project analysis.impacts exceeds ${MAX_SEM_IMPACT_QUERIES_PER_PROJECT} item limit`,
    );
  }
  assertSemEvidenceItemLimit(
    analysis.entities,
    analysis.impacts,
    'sem project analysis',
  );
  semAnalysisCollectionEvidenceTextCharacters([analysis]);
  if (
    analysis.durationMs !== undefined
    && (!Number.isSafeInteger(analysis.durationMs) || (analysis.durationMs as number) < 0)
  ) {
    throw new InputContractError(
      'sem project analysis.durationMs must be a non-negative safe integer when provided',
    );
  }
  for (const [index, entity] of analysis.entities.entries()) {
    validateSemEntityModel(entity, `sem project analysis.entities[${index}]`);
  }
  const entities = analysis.entities as SemEntity[];
  validateProjectEntities(repositoryRoot, projectRoot, project, entities);

  const topLevelEntities = new Map(
    entities
      .filter((entity) => entity.parentId === undefined)
      .map((entity) => [entity.id, entity]),
  );
  const impactTargets = new Set<string>();
  for (const [index, value] of analysis.impacts.entries()) {
    const label = `sem project analysis.impacts[${index}]`;
    validateSemImpactModel(value, label);
    const impact = value as SemImpact;
    const target = topLevelEntities.get(impact.entity.entityId);
    if (!target) {
      throw new InputContractError(
        `${label}.entity does not reference a top-level analysis entity: ${impact.entity.entityId}`,
      );
    }
    if (impactTargets.has(target.id)) {
      throw new InputContractError(
        `sem project analysis contains duplicate impact target: ${target.id}`,
      );
    }
    impactTargets.add(target.id);
    validateImpactResponse(repositoryRoot, target, impact);
  }
}

function validateChangePaths(
  repositoryRoot: string,
  changes: SemChangeSet,
): void {
  for (const [index, change] of changes.changes.entries()) {
    const file = repositoryFile(
      repositoryRoot,
      change.filePath,
      `sem diff changes[${index}].filePath`,
    );
    const idFile = repositoryFile(
      repositoryRoot,
      entityIdFile(change.entityId, `sem diff changes[${index}].entityId`),
      `sem diff changes[${index}].entityId file`,
    );
    let oldFile: string | undefined;
    if (change.oldFilePath !== undefined) {
      oldFile = repositoryFile(
        repositoryRoot,
        change.oldFilePath,
        `sem diff changes[${index}].oldFilePath`,
      ).file;
    }
    if (idFile.file !== file.file && idFile.file !== oldFile) {
      throw new InputContractError(
        `sem diff changes[${index}].entityId file ${idFile.file} does not match filePath ${file.file}`,
      );
    }
  }
  for (const [index, change] of (changes.binaryChanges ?? []).entries()) {
    repositoryFile(
      repositoryRoot,
      change.filePath,
      `sem diff binaryChanges[${index}].filePath`,
    );
    if (change.oldFilePath !== undefined) {
      repositoryFile(
        repositoryRoot,
        change.oldFilePath,
        `sem diff binaryChanges[${index}].oldFilePath`,
      );
    }
  }
}

function exactModelKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
): void {
  assertKnownFields(value, allowed, label);
}

function semChangeSource(
  value: unknown,
  label: string,
): SemChangeSet['source'] {
  const source = record(value, label);
  const mode = text(source.mode, `${label}.mode`);
  if (mode === 'range') {
    exactModelKeys(source, ['mode', 'from', 'to'], label);
    return {
      mode,
      from: visibleText(source.from, `${label}.from`),
      to: visibleText(source.to, `${label}.to`),
    };
  }
  if (mode === 'working' || mode === 'staged') {
    exactModelKeys(source, ['mode'], label);
    return { mode };
  }
  throw new InputContractError(`${label}.mode is unsupported: ${mode}`);
}

function assertSemChangeEvidenceItemLimit(
  changes: readonly unknown[],
  binaryChanges: readonly unknown[],
  untrackedFiles: readonly unknown[],
  label: string,
): void {
  let observed = 0;
  for (const [kind, items] of [
    ['semantic changes', changes],
    ['binary changes', binaryChanges],
    ['untracked files', untrackedFiles],
  ] as const) {
    if (items.length > MAX_SEM_CHANGE_EVIDENCE_ITEMS - observed) {
      throw new InputContractError(
        `${label} exceeds ${MAX_SEM_CHANGE_EVIDENCE_ITEMS} aggregate change evidence item limit at ${kind}`,
      );
    }
    observed += items.length;
  }
}

function semChangeSetEvidenceTextCharacters(value: unknown): number {
  const changeSet = runtimeEvidenceRecord(value);
  if (!changeSet) return 0;
  assertSemChangeEvidenceItemLimit(
    Array.isArray(changeSet.changes) ? changeSet.changes : [],
    Array.isArray(changeSet.binaryChanges) ? changeSet.binaryChanges : [],
    Array.isArray(changeSet.untrackedFiles) ? changeSet.untrackedFiles : [],
    'sem change set',
  );
  const budget: SemEvidenceTextBudget = {
    characters: 0,
    label: 'sem change set',
  };
  consumeSemChangeSetText(changeSet, 'sem change set', budget);
  return budget.characters;
}

export function assertSemChangeSetIntegrity(options: {
  repositoryRoot: string;
  changeSet: SemChangeSet;
}): void {
  const input = record(options as unknown, 'sem change set integrity options');
  exactModelKeys(
    input,
    ['repositoryRoot', 'changeSet'],
    'sem change set integrity options',
  );
  const repositoryRoot = canonicalRepositoryRoot(text(
    input.repositoryRoot,
    'sem change set integrity options.repositoryRoot',
  ));
  const changeSet = record(input.changeSet, 'sem change set');
  exactModelKeys(
    changeSet,
    ['source', 'changes', 'binaryChanges', 'untrackedFiles'],
    'sem change set',
  );
  semChangeSource(changeSet.source, 'sem change set.source');
  if (!Array.isArray(changeSet.changes)) {
    throw new InputContractError('sem change set.changes must be an array');
  }
  if (
    changeSet.binaryChanges !== undefined
    && !Array.isArray(changeSet.binaryChanges)
  ) {
    throw new InputContractError('sem change set.binaryChanges must be an array');
  }
  if (
    changeSet.untrackedFiles !== undefined
    && !Array.isArray(changeSet.untrackedFiles)
  ) {
    throw new InputContractError('sem change set.untrackedFiles must be an array');
  }
  assertSemChangeEvidenceItemLimit(
    changeSet.changes,
    changeSet.binaryChanges ?? [],
    changeSet.untrackedFiles ?? [],
    'sem change set',
  );
  semChangeSetEvidenceTextCharacters(changeSet);
  const entityIds = new Set<string>();
  for (const [index, value] of changeSet.changes.entries()) {
    const label = `sem change set.changes[${index}]`;
    const change = record(value, label);
    exactModelKeys(
      change,
      ['entityId', 'changeType', 'filePath', 'oldFilePath'],
      label,
    );
    const entityId = normalizedEntityId(text(change.entityId, `${label}.entityId`));
    if (entityIds.has(entityId)) {
      throw new InputContractError(`${label}.entityId is duplicated: ${entityId}`);
    }
    entityIds.add(entityId);
    const changeType = text(change.changeType, `${label}.changeType`) as SemChangeType;
    if (!semChangeTypes.has(changeType)) {
      throw new InputContractError(`${label}.changeType is unsupported: ${changeType}`);
    }
    text(change.filePath, `${label}.filePath`);
    if (change.oldFilePath !== undefined) {
      text(change.oldFilePath, `${label}.oldFilePath`);
    }
  }
  const binaryFiles = new Set<string>();
  if (changeSet.binaryChanges !== undefined) {
    for (const [index, value] of changeSet.binaryChanges.entries()) {
      const label = `sem change set.binaryChanges[${index}]`;
      const change = record(value, label);
      exactModelKeys(change, ['filePath', 'status', 'oldFilePath'], label);
      const file = repositoryFile(
        repositoryRoot,
        text(change.filePath, `${label}.filePath`),
        `${label}.filePath`,
      ).file;
      if (binaryFiles.has(file)) {
        throw new InputContractError(`${label}.filePath is duplicated: ${file}`);
      }
      binaryFiles.add(file);
      const status = text(
        change.status,
        `${label}.status`,
      ) as SemBinaryChangeStatus;
      if (!semBinaryChangeStatuses.has(status)) {
        throw new InputContractError(`${label}.status is unsupported: ${status}`);
      }
      if (change.oldFilePath !== undefined) {
        text(change.oldFilePath, `${label}.oldFilePath`);
      }
    }
  }
  const typedChangeSet = changeSet as unknown as SemChangeSet;
  validateChangePaths(repositoryRoot, typedChangeSet);
  const semanticFiles = new Set(typedChangeSet.changes.map((change, index) =>
    repositoryFile(
      repositoryRoot,
      change.filePath,
      `sem change set.changes[${index}].filePath`,
    ).file));
  const conflictingBinaryFile = [...binaryFiles].find((file) => semanticFiles.has(file));
  if (conflictingBinaryFile !== undefined) {
    throw new InputContractError(
      `sem change set file cannot be both semantic and binary: ${conflictingBinaryFile}`,
    );
  }
  if (changeSet.untrackedFiles !== undefined) {
    const untrackedFiles = new Set<string>();
    for (const [index, value] of changeSet.untrackedFiles.entries()) {
      const file = repositoryFile(
        repositoryRoot,
        text(value, `sem change set.untrackedFiles[${index}]`),
        `sem change set.untrackedFiles[${index}]`,
      ).file;
      if (untrackedFiles.has(file)) {
        throw new InputContractError(
          `sem change set.untrackedFiles[${index}] is duplicated: ${file}`,
        );
      }
      if (semanticFiles.has(file) || binaryFiles.has(file)) {
        throw new InputContractError(
          `sem change set file cannot be both tracked and untracked: ${file}`,
        );
      }
      untrackedFiles.add(file);
    }
  }
}

function relatedEntity(value: unknown, label: string): SemRelatedEntity {
  const entity = record(value, label);
  return {
    entityId: normalizedEntityId(text(entity.entityId, `${label}.entityId`)),
    file: normalizedPath(text(entity.file, `${label}.file`)),
    name: text(entity.name, `${label}.name`),
    kind: text(entity.type, `${label}.type`),
  };
}

function relatedEntities(value: unknown, label: string): SemRelatedEntity[] {
  if (!Array.isArray(value)) {
    throw new InputContractError(`${label} must be an array`);
  }
  return value.map((entry, index) => relatedEntity(entry, `${label}[${index}]`));
}

export function parseSemEntities(value: unknown, fallbackFile?: string): SemEntity[] {
  if (!Array.isArray(value)) {
    throw new InputContractError('sem entities output must be an array');
  }
  assertSemEvidenceItemLimit(value, [], 'sem entities output');
  const parsed = value.map((entry, index) => {
    const entity = record(entry, `sem entities[${index}]`);
    const file = normalizedPath(entity.file === undefined
      ? text(fallbackFile, `sem entities[${index}].file`)
      : text(entity.file, `sem entities[${index}].file`));
    const name = text(entity.name, `sem entities[${index}].name`);
    const kind = text(entity.type, `sem entities[${index}].type`);
    const parentId = entity.parent_id === null || entity.parent_id === undefined
      ? undefined
      : normalizedEntityId(text(entity.parent_id, `sem entities[${index}].parent_id`));
    const startLine = sourceLine(entity.start_line, `sem entities[${index}].start_line`);
    const reportedEndLine = sourceLine(
      entity.end_line,
      `sem entities[${index}].end_line`,
    );
    // SEM represents one-line JSON-schema children (properties, arrays, and
    // objects) with an end line immediately before their start line. Treat
    // that provider boundary as the containing line for every nested kind;
    // rejecting it would make historical snapshots fail on valid schemas.
    const endLine = parentId !== undefined && reportedEndLine === startLine - 1
      ? startLine
      : reportedEndLine;
    if (endLine < startLine) {
      throw new InputContractError(
        `sem entities[${index}].end_line must be greater than or equal to start_line`,
      );
    }
    const id = parentId ? `${parentId}::${name}` : `${file}::${kind}::${name}`;
    text(id, `sem entities[${index}].id`);
    return {
      id,
      file,
      name,
      kind,
      startLine,
      endLine,
      ...(parentId ? { parentId } : {}),
    };
  });
  const disambiguated = disambiguateNestedEntityIds(parsed);
  semEntityEvidenceTextCharacters(disambiguated, 'normalized sem entities');
  return disambiguated;
}

/**
 * Preserve both members when a provider gives same-name nested entities the
 * same parent-scoped ID but different kinds (for example a TypeScript type
 * and value declaration in a .d.ts namespace).
 */
function disambiguateNestedEntityIds(entities: SemEntity[]): SemEntity[] {
  const groups = new Map<string, SemEntity[]>();
  for (const entity of entities) {
    const group = groups.get(entity.id);
    if (group === undefined) groups.set(entity.id, [entity]);
    else group.push(entity);
  }
  const ambiguousIds = new Set(
    [...groups.entries()]
      .filter(([, group]) => group.some((entry) => entry.parentId !== undefined)
        && new Set(group.map((entry) => entry.kind)).size > 1)
      .map(([id]) => id),
  );
  if (ambiguousIds.size === 0) return entities;

  const existingIds = new Set(entities.map((entity) => entity.id));
  const assignedIds = new Set<string>();
  return entities.map((entity) => {
    if (entity.parentId === undefined || !ambiguousIds.has(entity.id)) return entity;
    const id = `${entity.parentId}::${entity.kind}::${entity.name}`;
    if (existingIds.has(id) || assignedIds.has(id)) {
      throw new InputContractError(
        `sem entities cannot disambiguate nested identity ${entity.id} as ${id}`,
      );
    }
    assignedIds.add(id);
    return { ...entity, id };
  });
}

export function parseSemImpact(value: unknown): SemImpact {
  const impact = record(value, 'sem impact output');
  assertSemEvidenceItemLimit([], [impact], 'sem impact output');
  const parsed: SemImpact = {
    entity: relatedEntity(impact.entity, 'sem impact entity'),
    dependencies: relatedEntities(impact.dependencies, 'sem impact dependencies'),
    dependents: relatedEntities(impact.dependents, 'sem impact dependents'),
    tests: relatedEntities(impact.tests, 'sem impact tests'),
  };
  semImpactEvidenceTextCharacters(parsed, 'normalized sem impact');
  return parsed;
}

export function parseSemDiff(
  value: unknown,
  source: SemChangeSet['source'] = { mode: 'working' },
): SemChangeSet {
  const diff = record(value, 'sem diff output');
  const validatedSource = semChangeSource(source, 'sem diff source');
  if (!Array.isArray(diff.changes)) {
    throw new InputContractError('sem diff changes must be an array');
  }
  if (diff.binaryChanges !== undefined && !Array.isArray(diff.binaryChanges)) {
    throw new InputContractError('sem diff binaryChanges must be an array');
  }
  assertSemChangeEvidenceItemLimit(
    diff.changes,
    diff.binaryChanges ?? [],
    [],
    'sem diff output',
  );
  const parsed: SemChangeSet = {
    source: validatedSource,
    changes: diff.changes.map((entry, index) => {
      const change = record(entry, `sem diff changes[${index}]`);
      return {
        entityId: normalizedEntityId(text(change.entityId, `sem diff changes[${index}].entityId`)),
        changeType: (() => {
          const changeType = text(
            change.changeType,
            `sem diff changes[${index}].changeType`,
          ) as SemChangeType;
          if (!semChangeTypes.has(changeType)) {
            throw new InputContractError(
              `sem diff changes[${index}].changeType is unsupported: ${changeType}`,
            );
          }
          return changeType;
        })(),
        filePath: normalizedPath(text(change.filePath, `sem diff changes[${index}].filePath`)),
        ...(change.oldFilePath === null || change.oldFilePath === undefined
          ? {}
          : { oldFilePath: normalizedPath(text(
            change.oldFilePath,
            `sem diff changes[${index}].oldFilePath`,
          )) }),
      };
    }),
    ...(diff.binaryChanges === undefined
      ? {}
      : {
        binaryChanges: (() => {
          return diff.binaryChanges.map((entry, index) => {
            const label = `sem diff binaryChanges[${index}]`;
            const change = record(entry, label);
            const status = text(
              change.status,
              `${label}.status`,
            ) as SemBinaryChangeStatus;
            if (!semBinaryChangeStatuses.has(status)) {
              throw new InputContractError(`${label}.status is unsupported: ${status}`);
            }
            return {
              filePath: normalizedPath(text(change.filePath, `${label}.filePath`)),
              status,
              ...(change.oldFilePath === null || change.oldFilePath === undefined
                ? {}
                : {
                  oldFilePath: normalizedPath(text(
                    change.oldFilePath,
                    `${label}.oldFilePath`,
                  )),
                }),
            };
          });
        })(),
      }),
  };
  semChangeSetEvidenceTextCharacters(parsed);
  return parsed;
}

const semSummaryChangeTypes = [
  'added',
  'modified',
  'deleted',
  'moved',
  'renamed',
  'reordered',
] as const satisfies readonly SemChangeType[];

function nonNegativeSafeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new InputContractError(`${label} must be a non-negative safe integer`);
  }
  return value as number;
}

function validateSemDiffEnvelope(value: unknown, parsed: SemChangeSet): void {
  const diff = record(value, 'sem diff output');
  const summary = record(diff.summary, 'sem diff summary');
  const counts = Object.fromEntries([
    'fileCount',
    ...semSummaryChangeTypes,
    'binary',
    'orphan',
    'total',
  ].map((field) => [
    field,
    nonNegativeSafeInteger(summary[field], `sem diff summary.${field}`),
  ])) as Record<string, number>;
  if (parsed.changes.length !== counts.total) {
    throw new InputContractError(
      `sem diff changes length is ${parsed.changes.length}, expected summary.total ${counts.total}`,
    );
  }
  const observedCounts = Object.fromEntries(
    semSummaryChangeTypes.map((changeType) => [changeType, 0]),
  ) as Record<SemChangeType, number>;
  for (const change of parsed.changes) {
    observedCounts[change.changeType] += 1;
  }
  for (const changeType of semSummaryChangeTypes) {
    if (changeType === 'modified') continue;
    const observed = observedCounts[changeType];
    if (observed !== counts[changeType]) {
      throw new InputContractError(
        `sem diff ${changeType} changes count is ${observed}, expected summary.${changeType} ${counts[changeType]}`,
      );
    }
  }
  const exactModified = observedCounts.modified;
  const structuralOverlapModified = exactModified
    + observedCounts.moved
    + observedCounts.renamed
    + observedCounts.reordered;
  if (
    counts.modified !== exactModified
    && counts.modified !== structuralOverlapModified
  ) {
    throw new InputContractError(
      `sem diff summary.modified ${counts.modified} must equal exact modified count ${exactModified} or sem 0.21 structural-overlap count ${structuralOverlapModified}`,
    );
  }
  if (!Array.isArray(diff.binaryChanges)) {
    throw new InputContractError('sem diff binaryChanges must be an array');
  }
  if ((parsed.binaryChanges?.length ?? 0) !== counts.binary) {
    throw new InputContractError(
      `sem diff binaryChanges length is ${parsed.binaryChanges?.length ?? 0}, expected summary.binary ${counts.binary}`,
    );
  }
  const rawChanges = diff.changes as unknown[];
  const orphanCount = rawChanges.filter((entry, index) => {
    const change = record(entry, `sem diff changes[${index}]`);
    return text(
      change.entityType,
      `sem diff changes[${index}].entityType`,
    ) === 'orphan';
  }).length;
  if (orphanCount !== counts.orphan) {
    throw new InputContractError(
      `sem diff orphan changes count is ${orphanCount}, expected summary.orphan ${counts.orphan}`,
    );
  }
  const changedFiles = new Set([
    ...parsed.changes.map((change) => change.filePath),
    ...(parsed.binaryChanges ?? []).map((change) => change.filePath),
  ]);
  if (changedFiles.size !== counts.fileCount) {
    throw new InputContractError(
      `sem diff unique changed file count is ${changedFiles.size}, expected summary.fileCount ${counts.fileCount}`,
    );
  }
}

export function defaultSemCommand(): string {
  const extension = process.platform === 'win32' ? '.cmd' : '';
  const packageRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
  );
  const packageLocalCommand = path.join(
    packageRoot,
    'node_modules',
    '.bin',
    `sem${extension}`,
  );
  let current = packageRoot;
  for (let depth = 0; depth < 32; depth += 1) {
    const candidate = path.join(
      current,
      'node_modules',
      '.bin',
      `sem${extension}`,
    );
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return packageLocalCommand;
}

export function resolveSemCommand(override?: string): string {
  const environmentCommand = process.env.SEM_COMMAND;
  const command = override
    ?? (environmentCommand && environmentCommand.length > 0
      ? environmentCommand
      : defaultSemCommand());
  return visibleText(command, 'sem command');
}

interface SemCommandResult extends SemExecutionLimits {
  operation: SemOperation;
  command: string;
  args: string[];
  cwd: string;
  durationMs: number;
  stdout: string;
  outputBytes: number;
}

export interface SemAggregateOutputBudget {
  label: string;
  limitBytes: number;
  usedBytes: number;
}

function semAggregateOutputBudget(
  value: unknown,
  label: string,
): SemAggregateOutputBudget {
  const budget = record(value, label);
  exactModelKeys(budget, ['label', 'limitBytes', 'usedBytes'], label);
  visibleText(budget.label, `${label}.label`);
  if (!Number.isSafeInteger(budget.limitBytes) || (budget.limitBytes as number) <= 0) {
    throw new InputContractError(`${label}.limitBytes must be a positive safe integer`);
  }
  if (
    !Number.isSafeInteger(budget.usedBytes)
    || (budget.usedBytes as number) < 0
    || (budget.usedBytes as number) > (budget.limitBytes as number)
  ) {
    throw new InputContractError(
      `${label}.usedBytes must be a non-negative safe integer no greater than limitBytes`,
    );
  }
  return budget as unknown as SemAggregateOutputBudget;
}

function operationFor(args: string[]): SemOperation {
  return args[0] === '--version' ? 'version' : args[0] as SemOperation;
}

function limitedText(value: unknown): string | undefined {
  const normalized = typeof value === 'string'
    ? toWellFormedText(value.trim())
    : '';
  if (normalized.length === 0) return undefined;
  return truncateWellFormedText(normalized, MAX_SEM_FAILURE_TEXT_CHARS);
}

function decodeUtf8Strict(value: Uint8Array | null | undefined, label: string): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(value ?? new Uint8Array());
  } catch (error) {
    throw new InputContractError(
      `Invalid UTF-8 in ${label}: ${diagnosticErrorMessage(error)}`,
    );
  }
}

function decodeUtf8Lossy(value: Uint8Array | null | undefined): string {
  const bounded = value?.subarray(0, MAX_SEM_FAILURE_DECODE_BYTES)
    ?? new Uint8Array();
  return new TextDecoder('utf-8').decode(bounded);
}

function boundedText(value: string): string {
  return truncateWellFormedText(value, MAX_SEM_FAILURE_TEXT_CHARS);
}

interface SemFailureInputTextBudget {
  characters: number;
}

function consumeSemFailureInputText(
  value: string,
  label: string,
  budget: SemFailureInputTextBudget,
): void {
  if (value.length > MAX_SEM_FAILURE_INPUT_TEXT_CHARS) {
    throw new InputContractError(
      `${label} exceeds ${MAX_SEM_FAILURE_INPUT_TEXT_CHARS} input character limit`,
    );
  }
  if (
    value.length
    > MAX_SEM_FAILURE_INPUT_TEXT_CHARS_TOTAL - budget.characters
  ) {
    throw new InputContractError(
      `sem failure input exceeds ${MAX_SEM_FAILURE_INPUT_TEXT_CHARS_TOTAL} aggregate text character limit`,
    );
  }
  budget.characters += value.length;
}

function requiredFailureText(
  value: unknown,
  label: string,
  budget: SemFailureInputTextBudget,
): void {
  if (typeof value !== 'string') {
    throw new InputContractError(
      `${label} must be a non-empty string containing visible text`,
    );
  }
  consumeSemFailureInputText(value, label, budget);
  if (!isWellFormedText(value)) {
    throw new InputContractError(`${label} must contain well-formed Unicode`);
  }
  if (value.length === 0 || !hasVisibleText(value)) {
    throw new InputContractError(
      `${label} must be a non-empty string containing visible text`,
    );
  }
}

function optionalFailureText(
  value: unknown,
  label: string,
  budget: SemFailureInputTextBudget,
): void {
  if (value === undefined) return;
  if (typeof value !== 'string') {
    throw new InputContractError(`${label} must be a string when provided`);
  }
  consumeSemFailureInputText(value, label, budget);
  if (!isWellFormedText(value)) {
    throw new InputContractError(`${label} must contain well-formed Unicode`);
  }
}

function failureInteger(
  value: unknown,
  label: string,
  minimum: number,
): void {
  if (!Number.isSafeInteger(value) || (value as number) < minimum) {
    throw new InputContractError(
      `${label} must be a safe integer greater than or equal to ${minimum}`,
    );
  }
}

function failureStringArray(
  value: unknown,
  label: string,
  budget: SemFailureInputTextBudget,
  minimumItems = 0,
): void {
  if (!Array.isArray(value)) {
    throw new InputContractError(`${label} must be an array`);
  }
  if (value.length < minimumItems) {
    throw new InputContractError(
      `${label} must contain at least ${minimumItems} value${minimumItems === 1 ? '' : 's'}`,
    );
  }
  if (value.length > MAX_SEM_FAILURE_COLLECTION_ITEMS) {
    throw new InputContractError(
      `${label} exceeds ${MAX_SEM_FAILURE_COLLECTION_ITEMS} item limit`,
    );
  }
  for (const [index, entry] of value.entries()) {
    requiredFailureText(entry, `${label}[${index}]`, budget);
  }
}

function validateSemFailureProjectProgress(failure: SemExecutionFailure): void {
  const progress = [
    failure.requestedProjects,
    failure.completedProjects,
    failure.skippedProjects,
  ];
  const provided = progress.filter((value) => value !== undefined).length;
  if (provided !== 0 && provided !== progress.length) {
    throw new InputContractError(
      'sem failure project progress fields must be provided together',
    );
  }
  if (provided === 0) return;

  const requested = new Set(failure.requestedProjects ?? []);
  const completed = new Set(failure.completedProjects ?? []);
  const skipped = new Set(failure.skippedProjects ?? []);
  for (const projectId of completed) {
    if (!requested.has(projectId)) {
      throw new InputContractError(
        `sem failure completedProjects must be a subset of requestedProjects: ${projectId}`,
      );
    }
    if (skipped.has(projectId)) {
      throw new InputContractError(
        `sem failure project cannot be both completed and skipped: ${projectId}`,
      );
    }
  }
  for (const projectId of skipped) {
    if (!requested.has(projectId)) {
      throw new InputContractError(
        `sem failure skippedProjects must be a subset of requestedProjects: ${projectId}`,
      );
    }
  }
  const unresolved = [...requested].filter((projectId) =>
    !completed.has(projectId) && !skipped.has(projectId));
  if (failure.projectId) {
    if (unresolved.length !== 1 || unresolved[0] !== failure.projectId) {
      throw new InputContractError(
        'sem failure unresolved project must equal projectId',
      );
    }
  } else if (unresolved.length > 0) {
    throw new InputContractError(
      `sem failure project progress is incomplete: ${boundedDiagnosticList(unresolved)}`,
    );
  }
}

function validateSemExecutionFailure(failure: SemExecutionFailure): void {
  if (!failure || typeof failure !== 'object') {
    throw new InputContractError('sem failure must be an object');
  }
  exactModelKeys(failure as unknown as Record<string, unknown>, [
    'operation',
    'reason',
    'command',
    'args',
    'cwd',
    'durationMs',
    'timeoutMs',
    'maxOutputBytes',
    'impactTargets',
    'maxImpactQueries',
    'projectId',
    'requestedProjects',
    'completedProjects',
    'skippedProjects',
    'expectedVersion',
    'observedVersion',
    'exitCode',
    'signal',
    'stderr',
    'detail',
  ], 'sem failure');
  const inputTextBudget: SemFailureInputTextBudget = { characters: 0 };
  if (!semOperations.has(failure.operation)) {
    throw new InputContractError('sem failure operation is unsupported');
  }
  if (!semFailureReasons.has(failure.reason)) {
    throw new InputContractError('sem failure reason is unsupported');
  }
  requiredFailureText(failure.command, 'sem failure command', inputTextBudget);
  failureStringArray(failure.args, 'sem failure args', inputTextBudget, 1);
  requiredFailureText(failure.cwd, 'sem failure cwd', inputTextBudget);
  failureInteger(failure.durationMs, 'sem failure durationMs', 0);
  failureInteger(failure.timeoutMs, 'sem failure timeoutMs', 1);
  failureInteger(failure.maxOutputBytes, 'sem failure maxOutputBytes', 1);
  const hasQueryLimitFields = failure.impactTargets !== undefined
    || failure.maxImpactQueries !== undefined;
  if (failure.reason === 'query-limit') {
    if (failure.operation !== 'impact') {
      throw new InputContractError(
        'sem query-limit failure operation must be impact',
      );
    }
    failureInteger(failure.impactTargets, 'sem failure impactTargets', 1);
    failureInteger(failure.maxImpactQueries, 'sem failure maxImpactQueries', 1);
    if ((failure.impactTargets as number) <= (failure.maxImpactQueries as number)) {
      throw new InputContractError(
        'sem query-limit failure impactTargets must exceed maxImpactQueries',
      );
    }
  } else if (hasQueryLimitFields) {
    throw new InputContractError(
      'sem failure impactTargets and maxImpactQueries require reason query-limit',
    );
  }
  if (failure.exitCode !== undefined) {
    failureInteger(failure.exitCode, 'sem failure exitCode', Number.MIN_SAFE_INTEGER);
  }
  for (const [label, value] of [
    ['projectId', failure.projectId],
    ['expectedVersion', failure.expectedVersion],
    ['observedVersion', failure.observedVersion],
    ['signal', failure.signal],
    ['stderr', failure.stderr],
    ['detail', failure.detail],
  ] as const) {
    optionalFailureText(value, `sem failure ${label}`, inputTextBudget);
  }
  for (const [label, value] of [
    ['requestedProjects', failure.requestedProjects],
    ['completedProjects', failure.completedProjects],
    ['skippedProjects', failure.skippedProjects],
  ] as const) {
    if (value !== undefined) {
      failureStringArray(
        value,
        `sem failure ${label}`,
        inputTextBudget,
      );
    }
  }
  validateSemFailureProjectProgress(failure);
}

function assertSemFailureTextBudget(failure: SemExecutionFailure): void {
  let characters = 0;
  const consume = (value: string | undefined): void => {
    if (value === undefined) return;
    const boundedCharacters = value.length > MAX_SEM_FAILURE_TEXT_CHARS
      ? MAX_SEM_FAILURE_TEXT_CHARS + 1
      : value.length;
    if (
      boundedCharacters
      > MAX_SEM_FAILURE_TEXT_CHARS_TOTAL - characters
    ) {
      throw new InputContractError(
        `sem failure exceeds ${MAX_SEM_FAILURE_TEXT_CHARS_TOTAL} aggregate text character limit`,
      );
    }
    characters += boundedCharacters;
  };
  consume(failure.command);
  for (const value of failure.args) consume(value);
  consume(failure.cwd);
  consume(failure.projectId);
  for (const value of failure.requestedProjects ?? []) consume(value);
  for (const value of failure.completedProjects ?? []) consume(value);
  for (const value of failure.skippedProjects ?? []) consume(value);
  consume(failure.expectedVersion);
  consume(failure.observedVersion);
  consume(failure.signal);
  consume(failure.stderr);
  consume(failure.detail);
}

export function boundSemExecutionFailure(
  failure: SemExecutionFailure,
): SemExecutionFailure {
  validateSemExecutionFailure(failure);
  assertSemFailureTextBudget(failure);
  const {
    command,
    args,
    cwd,
    projectId: rawProjectId,
    requestedProjects,
    completedProjects,
    skippedProjects,
    expectedVersion: rawExpectedVersion,
    observedVersion: rawObservedVersion,
    signal: rawSignal,
    stderr: rawStderr,
    detail: rawDetail,
    ...base
  } = failure;
  const optionalText = (value: string | undefined): string | undefined =>
    value === undefined ? undefined : limitedText(value);
  const boundedSet = (value: string[]): string[] =>
    [...new Set(value.map(boundedText))];
  const projectId = optionalText(rawProjectId);
  const expectedVersion = optionalText(rawExpectedVersion);
  const observedVersion = optionalText(rawObservedVersion);
  const signal = optionalText(rawSignal);
  const stderr = optionalText(rawStderr);
  const detail = optionalText(rawDetail);
  const bounded: SemExecutionFailure = {
    ...base,
    command: boundedText(command),
    args: args.map(boundedText),
    cwd: boundedText(cwd),
    ...(projectId ? { projectId } : {}),
    ...(requestedProjects
      ? { requestedProjects: boundedSet(requestedProjects) }
      : {}),
    ...(completedProjects
      ? { completedProjects: boundedSet(completedProjects) }
      : {}),
    ...(skippedProjects
      ? { skippedProjects: boundedSet(skippedProjects) }
      : {}),
    ...(expectedVersion ? { expectedVersion } : {}),
    ...(observedVersion ? { observedVersion } : {}),
    ...(signal ? { signal } : {}),
    ...(stderr ? { stderr } : {}),
    ...(detail ? { detail } : {}),
  };
  validateSemExecutionFailure(bounded);
  return bounded;
}

function failureReasonForSystemError(
  error: unknown,
): Extract<SemExecutionFailure['reason'], 'spawn' | 'timeout' | 'output-limit'> {
  const code = diagnosticSystemErrorCode(error);
  return code === 'ETIMEDOUT'
    ? 'timeout'
    : code === 'ENOBUFS'
      ? 'output-limit'
      : 'spawn';
}

function executionError(
  result: Omit<SemCommandResult, 'stdout' | 'outputBytes'>,
  reason: SemExecutionFailure['reason'],
  details: {
    exitCode?: number;
    signal?: string;
    stderr?: unknown;
    detail?: string;
    expectedVersion?: string;
    observedVersion?: string;
  } = {},
): SemExecutionError {
  const stderr = limitedText(details.stderr);
  return new SemExecutionError({
    operation: result.operation,
    reason,
    command: result.command,
    args: [...result.args],
    cwd: result.cwd,
    durationMs: result.durationMs,
    timeoutMs: result.timeoutMs,
    maxOutputBytes: result.maxOutputBytes,
    ...(details.exitCode === undefined ? {} : { exitCode: details.exitCode }),
    ...(details.signal ? { signal: details.signal } : {}),
    ...(stderr ? { stderr } : {}),
    ...(details.detail ? { detail: details.detail } : {}),
    ...(details.expectedVersion ? { expectedVersion: details.expectedVersion } : {}),
    ...(details.observedVersion ? { observedVersion: details.observedVersion } : {}),
  });
}

function runSem(
  command: string,
  args: string[],
  root: string,
  limits: SemExecutionLimits,
): SemCommandResult {
  const startedAt = performance.now();
  const context = (): Omit<SemCommandResult, 'stdout' | 'outputBytes'> => ({
    operation: operationFor(args),
    command,
    args,
    cwd: root,
    durationMs: Math.round(performance.now() - startedAt),
    ...limits,
  });
  const isPathCommand = path.isAbsolute(command) || command.includes('/') || command.includes('\\');
  if (isPathCommand && !existsSync(command)) {
    throw executionError(context(), 'spawn', { detail: `Cannot find sem command: ${command}` });
  }
  let result: SpawnSyncReturns<Buffer>;
  try {
    result = spawnSync(command, args, {
      cwd: root,
      env: { ...process.env, SEM_NO_TELEMETRY: '1' },
      maxBuffer: limits.maxOutputBytes,
      timeout: limits.timeoutMs,
      killSignal: 'SIGKILL',
      windowsHide: true,
    });
  } catch (error) {
    throw executionError(context(), 'spawn', {
      detail: diagnosticErrorMessage(error),
    });
  }
  if (result.error) {
    throw executionError(context(), failureReasonForSystemError(result.error), {
      ...(result.signal ? { signal: result.signal } : {}),
      stderr: decodeUtf8Lossy(result.stderr),
      detail: result.error.message,
    });
  }
  const outputBytes = result.stdout.length + result.stderr.length;
  if (outputBytes > limits.maxOutputBytes) {
    throw executionError(context(), 'output-limit', {
      stderr: decodeUtf8Lossy(result.stderr),
      detail: `sem command combined output exceeds ${limits.maxOutputBytes} byte limit after ${outputBytes} bytes`,
    });
  }
  if (result.status !== 0) {
    throw executionError(context(), 'exit', {
      ...(result.status === null ? {} : { exitCode: result.status }),
      ...(result.signal ? { signal: result.signal } : {}),
      stderr: decodeUtf8Lossy(result.stderr),
    });
  }
  const commandResult = context();
  let stdout: string;
  try {
    stdout = decodeUtf8Strict(result.stdout, 'sem stdout');
  } catch (error) {
    throw executionError(commandResult, 'invalid-output', {
      detail: diagnosticErrorMessage(error),
    });
  }
  return {
    ...commandResult,
    stdout,
    outputBytes,
  };
}

function runSemJson<T>(
  command: string,
  args: string[],
  root: string,
  limits: SemExecutionLimits,
  parser: (value: unknown) => T,
  aggregateOutputBudgets: readonly SemAggregateOutputBudget[] = [],
): T {
  const startedAt = performance.now();
  const result = runSem(command, args, root, limits);
  consumeSemOutputBudgets(result, result.outputBytes, aggregateOutputBudgets);
  let value: unknown;
  try {
    value = JSON.parse(result.stdout) as unknown;
  } catch (error) {
    throw executionError(result, 'invalid-json', {
      detail: diagnosticErrorMessage(error),
    });
  }
  let parsed: T;
  try {
    parsed = parser(value);
  } catch (error) {
    if (error instanceof SemExecutionError) throw error;
    throw executionError(result, 'invalid-output', {
      detail: diagnosticErrorMessage(error),
    });
  }
  assertSemCommandDeadline(
    result,
    startedAt,
    `sem ${result.operation} command exceeded ${limits.timeoutMs}ms budget after JSON response post-processing`,
  );
  return parsed;
}

function assertSemCommandDeadline(
  result: SemCommandResult,
  startedAt: number,
  detail: string,
): void {
  const durationMs = Math.ceil(performance.now() - startedAt);
  if (durationMs > result.timeoutMs) {
    throw executionError({ ...result, durationMs }, 'timeout', { detail });
  }
}

function consumeSemOutputBudgets(
  result: Omit<SemCommandResult, 'stdout' | 'outputBytes'>,
  outputBytes: number,
  aggregateOutputBudgets: readonly SemAggregateOutputBudget[],
): void {
  for (const aggregateOutputBudget of aggregateOutputBudgets) {
    const nextUsedBytes = aggregateOutputBudget.usedBytes + outputBytes;
    if (nextUsedBytes > aggregateOutputBudget.limitBytes) {
      throw executionError(result, 'output-limit', {
        detail: `${aggregateOutputBudget.label} exceeds ${aggregateOutputBudget.limitBytes} byte limit after ${nextUsedBytes} bytes`,
      });
    }
  }
  for (const aggregateOutputBudget of aggregateOutputBudgets) {
    const nextUsedBytes = aggregateOutputBudget.usedBytes + outputBytes;
    aggregateOutputBudget.usedBytes = nextUsedBytes;
  }
}

export function runSemVersion(options: {
  repositoryRoot: string;
  command?: string;
  limits?: Partial<SemExecutionLimits>;
  aggregateOutputBudget?: SemAggregateOutputBudget;
}): string {
  const input = record(options as unknown, 'sem version options');
  exactModelKeys(
    input,
    ['repositoryRoot', 'command', 'limits', 'aggregateOutputBudget'],
    'sem version options',
  );
  const repositoryRoot = canonicalRepositoryRoot(text(
    input.repositoryRoot,
    'sem version options.repositoryRoot',
  ));
  const command = resolveSemCommand(
    input.command === undefined ? undefined : text(input.command, 'sem version options.command'),
  );
  const limits = resolveSemExecutionLimits(
    input.limits as Partial<SemExecutionLimits> | undefined,
  );
  const aggregateOutputBudget = input.aggregateOutputBudget === undefined
    ? undefined
    : semAggregateOutputBudget(
      input.aggregateOutputBudget,
      'sem version options.aggregateOutputBudget',
    );
  const startedAt = performance.now();
  const result = runSem(command, ['--version'], repositoryRoot, limits);
  consumeSemOutputBudgets(
    result,
    result.outputBytes,
    aggregateOutputBudget ? [aggregateOutputBudget] : [],
  );
  if (result.stdout.length > MAX_SEM_VERSION_OUTPUT_CHARS) {
    throw executionError(result, 'invalid-output', {
      detail: `sem --version output exceeds ${MAX_SEM_VERSION_OUTPUT_CHARS} character limit`,
    });
  }
  const version = result.stdout.trim();
  if (!/^sem\s+\S+$/.test(version)) {
    throw executionError(result, 'invalid-output', {
      detail: `sem --version returned an unsupported value: ${version || '(empty)'}`,
    });
  }
  if (version !== `sem ${SUPPORTED_SEM_VERSION}`) {
    throw executionError(result, 'invalid-output', {
      detail: `Unsupported sem version: ${version}; expected sem ${SUPPORTED_SEM_VERSION}`,
      expectedVersion: SUPPORTED_SEM_VERSION,
      observedVersion: version.slice('sem '.length),
    });
  }
  assertSemCommandDeadline(
    result,
    startedAt,
    `sem version command exceeded ${limits.timeoutMs}ms budget after response post-processing`,
  );
  return version;
}

function semDiffSource(options: {
  staged?: boolean;
  from?: string;
  to?: string;
}): SemChangeSet['source'] {
  if (options.staged !== undefined && typeof options.staged !== 'boolean') {
    throw new InputContractError('sem diff staged must be a boolean when provided');
  }
  const hasFrom = options.from !== undefined;
  const hasTo = options.to !== undefined;
  const from = hasFrom ? visibleText(options.from, 'sem diff from') : undefined;
  const to = hasTo ? visibleText(options.to, 'sem diff to') : undefined;
  if (options.staged && (hasFrom || hasTo)) {
    throw new InputContractError('sem diff staged cannot be combined with from or to');
  }
  if (hasFrom !== hasTo) {
    throw new InputContractError('sem diff from and to must be provided together');
  }
  return options.staged
    ? { mode: 'staged' }
    : hasFrom && hasTo
      ? { mode: 'range', from: from!, to: to! }
      : { mode: 'working' };
}

export function runSemDiff(options: {
  repositoryRoot: string;
  command?: string;
  staged?: boolean;
  from?: string;
  to?: string;
  limits?: Partial<SemExecutionLimits>;
  aggregateOutputBudget?: SemAggregateOutputBudget;
}): SemChangeSet {
  const input = record(options as unknown, 'sem diff options');
  exactModelKeys(
    input,
    [
      'repositoryRoot',
      'command',
      'staged',
      'from',
      'to',
      'limits',
      'aggregateOutputBudget',
    ],
    'sem diff options',
  );
  const repositoryRoot = canonicalRepositoryRoot(text(
    input.repositoryRoot,
    'sem diff options.repositoryRoot',
  ));
  const command = resolveSemCommand(
    input.command === undefined ? undefined : text(input.command, 'sem diff options.command'),
  );
  const limits = resolveSemExecutionLimits(
    input.limits as Partial<SemExecutionLimits> | undefined,
  );
  const aggregateOutputBudget = input.aggregateOutputBudget === undefined
    ? undefined
    : semAggregateOutputBudget(
      input.aggregateOutputBudget,
      'sem diff options.aggregateOutputBudget',
    );
  const source = semDiffSource(input as {
    staged?: boolean;
    from?: string;
    to?: string;
  });
  const args = [
    'diff',
    ...(source.mode === 'staged' ? ['--staged'] : []),
    ...(source.mode === 'range' ? ['--from', source.from, '--to', source.to] : []),
    '--format',
    'json',
  ];
  const startedAt = performance.now();
  const diffOutputBudget: SemAggregateOutputBudget = {
    label: 'sem diff aggregate output',
    limitBytes: limits.maxOutputBytes,
    usedBytes: 0,
  };
  const outputBudgets = [
    diffOutputBudget,
    ...(aggregateOutputBudget ? [aggregateOutputBudget] : []),
  ];
  const parsed = runSemJson(
    command,
    args,
    repositoryRoot,
    limits,
    (value) => {
      const changes = parseSemDiff(value, source);
      validateSemDiffEnvelope(value, changes);
      assertSemChangeSetIntegrity({ repositoryRoot, changeSet: changes });
      return changes;
    },
    outputBudgets,
  );
  const aggregateDurationMs = (): number =>
    Math.ceil(performance.now() - startedAt);
  const remainingTimeoutMs = (): number =>
    limits.timeoutMs - aggregateDurationMs();
  if (source.mode !== 'working') {
    const durationMs = aggregateDurationMs();
    if (durationMs > limits.timeoutMs) {
      throw new SemExecutionError({
        operation: 'diff',
        reason: 'timeout',
        command,
        args,
        cwd: repositoryRoot,
        durationMs,
        ...limits,
        detail: `sem diff aggregate timeout exceeded ${limits.timeoutMs}ms budget after sem diff`,
      });
    }
    return parsed;
  }
  const gitCommand = 'git';
  const gitArgs = ['ls-files', '--others', '--exclude-standard', '-z'];
  const gitTimeoutMs = remainingTimeoutMs();
  if (gitTimeoutMs <= 0) {
    throw new SemExecutionError({
      operation: 'diff',
      reason: 'timeout',
      command: gitCommand,
      args: gitArgs,
      cwd: repositoryRoot,
      durationMs: aggregateDurationMs(),
      ...limits,
      detail: `sem diff aggregate timeout exhausted ${limits.timeoutMs}ms budget before git untracked-file scan`,
    });
  }
  const gitContext = (): Omit<SemCommandResult, 'stdout' | 'outputBytes'> => ({
    operation: 'diff',
    command: gitCommand,
    args: gitArgs,
    cwd: repositoryRoot,
    durationMs: aggregateDurationMs(),
    ...limits,
  });
  let untracked: SpawnSyncReturns<Buffer>;
  try {
    untracked = spawnSync(gitCommand, gitArgs, {
      cwd: repositoryRoot,
      maxBuffer: limits.maxOutputBytes,
      timeout: gitTimeoutMs,
      killSignal: 'SIGKILL',
      windowsHide: true,
    });
  } catch (error) {
    throw executionError(gitContext(), 'spawn', {
      detail: `git untracked-file scan failed: ${diagnosticErrorMessage(error)}`,
    });
  }
  if (untracked.error) {
    throw executionError(
      gitContext(),
      failureReasonForSystemError(untracked.error),
      {
      ...(untracked.signal ? { signal: untracked.signal } : {}),
      stderr: decodeUtf8Lossy(untracked.stderr),
      detail: `git untracked-file scan failed: ${untracked.error.message}`,
      },
    );
  }
  if (untracked.status !== 0) {
    throw executionError(gitContext(), 'exit', {
      ...(untracked.status === null ? {} : { exitCode: untracked.status }),
      ...(untracked.signal ? { signal: untracked.signal } : {}),
      stderr: decodeUtf8Lossy(untracked.stderr),
      detail: 'git untracked-file scan exited non-zero',
    });
  }
  consumeSemOutputBudgets(
    gitContext(),
    untracked.stdout.length + untracked.stderr.length,
    outputBudgets,
  );
  let gitStdout: string;
  try {
    gitStdout = decodeUtf8Strict(untracked.stdout, 'git untracked-file scan stdout');
  } catch (error) {
    throw executionError(gitContext(), 'invalid-output', {
      detail: diagnosticErrorMessage(error),
    });
  }
  const rawUntrackedFiles = gitStdout
    .split('\0')
    .filter((file) => file.length > 0);
  try {
    assertSemChangeEvidenceItemLimit(
      parsed.changes,
      parsed.binaryChanges ?? [],
      rawUntrackedFiles,
      'sem diff with git untracked files',
    );
  } catch (error) {
    throw executionError(gitContext(), 'invalid-output', {
      detail: diagnosticErrorMessage(error),
    });
  }
  const untrackedFiles = rawUntrackedFiles
    .map((file, index) => repositoryFile(
      repositoryRoot,
      file,
      `git untracked files[${index}]`,
    ).file);
  const combined = {
    ...parsed,
    untrackedFiles: [...new Set(untrackedFiles)].sort(),
  };
  try {
    assertSemChangeSetIntegrity({ repositoryRoot, changeSet: combined });
  } catch (error) {
    throw executionError(gitContext(), 'invalid-output', {
      detail: diagnosticErrorMessage(error),
    });
  }
  const durationMs = aggregateDurationMs();
  if (durationMs > limits.timeoutMs) {
    throw new SemExecutionError({
      operation: 'diff',
      reason: 'timeout',
      command: gitCommand,
      args: gitArgs,
      cwd: repositoryRoot,
      durationMs,
      ...limits,
      detail: `sem diff aggregate timeout exceeded ${limits.timeoutMs}ms budget after git untracked-file scan`,
    });
  }
  return combined;
}

export function runSemProjectAnalysis(options: {
  repositoryRoot: string;
  project: ArchitectureProject;
  impactFromPatterns: string[];
  impactEntityIds?: string[];
  command?: string;
  limits?: Partial<SemExecutionLimits>;
  aggregateOutputBudget?: SemAggregateOutputBudget;
}): SemProjectAnalysis {
  const startedAt = performance.now();
  const input = record(options as unknown, 'sem project analysis options');
  exactModelKeys(
    input,
    [
      'repositoryRoot',
      'project',
      'impactFromPatterns',
      'impactEntityIds',
      'command',
      'limits',
      'aggregateOutputBudget',
    ],
    'sem project analysis options',
  );
  const repositoryRoot = canonicalRepositoryRoot(text(
    input.repositoryRoot,
    'sem project analysis options.repositoryRoot',
  ));
  const project = architectureProject(input.project, 'sem project analysis options.project');
  const projectRoot = canonicalProjectRoot(repositoryRoot, project);
  const projectArgument = repositoryRelativeCanonicalPath(repositoryRoot, projectRoot);
  const command = resolveSemCommand(
    input.command === undefined
      ? undefined
      : text(input.command, 'sem project analysis options.command'),
  );
  const limits = resolveSemExecutionLimits(
    input.limits as Partial<SemExecutionLimits> | undefined,
  );
  const aggregateOutputBudget = input.aggregateOutputBudget === undefined
    ? undefined
    : semAggregateOutputBudget(
      input.aggregateOutputBudget,
      'sem project analysis aggregate output budget',
    );
  const matchesImpactSource = compileGlobPatterns(
    input.impactFromPatterns as string[],
  );
  const impactEntityIdsInput = input.impactEntityIds;
  if (impactEntityIdsInput !== undefined && !Array.isArray(impactEntityIdsInput)) {
    throw new InputContractError(
      'sem project analysis impactEntityIds must be an array when provided',
    );
  }
  const impactEntityIds = impactEntityIdsInput === undefined
    ? []
    : impactEntityIdsInput.map((value, index) =>
      text(value, `sem project analysis impactEntityIds[${index}]`));
  if (new Set(impactEntityIds).size !== impactEntityIds.length) {
    throw new InputContractError(
      'sem project analysis impactEntityIds must not contain duplicates',
    );
  }
  const explicitImpactEntityIds = new Set(impactEntityIds);
  try {
    const entitiesArgs = project.fileExtensions === undefined
      ? ['entities', projectArgument, '--json']
      : [
        'entities',
        '--json',
        '--file-exts',
        ...project.fileExtensions,
        '--',
        projectArgument,
      ];
    const { entities, impactTargets } = runSemJson(
      command,
      entitiesArgs,
      repositoryRoot,
      limits,
      (value) => {
        const entities = parseSemEntities(value);
        validateProjectEntities(repositoryRoot, projectRoot, project, entities);
        const impactTargets = entities.filter((entity) =>
          entity.parentId === undefined
          && (matchesImpactSource(entity.file) || explicitImpactEntityIds.has(entity.id)));
        return { entities, impactTargets };
      },
      aggregateOutputBudget ? [aggregateOutputBudget] : [],
    );
    if (impactTargets.length > MAX_SEM_IMPACT_QUERIES_PER_PROJECT) {
      const blockedTarget = impactTargets[MAX_SEM_IMPACT_QUERIES_PER_PROJECT]!;
      throw new SemExecutionError({
        operation: 'impact',
        reason: 'query-limit',
        command,
        args: ['impact', '--entity-id', blockedTarget.id, '--json'],
        cwd: repositoryRoot,
        durationMs: Math.round(performance.now() - startedAt),
        ...limits,
        impactTargets: impactTargets.length,
        maxImpactQueries: MAX_SEM_IMPACT_QUERIES_PER_PROJECT,
        projectId: project.id,
        detail: `${impactTargets.length} impact targets exceed the per-project limit of ${MAX_SEM_IMPACT_QUERIES_PER_PROJECT}; narrow impact boundary from patterns`,
      });
    }
    const impactOutputBudget: SemAggregateOutputBudget = {
      label: `sem impact aggregate output for project ${project.id}`,
      limitBytes: limits.maxOutputBytes,
      usedBytes: 0,
    };
    let evidenceItems = entities.length;
    let evidenceTextCharacters = semAnalysisCollectionEvidenceTextCharacters([{
      projectId: project.id,
      root: projectRoot,
      entities,
      impacts: [],
    }]);
    const impactStartedAt = performance.now();
    const impacts = impactTargets.map((entity) => {
      const elapsedMs = Math.ceil(performance.now() - impactStartedAt);
      const remainingTimeoutMs = limits.timeoutMs - elapsedMs;
      const args = ['impact', '--entity-id', entity.id, '--json'];
      if (remainingTimeoutMs <= 0) {
        throw new SemExecutionError({
          operation: 'impact',
          reason: 'timeout',
          command,
          args,
          cwd: repositoryRoot,
          durationMs: elapsedMs,
          ...limits,
          projectId: project.id,
          detail: `sem impact aggregate timeout for project ${project.id} exhausted ${limits.timeoutMs}ms budget before the next query`,
        });
      }
      try {
        return runSemJson(
          command,
          args,
          repositoryRoot,
          { ...limits, timeoutMs: remainingTimeoutMs },
          (value) => {
            const impact = parseSemImpact(value);
            const impactTextCharacters = semImpactEvidenceTextCharacters(
              impact,
              `sem impact evidence for project ${project.id}`,
            );
            evidenceItems = consumeSemEvidenceItems(
              evidenceItems,
              semImpactEvidenceItems(impact),
              `sem project analysis for project ${project.id}`,
            );
            if (
              impactTextCharacters
              > MAX_SEM_EVIDENCE_TEXT_CHARS_TOTAL - evidenceTextCharacters
            ) {
              throw new InputContractError(
                `sem project analysis for project ${project.id} exceeds ${MAX_SEM_EVIDENCE_TEXT_CHARS_TOTAL} aggregate text character limit`,
              );
            }
            validateImpactResponse(repositoryRoot, entity, impact);
            evidenceTextCharacters += impactTextCharacters;
            return impact;
          },
          [
            impactOutputBudget,
            ...(aggregateOutputBudget ? [aggregateOutputBudget] : []),
          ],
        );
      } catch (error) {
        if (error instanceof SemExecutionError && error.failure.reason === 'timeout') {
          const aggregateElapsedMs = Math.round(performance.now() - impactStartedAt);
          throw new SemExecutionError({
            ...error.failure,
            detail: `sem impact aggregate timeout for project ${project.id} exhausted ${limits.timeoutMs}ms budget after ${aggregateElapsedMs}ms${error.failure.detail ? `; ${error.failure.detail}` : ''}`,
          });
        }
        throw error;
      }
    });
    const impactDurationMs = Math.ceil(performance.now() - impactStartedAt);
    if (impactTargets.length > 0 && impactDurationMs > limits.timeoutMs) {
      const finalTarget = impactTargets.at(-1)!;
      throw new SemExecutionError({
        operation: 'impact',
        reason: 'timeout',
        command,
        args: ['impact', '--entity-id', finalTarget.id, '--json'],
        cwd: repositoryRoot,
        durationMs: impactDurationMs,
        ...limits,
        projectId: project.id,
        detail: `sem impact aggregate timeout for project ${project.id} exceeded ${limits.timeoutMs}ms budget after final query post-processing`,
      });
    }
    return {
      projectId: project.id,
      root: projectRoot,
      entities,
      impacts,
      durationMs: Math.round(performance.now() - startedAt),
    };
  } catch (error) {
    if (error instanceof SemExecutionError) {
      throw new SemExecutionError({
        ...error.failure,
        projectId: project.id,
      });
    }
    throw error;
  }
}
