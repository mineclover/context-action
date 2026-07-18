import type { AnalysisProject } from '@sem-foundation/contracts';

export type Severity = 'error' | 'warning' | 'info';

export type CapabilityStatus =
  | 'planned'
  | 'implemented'
  | 'verified'
  | 'deprecated';

export interface ArchitectureCapability {
  id: string;
  status: CapabilityStatus;
  project?: string;
  spec: string;
  /** Authored responsibility statement; source comments remain the implementation-adjacent detail. */
  role?: string;
  owners: string[];
  implementationAnchors: string[];
  testEvidence: string[];
  publicDocs: string[];
  decisions?: string[];
  rules?: string[];
}

export type ArchitectureProject = AnalysisProject;
export type { AnalysisProject } from '@sem-foundation/contracts';

export interface ArchitectureRegistry {
  $schema?: string;
  schemaVersion: 1;
  repository?: string;
  analysisProjects?: ArchitectureProject[];
  policyFiles?: string[];
  capabilities: ArchitectureCapability[];
}

export type PackageDependencyField =
  | 'dependencies'
  | 'devDependencies'
  | 'peerDependencies'
  | 'optionalDependencies';

export interface PackageBoundaryPolicy {
  id: string;
  project?: string;
  from: string;
  disallow?: string[];
  require?: string[];
  dependencyFields?: PackageDependencyField[];
  severity?: Severity;
}

export interface ImpactBoundaryPolicy {
  id: string;
  project?: string;
  from: string[];
  disallowDependencies: string[];
  severity?: Severity;
  missingEvidenceSeverity?: Severity;
}

export interface ArchitecturePolicySet {
  $schema?: string;
  schemaVersion: 1;
  packageBoundaries?: PackageBoundaryPolicy[];
  impactBoundaries?: ImpactBoundaryPolicy[];
}

export interface SemEntity {
  id: string;
  file: string;
  name: string;
  kind: string;
  startLine: number;
  endLine: number;
  parentId?: string;
}

export interface SemRelatedEntity {
  entityId: string;
  file: string;
  name: string;
  kind: string;
}

export interface SemImpact {
  entity: SemRelatedEntity;
  dependencies: SemRelatedEntity[];
  dependents: SemRelatedEntity[];
  tests: SemRelatedEntity[];
}

export interface SemProjectAnalysis {
  projectId: string;
  root: string;
  entities: SemEntity[];
  impacts: SemImpact[];
  durationMs?: number;
}

export type SemOperation = 'version' | 'entities' | 'impact' | 'diff';

export type SemFailureReason =
  | 'spawn'
  | 'timeout'
  | 'output-limit'
  | 'query-limit'
  | 'exit'
  | 'invalid-json'
  | 'invalid-output';

export interface SemExecutionLimits {
  timeoutMs: number;
  maxOutputBytes: number;
}

export interface SemExecutionFailure extends SemExecutionLimits {
  operation: SemOperation;
  reason: SemFailureReason;
  command: string;
  args: string[];
  cwd: string;
  durationMs: number;
  impactTargets?: number;
  maxImpactQueries?: number;
  projectId?: string;
  requestedProjects?: string[];
  completedProjects?: string[];
  skippedProjects?: string[];
  expectedVersion?: string;
  observedVersion?: string;
  exitCode?: number;
  signal?: string;
  stderr?: string;
  detail?: string;
}

export interface SemChange {
  entityId: string;
  changeType: SemChangeType;
  filePath: string;
  oldFilePath?: string;
}

export type SemChangeType =
  | 'added'
  | 'modified'
  | 'deleted'
  | 'moved'
  | 'renamed'
  | 'reordered';

export type SemBinaryChangeStatus =
  | 'added'
  | 'modified'
  | 'deleted'
  | 'renamed';

export interface SemBinaryChange {
  filePath: string;
  status: SemBinaryChangeStatus;
  oldFilePath?: string;
}

export type SemChangeSource =
  | { mode: 'working' }
  | { mode: 'staged' }
  | { mode: 'range'; from: string; to: string };

export interface SemChangeSet {
  source: SemChangeSource;
  changes: SemChange[];
  binaryChanges?: SemBinaryChange[];
  untrackedFiles?: string[];
}

export interface VerificationFinding {
  code: string;
  severity: Severity;
  message: string;
  capabilityId?: string;
  ruleId?: string;
  path?: string;
}

export interface CapabilityVerification {
  id: string;
  status: CapabilityStatus;
  findings: number;
  implementationAnchors: number;
  testEvidence: number;
  publicDocs: number;
}

export interface SymbolUsageRecord {
  capabilityId: string;
  anchor: string;
  projectId: string;
  definition: {
    file: string;
    startLine: number;
    endLine: number;
  };
  usageFiles: string[];
}

export interface VerificationReport {
  contractId: 'context-action/architecture-verification-report';
  contractVersion: '2.4';
  generatedAt: string;
  repositoryRoot: string;
  registryPath: string;
  failOn: Severity;
  passed: boolean;
  summary: {
    capabilities: number;
    errors: number;
    warnings: number;
    info: number;
  };
  capabilities: CapabilityVerification[];
  findings: VerificationFinding[];
  symbolUsages?: SymbolUsageRecord[];
  semVersion?: string;
  semFailure?: SemExecutionFailure;
  semAnalyses: Array<{
    projectId: string;
    root: string;
    entities: number;
    impacts: number;
    durationMs?: number;
  }>;
  semChanges?: {
    source: SemChangeSet['source'];
    entities: number;
    files: string[];
    semanticFiles: string[];
    binaryFiles: string[];
    untrackedFiles: string[];
    affectedCapabilities: string[];
    affectedDocuments: string[];
    affectedTests: string[];
  };
}

export interface VerificationOptions {
  root: string;
  registryPath: string;
  registry: ArchitectureRegistry;
  policies?: ArchitecturePolicySet[];
  semAnalyses?: SemProjectAnalysis[];
  semChanges?: SemChangeSet;
  semVersion?: string;
  failOn?: Severity;
  evaluateImpactPolicies?: boolean;
}
