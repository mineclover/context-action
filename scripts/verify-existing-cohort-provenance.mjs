#!/usr/bin/env node

/**
 * Verify registry artifacts that a coordinated candidate is allowed to resume.
 *
 * The publisher can resume a package only when the exact plan version already
 * on npm was produced by the same approved source and workflow.  This check is
 * deliberately read-only: it performs registry metadata reads, an isolated
 * install, and npm's signature/attestation audit, but never writes a package or
 * dist-tag.
 */

import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { retryTransientRegistryVisibility } from './registry-visibility-retry.cjs';

export const EXPECTED_REPOSITORY = 'https://github.com/mineclover/context-action';
export const EXPECTED_WORKFLOW_PATH = '.github/workflows/publish-coordinated-stable-candidate.yml';
export const EXPECTED_WORKFLOW_REF = 'refs/heads/main';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(repositoryRoot, 'releases', 'coordinated-stable-2026-10.json');
const registry = 'https://registry.npmjs.org';

function npmEnvironment() {
  return Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !name.toLowerCase().startsWith('npm_config_')),
  );
}

function option(name, argv = process.argv) {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
}

function usage() {
  return 'Usage: node scripts/verify-existing-cohort-provenance.mjs --commit <40-char SHA> [--output <path>]';
}

function decodeStatement(bundle) {
  const payload = bundle?.dsseEnvelope?.payload;
  if (typeof payload !== 'string') throw new Error('SLSA attestation has no DSSE payload');
  return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
}

export function attestedCommit(statement) {
  return statement?.predicate?.buildDefinition?.resolvedDependencies?.find(
    value => typeof value?.digest?.gitCommit === 'string',
  )?.digest?.gitCommit;
}

export function validateProvenanceStatement(statement, {
  commit,
  repository = EXPECTED_REPOSITORY,
  workflowPath = EXPECTED_WORKFLOW_PATH,
  ref = EXPECTED_WORKFLOW_REF,
} = {}) {
  const workflow = statement?.predicate?.buildDefinition?.externalParameters?.workflow;
  const actualCommit = attestedCommit(statement);
  if (actualCommit !== commit) {
    throw new Error(`Attested source commit ${actualCommit ?? '<missing>'} does not match approved ${commit}`);
  }
  if (workflow?.repository !== repository) {
    throw new Error(`Attested workflow repository ${workflow?.repository ?? '<missing>'} does not match ${repository}`);
  }
  if (workflow?.path !== workflowPath) {
    throw new Error(`Attested workflow path ${workflow?.path ?? '<missing>'} does not match ${workflowPath}`);
  }
  if (workflow?.ref !== ref) {
    throw new Error(`Attested workflow ref ${workflow?.ref ?? '<missing>'} does not match ${ref}`);
  }
  return workflow;
}

