import { constants as fsConstants } from 'node:fs';
import { open, stat } from 'node:fs/promises';
import { TextDecoder } from 'node:util';
import {
  normalizeAnalysisProjectFileExtensions,
  resolveSemFoundationLimits,
  type SemFoundationLimitOptions,
} from '@sem-foundation/contracts';
import type {
  ArchitectureCapability,
  ArchitecturePolicySet,
  ArchitectureRegistry,
  CapabilityStatus,
  ImpactBoundaryPolicy,
  PackageDependencyField,
  Severity,
} from './contracts.js';
import {
  assertKnownFields,
  diagnosticErrorMessage,
  toInputContractError,
} from './diagnostics.js';
import { InputContractError } from './errors.js';
import {
  globPatternSetIssue,
  MAX_GLOB_PATTERN_SET_COMPLEXITY,
} from './patterns.js';
import { hasVisibleText, isWellFormedText } from './text.js';

export { InputContractError } from './errors.js';

export const MAX_ARCHITECTURE_JSON_BYTES = 4 * 1024 * 1024;
export const MAX_PACKAGE_MANIFEST_BYTES = 1024 * 1024;
export const MAX_ARCHITECTURE_COLLECTION_ITEMS = 4096;
export const MAX_ARCHITECTURE_REFERENCE_ITEMS = 16_384;
export const MAX_ARCHITECTURE_TEXT_CHARS = 4096;
export const MAX_ARCHITECTURE_TEXT_CHARS_TOTAL = 4 * 1024 * 1024;
const MAX_BOUNDED_JSON_BYTES = 64 * 1024 * 1024;

const capabilityStatuses = new Set<CapabilityStatus>([
  'planned',
  'implemented',
  'verified',
  'deprecated',
]);
const severities = new Set<Severity>(['error', 'warning', 'info']);
const dependencyFields = new Set<PackageDependencyField>([
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
]);

function knownKeys(
  input: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
): void {
  assertKnownFields(input, allowed, label);
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InputContractError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new InputContractError(`${label} must be a non-empty string`);
  }
  if (!isWellFormedText(value)) {
    throw new InputContractError(`${label} must contain well-formed Unicode`);
  }
  if (value.includes('\0')) {
    throw new InputContractError(`${label} must not contain null bytes`);
  }
  if (value.length > MAX_ARCHITECTURE_TEXT_CHARS) {
    throw new InputContractError(
      `${label} exceeds ${MAX_ARCHITECTURE_TEXT_CHARS} character limit`,
    );
  }
  return value;
}

function visibleString(value: unknown, label: string): string {
  const result = string(value, label);
  if (!hasVisibleText(result)) {
    throw new InputContractError(`${label} must be a non-empty string containing visible text`);
  }
  return result;
}

export function normalizeArchitectureFileExtensions(
  value: unknown,
  label: string,
  limits?: SemFoundationLimitOptions,
): string[] | undefined {
  if (value === undefined) return undefined;
  try {
    return [...normalizeAnalysisProjectFileExtensions(
      value as readonly string[],
      label,
      limits,
    )];
  } catch (error) {
    if (error instanceof TypeError) throw new InputContractError(error.message);
    throw error;
  }
}

function assertArchitectureTextBudget(value: object, label: string): void {
  let textCharacters = 0;
  const stack: unknown[] = [value];
  const seen = new WeakSet<object>();
  while (stack.length > 0) {
    const current = stack.pop();
    if (typeof current === 'string') {
      if (
        current.length
        > MAX_ARCHITECTURE_TEXT_CHARS_TOTAL - textCharacters
      ) {
        throw new InputContractError(
          `${label} exceeds ${MAX_ARCHITECTURE_TEXT_CHARS_TOTAL} aggregate text character limit`,
        );
      }
      textCharacters += current.length;
      continue;
    }
    if (current === null || typeof current !== 'object') continue;
    if (seen.has(current)) continue;
    seen.add(current);
    if (Array.isArray(current)) {
      for (let index = current.length - 1; index >= 0; index -= 1) {
        stack.push(current[index]);
      }
    } else {
      stack.push(...Object.values(current));
    }
  }
}

function boundedArray(
  value: unknown,
  label: string,
  maxItems = MAX_ARCHITECTURE_COLLECTION_ITEMS,
): unknown[] {
  if (!Array.isArray(value)) {
    throw new InputContractError(`${label} must be an array`);
  }
  if (value.length > maxItems) {
    throw new InputContractError(
      `${label} exceeds ${maxItems} item limit`,
    );
  }
  return value;
}

