import { randomUUID } from 'node:crypto';
import {
  lstat,
  mkdir,
  open,
  realpath,
  rename,
  unlink,
} from 'node:fs/promises';
import path from 'node:path';
import type { SemFoundationLimitOptions } from '@sem-foundation/contracts';
import type {
  ArchitecturePolicySet,
  ArchitectureProject,
  ArchitectureRegistry,
  SemChangeSet,
  SemExecutionLimits,
  SemOperation,
  SemProjectAnalysis,
  VerificationReport,
} from '../contracts.js';
import {
  diagnosticErrorMessage,
  diagnosticSystemErrorCode,
} from '../diagnostics.js';
import {
  collectSymbolHistory,
  collectSymbolSnapshot,
  createSymbolContextComparisonReport,
  createSymbolSnapshotDiffReport,
  parseSymbolContextDocument,
  parseSymbolSnapshotDocument,
  renderSymbolContextComparisonConsole,
  renderSymbolContextComparisonJson,
  renderSymbolContextComparisonMarkdown,
  renderSymbolHistoryConsole,
  renderSymbolHistoryJson,
  renderSymbolHistoryMarkdown,
  renderSymbolSnapshotConsole,
  renderSymbolSnapshotDiffConsole,
  renderSymbolSnapshotDiffJson,
  renderSymbolSnapshotDiffMarkdown,
  renderSymbolSnapshotJson,
  renderSymbolSnapshotMarkdown,
} from '../history.js';
import {
  InputContractError,
  loadArchitecturePolicySet,
  loadArchitectureRegistry,
  readBoundedJsonFile,
} from '../input.js';
import {
  canonicalRepositoryRoot,
  requireExistingRepositoryPath,
  safeOutputRepositoryPath,
} from '../paths.js';
import {
  renderConsoleReport,
  renderJsonReport,
  renderMarkdownReport,
} from '../reporters.js';
import {
  MAX_SEM_EVIDENCE_ITEMS_TOTAL,
  MAX_SEM_EVIDENCE_TEXT_CHARS_TOTAL,
  resolveSemCommand,
  resolveSemExecutionLimits,
  runSemDiff,
  runSemProjectAnalysis,
  runSemVersion,
  SemExecutionError,
  semAnalysisCollectionEvidenceItems,
  semAnalysisCollectionEvidenceTextCharacters,
} from '../sem.js';
import {
  appendSemExecutionFailure,
  reportFailsAt,
  verifyArchitecture,
} from '../verifier.js';
import { type CliOptions, parseArgs, usage } from './args.js';

export interface CliIo {
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}

const processIo: CliIo = {
  stdout: (message) => process.stdout.write(message),
  stderr: (message) => process.stderr.write(message),
};

function foundationLimitOverrides(options: CliOptions): SemFoundationLimitOptions | undefined {
  if (
    options.maxAnalysisProjects === undefined
    && options.maxProjectFileExtensions === undefined
    && options.maxProjectFileExtensionChars === undefined
    && options.maxSnapshotSymbols === undefined
  ) {
    return undefined;
  }
  return {
    ...(options.maxAnalysisProjects === undefined
      ? {} : { maxAnalysisProjects: options.maxAnalysisProjects }),
    ...(options.maxProjectFileExtensions === undefined
      ? {} : { maxAnalysisProjectFileExtensions: options.maxProjectFileExtensions }),
    ...(options.maxProjectFileExtensionChars === undefined
      ? {} : { maxAnalysisProjectFileExtensionChars: options.maxProjectFileExtensionChars }),
    ...(options.maxSnapshotSymbols === undefined
      ? {} : { maxSymbolSnapshotEntries: options.maxSnapshotSymbols }),
  };
}

