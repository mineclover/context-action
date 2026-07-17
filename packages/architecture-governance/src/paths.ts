import { lstat, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  diagnosticErrorMessage,
  diagnosticSystemErrorCode,
} from './diagnostics.js';
import { InputContractError } from './errors.js';
import { isWellFormedText } from './text.js';

function requireNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new InputContractError(`${label} must be a non-empty string`);
  }
  if (!isWellFormedText(value)) {
    throw new InputContractError(`${label} must contain well-formed Unicode`);
  }
  if (value.includes('\0')) {
    throw new InputContractError(`${label} must not contain null bytes`);
  }
}

function inside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === ''
    || (!relative.startsWith(`..${path.sep}`)
      && relative !== '..'
      && !path.isAbsolute(relative));
}

function requireRepositoryPathInputs(
  root: unknown,
  candidate: unknown,
  label: unknown,
  allowAbsolute: unknown,
): void {
  requireNonEmptyString(root, 'Repository root');
  requireNonEmptyString(label, 'Path label');
  requireNonEmptyString(candidate, label);
  if (typeof allowAbsolute !== 'boolean') {
    throw new InputContractError('allowAbsolute must be boolean');
  }
}

function resolveCanonicalRepositoryPath(
  authoredRoot: string,
  canonicalRoot: string,
  candidate: string,
  label: string,
  allowAbsolute = true,
): string {
  requireRepositoryPathInputs(
    authoredRoot,
    candidate,
    label,
    allowAbsolute,
  );
  const absolute = path.isAbsolute(candidate);
  if (!allowAbsolute && absolute) {
    throw new InputContractError(`${label} escapes repository root: ${candidate}`);
  }
  const resolved = absolute
    ? path.resolve(candidate)
    : path.resolve(canonicalRoot, candidate);
  const authoredResolvedRoot = path.resolve(authoredRoot);
  if (
    !inside(canonicalRoot, resolved)
    && !(absolute && inside(authoredResolvedRoot, resolved))
  ) {
    throw new InputContractError(`${label} escapes repository root: ${candidate}`);
  }
  return resolved;
}

export async function canonicalRepositoryRoot(candidate: string): Promise<string> {
  requireNonEmptyString(candidate, 'Repository root');
  const resolved = path.resolve(candidate);
  try {
    const canonical = await realpath(resolved);
    if (!(await stat(canonical)).isDirectory()) {
      throw new InputContractError(`Repository root must be a directory: ${candidate}`);
    }
    return canonical;
  } catch (error) {
    if (error instanceof InputContractError) throw error;
    throw new InputContractError(
      `Cannot resolve repository root ${candidate}: ${diagnosticErrorMessage(error)}`,
    );
  }
}

export function resolveRepositoryPath(
  root: string,
  candidate: string,
  label: string,
  allowAbsolute = true,
): string {
  requireRepositoryPathInputs(root, candidate, label, allowAbsolute);
  if (!allowAbsolute && path.isAbsolute(candidate)) {
    throw new InputContractError(`${label} escapes repository root: ${candidate}`);
  }
  const resolved = path.resolve(root, candidate);
  if (!inside(root, resolved)) {
    throw new InputContractError(`${label} escapes repository root: ${candidate}`);
  }
  return resolved;
}

export async function requireExistingRepositoryPath(
  root: string,
  candidate: string,
  label: string,
  expectedType?: 'file' | 'directory',
): Promise<string> {
  if (
    expectedType !== undefined
    && expectedType !== 'file'
    && expectedType !== 'directory'
  ) {
    throw new InputContractError('expectedType must be file or directory when provided');
  }
  requireRepositoryPathInputs(root, candidate, label, true);
  const canonicalRoot = await canonicalRepositoryRoot(root);
  const resolved = resolveCanonicalRepositoryPath(
    root,
    canonicalRoot,
    candidate,
    label,
  );
  let canonical: string;
  try {
    canonical = await realpath(resolved);
  } catch (error) {
    throw new InputContractError(
      `Cannot resolve ${label.toLowerCase()} ${candidate}: ${diagnosticErrorMessage(error)}`,
    );
  }
  if (!inside(canonicalRoot, canonical)) {
    throw new InputContractError(
      `${label} escapes repository root through symbolic link: ${candidate}`,
    );
  }
  if (expectedType) {
    const metadata = await stat(canonical);
    const matches = expectedType === 'file' ? metadata.isFile() : metadata.isDirectory();
    if (!matches) {
      throw new InputContractError(`${label} must be a ${expectedType}: ${candidate}`);
    }
  }
  return canonical;
}

export async function safeOutputRepositoryPath(
  root: string,
  candidate: string,
): Promise<string> {
  requireRepositoryPathInputs(root, candidate, 'Output path', true);
  const canonicalRoot = await canonicalRepositoryRoot(root);
  const resolved = resolveCanonicalRepositoryPath(
    root,
    canonicalRoot,
    candidate,
    'Output path',
  );
  let current = resolved;
  while (true) {
    try {
      const lexicalMetadata = await lstat(current);
      let canonical: string;
      try {
        canonical = await realpath(current);
      } catch (error) {
        throw new InputContractError(
          `Cannot resolve output path ${candidate}: ${diagnosticErrorMessage(error)}`,
        );
      }
      if (!inside(canonicalRoot, canonical)) {
        throw new InputContractError(
          `Output path escapes repository root through symbolic link: ${candidate}`,
        );
      }
      const metadata = await stat(canonical);
      if (current === resolved) {
        if (lexicalMetadata.isSymbolicLink()) {
          throw new InputContractError(
            `Output path must not be a symbolic link: ${candidate}`,
          );
        }
        if (!lexicalMetadata.isFile() || !metadata.isFile()) {
          throw new InputContractError(
            `Output path must be a file when it already exists: ${candidate}`,
          );
        }
      } else if (!metadata.isDirectory()) {
        throw new InputContractError(
          `Existing output path parent must be a directory: ${candidate}`,
        );
      }
      return resolved;
    } catch (error) {
      if (error instanceof InputContractError) throw error;
      const code = diagnosticSystemErrorCode(error);
      if (code !== 'ENOENT' && code !== 'ENOTDIR') {
        throw new InputContractError(
          `Cannot inspect output path ${candidate}: ${diagnosticErrorMessage(error)}`,
        );
      }
      const parent = path.dirname(current);
      if (parent === current) {
        throw new InputContractError(`Cannot find an existing parent for output path: ${candidate}`);
      }
      current = parent;
    }
  }
}

export type ExistingRepositoryPathInspection =
  | { status: 'inside'; resolved: string }
  | { status: 'outside'; resolved: string }
  | { status: 'missing'; resolved: string; error?: string };

export async function inspectExistingRepositoryPath(
  root: string,
  candidate: string,
): Promise<ExistingRepositoryPathInspection> {
  requireNonEmptyString(root, 'Repository root');
  requireNonEmptyString(candidate, 'Path');
  let resolved: string;
  try {
    resolveRepositoryPath(root, candidate, 'Path', false);
  } catch {
    return { status: 'outside', resolved: path.resolve(root, candidate) };
  }
  const canonicalRoot = await canonicalRepositoryRoot(root);
  resolved = resolveCanonicalRepositoryPath(
    root,
    canonicalRoot,
    candidate,
    'Path',
    false,
  );
  try {
    const canonical = await realpath(resolved);
    return inside(canonicalRoot, canonical)
      ? { status: 'inside', resolved }
      : { status: 'outside', resolved };
  } catch (error) {
    return {
      status: 'missing',
      resolved,
      error: diagnosticErrorMessage(error),
    };
  }
}
