/**
 * Durable diagnostics for a multi-file filesystem save.
 *
 * A save plan deliberately stores digests and lengths instead of source text.
 * The application can later compare the connected folder without copying
 * workspace content into an operation record or provider trace.
 */

const MAX_SAVE_PLAN_FILES = 200;
const MAX_WORKSPACE_PATH_LENGTH = 2_000;

export interface WorkspaceSavePlanInput {
  readonly path: string;
  readonly source: string;
}

export interface WorkspaceSavePlanFile {
  readonly path: string;
  readonly sourceHash: string;
  readonly sourceLength: number;
}

export interface WorkspaceSavePlanDetails {
  readonly outcome: 'unknown';
  readonly operation: string;
  readonly plannedFiles: readonly WorkspaceSavePlanFile[];
  readonly completedPaths: readonly string[];
  readonly pendingPaths: readonly string[];
  readonly reason?: string;
}

export type WorkspaceSavePlanFileReader = (
  path: string
) => Promise<string | undefined>;

function assertOperationName(operation: string): void {
  if (typeof operation !== 'string' || operation.trim().length === 0) {
    throw new TypeError('Workspace save plan operation must be a non-empty string.');
  }
}

function assertPath(path: string): void {
  if (
    typeof path !== 'string' ||
    path.length === 0 ||
    path.length > MAX_WORKSPACE_PATH_LENGTH
  ) {
    throw new TypeError('Workspace save plan paths must be non-empty and bounded.');
  }
}

function fallbackHash(source: string): string {
  let hash = 2_166_136_261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/** Hash a source string without requiring a Node-only crypto dependency. */
export async function hashWorkspaceSource(source: string): Promise<string> {
  if (typeof source !== 'string') {
    throw new TypeError('Workspace source must be a string.');
  }

  const encoder = typeof TextEncoder === 'function' ? new TextEncoder() : undefined;
  const subtle = globalThis.crypto?.subtle;
  if (!encoder || !subtle) return fallbackHash(source);

  const digest = await subtle.digest('SHA-256', encoder.encode(source));
  return `sha256:${Array.from(new Uint8Array(digest), byte =>
    byte.toString(16).padStart(2, '0')
  ).join('')}`;
}

/** Create a deterministic per-file manifest for a multi-file save. */
export async function createWorkspaceSavePlan(
  files: readonly WorkspaceSavePlanInput[],
  operation = 'workspace.saveAll'
): Promise<readonly WorkspaceSavePlanFile[]> {
  assertOperationName(operation);
  if (!Array.isArray(files) || files.length > MAX_SAVE_PLAN_FILES) {
    throw new RangeError(
      `Workspace save plan supports at most ${MAX_SAVE_PLAN_FILES} files.`
    );
  }

  const seen = new Set<string>();
  const plan = await Promise.all(
    files.map(async file => {
      assertPath(file.path);
      if (typeof file.source !== 'string') {
        throw new TypeError('Workspace save plan source must be a string.');
      }
      if (seen.has(file.path)) {
        throw new Error(`Workspace save plan contains duplicate path: ${file.path}`);
      }
      seen.add(file.path);
      return {
        path: file.path,
        sourceHash: await hashWorkspaceSource(file.source),
        sourceLength: file.source.length,
      } satisfies WorkspaceSavePlanFile;
    })
  );

  return plan.sort((left, right) => left.path.localeCompare(right.path));
}

function readPathList(value: unknown, plannedPaths: ReadonlySet<string>): string[] | undefined {
  if (!Array.isArray(value) || value.length > MAX_SAVE_PLAN_FILES) return undefined;
  const paths: string[] = [];
  const seen = new Set<string>();
  for (const candidate of value) {
    if (typeof candidate !== 'string' || !plannedPaths.has(candidate) || seen.has(candidate)) {
      return undefined;
    }
    seen.add(candidate);
    paths.push(candidate);
  }
  return paths;
}

/** Parse untrusted durable details before a recovery resolver uses them. */
export function readWorkspaceSavePlanDetails(
  value: unknown
): WorkspaceSavePlanDetails | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as {
    outcome?: unknown;
    operation?: unknown;
    plannedFiles?: unknown;
    completedPaths?: unknown;
    pendingPaths?: unknown;
    reason?: unknown;
  };
  if (
    candidate.outcome !== 'unknown' ||
    typeof candidate.operation !== 'string' ||
    !Array.isArray(candidate.plannedFiles) ||
    candidate.plannedFiles.length === 0 ||
    candidate.plannedFiles.length > MAX_SAVE_PLAN_FILES
  ) {
    return undefined;
  }

  const plannedFiles: WorkspaceSavePlanFile[] = [];
  const plannedPaths = new Set<string>();
  for (const item of candidate.plannedFiles) {
    if (!item || typeof item !== 'object') return undefined;
    const file = item as {
      path?: unknown;
      sourceHash?: unknown;
      sourceLength?: unknown;
    };
    const sourceLength = file.sourceLength;
    if (
      typeof file.path !== 'string' ||
      file.path.length === 0 ||
      file.path.length > MAX_WORKSPACE_PATH_LENGTH ||
      typeof file.sourceHash !== 'string' ||
      file.sourceHash.length === 0 ||
      typeof sourceLength !== 'number' ||
      !Number.isSafeInteger(sourceLength) ||
      sourceLength < 0 ||
      plannedPaths.has(file.path)
    ) {
      return undefined;
    }
    plannedPaths.add(file.path);
    plannedFiles.push({
      path: file.path,
      sourceHash: file.sourceHash,
      sourceLength,
    });
  }

  const completedPaths = readPathList(candidate.completedPaths, plannedPaths);
  const pendingPaths = readPathList(candidate.pendingPaths, plannedPaths);
  if (!completedPaths || !pendingPaths) return undefined;

  return {
    outcome: 'unknown',
    operation: candidate.operation,
    plannedFiles,
    completedPaths,
    pendingPaths,
    ...(typeof candidate.reason === 'string' ? { reason: candidate.reason } : {}),
  };
}