function selectedRegistry(
  registry: ArchitectureRegistry,
  projectIds: string[],
): { registry: ArchitectureRegistry; projects: ArchitectureProject[] } {
  const declared = registry.analysisProjects ?? [{ id: 'default', root: '.' }];
  const requested = new Set(projectIds);
  const declaredIds = new Set(declared.map((project) => project.id));
  for (const projectId of requested) {
    if (!declaredIds.has(projectId)) {
      throw new InputContractError(`Unknown analysis project: ${projectId}`);
    }
  }
  if (projectIds.length !== requested.size) {
    throw new InputContractError('Duplicate --project values are not allowed');
  }
  const projects = requested.size === 0
    ? declared
    : declared.filter((project) => requested.has(project.id));
  if (requested.size === 0) {
    return {
      registry: registry.analysisProjects ? registry : { ...registry, analysisProjects: projects },
      projects,
    };
  }
  return {
    registry: {
      ...registry,
      analysisProjects: projects,
      capabilities: registry.capabilities.filter((capability) =>
        !capability.project
        || !declaredIds.has(capability.project)
        || requested.has(capability.project)),
    },
    projects,
  };
}

function renderReport(
  report: VerificationReport,
  format: 'console' | 'json' | 'markdown',
): string {
  return format === 'json'
    ? renderJsonReport(report)
    : format === 'markdown'
      ? renderMarkdownReport(report)
      : renderConsoleReport(report);
}

async function emitReport(options: {
  report: VerificationReport;
  format: 'console' | 'json' | 'markdown';
  outputPath?: string;
  protectedInputPaths?: string[];
  root: string;
  io: CliIo;
}): Promise<void> {
  const output = renderReport(options.report, options.format);
  if (!options.outputPath) {
    options.io.stdout(output);
    return;
  }
  await safeOutputRepositoryPath(options.root, options.outputPath);
  await assertOutputDoesNotAlias(
    options.outputPath,
    options.protectedInputPaths ?? [],
  );
  await mkdir(path.dirname(options.outputPath), { recursive: true });
  await safeOutputRepositoryPath(options.root, options.outputPath);
  await assertOutputDoesNotAlias(
    options.outputPath,
    options.protectedInputPaths ?? [],
  );
  await writeReportAtomically({
    root: options.root,
    outputPath: options.outputPath,
    output,
    protectedInputPaths: options.protectedInputPaths ?? [],
  });
  options.io.stdout(
    `Wrote architecture verification report to ${path.relative(options.root, options.outputPath)}\n`,
  );
}

async function writeReportAtomically(options: {
  root: string;
  outputPath: string;
  output: string;
  protectedInputPaths: string[];
}): Promise<void> {
  const directory = path.dirname(options.outputPath);
  const outputMode = await reportOutputMode(options.outputPath);
  const temporaryPath = path.join(
    directory,
    `.${path.basename(options.outputPath)}.${process.pid}.${randomUUID()}.tmp`,
  );
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  try {
    await safeOutputRepositoryPath(options.root, temporaryPath);
    handle = await open(temporaryPath, 'wx', 0o600);
    await handle.writeFile(options.output, 'utf8');
    await handle.chmod(outputMode);
    await handle.sync();
    await handle.close();
    handle = undefined;

    await safeOutputRepositoryPath(options.root, temporaryPath);
    await safeOutputRepositoryPath(options.root, options.outputPath);
    await assertOutputDoesNotAlias(
      options.outputPath,
      options.protectedInputPaths,
    );
    await rename(temporaryPath, options.outputPath);
    await syncDirectory(directory);
  } finally {
    if (handle) await handle.close().catch(() => undefined);
    await unlink(temporaryPath).catch(() => undefined);
  }
}

async function reportOutputMode(outputPath: string): Promise<number> {
  try {
    const metadata = await lstat(outputPath);
    if (!metadata.isFile()) {
      throw new InputContractError(
        `Output path must be a regular file when it already exists: ${outputPath}`,
      );
    }
    return metadata.mode & 0o777;
  } catch (error) {
    if (error instanceof InputContractError) throw error;
    if (diagnosticSystemErrorCode(error) === 'ENOENT') {
      return 0o666 & ~process.umask();
    }
    throw new InputContractError(
      `Cannot inspect output permissions ${outputPath}: ${diagnosticErrorMessage(error)}`,
    );
  }
}