function strings(
  value: unknown,
  label: string,
  maxItems = MAX_ARCHITECTURE_COLLECTION_ITEMS,
): string[] {
  const values = boundedArray(value, label, maxItems);
  const entries = values.map((entry, index) => string(entry, `${label}[${index}]`));
  if (new Set(entries).size !== entries.length) {
    throw new InputContractError(`${label} must not contain duplicate values`);
  }
  return entries;
}

function nonEmptyStrings(
  value: unknown,
  label: string,
  maxItems = MAX_ARCHITECTURE_COLLECTION_ITEMS,
): string[] {
  const entries = strings(value, label, maxItems);
  if (entries.length === 0) {
    throw new InputContractError(`${label} must contain at least one value`);
  }
  return entries;
}

function optionalStrings(value: unknown, label: string): string[] | undefined {
  return value === undefined ? undefined : strings(value, label);
}

function consumeReferenceItems(
  current: number,
  value: unknown,
  label: string,
): number {
  const next = current + (Array.isArray(value) ? value.length : 0);
  if (next > MAX_ARCHITECTURE_REFERENCE_ITEMS) {
    throw new InputContractError(
      `${label} exceeds ${MAX_ARCHITECTURE_REFERENCE_ITEMS} aggregate reference item limit`,
    );
  }
  return next;
}

function assertRegistryReferenceLimit(
  capabilities: unknown[],
  analysisProjects: unknown,
  policyFiles: unknown,
): void {
  let references = capabilities.length;
  references = consumeReferenceItems(
    references,
    analysisProjects,
    'registry',
  );
  references = consumeReferenceItems(references, policyFiles, 'registry');
  for (const capabilityValue of capabilities) {
    const capability = capabilityValue !== null
      && typeof capabilityValue === 'object'
      && !Array.isArray(capabilityValue)
      ? capabilityValue as Record<string, unknown>
      : undefined;
    if (!capability) continue;
    references += 1; // spec
    if (references > MAX_ARCHITECTURE_REFERENCE_ITEMS) {
      throw new InputContractError(
        `registry exceeds ${MAX_ARCHITECTURE_REFERENCE_ITEMS} aggregate reference item limit`,
      );
    }
    for (const field of [
      'owners',
      'implementationAnchors',
      'testEvidence',
      'publicDocs',
      'decisions',
      'rules',
    ]) {
      references = consumeReferenceItems(
        references,
        capability[field],
        'registry',
      );
    }
  }
}

function assertPolicyReferenceLimit(
  packageBoundaries: unknown[],
  impactBoundaries: unknown[],
): void {
  let references = packageBoundaries.length + impactBoundaries.length;
  if (references > MAX_ARCHITECTURE_REFERENCE_ITEMS) {
    throw new InputContractError(
      `policy set exceeds ${MAX_ARCHITECTURE_REFERENCE_ITEMS} aggregate reference item limit`,
    );
  }
  for (const [rules, fields] of [
    [packageBoundaries, ['disallow', 'require', 'dependencyFields']],
    [impactBoundaries, ['from', 'disallowDependencies']],
  ] as const) {
    for (const ruleValue of rules) {
      const rule = ruleValue !== null
        && typeof ruleValue === 'object'
        && !Array.isArray(ruleValue)
        ? ruleValue as Record<string, unknown>
        : undefined;
      if (!rule) continue;
      for (const field of fields) {
        references = consumeReferenceItems(references, rule[field], 'policy set');
      }
    }
  }
}

