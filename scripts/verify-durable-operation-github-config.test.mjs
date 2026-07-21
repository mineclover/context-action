import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateGithubConfiguration } from './verify-durable-operation-github-config.mjs';

const completeSetup = {
  repository: 'mineclover/context-action',
  environments: ['durable-staging', 'durable-production'],
  environmentSecrets: {
    'durable-staging': ['REDIS_URL', 'DATABASE_URL'],
    'durable-production': ['REDIS_URL', 'DATABASE_URL'],
  },
  environmentSecretReadability: {
    'durable-staging': true,
    'durable-production': true,
  },
  localWorkflowPresent: true,
  localWorkflowContractValid: true,
  remoteWorkflowPresent: true,
};

test('marks configuration ready only when both environments and workflow are present', () => {
  const report = evaluateGithubConfiguration(completeSetup);
  assert.equal(report.status, 'ready');
  assert.deepEqual(report.missingRequirements, []);
  assert.equal(report.workflow.localContractValid, true);
  assert.ok(report.environments.every(environment => environment.ready));
});

test('does not treat a present but invalid local workflow as ready', () => {
  const report = evaluateGithubConfiguration({
    ...completeSetup,
    localWorkflowContractValid: false,
    localWorkflowContractError: 'missing package script',
  });
  assert.equal(report.status, 'missing');
  assert.equal(report.workflow.localPresent, true);
  assert.equal(report.workflow.localContractValid, false);
  assert.equal(report.workflow.localContractError, 'missing package script');
  assert.deepEqual(report.missingRequirements, [
    'local workflow contract: .github/workflows/verify-durable-operations.yml',
  ]);
});

test('does not treat unreadable secret metadata as a ready environment', () => {
  const report = evaluateGithubConfiguration({
    ...completeSetup,
    environmentSecretReadability: {
      'durable-staging': false,
      'durable-production': true,
    },
  });
  assert.equal(report.status, 'missing');
  assert.equal(report.environments[0].secretNamesReadable, false);
  assert.equal(report.environments[0].ready, false);
  assert.deepEqual(report.missingRequirements, [
    'readable secret metadata: durable-staging',
  ]);
});

test('reports each missing remote deployment prerequisite without secret values', () => {
  const report = evaluateGithubConfiguration({
    repository: completeSetup.repository,
    environments: [],
    environmentSecrets: {},
    environmentSecretReadability: {},
    localWorkflowPresent: true,
    remoteWorkflowPresent: false,
  });
  assert.equal(report.status, 'missing');
  assert.deepEqual(report.missingRequirements, [
    'remote workflow: .github/workflows/verify-durable-operations.yml',
    'environment: durable-staging',
    'environment: durable-production',
  ]);
  assert.doesNotMatch(JSON.stringify(report), /redis:\/\/|postgres:\/\/|password|secret-value/i);
});