async function syncDirectory(directory: string): Promise<void> {
  if (process.platform === 'win32') return;
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  try {
    handle = await open(directory, 'r');
    await handle.sync();
  } catch (error) {
    throw new InputContractError(
      `Cannot flush report directory ${directory}: ${diagnosticErrorMessage(error)}`,
    );
  } finally {
    if (handle) await handle.close().catch(() => undefined);
  }
}

async function pathsAlias(left: string, right: string): Promise<boolean> {
  if (path.resolve(left) === path.resolve(right)) return true;
  try {
    return await realpath(left) === await realpath(right);
  } catch {
    return false;
  }
}

async function assertOutputDoesNotAlias(
  outputPath: string,
  inputPaths: string[],
): Promise<void> {
  for (const inputPath of inputPaths) {
    if (await pathsAlias(outputPath, inputPath)) {
      throw new InputContractError(
        `Output path must not overwrite architecture input: ${outputPath}`,
      );
    }
  }
}

function selectedPolicies(
  policies: ArchitecturePolicySet[],
  projects: ArchitectureProject[],
  declaredProjects: ArchitectureProject[],
): ArchitecturePolicySet[] {
  const selectedProjectIds = new Set(projects.map((project) => project.id));
  const declaredProjectIds = new Set(declaredProjects.map((project) => project.id));
  return policies
    .map((policy) => ({
      ...policy,
      ...(policy.packageBoundaries ? {
        packageBoundaries: policy.packageBoundaries.filter((rule) =>
          !rule.project || !declaredProjectIds.has(rule.project) || selectedProjectIds.has(rule.project)),
      } : {}),
      ...(policy.impactBoundaries ? {
        impactBoundaries: policy.impactBoundaries.filter((rule) =>
          !rule.project || !declaredProjectIds.has(rule.project) || selectedProjectIds.has(rule.project)),
      } : {}),
    }))
    .filter((policy) =>
      (policy.packageBoundaries?.length ?? 0) > 0
      || (policy.impactBoundaries?.length ?? 0) > 0);
}