export async function readBoundedJsonFile(
  filePath: string,
  options: {
    label: string;
    maxBytes: number;
  },
): Promise<unknown> {
  const input = record(options as unknown, 'JSON read options');
  knownKeys(input, ['label', 'maxBytes'], 'JSON read options');
  const normalizedPath = string(filePath, 'JSON file path');
  const label = string(input.label, 'JSON read options.label');
  const requestedMaxBytes = input.maxBytes;
  if (
    !Number.isSafeInteger(requestedMaxBytes)
    || (requestedMaxBytes as number) <= 0
    || (requestedMaxBytes as number) > MAX_BOUNDED_JSON_BYTES
  ) {
    throw new InputContractError(
      `JSON byte limit must be an integer between 1 and ${MAX_BOUNDED_JSON_BYTES}`,
    );
  }
  const maxBytes = requestedMaxBytes as number;
  try {
    if (!(await stat(normalizedPath)).isFile()) {
      throw new InputContractError(`${label} must be a file: ${normalizedPath}`);
    }
  } catch (error) {
    if (error instanceof InputContractError) throw error;
    throw new InputContractError(
      `Cannot inspect ${label} ${normalizedPath}: ${diagnosticErrorMessage(error)}`,
    );
  }
  let handle: Awaited<ReturnType<typeof open>>;
  try {
    handle = await open(
      normalizedPath,
      fsConstants.O_RDONLY | fsConstants.O_NONBLOCK,
    );
  } catch (error) {
    throw new InputContractError(
      `Cannot read ${label} ${normalizedPath}: ${diagnosticErrorMessage(error)}`,
    );
  }
  try {
    const metadata = await handle.stat();
    if (!metadata.isFile()) {
      throw new InputContractError(`${label} must be a file: ${normalizedPath}`);
    }
    if (metadata.size > maxBytes) {
      throw new InputContractError(
        `${label} exceeds ${maxBytes} byte limit: ${normalizedPath} (${metadata.size} bytes)`,
      );
    }
    const bytes = Buffer.alloc(maxBytes + 1);
    let offset = 0;
    while (offset < bytes.length) {
      const result = await handle.read(bytes, offset, bytes.length - offset, offset);
      if (result.bytesRead === 0) break;
      offset += result.bytesRead;
    }
    if (offset > maxBytes) {
      throw new InputContractError(
        `${label} exceeds ${maxBytes} byte limit while reading: ${normalizedPath}`,
      );
    }
    let source: string;
    try {
      source = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, offset));
    } catch (error) {
      throw new InputContractError(
        `Invalid UTF-8 in ${label} ${normalizedPath}: ${diagnosticErrorMessage(error)}`,
      );
    }
    try {
      return JSON.parse(source) as unknown;
    } catch (error) {
      throw new InputContractError(
        `Invalid JSON in ${label} ${normalizedPath}: ${diagnosticErrorMessage(error)}`,
      );
    }
  } catch (error) {
    if (error instanceof InputContractError) throw error;
    throw new InputContractError(
      `Cannot read ${label} ${normalizedPath}: ${diagnosticErrorMessage(error)}`,
    );
  } finally {
    await handle.close().catch(() => undefined);
  }
}

function parseCapability(value: unknown, index: number): ArchitectureCapability {
  const input = record(value, `capabilities[${index}]`);
  knownKeys(input, [
    'id',
    'status',
    'project',
    'spec',
    'role',
    'owners',
    'implementationAnchors',
    'testEvidence',
    'publicDocs',
    'decisions',
    'rules',
  ], `capabilities[${index}]`);
  const status = string(input.status, `capabilities[${index}].status`) as CapabilityStatus;
  if (!capabilityStatuses.has(status)) {
    throw new InputContractError(`capabilities[${index}].status is unsupported: ${status}`);
  }

  const decisions = optionalStrings(input.decisions, `capabilities[${index}].decisions`);
  const rules = optionalStrings(input.rules, `capabilities[${index}].rules`);
  return {
    id: string(input.id, `capabilities[${index}].id`),
    status,
    ...(input.project === undefined ? {} : { project: string(input.project, `capabilities[${index}].project`) }),
    spec: string(input.spec, `capabilities[${index}].spec`),
    ...(input.role === undefined ? {} : { role: string(input.role, `capabilities[${index}].role`) }),
    owners: strings(input.owners, `capabilities[${index}].owners`),
    implementationAnchors: strings(input.implementationAnchors, `capabilities[${index}].implementationAnchors`),
    testEvidence: strings(input.testEvidence, `capabilities[${index}].testEvidence`),
    publicDocs: strings(input.publicDocs, `capabilities[${index}].publicDocs`),
    ...(decisions ? { decisions } : {}),
    ...(rules ? { rules } : {}),
  };
}

