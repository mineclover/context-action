import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectDurableOperationWorkflow } from './verify-durable-operation-workflow.mjs';

const REQUIRED_ENVIRONMENTS = ['durable-staging', 'durable-production'];
const REQUIRED_SECRETS = ['REDIS_URL', 'DATABASE_URL'];
const CONFIG_SCHEMA = 'context-action/durable-operation-github-config.v1';
const WORKFLOW_PATH = '.github/workflows/verify-durable-operations.yml';

function runGhApi(endpoint) {
  const output = execFileSync('gh', ['api', endpoint], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(output);
}

function readRepository() {
  const configured = process.env.GITHUB_REPOSITORY?.trim();
  if (configured) return configured;
  return execFileSync(
    'gh',
    ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ).trim();
}

function expectedSecretStatus(secretNames) {
  const names = new Set(secretNames);
  return Object.fromEntries(
    REQUIRED_SECRETS.map((name) => [name, names.has(name)]),
  );
}

export function evaluateGithubConfiguration({
  repository,
  environments,
  environmentSecrets,
  environmentSecretReadability = {},
  localWorkflowPresent,
  localWorkflowContractValid = localWorkflowPresent === true,
  localWorkflowContractError,
  remoteWorkflowPresent,
}) {
  const configuredEnvironments = new Set(environments);
  const environmentReports = REQUIRED_ENVIRONMENTS.map((name) => {
    const present = configuredEnvironments.has(name);
    const secretNamesReadable = present
      ? environmentSecretReadability[name] !== false
      : false;
    const secrets = present && secretNamesReadable
      ? expectedSecretStatus(environmentSecrets[name] ?? [])
      : Object.fromEntries(REQUIRED_SECRETS.map((secret) => [secret, false]));
    return {
      name,
      present,
      secretNamesReadable,
      secrets,
      ready: present && secretNamesReadable && Object.values(secrets).every(Boolean),
    };
  });
  const ready =
    localWorkflowPresent === true &&
    localWorkflowContractValid === true &&
    remoteWorkflowPresent === true &&
    environmentReports.every((environment) => environment.ready);
  const missingRequirements = [];
  if (localWorkflowPresent !== true) {
    missingRequirements.push(`local workflow: ${WORKFLOW_PATH}`);
  } else if (localWorkflowContractValid !== true) {
    missingRequirements.push(`local workflow contract: ${WORKFLOW_PATH}`);
  }
  if (remoteWorkflowPresent !== true) {
    missingRequirements.push(`remote workflow: ${WORKFLOW_PATH}`);
  }
  for (const environment of environmentReports) {
    if (!environment.present) {
      missingRequirements.push(`environment: ${environment.name}`);
      continue;
    }
    if (!environment.secretNamesReadable) {
      missingRequirements.push(`readable secret metadata: ${environment.name}`);
      continue;
    }
    for (const [secret, present] of Object.entries(environment.secrets)) {
      if (!present) missingRequirements.push(`secret: ${environment.name}/${secret}`);
    }
  }
  return {
    schemaVersion: CONFIG_SCHEMA,
    repository,
    workflow: {
      path: WORKFLOW_PATH,
      localPresent: localWorkflowPresent === true,
      localContractValid: localWorkflowContractValid === true,
      ...(localWorkflowContractError === undefined
        ? {}
        : { localContractError: localWorkflowContractError }),
      remotePresent: remoteWorkflowPresent === true,
    },
    environments: environmentReports,
    missingRequirements,
    status: ready ? 'ready' : 'missing',
  };
}

function readRemoteConfiguration(repository) {
  const environmentResponse = runGhApi(`repos/${repository}/environments`);
  const environments = Array.isArray(environmentResponse.environments)
    ? environmentResponse.environments
        .map((environment) => environment?.name)
        .filter((name) => typeof name === 'string')
    : [];
  const environmentSecrets = {};
  const environmentSecretReadability = {};
  for (const name of REQUIRED_ENVIRONMENTS) {
    if (!environments.includes(name)) continue;
    try {
      const response = runGhApi(
        `repos/${repository}/environments/${encodeURIComponent(name)}/secrets`,
      );
      environmentSecrets[name] = Array.isArray(response.secrets)
        ? response.secrets
            .map((secret) => secret?.name)
            .filter((secretName) => typeof secretName === 'string')
        : [];
      environmentSecretReadability[name] = true;
    } catch {
      // The API returns no secret values. An unreadable secret list is still
      // treated as missing so a deployment cannot be falsely marked ready.
      environmentSecrets[name] = [];
      environmentSecretReadability[name] = false;
    }
  }
  let remoteWorkflowPresent = false;
  try {
    runGhApi(`repos/${repository}/contents/${WORKFLOW_PATH}`);
    remoteWorkflowPresent = true;
  } catch {
    remoteWorkflowPresent = false;
  }
  return {
    environments,
    environmentSecrets,
    environmentSecretReadability,
    remoteWorkflowPresent,
  };
}

export function readGithubConfiguration({ repository = readRepository(), root = process.cwd() } = {}) {
  const remote = readRemoteConfiguration(repository);
  const localWorkflowPresent = fs.existsSync(path.join(root, WORKFLOW_PATH));
  let localWorkflowContractValid = localWorkflowPresent;
  let localWorkflowContractError;
  if (localWorkflowPresent) {
    try {
      inspectDurableOperationWorkflow({ rootDirectory: root });
    } catch (error) {
      localWorkflowContractValid = false;
      localWorkflowContractError = error instanceof Error
        ? error.message
        : 'local workflow contract is invalid';
    }
  }
  return evaluateGithubConfiguration({
    repository,
    environments: remote.environments,
    environmentSecrets: remote.environmentSecrets,
    environmentSecretReadability: remote.environmentSecretReadability,
    localWorkflowPresent,
    localWorkflowContractValid,
    localWorkflowContractError,
    remoteWorkflowPresent: remote.remoteWorkflowPresent,
  });
}

function main() {
  const reportOnly = process.argv.includes('--report-only');
  let report;
  try {
    report = readGithubConfiguration();
  } catch (error) {
    report = {
      schemaVersion: CONFIG_SCHEMA,
      status: 'unavailable',
      reason: error instanceof Error ? error.message : 'GitHub configuration is unavailable',
    };
  }
  console.log(JSON.stringify(report, null, 2));
  if (!reportOnly && report.status !== 'ready') process.exitCode = 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