function appendSemAnalyses(options: {
  root: string;
  projects: ArchitectureProject[];
  registry: ArchitectureRegistry;
  policies: ArchitecturePolicySet[];
  enabled: boolean;
  target: SemProjectAnalysis[];
  command?: string;
  limits?: SemExecutionLimits;
  startedAt?: number;
  aggregateOutputBudget?: {
    label: string;
    limitBytes: number;
    usedBytes: number;
  };
  budgetLabel?: string;
}): void {
  if (!options.enabled) return;
  const startedAt = options.startedAt ?? performance.now();
  const command = resolveSemCommand(options.command);
  const limits = options.limits ?? resolveSemExecutionLimits();
  const budgetLabel = options.budgetLabel ?? 'sem analyses aggregate';
  let evidenceItems = semAnalysisCollectionEvidenceItems(options.target);
  let evidenceTextCharacters = semAnalysisCollectionEvidenceTextCharacters(
    options.target,
  );
  const aggregateOutputBudget = options.aggregateOutputBudget ?? {
    label: 'sem analyses aggregate output',
    limitBytes: limits.maxOutputBytes,
    usedBytes: 0,
  };
  const impactPolicies = options.policies.flatMap((policy) => policy.impactBoundaries ?? []);
  for (const project of options.projects) {
    const elapsedMs = Math.ceil(performance.now() - startedAt);
    const remainingTimeoutMs = limits.timeoutMs - elapsedMs;
    if (remainingTimeoutMs <= 0) {
      throw new SemExecutionError({
        operation: 'entities',
        reason: 'timeout',
        command,
        args: ['entities', project.root, '--json'],
        cwd: options.root,
        durationMs: elapsedMs,
        ...limits,
        projectId: project.id,
        detail: `${budgetLabel} timeout exhausted ${limits.timeoutMs}ms budget before project ${project.id}`,
      });
    }
    let analysis: SemProjectAnalysis;
    try {
      const symbolEntityIds = options.registry.capabilities
        .filter((capability) => !capability.project || capability.project === project.id)
        .flatMap((capability) => capability.implementationAnchors)
        .filter((anchor) => anchor.includes('::'));
      analysis = runSemProjectAnalysis({
        repositoryRoot: options.root,
        project,
        impactFromPatterns: impactPolicies
          .filter((rule) => !rule.project || rule.project === project.id)
          .flatMap((rule) => rule.from),
        impactEntityIds: symbolEntityIds,
        ...(options.command ? { command: options.command } : {}),
        limits: { ...limits, timeoutMs: remainingTimeoutMs },
        aggregateOutputBudget,
      });
    } catch (error) {
      if (!(error instanceof SemExecutionError)) throw error;
      const aggregateDurationMs = Math.ceil(performance.now() - startedAt);
      if (error.failure.reason === 'timeout') {
        throw new SemExecutionError({
          ...error.failure,
          durationMs: aggregateDurationMs,
          timeoutMs: limits.timeoutMs,
          detail: `${budgetLabel} timeout exhausted ${limits.timeoutMs}ms budget during project ${project.id}${error.failure.detail ? `; ${error.failure.detail}` : ''}`,
        });
      }
      if (
        error.failure.reason === 'output-limit'
        && error.failure.detail?.includes(aggregateOutputBudget.label)
      ) {
        throw new SemExecutionError({
          ...error.failure,
          durationMs: aggregateDurationMs,
        });
      }
      throw error;
    }
    const aggregateDurationMs = Math.ceil(performance.now() - startedAt);
    if (aggregateDurationMs > limits.timeoutMs) {
      throw new SemExecutionError({
        operation: 'entities',
        reason: 'timeout',
        command,
        args: ['entities', project.root, '--json'],
        cwd: options.root,
        durationMs: aggregateDurationMs,
        ...limits,
        projectId: project.id,
        detail: `${budgetLabel} timeout exceeded ${limits.timeoutMs}ms budget after project ${project.id}`,
      });
    }
    const projectEvidenceItems = semAnalysisCollectionEvidenceItems([analysis]);
    if (projectEvidenceItems > MAX_SEM_EVIDENCE_ITEMS_TOTAL - evidenceItems) {
      throw new SemExecutionError({
        operation: 'entities',
        reason: 'invalid-output',
        command,
        args: ['entities', project.root, '--json'],
        cwd: options.root,
        durationMs: Math.round(performance.now() - startedAt),
        ...limits,
        projectId: project.id,
        detail: `sem analyses exceed ${MAX_SEM_EVIDENCE_ITEMS_TOTAL} global evidence item limit after project ${project.id}`,
      });
    }
    const projectEvidenceTextCharacters =
      semAnalysisCollectionEvidenceTextCharacters([analysis]);
    if (
      projectEvidenceTextCharacters
      > MAX_SEM_EVIDENCE_TEXT_CHARS_TOTAL - evidenceTextCharacters
    ) {
      throw new SemExecutionError({
        operation: 'entities',
        reason: 'invalid-output',
        command,
        args: ['entities', project.root, '--json'],
        cwd: options.root,
        durationMs: Math.round(performance.now() - startedAt),
        ...limits,
        projectId: project.id,
        detail: `sem analyses exceed ${MAX_SEM_EVIDENCE_TEXT_CHARS_TOTAL} global evidence text character limit after project ${project.id}`,
      });
    }
    evidenceItems += projectEvidenceItems;
    evidenceTextCharacters += projectEvidenceTextCharacters;
    options.target.push(analysis);
  }
}