function parseArchitectureRegistryValue(
  value: unknown,
  contractLimits?: SemFoundationLimitOptions,
): ArchitectureRegistry {
  const limits = resolveSemFoundationLimits(contractLimits);
  const input = record(value, 'registry');
  knownKeys(input, [
    '$schema',
    'schemaVersion',
    'repository',
    'analysisProjects',
    'policyFiles',
    'capabilities',
  ], 'registry');
  if (input.schemaVersion !== 1) {
    throw new InputContractError('registry.schemaVersion must be 1');
  }
  const capabilities = boundedArray(input.capabilities, 'registry.capabilities');
  const schema = input.$schema === undefined ? undefined : string(input.$schema, 'registry.$schema');
  const policyFiles = optionalStrings(input.policyFiles, 'registry.policyFiles');
  const analysisProjects = input.analysisProjects === undefined
    ? undefined
    : boundedArray(
      input.analysisProjects,
      'registry.analysisProjects',
      limits.maxAnalysisProjects,
    );
  if (analysisProjects?.length === 0) {
    throw new InputContractError('registry.analysisProjects must contain at least one project when provided');
  }
  assertRegistryReferenceLimit(
    capabilities,
    analysisProjects,
    policyFiles,
  );
  const registry: ArchitectureRegistry = {
    ...(schema ? { $schema: schema } : {}),
    schemaVersion: 1,
    ...(input.repository === undefined ? {} : { repository: string(input.repository, 'registry.repository') }),
    ...(analysisProjects === undefined ? {} : {
      analysisProjects: analysisProjects.map((value, index) => {
          const project = record(value, `registry.analysisProjects[${index}]`);
          knownKeys(project, ['id', 'root', 'fileExtensions'], `registry.analysisProjects[${index}]`);
          const fileExtensions = normalizeArchitectureFileExtensions(
            project.fileExtensions,
            `registry.analysisProjects[${index}].fileExtensions`,
            limits,
          );
          return {
            id: visibleString(project.id, `registry.analysisProjects[${index}].id`),
            root: visibleString(project.root, `registry.analysisProjects[${index}].root`),
            ...(fileExtensions === undefined ? {} : { fileExtensions }),
          };
        }),
    }),
    ...(policyFiles ? { policyFiles } : {}),
    capabilities: capabilities.map(parseCapability),
  };
  assertArchitectureTextBudget(registry, 'registry');
  return registry;
}

export function parseArchitectureRegistry(
  value: unknown,
  contractLimits?: SemFoundationLimitOptions,
): ArchitectureRegistry {
  try {
    return parseArchitectureRegistryValue(value, contractLimits);
  } catch (error) {
    throw toInputContractError(error, 'Registry validation failed');
  }
}

export async function loadArchitectureRegistry(
  path: string,
  contractLimits?: SemFoundationLimitOptions,
): Promise<ArchitectureRegistry> {
  return parseArchitectureRegistry(
    await readBoundedJsonFile(path, {
      label: 'architecture registry',
      maxBytes: MAX_ARCHITECTURE_JSON_BYTES,
    }),
    contractLimits,
  );
}

