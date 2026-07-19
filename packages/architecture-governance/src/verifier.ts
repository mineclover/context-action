import { stat } from 'node:fs/promises';
import path from 'node:path';
import { compareStableText } from '@context-action/sem-foundation-contracts';
import type {
  ArchitectureCapability,
  ArchitecturePolicySet,
  ArchitectureRegistry,
  CapabilityStatus,
  ImpactBoundaryPolicy,
  PackageBoundaryPolicy,
  PackageDependencyField,
  SemExecutionFailure,
  SemProjectAnalysis,
  Severity,
  SymbolUsageRecord,
  VerificationFinding,
  VerificationOptions,
  VerificationReport,
} from './contracts.js';
import {
  assertKnownFields,
  diagnosticErrorMessage,
} from './diagnostics.js';
import {
  InputContractError,
  MAX_ARCHITECTURE_COLLECTION_ITEMS,
  MAX_ARCHITECTURE_REFERENCE_ITEMS,
  MAX_PACKAGE_MANIFEST_BYTES,
  parseArchitecturePolicySet,
  parseArchitectureRegistry,
  readBoundedJsonFile,
} from './input.js';
import {
  canonicalRepositoryRoot,
  inspectExistingRepositoryPath,
  resolveRepositoryPath,
} from './paths.js';
import {
  compileGlobPatterns,
  globPatternIssue,
  globPatternSetIssue,
} from './patterns.js';
import { assertVerificationReport } from './report-contract.js';
import {
  assertSemChangeSetIntegrity,
  assertSemProjectAnalysisIntegrity,
  boundSemExecutionFailure,
  MAX_SEM_EVIDENCE_ITEMS_TOTAL,
  MAX_SEM_EVIDENCE_TEXT_CHARS_TOTAL,
  SUPPORTED_SEM_VERSION,
  semAnalysisCollectionEvidenceTextCharacters,
  semProjectAnalysisEvidenceItems,
} from './sem.js';
import { hasVisibleText, toWellFormedText } from './text.js';