function remainingSemExecutionLimits(options: {
  startedAt: number;
  limits: SemExecutionLimits;
  operation: SemOperation;
  command: string;
  args: string[];
  cwd: string;
  detail: string;
}): SemExecutionLimits {
  const durationMs = Math.ceil(performance.now() - options.startedAt);
  const timeoutMs = options.limits.timeoutMs - durationMs;
  if (timeoutMs <= 0) {
    throw new SemExecutionError({
      operation: options.operation,
      reason: 'timeout',
      command: options.command,
      args: options.args,
      cwd: options.cwd,
      durationMs,
      ...options.limits,
      detail: `sem execution aggregate timeout exhausted ${options.limits.timeoutMs}ms budget ${options.detail}`,
    });
  }
  return { ...options.limits, timeoutMs };
}

export async function runCli(
  argv = process.argv.slice(2),
  io: CliIo = processIo,
): Promise<number> {
  try {
    const options = parseArgs(argv);
    if (options === 'help') {
      io.stdout(usage());
      return 0;
    }
    const root = await canonicalRepositoryRoot(options.root);
    const outputPath = options.output
      ? await safeOutputRepositoryPath(root, options.output)
      : undefined;
    if (options.command === 'intersect') {
      const leftPath = await requireExistingRepositoryPath(
        root,
        options.left!,
        'Left symbol context',
        'file',
      );
      const rightPath = await requireExistingRepositoryPath(
        root,
        options.right!,
        'Right symbol context',
        'file',
      );
      const left = parseSymbolContextDocument(
        await readBoundedJsonFile(leftPath, {
          label: 'Left symbol context',
          maxBytes: 4 * 1024 * 1024,
        }),
        'left symbol context',
      );
      const right = parseSymbolContextDocument(
        await readBoundedJsonFile(rightPath, {
          label: 'Right symbol context',
          maxBytes: 4 * 1024 * 1024,
        }),
        'right symbol context',
      );
      const report = createSymbolContextComparisonReport(left, right);
      const rendered = options.format === 'json'
        ? renderSymbolContextComparisonJson(report)
        : options.format === 'markdown'
          ? renderSymbolContextComparisonMarkdown(report)
          : renderSymbolContextComparisonConsole(report);
      if (!outputPath) {
        io.stdout(rendered);
        return 0;
      }
      await assertOutputDoesNotAlias(outputPath, [leftPath, rightPath]);
      await writeReportAtomically({
        root,
        outputPath,
        output: rendered,
        protectedInputPaths: [leftPath, rightPath],
      });
      io.stdout(`Wrote symbol context comparison to ${path.relative(root, outputPath)}\n`);
      return 0;
    }
    if (options.command === 'snapshot-diff') {
      const leftPath = await requireExistingRepositoryPath(
        root,
        options.left!,
        'Left symbol snapshot',
        'file',
      );
      const rightPath = await requireExistingRepositoryPath(
        root,
        options.right!,
        'Right symbol snapshot',
        'file',
      );
      const left = parseSymbolSnapshotDocument(
        await readBoundedJsonFile(leftPath, {
          label: 'Left symbol snapshot',
          maxBytes: 4 * 1024 * 1024,
        }),
        'left symbol snapshot',
      );
      const right = parseSymbolSnapshotDocument(
        await readBoundedJsonFile(rightPath, {
          label: 'Right symbol snapshot',
          maxBytes: 4 * 1024 * 1024,
        }),
        'right symbol snapshot',
      );
      const report = createSymbolSnapshotDiffReport(left, right);
      const rendered = options.format === 'json'
        ? renderSymbolSnapshotDiffJson(report)
        : options.format === 'markdown'
          ? renderSymbolSnapshotDiffMarkdown(report)
          : renderSymbolSnapshotDiffConsole(report);
      if (!outputPath) {
        io.stdout(rendered);
        return 0;
      }
      await assertOutputDoesNotAlias(outputPath, [leftPath, rightPath]);
      await writeReportAtomically({
        root,
        outputPath,
        output: rendered,
        protectedInputPaths: [leftPath, rightPath],
      });
      io.stdout(`Wrote symbol snapshot diff to ${path.relative(root, outputPath)}\n`);
      return 0;
    }
    if (options.command === 'history') {
      const historyRegistryPath = await requireExistingRepositoryPath(
        root,
        options.registry,
        'Registry path',
        'file',
      );
      const historyRegistry = await loadArchitectureRegistry(
        historyRegistryPath,
        foundationLimitOverrides(options),
      );
      const historyRegistryPathRelative = path
        .relative(root, path.resolve(root, options.registry))
        .split(path.sep)
        .join('/');
      const contractLimits = foundationLimitOverrides(options);
      const history = await collectSymbolHistory({
        repositoryRoot: root,
        from: options.from!,
        to: options.to!,
        projects: historyRegistry.analysisProjects ?? [{ id: 'default', root: '.' }],
        registryPath: historyRegistryPathRelative,
        ...(options.maxHistoryCommits === undefined
          ? {} : { maxCommits: options.maxHistoryCommits }),
        ...(options.maxHistoryChanges === undefined
          ? {} : { maxChanges: options.maxHistoryChanges }),
        ...(contractLimits === undefined ? {} : { contractLimits }),
        ...(options.semCommand === undefined ? {} : { command: options.semCommand }),
        ...(options.semTimeoutMs === undefined && options.semMaxOutputBytes === undefined
          ? {}
          : {
            limits: {
              ...(options.semTimeoutMs === undefined ? {} : { timeoutMs: options.semTimeoutMs }),
              ...(options.semMaxOutputBytes === undefined ? {} : { maxOutputBytes: options.semMaxOutputBytes }),
            },
          }),
      });
      const rendered = options.format === 'json'
        ? renderSymbolHistoryJson(history)
        : options.format === 'markdown'
          ? renderSymbolHistoryMarkdown(history)
          : renderSymbolHistoryConsole(history);
      if (!outputPath) {
        io.stdout(rendered);
        return 0;
      }
      await writeReportAtomically({
        root,
        outputPath,
        output: rendered,
        protectedInputPaths: [historyRegistryPath],
      });
      io.stdout(`Wrote symbol history report to ${path.relative(root, outputPath)}\n`);
      return 0;
    }
    if (options.command === 'snapshot') {
      const snapshotRegistryPath = await requireExistingRepositoryPath(
        root,
        options.registry,
        'Registry path',
        'file',
      );
      const snapshotRegistry = await loadArchitectureRegistry(
        snapshotRegistryPath,
        foundationLimitOverrides(options),
      );
      const selection = selectedRegistry(snapshotRegistry, options.projects);
      const snapshotRegistryPathRelative = path
        .relative(root, path.resolve(root, options.registry))
        .split(path.sep)
        .join('/');
      const contractLimits = foundationLimitOverrides(options);
      if (!options.commit) {
        for (const project of selection.projects) {
          await requireExistingRepositoryPath(
            root,
            project.root,
            `Analysis project ${project.id} root`,
            'directory',
          );
        }
      }
      const snapshot = await collectSymbolSnapshot({
        repositoryRoot: root,
        projects: selection.projects,
        registryPath: snapshotRegistryPathRelative,
        ...(contractLimits === undefined ? {} : { contractLimits }),
        ...(options.commit === undefined ? {} : { commit: options.commit }),
        ...(options.semCommand === undefined ? {} : { command: options.semCommand }),
        ...(options.semTimeoutMs === undefined && options.semMaxOutputBytes === undefined
          ? {}
          : {
            limits: {
              ...(options.semTimeoutMs === undefined ? {} : { timeoutMs: options.semTimeoutMs }),
              ...(options.semMaxOutputBytes === undefined ? {} : { maxOutputBytes: options.semMaxOutputBytes }),
            },
          }),
      });
      const rendered = options.format === 'json'
        ? renderSymbolSnapshotJson(snapshot)
        : options.format === 'markdown'
          ? renderSymbolSnapshotMarkdown(snapshot)
          : renderSymbolSnapshotConsole(snapshot);
      if (!outputPath) {
        io.stdout(rendered);
        return 0;
      }
      await assertOutputDoesNotAlias(outputPath, [snapshotRegistryPath]);
      await writeReportAtomically({
        root,
        outputPath,
        output: rendered,
        protectedInputPaths: [snapshotRegistryPath],
      });
      io.stdout(`Wrote symbol snapshot to ${path.relative(root, outputPath)}\n`);
      return 0;
    }
    const registryPath = await requireExistingRepositoryPath(
      root,
      options.registry,
      'Registry path',
      'file',
    );
    const loadedRegistry = await loadArchitectureRegistry(registryPath);
    const selection = selectedRegistry(loadedRegistry, options.projects);
    for (const project of selection.projects) {
      await requireExistingRepositoryPath(
        root,
        project.root,
        `Analysis project ${project.id} root`,
        'directory',
      );
    }
    const policyPaths: string[] = [];
    const loadedPolicies: ArchitecturePolicySet[] = [];
    for (const file of loadedRegistry.policyFiles ?? []) {
      const policyPath = await requireExistingRepositoryPath(
        root,
        file,
        'Policy path',
        'file',
      );
      policyPaths.push(policyPath);
      loadedPolicies.push(await loadArchitecturePolicySet(policyPath));
    }
    if (outputPath) {
      await assertOutputDoesNotAlias(outputPath, [registryPath, ...policyPaths]);
    }
    const policies = selectedPolicies(
      loadedPolicies,
      selection.projects,
      loadedRegistry.analysisProjects ?? selection.projects,
    );
    const semLimits = options.useSem
      ? resolveSemExecutionLimits({
        ...(options.semTimeoutMs === undefined ? {} : { timeoutMs: options.semTimeoutMs }),
        ...(options.semMaxOutputBytes === undefined
          ? {}
          : { maxOutputBytes: options.semMaxOutputBytes }),
      })
      : undefined;
    if (options.useSem) {
      const preflight = await verifyArchitecture({
        root,
        registryPath: options.registry,
        registry: selection.registry,
        policies,
        semAnalyses: [],
        failOn: options.failOn,
        evaluateImpactPolicies: false,
      });
      if (reportFailsAt(preflight, options.failOn)) {
        await emitReport({
          report: preflight,
          format: options.format,
          ...(outputPath ? { outputPath } : {}),
          protectedInputPaths: [registryPath, ...policyPaths],
          root,
          io,
        });
        return 1;
      }
    }
    let semVersion: string | undefined;
    const semAnalyses: SemProjectAnalysis[] = [];
    let semChanges: SemChangeSet | undefined;
    const semStartedAt = performance.now();
    const resolvedSemCommand = semLimits
      ? resolveSemCommand(options.semCommand)
      : undefined;
    const aggregateOutputBudget = semLimits
      ? {
        label: 'sem execution aggregate output',
        limitBytes: semLimits.maxOutputBytes,
        usedBytes: 0,
      }
      : undefined;
    try {
      semVersion = options.useSem
        ? runSemVersion({
          repositoryRoot: root,
          ...(resolvedSemCommand ? { command: resolvedSemCommand } : {}),
          ...(semLimits ? { limits: semLimits } : {}),
          ...(aggregateOutputBudget ? { aggregateOutputBudget } : {}),
        })
        : undefined;
      appendSemAnalyses({
        root,
        projects: selection.projects,
        registry: selection.registry,
        policies,
        enabled: options.useSem,
        target: semAnalyses,
        ...(resolvedSemCommand ? { command: resolvedSemCommand } : {}),
        ...(semLimits ? { limits: semLimits } : {}),
        ...(semLimits ? { startedAt: semStartedAt } : {}),
        ...(aggregateOutputBudget ? { aggregateOutputBudget } : {}),
        budgetLabel: 'sem execution aggregate',
      });
      if (options.changed && semLimits) {
        const diffArgs = [
          'diff',
          ...(options.staged ? ['--staged'] : []),
          ...(options.from && options.to
            ? ['--from', options.from, '--to', options.to]
            : []),
          '--format',
          'json',
        ];
        const remainingLimits = remainingSemExecutionLimits({
          startedAt: semStartedAt,
          limits: semLimits,
          operation: 'diff',
          command: resolvedSemCommand ?? resolveSemCommand(options.semCommand),
          args: diffArgs,
          cwd: root,
          detail: 'before diff',
        });
        let candidateChanges: SemChangeSet;
        try {
          candidateChanges = runSemDiff({
          repositoryRoot: root,
          staged: options.staged,
          ...(options.from ? { from: options.from } : {}),
          ...(options.to ? { to: options.to } : {}),
          ...(resolvedSemCommand ? { command: resolvedSemCommand } : {}),
            limits: remainingLimits,
            ...(aggregateOutputBudget ? { aggregateOutputBudget } : {}),
          });
        } catch (error) {
          if (!(error instanceof SemExecutionError)) throw error;
          if (error.failure.reason === 'timeout') {
            throw new SemExecutionError({
              ...error.failure,
              durationMs: Math.ceil(performance.now() - semStartedAt),
              timeoutMs: semLimits.timeoutMs,
              detail: `sem execution aggregate timeout exhausted ${semLimits.timeoutMs}ms budget during diff${error.failure.detail ? `; ${error.failure.detail}` : ''}`,
            });
          }
          throw error;
        }
        remainingSemExecutionLimits({
          startedAt: semStartedAt,
          limits: semLimits,
          operation: 'diff',
          command: resolvedSemCommand ?? resolveSemCommand(options.semCommand),
          args: diffArgs,
          cwd: root,
          detail: 'after diff',
        });
        semChanges = candidateChanges;
      }
    } catch (error) {
      if (!(error instanceof SemExecutionError)) throw error;
      const requestedProjects = selection.projects.map((project) => project.id);
      const completedProjects = semAnalyses.map((analysis) => analysis.projectId);
      const completedProjectIds = new Set(completedProjects);
      const skippedProjects = requestedProjects.filter((projectId) =>
        projectId !== error.failure.projectId && !completedProjectIds.has(projectId));
      const failure = {
        ...error.failure,
        requestedProjects,
        completedProjects,
        skippedProjects,
      };
      const failureBase = await verifyArchitecture({
        root,
        registryPath: options.registry,
        registry: selection.registry,
        policies,
        semAnalyses,
        ...(semVersion ? { semVersion } : {}),
        failOn: options.failOn,
        evaluateImpactPolicies: semAnalyses.length > 0,
      });
      const failureReport = appendSemExecutionFailure(failureBase, failure);
      await emitReport({
        report: failureReport,
        format: options.format,
        ...(outputPath ? { outputPath } : {}),
        protectedInputPaths: [registryPath, ...policyPaths],
        root,
        io,
      });
      return 2;
    }
    const report = await verifyArchitecture({
      root,
      registryPath: options.registry,
      registry: selection.registry,
      policies,
      semAnalyses,
      ...(semChanges ? { semChanges } : {}),
      ...(semVersion ? { semVersion } : {}),
      failOn: options.failOn,
      evaluateImpactPolicies: options.useSem,
    });
    await emitReport({
      report,
      format: options.format,
      ...(outputPath ? { outputPath } : {}),
      protectedInputPaths: [registryPath, ...policyPaths],
      root,
      io,
    });
    return reportFailsAt(report, options.failOn) ? 1 : 0;
  } catch (error) {
    const message = diagnosticErrorMessage(error);
    io.stderr(`arch-verify input error: ${message}\n`);
    return 2;
  }
}