/** Verify every external source in a previously recorded save plan. */
export async function verifyWorkspaceSavePlan(
  details: WorkspaceSavePlanDetails,
  readSource: WorkspaceSavePlanFileReader
): Promise<readonly string[]> {
  if (details?.outcome !== 'unknown') {
    throw new TypeError('Workspace save plan details must describe an unknown outcome.');
  }
  if (typeof readSource !== 'function') {
    throw new TypeError('Workspace save plan readSource must be a function.');
  }

  const mismatches: string[] = [];
  for (const expectedFile of details.plannedFiles) {
    const source = await readSource(expectedFile.path);
    if (source === undefined) {
      mismatches.push(`${expectedFile.path} is missing`);
      continue;
    }
    const sourceHash = await hashWorkspaceSource(source);
    if (
      sourceHash !== expectedFile.sourceHash ||
      source.length !== expectedFile.sourceLength
    ) {
      mismatches.push(`${expectedFile.path} differs`);
    }
  }
  if (mismatches.length > 0) {
    throw new Error(
      `Workspace save plan does not match the external files (${mismatches.join(', ')}).`
    );
  }
  return details.plannedFiles.map(file => file.path);
}

/** Build the details payload carried by an ambiguous save failure. */
export function createWorkspaceSaveUnknownDetails(input: {
  readonly operation: string;
  readonly plannedFiles: readonly WorkspaceSavePlanFile[];
  readonly completedPaths: readonly string[];
  readonly reason?: string;
}): WorkspaceSavePlanDetails {
  assertOperationName(input.operation);
  const plannedPaths = new Set(input.plannedFiles.map(file => file.path));
  const completedPaths = readPathList(input.completedPaths, plannedPaths);
  if (!completedPaths) {
    throw new TypeError('Workspace save plan completedPaths are invalid.');
  }
  const completed = new Set(completedPaths);
  const pendingPaths = input.plannedFiles
    .map(file => file.path)
    .filter(path => !completed.has(path));
  return {
    outcome: 'unknown',
    operation: input.operation,
    plannedFiles: input.plannedFiles,
    completedPaths,
    pendingPaths,
    ...(input.reason === undefined ? {} : { reason: input.reason }),
  };
}