const capabilityIdPattern = /^CA-[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
const projectIdPattern = /^[a-z][a-z0-9-]*$/;
const severityRank: Record<Severity, number> = { info: 0, warning: 1, error: 2 };
const supportedSeverities = new Set<Severity>(['info', 'warning', 'error']);
const statusRank: Record<CapabilityStatus, number> = {
  planned: 0,
  deprecated: 0,
  implemented: 1,
  verified: 2,
};
const supportedCapabilityStatuses = new Set<CapabilityStatus>([
  'planned',
  'implemented',
  'verified',
  'deprecated',
]);
const verificationOptionKeys = new Set<keyof VerificationOptions>([
  'root',
  'registryPath',
  'registry',
  'policies',
  'semAnalyses',
  'semChanges',
  'semVersion',
  'failOn',
  'evaluateImpactPolicies',
]);
export const MAX_IMPACT_POLICY_EVALUATION_OPERATIONS = 16_384;
const defaultDependencyFields: PackageDependencyField[] = [
  'dependencies',
  'peerDependencies',
  'optionalDependencies',
];

function finding(
  code: string,
  severity: Severity,
  message: string,
  details: Partial<VerificationFinding> = {},
): VerificationFinding {
  const capabilityId = visibleFindingDetail(details.capabilityId);
  const ruleId = visibleFindingDetail(details.ruleId);
  const findingPath = visibleFindingDetail(details.path);
  return {
    code,
    severity,
    message: toWellFormedText(message),
    ...(capabilityId ? { capabilityId } : {}),
    ...(ruleId ? { ruleId } : {}),
    ...(findingPath ? { path: findingPath } : {}),
  };
}

function visibleFindingDetail(value: unknown): string | undefined {
  return typeof value === 'string' && hasVisibleText(value) ? value : undefined;
}

function observedRuntimeValue(value: unknown): string {
  if (typeof value !== 'string') return typeof value;
  return JSON.stringify(value.length <= 128 ? value : `${value.slice(0, 128)}…`);
}

function runtimeRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function policyInputReferenceItems(value: unknown, limit: number): number {
  let references = 1;
  const policy = runtimeRecord(value);
  if (!policy) return references;
  for (const [boundaryField, referenceFields] of [
    ['packageBoundaries', ['disallow', 'require', 'dependencyFields']],
    ['impactBoundaries', ['from', 'disallowDependencies']],
  ] as const) {
    const rules = policy[boundaryField];
    if (!Array.isArray(rules)) continue;
    references += rules.length;
    if (references > limit) return references;
    for (const ruleValue of rules) {
      const rule = runtimeRecord(ruleValue);
      if (!rule) continue;
      for (const field of referenceFields) {
        if (!Array.isArray(rule[field])) continue;
        references += rule[field].length;
        if (references > limit) return references;
      }
    }
  }
  return references;
}

function runtimeErrorMessage(error: unknown): string {
  const message = diagnosticErrorMessage(error);
  return message.length <= 1024 ? message : `${message.slice(0, 1024)}…`;
}

function optionalFindingId(value: unknown): string | undefined {
  return visibleFindingDetail(value);
}

function anchorPath(anchor: string): string {
  return anchor.split('::', 1)[0]?.split('#', 1)[0] ?? anchor;
}

function capabilityPaths(capability: ArchitectureCapability): string[] {
  return [
    capability.spec,
    ...capability.owners,
    ...capability.implementationAnchors.map(anchorPath),
    ...capability.testEvidence,
    ...capability.publicDocs,
    ...(capability.decisions ?? []),
  ];
}

function normalizedRepositoryCandidate(candidate: string): string {
  const normalized = path.posix.normalize(candidate.replace(/\\/g, '/'));
  if (normalized === '' || normalized === '.') return '.';
  return normalized !== '/' && normalized.endsWith('/')
    ? normalized.slice(0, -1)
    : normalized;
}

function normalizedReportFile(candidate: string): string | undefined {
  const normalized = normalizedRepositoryCandidate(candidate);
  const segments = normalized.split('/');
  return normalized === '.'
    || !hasVisibleText(normalized)
    || normalized.includes('\0')
    || normalized.includes('\\')
    || path.posix.isAbsolute(normalized)
    || path.win32.isAbsolute(normalized)
    || segments.some((segment) => segment === '.' || segment === '..')
    || path.posix.normalize(normalized) !== normalized
    ? undefined
    : normalized;
}

function normalizedReportFiles(candidates: string[]): string[] {
  return [...new Set(candidates
    .map(normalizedReportFile)
    .filter((candidate): candidate is string => candidate !== undefined))]
    .sort();
}

function changedFileCandidateIndex(files: string[]): Set<string> {
  const candidates = new Set<string>();
  for (const file of files) {
    const normalized = normalizedRepositoryCandidate(file);
    candidates.add('.');
    candidates.add(normalized);
    let separator = normalized.lastIndexOf('/');
    while (separator > 0) {
      candidates.add(normalized.slice(0, separator));
      separator = normalized.lastIndexOf('/', separator - 1);
    }
  }
  return candidates;
}

function pathBelongsToProject(candidate: string, projectRoot: string): boolean {
  const normalizedRoot = normalizedRepositoryCandidate(projectRoot);
  const normalizedCandidate = normalizedRepositoryCandidate(candidate);
  return normalizedRoot === '.'
    || normalizedCandidate === normalizedRoot
    || normalizedCandidate.startsWith(`${normalizedRoot}/`);
}

function repositoryRelativePath(root: string, candidate: string): string {
  const relative = path.relative(root, candidate).split(path.sep).join('/');
  return relative === '' ? '.' : relative;
}

async function pathFinding(
  root: string,
  candidate: string,
  code: string,
  capabilityId?: string,
  expectedType?: 'file' | 'directory',
): Promise<VerificationFinding | null> {
  const inspection = await inspectExistingRepositoryPath(root, candidate);
  if (inspection.status === 'outside') {
    return finding(`${code}_OUTSIDE_ROOT`, 'error', `Path escapes repository root: ${candidate}`, {
      ...(capabilityId ? { capabilityId } : {}),
      path: candidate,
    });
  }
  if (inspection.status === 'missing') {
    return finding(code, 'error', `Path does not exist or cannot be resolved: ${candidate}`, {
      ...(capabilityId ? { capabilityId } : {}),
      path: candidate,
    });
  }
  if (expectedType) {
    try {
      const metadata = await stat(inspection.resolved);
      const matches = expectedType === 'file'
        ? metadata.isFile()
        : metadata.isDirectory();
      if (!matches) {
        return finding(
          code.replace(/_MISSING$/, `_NOT_${expectedType.toUpperCase()}`),
          'error',
          `Path must be a ${expectedType}: ${candidate}`,
          {
            ...(capabilityId ? { capabilityId } : {}),
            path: candidate,
          },
        );
      }
    } catch {
      return finding(code, 'error', `Path does not exist or cannot be resolved: ${candidate}`, {
        ...(capabilityId ? { capabilityId } : {}),
        path: candidate,
      });
    }
  }
  return null;
}

function requiredEvidenceFindings(capability: ArchitectureCapability): VerificationFinding[] {
  const findings: VerificationFinding[] = [];
  const rank = statusRank[capability.status];
  if (capability.owners.length === 0) {
    findings.push(finding('CAPABILITY_OWNER_REQUIRED', 'error', 'Capability must declare at least one owner', { capabilityId: capability.id }));
  }
  if (rank >= 1 && capability.implementationAnchors.length === 0) {
    findings.push(finding('CAPABILITY_IMPLEMENTATION_REQUIRED', 'error', `${capability.status} capability requires an implementation anchor`, { capabilityId: capability.id }));
  }
  if (rank >= 2 && capability.testEvidence.length === 0) {
    findings.push(finding('CAPABILITY_TEST_REQUIRED', 'error', `${capability.status} capability requires test evidence`, { capabilityId: capability.id }));
  }
  if (rank >= 2 && capability.publicDocs.length === 0) {
    findings.push(finding('CAPABILITY_DOCUMENTATION_REQUIRED', 'error', `${capability.status} capability requires public documentation`, { capabilityId: capability.id }));
  }
  return findings;
}

async function verifyCapabilityPaths(
  root: string,
  capability: ArchitectureCapability,
): Promise<VerificationFinding[]> {
  const candidates: Array<[string, string, 'file' | 'directory' | undefined]> = [
    [capability.spec, 'SPEC_PATH_MISSING', 'file'],
    ...capability.owners.map((value): [string, string, undefined] => [value, 'OWNER_PATH_MISSING', undefined]),
    ...capability.implementationAnchors.map((value): [string, string, 'file'] => [anchorPath(value), 'IMPLEMENTATION_PATH_MISSING', 'file']),
    ...capability.testEvidence.map((value): [string, string, 'file'] => [value, 'TEST_PATH_MISSING', 'file']),
    ...capability.publicDocs.map((value): [string, string, 'file'] => [value, 'DOCUMENT_PATH_MISSING', 'file']),
    ...(capability.decisions ?? []).map((value): [string, string, 'file'] => [value, 'DECISION_PATH_MISSING', 'file']),
  ];
  const findings: VerificationFinding[] = [];
  for (const [candidate, code, expectedType] of candidates) {
    const result = await pathFinding(
      root,
      candidate,
      code,
      capability.id,
      expectedType,
    );
    if (result) findings.push(result);
  }
  return findings;
}

async function verifyPackageBoundary(root: string, rule: PackageBoundaryPolicy): Promise<VerificationFinding[]> {
  const packageCandidate = path.posix.join(rule.from, 'package.json');
  const inspection = await inspectExistingRepositoryPath(root, packageCandidate);
  if (inspection.status === 'outside') {
    return [finding('PACKAGE_POLICY_PATH_OUTSIDE_ROOT', 'error', `Package policy path escapes repository root: ${rule.from}`, { ruleId: rule.id, path: rule.from })];
  }
  const packagePath = inspection.resolved;
  let packageJson: Record<string, unknown>;
  try {
    const parsed = await readBoundedJsonFile(packagePath, {
      label: 'package manifest',
      maxBytes: MAX_PACKAGE_MANIFEST_BYTES,
    });
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new InputContractError('package manifest root must be an object');
    }
    packageJson = parsed as Record<string, unknown>;
  } catch (error) {
    return [finding('PACKAGE_POLICY_INPUT_ERROR', 'error', `Cannot read package policy input ${rule.from}/package.json: ${diagnosticErrorMessage(error)}`, { ruleId: rule.id, path: rule.from })];
  }
  const dependencies = new Set<string>();
  for (const field of rule.dependencyFields ?? defaultDependencyFields) {
    const values = packageJson[field];
    if (values === undefined) continue;
    if (!values || typeof values !== 'object' || Array.isArray(values)) {
      return [finding(
        'PACKAGE_POLICY_INPUT_ERROR',
        'error',
        `${rule.from}/package.json field ${field} must be an object`,
        { ruleId: rule.id, path: rule.from },
      )];
    }
    for (const [dependency, version] of Object.entries(values)) {
      if (typeof version !== 'string' || version.length === 0) {
        return [finding(
          'PACKAGE_POLICY_INPUT_ERROR',
          'error',
          `${rule.from}/package.json field ${field}.${dependency} must be a non-empty string`,
          { ruleId: rule.id, path: rule.from },
        )];
      }
      dependencies.add(dependency);
    }
  }
  const severity = rule.severity ?? 'error';
  return [
    ...(rule.disallow ?? []).filter((dependency) => dependencies.has(dependency)).map((dependency) =>
      finding('PACKAGE_DEPENDENCY_FORBIDDEN', severity, `${rule.from} must not depend on ${dependency}`, { ruleId: rule.id, path: `${rule.from}/package.json` })),
    ...(rule.require ?? []).filter((dependency) => !dependencies.has(dependency)).map((dependency) =>
      finding('PACKAGE_DEPENDENCY_REQUIRED', severity, `${rule.from} must depend on ${dependency}`, { ruleId: rule.id, path: `${rule.from}/package.json` })),
  ];
}