function command(commandName, argumentsList, cwd = repositoryRoot) {
  const result = spawnSync(commandName, argumentsList, {
    cwd,
    encoding: 'utf8',
    env: npmEnvironment(),
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error,
  };
}

function transientRegistryError(result) {
  return /\bETARGET\b|No matching version found|\bE404\b|404\s+Not Found/iu.test(
    `${result.stdout}\n${result.stderr}\n${result.error?.message ?? ''}`,
  );
}

/**
 * Return true only when an exact version is visible.  A version which is not
 * visible after the bounded propagation retry is considered unpublished and
 * is intentionally skipped by the resume guard.
 */
export async function exactVersionIsPublished(name, version) {
  const result = await retryTransientRegistryVisibility(async () => {
    const response = command('npm', ['view', `${name}@${version}`, 'version', '--json', `--registry=${registry}`]);
    if (response.status === 0) {
      let value;
      try {
        value = JSON.parse(response.stdout);
      } catch {
        throw new Error(`npm view returned invalid metadata for ${name}@${version}`);
      }
      if (value !== version) throw new Error(`npm view returned ${value ?? '<missing>'} for ${name}@${version}`);
      return { published: true, response };
    }
    if (transientRegistryError(response)) {
      const error = new Error(`npm view could not see ${name}@${version}`);
      error.retryableRegistryVisibility = true;
      throw error;
    }
    throw new Error(`npm view failed for ${name}@${version}: ${response.stderr || response.stdout}`);
  }, {
    // A missing exact version is expected during a first publication. Keep the
    // propagation window bounded so a five-package cohort does not consume the
    // entire workflow timeout when all versions are new.
    delays: [1000, 2000, 4000],
  }).catch(error => {
    if (error?.retryableRegistryVisibility) return { published: false };
    throw error;
  });
  return result.published;
}

function auditEntry(audit, name, version) {
  return (audit?.verified ?? []).find(entry => entry.name === name && entry.version === version)
    ?? (audit?.verified ?? []).find(entry => `${entry.name}@${entry.version}` === `${name}@${version}`);
}

export async function verifyExistingCohort({ commit, output } = {}) {
  if (!/^[a-f0-9]{40}$/u.test(commit ?? '')) throw new Error(usage());
  const plan = JSON.parse(await readFile(planPath, 'utf8'));
  const packages = Object.entries(plan.packages ?? {});
  if (packages.length === 0) throw new Error('Coordinated release plan contains no packages');

  const existing = [];
  const skipped = [];
  for (const [name, version] of packages) {
    if (await exactVersionIsPublished(name, version)) existing.push([name, version]);
    else skipped.push({ name, version, reason: 'unpublished' });
  }

  const verified = [];
  if (existing.length > 0) {
    const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'context-action-existing-provenance-'));
    try {
      await writeFile(path.join(temporaryDirectory, 'package.json'), `${JSON.stringify({
        name: 'context-action-existing-cohort-provenance-verifier',
        private: true,
        version: '0.0.0',
        dependencies: Object.fromEntries(existing),
      }, null, 2)}\n`);
      let cacheDirectory;
      await retryTransientRegistryVisibility(async () => {
        const attempt = await mkdtemp(path.join(temporaryDirectory, 'npm-cache-attempt-'));
        cacheDirectory = attempt;
        const response = command('npm', [
          'install', '--ignore-scripts', '--no-audit', '--prefer-online',
          `--registry=${registry}`, '--cache', cacheDirectory,
        ], temporaryDirectory);
        if (response.status === 0) return response;
        if (transientRegistryError(response)) {
          const error = new Error(`npm install could not see existing cohort:\n${response.stdout}${response.stderr}`);
          error.retryableRegistryVisibility = true;
          throw error;
        }
        throw new Error(`npm install failed:\n${response.stdout}${response.stderr}`);
      }, { delays: [1000, 2000, 4000] });

      const auditResponse = command('npm', [
        'audit', 'signatures', '--json', '--include-attestations',
        '--cache', cacheDirectory, `--registry=${registry}`,
      ], temporaryDirectory);
      if (auditResponse.status !== 0 && !auditResponse.stdout.trim()) {
        throw new Error(`npm audit signatures failed:\n${auditResponse.stdout}${auditResponse.stderr}`);
      }
      let audit;
      try {
        audit = JSON.parse(auditResponse.stdout);
      } catch {
        throw new Error(`npm audit signatures returned invalid JSON:\n${auditResponse.stdout}${auditResponse.stderr}`);
      }
      if ((audit.invalid?.length ?? 0) > 0 || (audit.missing?.length ?? 0) > 0) {
        throw new Error('npm audit signatures reported invalid or missing attestations for an existing cohort artifact');
      }
      for (const [name, version] of existing) {
        const entry = auditEntry(audit, name, version);
        if (!entry) throw new Error(`npm audit signatures returned no verified attestation for ${name}@${version}`);
        const bundle = entry.attestationBundles?.find(
          value => value?.predicateType === 'https://slsa.dev/provenance/v1',
        );
        if (!bundle) throw new Error(`No SLSA provenance attestation was returned for ${name}@${version}`);
        const statement = decodeStatement(bundle.bundle);
        const workflow = validateProvenanceStatement(statement, { commit });
        verified.push({ name, version, sourceCommit: commit, workflow });
      }
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  }

  const report = {
    schemaVersion: 'context-action-existing-cohort-provenance.v1',
    status: 'verified',
    approvedCommit: commit,
    existing: verified,
    skipped,
  };
  if (output) {
    const outputPath = path.isAbsolute(output) ? output : path.join(repositoryRoot, output);
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  console.log(JSON.stringify(report));
  return report;
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  verifyExistingCohort({ commit: option('--commit'), output: option('--output') }).catch(error => {
    console.error(`Existing coordinated cohort provenance verification failed: ${error.message}`);
    process.exitCode = 1;
  });
}
