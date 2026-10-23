#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  inspectGitHubWorkflow,
  isUnconditionalFailClosedStep,
  protectedPublicationFailures,
  workflowPublicationCommands,
} from './verify-v1-supply-chain.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidatePath = path.join(repositoryRoot, '.github', 'workflows', 'publish-lit-public-candidate.yml');
const promotionPath = path.join(repositoryRoot, '.github', 'workflows', 'promote-lit-public.yml');
const planPath = path.join(repositoryRoot, 'releases', 'lit-public-2026-10-patch-2.json');
const cohort = '@context-action/lit,@context-action/lit-ui';
const commitExpression = '$' + '{{ inputs.release_commit }}';

const candidate = inspectGitHubWorkflow(await readFile(candidatePath, 'utf8'));
const promotion = inspectGitHubWorkflow(await readFile(promotionPath, 'utf8'));
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const errors = [];

function commands(inspection) {
  return inspection.commands.map(({ command }) => command);
}

function requireCommand(inspection, expected, message) {
  if (!commands(inspection).includes(expected)) errors.push(message);
}

function requireInput(inspection, name, message) {
  const input = inspection.document.on?.workflow_dispatch?.inputs?.[name];
  if (input?.required !== true) errors.push(message);
}

function requireStep(inspection, name, message) {
  const step = inspection.steps.find(entry => entry.definition.name === name);
  if (!step || !isUnconditionalFailClosedStep(step)) errors.push(message);
  return step;
}

if (plan.schemaVersion !== 'context-action-lit-public-release.v1'
  || plan.status !== 'approved-for-candidate'
  || plan.candidateDistTag !== 'next'
  || plan.promotionDistTag !== 'latest'
  || plan.candidateWorkflow !== 'publish-lit-public-candidate.yml'
  || plan.promotionWorkflow !== 'promote-lit-public.yml'
  || plan.promotionConfirmation !== 'PROMOTE_LIT_PUBLIC'
  || JSON.stringify(Object.keys(plan.packages ?? {}))
    !== JSON.stringify(['@context-action/lit', '@context-action/lit-ui'])) {
  errors.push('public Lit workflow must bind the approved next-to-latest plan and package order');
}

errors.push(...protectedPublicationFailures(
  'Lit public candidate workflow',
  candidate,
  workflowPublicationCommands(candidate),
));
const candidatePublication = workflowPublicationCommands(candidate);
if (candidatePublication.length !== 1) errors.push('Lit public candidate workflow must contain one scoped publication');
const candidateCommand = candidatePublication[0]?.command;
if (candidateCommand !== undefined) {
  if (!candidateCommand.includes('--scope @context-action/lit')
    || !candidateCommand.includes('--scope @context-action/lit-ui')) {
    errors.push('Lit public candidate workflow must publish both packages');
  }
  if (candidateCommand.indexOf('--scope @context-action/lit-ui')
    < candidateCommand.indexOf('--scope @context-action/lit')) {
    errors.push('Lit public candidate workflow must publish lit before lit-ui');
  }
}
requireInput(candidate, 'publish_auth', 'Lit public candidate workflow must require publish_auth');
requireInput(candidate, 'release_commit', 'Lit public candidate workflow must require release_commit');
for (const expected of [
  'pnpm verify:lit-public-release -- --require-current-source',
  'pnpm release:check',
  'pnpm verify:package-exports',
  'pnpm verify:package-tarballs',
  'pnpm verify:lit-packed-consumer',
  'pnpm package-boundary:check',
  'node scripts/verify-lit-public-provenance.mjs --tag next --commit "$RELEASE_COMMIT" --output reports/npm-lit-public-candidate-provenance.json',
  'node scripts/verify-lit-public-consumer-smoke.mjs --tag next --cohort',
  'pnpm capture:published-release -- --tag next --packages "@context-action/lit,@context-action/lit-ui" --consumer-status passed --output reports/npm-lit-public-candidate-registry-evidence.json',
]) requireCommand(candidate, expected, `Lit public candidate workflow must include ${expected}`);
const candidateUpload = candidate.steps.find(step => step.definition.name === 'Upload public Lit candidate evidence');
if (candidateUpload?.definition.if !== 'always()'
  || candidateUpload.definition.with?.path !== 'reports/npm-lit-public-candidate-*.json'
  || candidateUpload.definition.with?.['if-no-files-found'] !== 'error') {
  errors.push('Lit public candidate workflow must upload its exact evidence path fail-closed');
}
const candidatePublishStep = candidatePublication[0]?.step;
const candidateSourceStep = candidate.steps.find(step =>
  step.definition.name === 'Re-verify approved source immediately before publication');