function parseArchitecturePolicySetValue(value: unknown): ArchitecturePolicySet {
  const input = record(value, 'policy set');
  knownKeys(input, ['$schema', 'schemaVersion', 'packageBoundaries', 'impactBoundaries'], 'policy set');
  if (input.schemaVersion !== 1) {
    throw new InputContractError('policy set schemaVersion must be 1');
  }
  const schema = input.$schema === undefined ? undefined : string(input.$schema, 'policy set.$schema');
  if (input.packageBoundaries === undefined && input.impactBoundaries === undefined) {
    throw new InputContractError('policy set must declare packageBoundaries or impactBoundaries');
  }
  const packageBoundaryValues = input.packageBoundaries === undefined
    ? undefined
    : boundedArray(input.packageBoundaries, 'packageBoundaries');
  const impactBoundaryValues = input.impactBoundaries === undefined
    ? undefined
    : boundedArray(input.impactBoundaries, 'impactBoundaries');
  if (packageBoundaryValues?.length === 0) {
    throw new InputContractError('packageBoundaries must contain at least one rule when provided');
  }
  if (impactBoundaryValues?.length === 0) {
    throw new InputContractError('impactBoundaries must contain at least one rule when provided');
  }
  assertPolicyReferenceLimit(
    packageBoundaryValues ?? [],
    impactBoundaryValues ?? [],
  );

  const packageBoundaries = packageBoundaryValues === undefined
    ? undefined
    : packageBoundaryValues.map((value, index) => {
        const rule = record(value, `packageBoundaries[${index}]`);
        knownKeys(rule, [
          'id',
          'project',
          'from',
          'disallow',
          'require',
          'dependencyFields',
          'severity',
        ], `packageBoundaries[${index}]`);
        const severity = rule.severity === undefined ? undefined : string(rule.severity, `packageBoundaries[${index}].severity`) as Severity;
        if (severity && !severities.has(severity)) {
          throw new InputContractError(`packageBoundaries[${index}].severity is unsupported: ${severity}`);
        }
        const fields = rule.dependencyFields === undefined
          ? undefined
          : nonEmptyStrings(
            rule.dependencyFields,
            `packageBoundaries[${index}].dependencyFields`,
            dependencyFields.size,
          ) as PackageDependencyField[];
        if (fields?.some((field) => !dependencyFields.has(field))) {
          throw new InputContractError(`packageBoundaries[${index}].dependencyFields contains an unsupported field`);
        }
        const disallow = rule.disallow === undefined
          ? undefined
          : nonEmptyStrings(rule.disallow, `packageBoundaries[${index}].disallow`);
        const require = rule.require === undefined
          ? undefined
          : nonEmptyStrings(rule.require, `packageBoundaries[${index}].require`);
        if (!disallow && !require) {
          throw new InputContractError(`packageBoundaries[${index}] requires disallow or require`);
        }
        return {
          id: string(rule.id, `packageBoundaries[${index}].id`),
          ...(rule.project === undefined ? {} : { project: string(rule.project, `packageBoundaries[${index}].project`) }),
          from: string(rule.from, `packageBoundaries[${index}].from`),
          ...(disallow ? { disallow } : {}),
          ...(require ? { require } : {}),
          ...(fields ? { dependencyFields: fields } : {}),
          ...(severity ? { severity } : {}),
        };
      });

  const impactBoundaries = impactBoundaryValues === undefined
    ? undefined
    : impactBoundaryValues.map((value, index) => {
        const rule = record(value, `impactBoundaries[${index}]`);
        knownKeys(rule, [
          'id',
          'project',
          'from',
          'disallowDependencies',
          'severity',
          'missingEvidenceSeverity',
        ], `impactBoundaries[${index}]`);
        const severity = rule.severity === undefined ? undefined : string(rule.severity, `impactBoundaries[${index}].severity`) as Severity;
        const missingEvidenceSeverity = rule.missingEvidenceSeverity === undefined
          ? undefined
          : string(rule.missingEvidenceSeverity, `impactBoundaries[${index}].missingEvidenceSeverity`) as Severity;
        if ((severity && !severities.has(severity)) || (missingEvidenceSeverity && !severities.has(missingEvidenceSeverity))) {
          throw new InputContractError(`impactBoundaries[${index}] contains an unsupported severity`);
        }
        const parsed: ImpactBoundaryPolicy = {
          id: string(rule.id, `impactBoundaries[${index}].id`),
          ...(rule.project === undefined ? {} : { project: string(rule.project, `impactBoundaries[${index}].project`) }),
          from: nonEmptyStrings(
            rule.from,
            `impactBoundaries[${index}].from`,
            MAX_GLOB_PATTERN_SET_COMPLEXITY,
          ),
          disallowDependencies: nonEmptyStrings(
            rule.disallowDependencies,
            `impactBoundaries[${index}].disallowDependencies`,
            MAX_GLOB_PATTERN_SET_COMPLEXITY,
          ),
          ...(severity ? { severity } : {}),
          ...(missingEvidenceSeverity ? { missingEvidenceSeverity } : {}),
        };
        for (const [field, patterns] of [
          ['from', parsed.from],
          ['disallowDependencies', parsed.disallowDependencies],
        ] as const) {
          const issue = globPatternSetIssue(patterns);
          if (issue) {
            throw new InputContractError(
              `impactBoundaries[${index}].${field} ${issue}`,
            );
          }
        }
        return parsed;
      });

  const policySet: ArchitecturePolicySet = {
    ...(schema ? { $schema: schema } : {}),
    schemaVersion: 1,
    ...(packageBoundaries ? { packageBoundaries } : {}),
    ...(impactBoundaries ? { impactBoundaries } : {}),
  };
  assertArchitectureTextBudget(policySet, 'policy set');
  return policySet;
}

export function parseArchitecturePolicySet(value: unknown): ArchitecturePolicySet {
  try {
    return parseArchitecturePolicySetValue(value);
  } catch (error) {
    throw toInputContractError(error, 'Policy validation failed');
  }
}

export async function loadArchitecturePolicySet(path: string): Promise<ArchitecturePolicySet> {
  return parseArchitecturePolicySet(await readBoundedJsonFile(path, {
    label: 'architecture policy set',
    maxBytes: MAX_ARCHITECTURE_JSON_BYTES,
  }));
}