interface ImpactPolicyEvaluationBudget {
  operations: number;
}

interface ImpactBoundaryVerification {
  findings: VerificationFinding[];
  limitExceeded: boolean;
}

function consumeImpactPolicyOperation(budget: ImpactPolicyEvaluationBudget): boolean {
  if (budget.operations >= MAX_IMPACT_POLICY_EVALUATION_OPERATIONS) return false;
  budget.operations += 1;
  return true;
}

function verifyImpactBoundary(
  rule: ImpactBoundaryPolicy,
  analyses: SemProjectAnalysis[],
  budget: ImpactPolicyEvaluationBudget,
): ImpactBoundaryVerification {
  if (!consumeImpactPolicyOperation(budget)) {
    return { findings: [], limitExceeded: true };
  }
  const applicable: SemProjectAnalysis[] = [];
  for (const analysis of analyses) {
    if (!consumeImpactPolicyOperation(budget)) {
      return { findings: [], limitExceeded: true };
    }
    if (!rule.project || analysis.projectId === rule.project) applicable.push(analysis);
  }
  if (applicable.length === 0) {
    return {
      findings: [finding('SEM_EVIDENCE_MISSING', rule.missingEvidenceSeverity ?? 'warning', `Impact boundary ${rule.id} was not evaluated because sem analysis was not provided`, { ruleId: rule.id })],
      limitExceeded: false,
    };
  }
  const matchesSource = compileGlobPatterns(rule.from);
  const relevantImpacts: SemProjectAnalysis['impacts'] = [];
  for (const analysis of applicable) {
    for (const impact of analysis.impacts) {
      if (!consumeImpactPolicyOperation(budget)) {
        return { findings: [], limitExceeded: true };
      }
      if (matchesSource(impact.entity.file)) relevantImpacts.push(impact);
    }
  }
  if (relevantImpacts.length === 0) {
    return {
      findings: [finding('SEM_IMPACT_SOURCE_MISSING', rule.missingEvidenceSeverity ?? 'warning', `Impact boundary ${rule.id} did not match a top-level sem entity`, { ruleId: rule.id })],
      limitExceeded: false,
    };
  }
  const severity = rule.severity ?? 'error';
  const matchesDisallowedDependency = compileGlobPatterns(rule.disallowDependencies);
  const findings: VerificationFinding[] = [];
  for (const impact of relevantImpacts) {
    for (const dependency of impact.dependencies) {
      if (!consumeImpactPolicyOperation(budget)) {
        return { findings, limitExceeded: true };
      }
      if (!matchesDisallowedDependency(dependency.file)) continue;
      findings.push(finding(
        'SEM_IMPACT_BOUNDARY_VIOLATION',
        severity,
        `${impact.entity.entityId} depends on forbidden entity ${dependency.entityId}`,
        { ruleId: rule.id, path: impact.entity.file },
      ));
    }
  }
  return { findings, limitExceeded: false };
}

function allPolicies(policies: ArchitecturePolicySet[]): {
  packages: PackageBoundaryPolicy[];
  impacts: ImpactBoundaryPolicy[];
} {
  return {
    packages: policies.flatMap((policy) => policy.packageBoundaries ?? []),
    impacts: policies.flatMap((policy) => policy.impactBoundaries ?? []),
  };
}

function collectSymbolUsageRecords(
  registry: ArchitectureRegistry,
  analyses: SemProjectAnalysis[],
): SymbolUsageRecord[] {
  const records: SymbolUsageRecord[] = [];
  const entitiesByProject = new Map<string, Map<string, SemProjectAnalysis['entities'][number]>>();
  const impactsByProject = new Map<string, Map<string, SemProjectAnalysis['impacts'][number]>>();
  for (const analysis of analyses) {
    if (analysis.impacts.length === 0) continue;
    entitiesByProject.set(
      analysis.projectId,
      new Map(analysis.entities
        .filter((entity) => entity.parentId === undefined)
        .map((entity) => [entity.id, entity])),
    );
    impactsByProject.set(
      analysis.projectId,
      new Map(analysis.impacts.map((impact) => [impact.entity.entityId, impact])),
    );
  }
  for (const capability of registry.capabilities) {
    const candidateAnalyses = (capability.project
      ? analyses.filter((analysis) => analysis.projectId === capability.project)
      : analyses).filter((analysis) => analysis.impacts.length > 0);
    for (const anchor of capability.implementationAnchors.filter((value) => value.includes('::'))) {
      for (const analysis of candidateAnalyses) {
        const entity = entitiesByProject.get(analysis.projectId)?.get(anchor);
        if (!entity) continue;
        const impact = impactsByProject.get(analysis.projectId)?.get(anchor);
        const usageFiles = [...new Set(
          impact?.dependents.map((dependent) => dependent.file) ?? [],
        )].sort();
        records.push({
          capabilityId: capability.id,
          anchor,
          projectId: analysis.projectId,
          definition: {
            file: entity.file,
            startLine: entity.startLine,
            endLine: entity.endLine,
          },
          usageFiles,
        });
      }
    }
  }
  return records;
}