if (!candidateSourceStep || !candidatePublishStep
  || candidateSourceStep.index !== candidatePublishStep.index - 1
  || JSON.stringify(candidateSourceStep.statements.map(({ statement }) => statement))
    !== JSON.stringify([
      'test "$(git rev-parse HEAD)" = "$RELEASE_COMMIT"',
      'git diff --exit-code',
      'git diff --cached --exit-code',
    ])
  || JSON.stringify(candidateSourceStep.definition.env) !== JSON.stringify({ RELEASE_COMMIT: commitExpression })) {
  errors.push('Lit public candidate workflow must re-check the approved clean source immediately before publication');
}

const promotionJob = promotion.jobs[0];
const promotionEnvironment = promotionJob?.definition?.environment;
if (promotion.document.permissions?.['id-token'] !== 'write'
  || (typeof promotionEnvironment === 'string' ? promotionEnvironment : promotionEnvironment?.name) !== 'npm-stable') {
  errors.push('Lit promotion workflow must use npm-stable and OIDC provenance permissions');
}
for (const expected of [
  'test "$CONFIRMATION" = "PROMOTE_LIT_PUBLIC"',
  'test "$(git rev-parse HEAD)" = "$GITHUB_SHA"',
  'test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)"',
  'git merge-base --is-ancestor "$RELEASE_COMMIT" HEAD',
  'git diff --exit-code',
  'git diff --cached --exit-code',
  'node scripts/verify-lit-public-provenance.mjs --tag next --commit "$RELEASE_COMMIT" --output reports/npm-lit-public-promotion-preflight-provenance.json',
  'node scripts/verify-lit-public-consumer-smoke.mjs --tag next --cohort',
  'node scripts/promote-lit-public.mjs --commit "$RELEASE_COMMIT" --output reports/npm-lit-public-promotion-summary.json',
  'node scripts/verify-lit-public-consumer-smoke.mjs --tag latest --cohort',
  'node scripts/verify-lit-public-provenance.mjs --tag latest --commit "$RELEASE_COMMIT" --output reports/npm-lit-public-promotion-provenance.json',
  'pnpm capture:published-release -- --tag latest --packages "@context-action/lit,@context-action/lit-ui" --consumer-status passed --output reports/npm-lit-public-promotion-registry-evidence.json',
]) requireCommand(promotion, expected, `Lit promotion workflow must include ${expected}`);
requireStep(promotion, 'Verify npm token auth', 'Lit promotion workflow must verify npm token auth');
requireInput(promotion, 'release_commit', 'Lit promotion workflow must require release_commit');
requireInput(promotion, 'confirmation', 'Lit promotion workflow must require confirmation');
const promotionUpload = promotion.steps.find(step => step.definition.name === 'Upload promoted Lit evidence');
if (promotionUpload?.definition.if !== 'always()'
  || promotionUpload.definition.with?.path !== 'reports/npm-lit-public-promotion-*.json'
  || promotionUpload.definition.with?.['if-no-files-found'] !== 'error') {
  errors.push('Lit promotion workflow must upload its exact evidence path fail-closed');
}

if (errors.length > 0) {
  console.error(`Lit public workflow contract failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ status: 'ok', workflows: [path.basename(candidatePath), path.basename(promotionPath)], cohort }));
}