export async function verifyArchitecture(options: VerificationOptions): Promise<VerificationReport> {
  const runtimeOptions = runtimeRecord(options as unknown);
  if (!runtimeOptions) {
    throw new InputContractError('Verification options must be an object');
  }
  assertKnownFields(
    runtimeOptions,
    verificationOptionKeys,
    'Verification options',
    'contain',
  );
  if (typeof options.root !== 'string' || !hasVisibleText(options.root)) {
    throw new InputContractError(
      'Verification root must be a non-empty string containing visible text',
    );
  }
  if (typeof options.registryPath !== 'string' || !hasVisibleText(options.registryPath)) {
    throw new InputContractError(
      'Registry path must be a non-empty string containing visible text',
    );
  }
  const root = await canonicalRepositoryRoot(options.root);
  const findings: VerificationFinding[] = [];
  const requestedFailOn = options.failOn as unknown;
  const failOn: Severity = requestedFailOn === undefined
    || requestedFailOn === 'error'
    ? 'error'
    : requestedFailOn === 'warning' || requestedFailOn === 'info'
      ? requestedFailOn
      : 'error';
  if (requestedFailOn !== undefined && failOn !== requestedFailOn) {
    findings.push(finding(
      'FAIL_THRESHOLD_INVALID',
      'error',
      `Fail threshold is unsupported; using fail-closed error threshold: ${observedRuntimeValue(requestedFailOn)}`,
    ));
  }

  const registryInput = options.registry as unknown;
  let normalizedRegistryInput = registryInput;
  const registryObject = runtimeRecord(registryInput);
  if (registryObject) {
    const candidate: Record<string, unknown> = { ...registryObject };
    if (registryObject.schemaVersion !== 1) {
      findings.push(finding(
        'REGISTRY_SCHEMA_VERSION_UNSUPPORTED',
        'error',
        `Architecture registry schemaVersion must be 1, received ${observedRuntimeValue(registryObject.schemaVersion)}`,
      ));
      candidate.schemaVersion = 1;
    }
    if (Array.isArray(registryObject.analysisProjects)
      && registryObject.analysisProjects.length === 0) {
      findings.push(finding(
        'ANALYSIS_PROJECT_REQUIRED',
        'error',
        'analysisProjects must contain at least one project when provided',
      ));
      delete candidate.analysisProjects;
    }
    if (
      Array.isArray(registryObject.capabilities)
      && registryObject.capabilities.length <= MAX_ARCHITECTURE_COLLECTION_ITEMS
    ) {
      candidate.capabilities = registryObject.capabilities.map((value) => {
        const capability = runtimeRecord(value);
        if (
          !capability
          || capability.status === undefined
          || supportedCapabilityStatuses.has(capability.status as CapabilityStatus)
        ) {
          return value;
        }
        const capabilityId = optionalFindingId(capability.id);
        findings.push(finding(
          'CAPABILITY_STATUS_INVALID',
          'error',
          `Capability status is unsupported: ${observedRuntimeValue(capability.status)}`,
          capabilityId ? { capabilityId } : {},
        ));
        return { ...capability, status: 'planned' };
      });
    }
    normalizedRegistryInput = candidate;
  }
  let registry: ArchitectureRegistry;
  try {
    registry = parseArchitectureRegistry(normalizedRegistryInput);
  } catch (error) {
    findings.push(finding(
      'REGISTRY_INPUT_INVALID',
      'error',
      `Architecture registry input is invalid: ${runtimeErrorMessage(error)}`,
    ));
    registry = { schemaVersion: 1, capabilities: [] };
  }

  const requestedEvaluateImpactPolicies = options.evaluateImpactPolicies as unknown;
  const evaluateImpactPolicies = requestedEvaluateImpactPolicies !== false;
  if (
    requestedEvaluateImpactPolicies !== undefined
    && typeof requestedEvaluateImpactPolicies !== 'boolean'
  ) {
    findings.push(finding(
      'IMPACT_POLICY_EVALUATION_INVALID',
      'error',
      `evaluateImpactPolicies must be boolean; using fail-closed evaluation: ${observedRuntimeValue(requestedEvaluateImpactPolicies)}`,
    ));
  }
  const expectedSemVersion = `sem ${SUPPORTED_SEM_VERSION}`;
  const semVersionEvidenceValid = options.semVersion === undefined
    || options.semVersion === expectedSemVersion;
  const validSemVersion = options.semVersion === expectedSemVersion
    ? options.semVersion
    : undefined;
  if (!semVersionEvidenceValid) {
    const observed = typeof options.semVersion === 'string'
      ? JSON.stringify(
        options.semVersion.length <= 128
          ? options.semVersion
          : `${options.semVersion.slice(0, 128)}…`,
      )
      : typeof options.semVersion;
    findings.push(finding(
      'SEM_VERSION_EVIDENCE_INVALID',
      'error',
      `Sem version evidence is incompatible: expected ${expectedSemVersion}, received ${observed}`,
    ));
  }
  const capabilityIds = new Set<string>();
  const implementationAnchorOwners = new Map<string, string>();
  const projectIds = new Set<string>();
  const canonicalProjectRoots = new Map<string, { absolute: string; relative: string }>();
  const declaredProjects = registry.analysisProjects;
  const projects = declaredProjects ?? [{ id: 'default', root: '.' }];
  const projectById = new Map(projects.map((project) => [project.id, project]));

  for (const project of projects) {
    if (!projectIdPattern.test(project.id)) {
      findings.push(finding('ANALYSIS_PROJECT_ID_INVALID', 'error', `Analysis project id must match ${projectIdPattern}: ${project.id}`));
    }
    if (projectIds.has(project.id)) {
      findings.push(finding('ANALYSIS_PROJECT_ID_DUPLICATE', 'error', `Duplicate analysis project id: ${project.id}`));
    }
    projectIds.add(project.id);
    const rootIssue = await pathFinding(
      root,
      project.root,
      'ANALYSIS_PROJECT_ROOT_MISSING',
      undefined,
      'directory',
    );
    if (rootIssue) {
      findings.push(rootIssue);
    } else {
      try {
        const absolute = await canonicalRepositoryRoot(path.resolve(root, project.root));
        canonicalProjectRoots.set(project.id, {
          absolute,
          relative: repositoryRelativePath(root, absolute),
        });
      } catch {
        findings.push(finding(
          'ANALYSIS_PROJECT_ROOT_MISSING',
          'error',
          `Analysis project root does not exist or cannot be resolved: ${project.root}`,
          { path: project.root },
        ));
      }
    }
  }

  const analysisByProject = new Map<string, SemProjectAnalysis>();
  const validSemAnalyses: SemProjectAnalysis[] = [];
  const seenAnalysisProjects = new Set<string>();
  const semAnalysesInput = options.semAnalyses as unknown;
  const semAnalysisCandidates = semAnalysesInput === undefined
    ? []
    : Array.isArray(semAnalysesInput)
      && semAnalysesInput.length <= MAX_ARCHITECTURE_COLLECTION_ITEMS
      ? semAnalysesInput
      : [];
  if (semAnalysesInput !== undefined && !Array.isArray(semAnalysesInput)) {
    findings.push(finding(
      'SEM_ANALYSES_INPUT_INVALID',
      'error',
      `semAnalyses must be an array, received ${observedRuntimeValue(semAnalysesInput)}`,
    ));
  } else if (
    Array.isArray(semAnalysesInput)
    && semAnalysesInput.length > MAX_ARCHITECTURE_COLLECTION_ITEMS
  ) {
    findings.push(finding(
      'SEM_ANALYSES_LIMIT_EXCEEDED',
      'error',
      `semAnalyses exceeds ${MAX_ARCHITECTURE_COLLECTION_ITEMS} item limit`,
    ));
  }
  let semAnalysisCollectionEvidenceValid = true;
  const perAnalysisEvidence = semAnalysisCandidates.map((analysis) => {
    try {
      return {
        evidenceItems: semProjectAnalysisEvidenceItems(analysis),
        textCharacters: semAnalysisCollectionEvidenceTextCharacters([analysis]),
      };
    } catch (error) {
      return { issue: error };
    }
  });
  if (semAnalysisCandidates.length > 0) {
    const evidenceItems = perAnalysisEvidence.reduce(
      (total, evidence) => total + ('evidenceItems' in evidence
        ? (evidence.evidenceItems ?? 0)
        : 0),
      0,
    );
    const textCharacters = perAnalysisEvidence.reduce(
      (total, evidence) => total + ('textCharacters' in evidence
        ? (evidence.textCharacters ?? 0)
        : 0),
      0,
    );
    if (evidenceItems > MAX_SEM_EVIDENCE_ITEMS_TOTAL) {
      semAnalysisCollectionEvidenceValid = false;
      findings.push(finding(
        'SEM_ANALYSES_EVIDENCE_LIMIT_EXCEEDED',
        'error',
        `sem analyses exceed ${MAX_SEM_EVIDENCE_ITEMS_TOTAL} global evidence item limit`,
      ));
    } else if (textCharacters > MAX_SEM_EVIDENCE_TEXT_CHARS_TOTAL) {
      semAnalysisCollectionEvidenceValid = false;
      findings.push(finding(
        'SEM_ANALYSES_EVIDENCE_LIMIT_EXCEEDED',
        'error',
        `sem analyses exceed ${MAX_SEM_EVIDENCE_TEXT_CHARS_TOTAL} aggregate text character limit`,
      ));
    }
  }
  for (const [analysisIndex, analysis] of (semVersionEvidenceValid
    && semAnalysisCollectionEvidenceValid
    ? semAnalysisCandidates
    : []).entries()) {
    const evidence = perAnalysisEvidence[analysisIndex];
    const evidenceIssue = evidence && 'issue' in evidence
      ? evidence.issue
      : undefined;
    if (evidenceIssue !== undefined) {
      findings.push(finding(
        'SEM_ANALYSIS_EVIDENCE_INVALID',
        'error',
        runtimeErrorMessage(evidenceIssue),
      ));
      continue;
    }
    if (!analysis || typeof analysis !== 'object') {
      findings.push(finding(
        'SEM_ANALYSIS_EVIDENCE_INVALID',
        'error',
        'Sem analysis evidence must be an object',
      ));
      continue;
    }
    if (typeof analysis.projectId !== 'string' || analysis.projectId.length === 0) {
      findings.push(finding(
        'SEM_ANALYSIS_EVIDENCE_INVALID',
        'error',
        'Sem analysis projectId must be a non-empty string',
      ));
      continue;
    }
    if (typeof analysis.root !== 'string' || analysis.root.length === 0) {
      findings.push(finding(
        'SEM_ANALYSIS_EVIDENCE_INVALID',
        'error',
        `Sem analysis root must be a non-empty string for project ${analysis.projectId}`,
      ));
      continue;
    }
    if (seenAnalysisProjects.has(analysis.projectId)) {
      findings.push(finding('SEM_ANALYSIS_DUPLICATE', 'error', `Multiple sem analyses were provided for project: ${analysis.projectId}`));
      continue;
    }
    seenAnalysisProjects.add(analysis.projectId);
    const project = projectById.get(analysis.projectId);
    if (!project) {
      findings.push(finding('SEM_ANALYSIS_PROJECT_UNKNOWN', 'error', `Sem analysis references unknown project: ${analysis.projectId}`));
      continue;
    }
    const expectedRoot = canonicalProjectRoots.get(project.id)?.absolute
      ?? path.resolve(root, project.root);
    let actualRoot: string | undefined;
    try {
      actualRoot = await canonicalRepositoryRoot(analysis.root);
    } catch {
      // The mismatch finding below carries the stable report contract for invalid evidence roots.
    }
    if (actualRoot !== expectedRoot) {
      findings.push(finding('SEM_ANALYSIS_ROOT_MISMATCH', 'error', `Sem analysis root is ${analysis.root}, expected ${expectedRoot}`, { path: analysis.root }));
      continue;
    }
    try {
      assertSemProjectAnalysisIntegrity({
        repositoryRoot: root,
        project,
        analysis,
      });
    } catch (error) {
      findings.push(finding(
        'SEM_ANALYSIS_EVIDENCE_INVALID',
        'error',
        `Sem analysis evidence is invalid for project ${analysis.projectId}: ${diagnosticErrorMessage(error)}`,
      ));
      continue;
    }
    analysisByProject.set(analysis.projectId, analysis);
    validSemAnalyses.push(analysis);
  }
  let validSemChanges: VerificationOptions['semChanges'];
  if (semVersionEvidenceValid && options.semChanges !== undefined) {
    try {
      assertSemChangeSetIntegrity({
        repositoryRoot: root,
        changeSet: options.semChanges,
      });
      validSemChanges = options.semChanges;
    } catch (error) {
      findings.push(finding(
        'SEM_CHANGE_EVIDENCE_INVALID',
        'error',
        `Sem change evidence is invalid: ${diagnosticErrorMessage(error)}`,
      ));
    }
  }

  const topLevelEntityCounts = new Map<string, number>();
  const topLevelEntityCountsByProject = new Map<string, Map<string, number>>();
  for (const analysis of validSemAnalyses) {
    const projectCounts = new Map<string, number>();
    for (const entity of analysis.entities) {
      if (entity.parentId !== undefined) continue;
      projectCounts.set(entity.id, (projectCounts.get(entity.id) ?? 0) + 1);
      topLevelEntityCounts.set(
        entity.id,
        (topLevelEntityCounts.get(entity.id) ?? 0) + 1,
      );
    }
    topLevelEntityCountsByProject.set(analysis.projectId, projectCounts);
  }

  for (const capability of registry.capabilities) {
    if (!capabilityIdPattern.test(capability.id)) {
      findings.push(finding('CAPABILITY_ID_INVALID', 'error', `Capability id must match ${capabilityIdPattern}: ${capability.id}`, { capabilityId: capability.id }));
    }
    if (capabilityIds.has(capability.id)) {
      findings.push(finding('CAPABILITY_ID_DUPLICATE', 'error', `Duplicate capability id: ${capability.id}`, { capabilityId: capability.id }));
    }
    capabilityIds.add(capability.id);
    for (const anchor of capability.implementationAnchors.filter((value) => value.includes('::'))) {
      const previousCapabilityId = implementationAnchorOwners.get(anchor);
      if (previousCapabilityId !== undefined && previousCapabilityId !== capability.id) {
        findings.push(finding(
          'CAPABILITY_IMPLEMENTATION_DUPLICATE',
          'error',
          `Implementation anchor ${anchor} is declared by both ${previousCapabilityId} and ${capability.id}`,
          { capabilityId: capability.id, path: anchorPath(anchor) },
        ));
      } else {
        implementationAnchorOwners.set(anchor, capability.id);
      }
    }
    if (capability.project && !projectById.has(capability.project)) {
      findings.push(finding('CAPABILITY_ANALYSIS_PROJECT_UNKNOWN', 'error', `Capability references unknown analysis project: ${capability.project}`, { capabilityId: capability.id }));
    } else if (capability.project) {
      const project = projectById.get(capability.project);
      if (project) {
        const projectRoot = canonicalProjectRoots.get(project.id)?.relative ?? project.root;
        for (const candidate of [
          ...capability.owners,
          ...capability.implementationAnchors.map(anchorPath),
        ]) {
          if (!pathBelongsToProject(candidate, projectRoot)) {
            findings.push(finding('CAPABILITY_PROJECT_SCOPE_MISMATCH', 'error', `Capability path ${candidate} is outside analysis project ${capability.project} (${projectRoot})`, { capabilityId: capability.id, path: candidate }));
          }
        }
      }
    }
    findings.push(...requiredEvidenceFindings(capability));
    findings.push(...await verifyCapabilityPaths(root, capability));

    const hasAnalysis = capability.project
      ? analysisByProject.has(capability.project)
      : analysisByProject.size > 0;
    if (semAnalysisCandidates.length > 0 && capability.project && !hasAnalysis) {
      findings.push(finding('CAPABILITY_SEM_ANALYSIS_MISSING', 'error', `No sem analysis was provided for capability project: ${capability.project}`, { capabilityId: capability.id }));
    }
    if (hasAnalysis) {
      const entityCounts = capability.project
        ? topLevelEntityCountsByProject.get(capability.project)
        : topLevelEntityCounts;
      for (const anchor of capability.implementationAnchors.filter((value) => value.includes('::'))) {
        const matches = entityCounts?.get(anchor) ?? 0;
        if (matches === 0) {
          findings.push(finding('IMPLEMENTATION_ANCHOR_NOT_IN_SEM', 'error', `Implementation anchor is absent from sem entities: ${anchor}`, { capabilityId: capability.id, path: anchorPath(anchor) }));
        } else if (matches > 1) {
          findings.push(finding('IMPLEMENTATION_ANCHOR_AMBIGUOUS', 'error', `Implementation anchor matches multiple top-level sem entities: ${anchor}`, { capabilityId: capability.id, path: anchorPath(anchor) }));
        }
      }
    }
  }

  const compatiblePolicies: ArchitecturePolicySet[] = [];
  const preflightInvalidPolicyIds = new Set<string>();
  const policiesInput = options.policies as unknown;
  const policyCandidates = policiesInput === undefined
    ? []
    : Array.isArray(policiesInput)
      && policiesInput.length <= MAX_ARCHITECTURE_COLLECTION_ITEMS
      ? policiesInput
      : [];
  if (policiesInput !== undefined && !Array.isArray(policiesInput)) {
    findings.push(finding(
      'POLICIES_INPUT_INVALID',
      'error',
      `policies must be an array, received ${observedRuntimeValue(policiesInput)}`,
    ));
  } else if (
    Array.isArray(policiesInput)
    && policiesInput.length > MAX_ARCHITECTURE_COLLECTION_ITEMS
  ) {
    findings.push(finding(
      'POLICY_SET_LIMIT_EXCEEDED',
      'error',
      `policies exceeds ${MAX_ARCHITECTURE_COLLECTION_ITEMS} item limit`,
    ));
  }
  let policyReferenceItems = 0;
  for (const [index, value] of policyCandidates.entries()) {
    const remainingReferenceItems = MAX_ARCHITECTURE_REFERENCE_ITEMS
      - policyReferenceItems;
    const inputReferenceItems = policyInputReferenceItems(
      value,
      remainingReferenceItems,
    );
    if (inputReferenceItems > remainingReferenceItems) {
      findings.push(finding(
        'POLICY_REFERENCE_LIMIT_EXCEEDED',
        'error',
        `Policy inputs exceed the global limit of ${MAX_ARCHITECTURE_REFERENCE_ITEMS} reference items`,
      ));
      break;
    }
    policyReferenceItems += inputReferenceItems;
    const policy = runtimeRecord(value);
    if (!policy) {
      findings.push(finding(
        'POLICY_INPUT_INVALID',
        'error',
        `Policy set at index ${index} must be an object`,
      ));
      continue;
    }
    if (policy.schemaVersion !== 1) {
      findings.push(finding(
        'POLICY_SCHEMA_VERSION_UNSUPPORTED',
        'error',
        `Policy set at index ${index} schemaVersion must be 1, received ${observedRuntimeValue(policy.schemaVersion)}`,
      ));
      continue;
    }
    const packageRulesEmpty = policy.packageBoundaries === undefined
      || (Array.isArray(policy.packageBoundaries) && policy.packageBoundaries.length === 0);
    const impactRulesEmpty = policy.impactBoundaries === undefined
      || (Array.isArray(policy.impactBoundaries) && policy.impactBoundaries.length === 0);
    if (
      packageRulesEmpty
      && impactRulesEmpty
    ) {
      findings.push(finding(
        'POLICY_SET_EMPTY',
        'error',
        `Policy set at index ${index} does not declare any rules`,
      ));
      continue;
    }

    const normalizedPolicy: Record<string, unknown> = { ...policy };
    if (Array.isArray(policy.packageBoundaries)) {
      normalizedPolicy.packageBoundaries = policy.packageBoundaries.map((value) => {
        const rule = runtimeRecord(value);
        if (
          !rule
          || rule.severity === undefined
          || supportedSeverities.has(rule.severity as Severity)
        ) {
          return value;
        }
        const ruleId = optionalFindingId(rule.id);
        findings.push(finding(
          'PACKAGE_POLICY_SEVERITY_INVALID',
          'error',
          `Package policy severity is unsupported: ${observedRuntimeValue(rule.severity)}`,
          ruleId ? { ruleId } : {},
        ));
        if (ruleId) preflightInvalidPolicyIds.add(ruleId);
        return { ...rule, severity: 'error' };
      });
    }
    if (Array.isArray(policy.impactBoundaries)) {
      normalizedPolicy.impactBoundaries = policy.impactBoundaries.map((value) => {
        const rule = runtimeRecord(value);
        if (!rule) return value;
        const normalizedRule: Record<string, unknown> = { ...rule };
        const ruleId = optionalFindingId(rule.id);
        if (
          rule.severity !== undefined
          && !supportedSeverities.has(rule.severity as Severity)
        ) {
          findings.push(finding(
            'SEM_POLICY_SEVERITY_INVALID',
            'error',
            `Impact policy severity is unsupported: ${observedRuntimeValue(rule.severity)}`,
            ruleId ? { ruleId } : {},
          ));
          if (ruleId) preflightInvalidPolicyIds.add(ruleId);
          normalizedRule.severity = 'error';
        }
        if (
          rule.missingEvidenceSeverity !== undefined
          && !supportedSeverities.has(rule.missingEvidenceSeverity as Severity)
        ) {
          findings.push(finding(
            'SEM_POLICY_MISSING_EVIDENCE_SEVERITY_INVALID',
            'error',
            `Impact policy missingEvidenceSeverity is unsupported: ${observedRuntimeValue(rule.missingEvidenceSeverity)}`,
            ruleId ? { ruleId } : {},
          ));
          if (ruleId) preflightInvalidPolicyIds.add(ruleId);
          normalizedRule.missingEvidenceSeverity = 'error';
        }
        let invalidGlobReported = false;
        for (const field of ['from', 'disallowDependencies'] as const) {
          if (!Array.isArray(rule[field])) continue;
          const normalizedPatterns = rule[field].map((pattern, patternIndex) => {
            if (typeof pattern !== 'string') return pattern;
            const issue = globPatternIssue(pattern);
            if (!issue) return pattern;
            if (!invalidGlobReported) {
              findings.push(finding(
                'SEM_POLICY_GLOB_INVALID',
                'error',
                `Impact policy ${field} ${issue}`,
                ruleId ? { ruleId } : {},
              ));
              invalidGlobReported = true;
            }
            if (ruleId) preflightInvalidPolicyIds.add(ruleId);
            return `__invalid-glob-${field}-${patternIndex}__`;
          });
          normalizedRule[field] = normalizedPatterns;
          if (
            !invalidGlobReported
            && normalizedPatterns.every((pattern) => typeof pattern === 'string')
          ) {
            const issue = globPatternSetIssue(normalizedPatterns);
            if (issue) {
              findings.push(finding(
                'SEM_POLICY_GLOB_INVALID',
                'error',
                `Impact policy ${field} ${issue}`,
                ruleId ? { ruleId } : {},
              ));
              invalidGlobReported = true;
              if (ruleId) preflightInvalidPolicyIds.add(ruleId);
              normalizedRule[field] = [`__invalid-glob-${field}-set__`];
            }
          }
        }
        return normalizedRule;
      });
    }
    try {
      compatiblePolicies.push(parseArchitecturePolicySet(normalizedPolicy));
    } catch (error) {
      findings.push(finding(
        'POLICY_INPUT_INVALID',
        'error',
        `Policy set at index ${index} is invalid: ${runtimeErrorMessage(error)}`,
      ));
    }
  }
  const policies = allPolicies(compatiblePolicies);
  const policyIds = new Set<string>();
  const invalidPolicyIds = new Set(preflightInvalidPolicyIds);
  for (const rule of [...policies.packages, ...policies.impacts]) {
    if (policyIds.has(rule.id)) {
      findings.push(finding('POLICY_ID_DUPLICATE', 'error', `Duplicate policy id: ${rule.id}`, { ruleId: rule.id }));
    }
    policyIds.add(rule.id);
  }
  for (const rule of policies.impacts) {
    const invalidGlob = [
      { field: 'from', issue: globPatternSetIssue(rule.from) },
      {
        field: 'disallowDependencies',
        issue: globPatternSetIssue(rule.disallowDependencies),
      },
    ].find(({ issue }) => issue !== undefined);
    if (invalidGlob) {
      findings.push(finding(
        'SEM_POLICY_GLOB_INVALID',
        'error',
        `Impact policy ${invalidGlob.field} ${invalidGlob.issue}`,
        { ruleId: rule.id },
      ));
      invalidPolicyIds.add(rule.id);
      continue;
    }
    if (rule.project && !projectById.has(rule.project)) {
      findings.push(finding('SEM_POLICY_PROJECT_UNKNOWN', 'error', `Impact policy references unknown project: ${rule.project}`, { ruleId: rule.id }));
      invalidPolicyIds.add(rule.id);
    } else if (rule.project) {
      const project = projectById.get(rule.project);
      const projectRoot = project
        ? canonicalProjectRoots.get(project.id)?.relative ?? project.root
        : undefined;
      if (projectRoot && rule.from.some((candidate) => !pathBelongsToProject(candidate, projectRoot))) {
        findings.push(finding('SEM_POLICY_SCOPE_MISMATCH', 'error', `Impact policy source is outside analysis project ${rule.project} (${projectRoot})`, { ruleId: rule.id }));
        invalidPolicyIds.add(rule.id);
      }
    }
  }
  for (const rule of policies.packages) {
    if (rule.project && !projectById.has(rule.project)) {
      findings.push(finding('PACKAGE_POLICY_PROJECT_UNKNOWN', 'error', `Package policy references unknown project: ${rule.project}`, { ruleId: rule.id }));
      invalidPolicyIds.add(rule.id);
    } else if (rule.project) {
      const project = projectById.get(rule.project);
      const projectRoot = project
        ? canonicalProjectRoots.get(project.id)?.relative ?? project.root
        : undefined;
      if (projectRoot && !pathBelongsToProject(rule.from, projectRoot)) {
        findings.push(finding('PACKAGE_POLICY_SCOPE_MISMATCH', 'error', `Package policy path ${rule.from} is outside analysis project ${rule.project} (${projectRoot})`, { ruleId: rule.id, path: rule.from }));
        invalidPolicyIds.add(rule.id);
      }
    }
  }
  for (const capability of registry.capabilities) {
    for (const ruleId of capability.rules ?? []) {
      if (!policyIds.has(ruleId)) {
        findings.push(finding('CAPABILITY_POLICY_UNKNOWN', 'error', `Capability references unknown policy: ${ruleId}`, { capabilityId: capability.id, ruleId }));
      }
    }
  }
  for (const rule of policies.packages) {
    if (invalidPolicyIds.has(rule.id)) continue;
    findings.push(...await verifyPackageBoundary(root, rule));
  }
  if (evaluateImpactPolicies) {
    const impactEvaluationBudget: ImpactPolicyEvaluationBudget = { operations: 0 };
    for (const rule of policies.impacts) {
      if (invalidPolicyIds.has(rule.id)) continue;
      const verification = verifyImpactBoundary(
        rule,
        validSemAnalyses,
        impactEvaluationBudget,
      );
      findings.push(...verification.findings);
      if (verification.limitExceeded) {
        findings.push(finding(
          'SEM_IMPACT_EVALUATION_LIMIT_EXCEEDED',
          'error',
          `Impact policy evaluation exceeded the global limit of ${MAX_IMPACT_POLICY_EVALUATION_OPERATIONS} operations; narrow impact policy patterns or selected projects`,
          { ruleId: rule.id },
        ));
        break;
      }
    }
  }

  findings.sort((left, right) =>
    severityRank[right.severity] - severityRank[left.severity]
      || compareStableText(left.capabilityId ?? '', right.capabilityId ?? '')
      || compareStableText(left.code, right.code)
      || compareStableText(left.message, right.message));
  const directFindingCountsByCapability = new Map<string, number>();
  const findingCountsByRule = new Map<string, number>();
  const overlappingFindingCounts = new Map<string, Map<string, number>>();
  for (const entry of findings) {
    if (entry.capabilityId !== undefined) {
      directFindingCountsByCapability.set(
        entry.capabilityId,
        (directFindingCountsByCapability.get(entry.capabilityId) ?? 0) + 1,
      );
    }
    if (entry.ruleId !== undefined) {
      findingCountsByRule.set(
        entry.ruleId,
        (findingCountsByRule.get(entry.ruleId) ?? 0) + 1,
      );
    }
    if (entry.capabilityId !== undefined && entry.ruleId !== undefined) {
      let countsByRule = overlappingFindingCounts.get(entry.capabilityId);
      if (countsByRule === undefined) {
        countsByRule = new Map<string, number>();
        overlappingFindingCounts.set(entry.capabilityId, countsByRule);
      }
      countsByRule.set(entry.ruleId, (countsByRule.get(entry.ruleId) ?? 0) + 1);
    }
  }
  const counts = {
    errors: findings.filter((entry) => entry.severity === 'error').length,
    warnings: findings.filter((entry) => entry.severity === 'warning').length,
    info: findings.filter((entry) => entry.severity === 'info').length,
  };
  const resolvedRegistryPath = resolveRepositoryPath(
    root,
    options.registryPath,
    'Registry path',
  );
  const registryRelativePath = path.relative(root, resolvedRegistryPath).split(path.sep).join('/');
  const normalizedRegistryPath = registryRelativePath === '' ? '.' : registryRelativePath;
  const semanticFiles = validSemChanges
    ? [...new Set(validSemChanges.changes.flatMap((change) => [
      change.filePath,
      ...(change.oldFilePath ? [change.oldFilePath] : []),
    ]))].sort()
    : [];
  const binaryFiles = validSemChanges
    ? [...new Set((validSemChanges.binaryChanges ?? []).flatMap((change) => [
      change.filePath,
      ...(change.oldFilePath ? [change.oldFilePath] : []),
    ]))].sort()
    : [];
  const untrackedFiles = [...new Set(validSemChanges?.untrackedFiles ?? [])].sort();
  const changedFiles = [...new Set([
    ...semanticFiles,
    ...binaryFiles,
    ...untrackedFiles,
  ])].sort();
  const reportedCapabilityIds = new Set<string>();
  const reportedCapabilities = registry.capabilities.filter((capability) => {
    if (!hasVisibleText(capability.id)) return false;
    if (reportedCapabilityIds.has(capability.id)) return false;
    reportedCapabilityIds.add(capability.id);
    return true;
  });
  const controlPaths = new Set([
    normalizedRegistryPath,
    ...(registry.policyFiles ?? []),
  ].map(normalizedRepositoryCandidate));
  const architectureControlChanged = changedFiles.some((file) =>
    controlPaths.has(normalizedRepositoryCandidate(file)));
  const changedCandidatePaths = changedFileCandidateIndex(changedFiles);
  const affectedCapabilityRecords = validSemChanges
    ? (architectureControlChanged
      ? reportedCapabilities
      : reportedCapabilities
      .filter((capability) => capabilityPaths(capability).some((candidate) =>
        changedCandidatePaths.has(normalizedRepositoryCandidate(candidate)))))
    : [];
  const affectedCapabilities = [...new Set(
    affectedCapabilityRecords.map((capability) => capability.id),
  )];
  const affectedDocuments = normalizedReportFiles(affectedCapabilityRecords.flatMap((capability) => [
    capability.spec,
    ...capability.publicDocs,
    ...(capability.decisions ?? []),
  ]));
  const affectedTests = normalizedReportFiles(affectedCapabilityRecords.flatMap((capability) =>
    capability.testEvidence));

  const report: VerificationReport = {
    contractId: 'context-action/architecture-verification-report',
    contractVersion: '2.4',
    generatedAt: new Date().toISOString(),
    repositoryRoot: root,
    registryPath: normalizedRegistryPath,
    failOn,
    passed: !findings.some((entry) => severityRank[entry.severity] >= severityRank[failOn]),
    summary: { capabilities: reportedCapabilities.length, ...counts },
    capabilities: reportedCapabilities.map((capability) => ({
      id: capability.id,
      status: supportedCapabilityStatuses.has(capability.status)
        ? capability.status
        : 'planned',
      findings: (directFindingCountsByCapability.get(capability.id) ?? 0)
        + (capability.rules ?? []).reduce((total, ruleId) =>
          total
          + (findingCountsByRule.get(ruleId) ?? 0)
          - (overlappingFindingCounts.get(capability.id)?.get(ruleId) ?? 0), 0),
      implementationAnchors: capability.implementationAnchors.length,
      testEvidence: capability.testEvidence.length,
      publicDocs: capability.publicDocs.length,
    })),
    findings,
    symbolUsages: collectSymbolUsageRecords(registry, validSemAnalyses),
    ...(validSemVersion ? { semVersion: validSemVersion } : {}),
    semAnalyses: validSemAnalyses.map((analysis) => ({
      projectId: analysis.projectId,
      root: analysis.root,
      entities: analysis.entities.length,
      impacts: analysis.impacts.length,
      ...(analysis.durationMs === undefined ? {} : { durationMs: analysis.durationMs }),
    })),
    ...(validSemChanges ? {
      semChanges: {
        source: validSemChanges.source,
        entities: validSemChanges.changes.length,
        files: changedFiles,
        semanticFiles,
        binaryFiles,
        untrackedFiles,
        affectedCapabilities,
        affectedDocuments,
        affectedTests,
      },
    } : {}),
  };
  assertVerificationReport(report);
  return report;
}

export function reportFailsAt(report: VerificationReport, threshold: Severity): boolean {
  assertVerificationReport(report);
  if (!supportedSeverities.has(threshold as Severity)) {
    throw new InputContractError(
      `Report fail threshold is unsupported: ${observedRuntimeValue(threshold)}`,
    );
  }
  const thresholdRank = severityRank[threshold];
  return report.findings.some((entry) => severityRank[entry.severity] >= thresholdRank);
}

export function appendSemExecutionFailure(
  report: VerificationReport,
  failure: SemExecutionFailure,
): VerificationReport {
  assertVerificationReport(report);
  const boundedFailure = boundSemExecutionFailure(failure);
  const project = boundedFailure.projectId ? ` for project ${boundedFailure.projectId}` : '';
  const failureFinding = finding(
    'SEM_EXECUTION_FAILED',
    'error',
    `sem ${boundedFailure.operation}${project} failed (${boundedFailure.reason}) after ${boundedFailure.durationMs}ms`,
  );
  const result: VerificationReport = {
    ...report,
    generatedAt: new Date().toISOString(),
    passed: false,
    summary: {
      ...report.summary,
      errors: report.summary.errors + 1,
    },
    findings: [failureFinding, ...report.findings],
    semFailure: boundedFailure,
  };
  assertVerificationReport(result);
  return result;
}
