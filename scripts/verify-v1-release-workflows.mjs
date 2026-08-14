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
const workflowDirectory = path.join(repositoryRoot, '.github', 'workflows');
const manifestPath = path.join(repositoryRoot, 'docs', 'releases', 'v1.0.0', 'release-manifest.json');
const failureOrCancellationCondition = '$' + '{{ failure() || cancelled() }}';
const foreignJournalErrorTemplate = 'foreign maintenance journal $' + '{candidate} is unresolved';
const releaseCommitInputExpression = '$' + '{{ inputs.release_commit }}';
const maintenanceBuildStepName = 'Build workspace dependencies and test the maintenance target';
const maintenanceBuildStatements = [
  'pnpm build',
  'pnpm --filter "$PACKAGE_NAME" type-check',
  'pnpm --filter "$PACKAGE_NAME" test',
];
const approvedSourceStatements = [
  'test "$(git rev-parse HEAD)" = "$RELEASE_COMMIT"',
  'git diff --exit-code',
  'git diff --cached --exit-code',
];

function requireText(errors, source, text, description) {
  if (!source.includes(text)) errors.push(description);
}

function stepByName(inspection, name) {
  return inspection.steps.find(step => step.definition.name === name);
}

function stepRunText(inspection, name) {
  const run = stepByName(inspection, name)?.definition.run;
  return typeof run === 'string' ? run : '';
}

function requireOrderedText(errors, source, before, after, description) {
  const beforeIndex = source.indexOf(before);
  const afterIndex = source.indexOf(after, Math.max(0, beforeIndex + before.length));
  if (beforeIndex < 0 || afterIndex < 0) errors.push(description);
}

function requireStepOrder(errors, inspection, beforeName, afterName, description) {
  const before = stepByName(inspection, beforeName);
  const after = stepByName(inspection, afterName);
  if (!before || !after || before.job !== after.job || before.index >= after.index) errors.push(description);
}

function workflowDispatch(document) {
  const dispatch = document.on?.workflow_dispatch;
  return dispatch && typeof dispatch === 'object' && !Array.isArray(dispatch) ? dispatch : undefined;
}

function workflowInput(document, name) {
  const inputs = workflowDispatch(document)?.inputs;
  return inputs && typeof inputs === 'object' && !Array.isArray(inputs) ? inputs[name] : undefined;
}

function environmentName(job) {
  const environment = job?.definition?.environment;
  return typeof environment === 'string'
    ? environment
    : environment && typeof environment === 'object' && !Array.isArray(environment)
      ? environment.name
      : undefined;
}

function publicationCommandText(inspection) {
  return workflowPublicationCommands(inspection).map(({ command }) => command).join('\n');
}

function collectNonRunScalars(value, output = [], key) {
  if (key === 'run') return output;
  if (Array.isArray(value)) {
    for (const item of value) {
      if (item && typeof item === 'object') collectNonRunScalars(item, output);
      else output.push(`- ${String(item)}`, String(item));
    }
    return output;
  }
  if (value && typeof value === 'object') {
    for (const [childKey, childValue] of Object.entries(value)) {
      output.push(`${childKey}:`);
      collectNonRunScalars(childValue, output, childKey);
    }
    return output;
  }
  if (key !== undefined) output.push(`${key}: ${String(value)}`);
  output.push(String(value));
  return output;
}

function workflowSemanticText(inspection) {
  return [
    ...collectNonRunScalars(inspection.document),
    ...inspection.commands.map(({ command }) => command),
  ].join('\n');
}

function requireExecutableCommand(errors, inspection, expected, description) {
  if (!inspection.statements.some(({ statement }) => statement === expected)) errors.push(description);
}

function requireCommandBeforePublication(errors, inspection, pattern, description) {
  const publication = workflowPublicationCommands(inspection)[0];
  const statement = inspection.statements.find(entry =>
    publication
    && pattern.test(entry.statement)
    && entry.job === publication.job
    && entry.step.index < publication.step.index
    && isUnconditionalFailClosedStep(entry.step));
  if (!statement) errors.push(description);
}

function requireExactStepBeforePublication(
  errors,
  inspection,
  name,
  expectedStatements,
  expectedEnvironment,
  description,
  { adjacent = false } = {},
) {
  const step = stepByName(inspection, name);
  const publication = workflowPublicationCommands(inspection)[0];
  const environment = step?.definition.env ?? {};
  if (!step || !publication
    || step.job !== publication.job
    || step.index >= publication.step.index
    || (adjacent && step.index !== publication.step.index - 1)
    || !isUnconditionalFailClosedStep(step)
    || JSON.stringify(step.statements.map(({ statement }) => statement))
      !== JSON.stringify(expectedStatements)
    || JSON.stringify(environment) !== JSON.stringify(expectedEnvironment)) {
    errors.push(description);
  }
}

export function validateReleaseWorkflowSources({
  stableCandidate,
  coordinatedCandidate,
  coordinatedPromotion,
  generalPublish,
  mutativePublish,
  maintenancePatch,
  manifestSource,
  packageSource,
  publishHelper,
  changelogVerifier,
  coordinatedPlanSource,
}) {
  const stableInspection = inspectGitHubWorkflow(stableCandidate);
  const generalInspection = inspectGitHubWorkflow(generalPublish);
  const mutativeInspection = inspectGitHubWorkflow(mutativePublish);
  const maintenanceInspection = inspectGitHubWorkflow(maintenancePatch);
  const coordinatedCandidateInspection = coordinatedCandidate ? inspectGitHubWorkflow(coordinatedCandidate) : null;
  const coordinatedPromotionInspection = coordinatedPromotion ? inspectGitHubWorkflow(coordinatedPromotion) : null;
  const manifest = JSON.parse(manifestSource);
  const rootPackage = JSON.parse(packageSource);
  const packages = Object.entries(manifest.artifactCohort?.packages ?? {});
  const errors = [];

  if (!coordinatedCandidateInspection || !coordinatedPromotionInspection || !coordinatedPlanSource) {
    errors.push('Coordinated stable candidate and promotion workflows require a reviewed release plan');
  } else {
    const coordinatedPlan = JSON.parse(coordinatedPlanSource);
    const coordinatedPackages = Object.keys(coordinatedPlan.packages ?? {});
    const expectedCoordinatedPackages = [
      '@context-action/core',
      '@context-action/react',
    ];
    if (JSON.stringify(coordinatedPackages) !== JSON.stringify(expectedCoordinatedPackages)
      || coordinatedPlan.status !== 'approved-for-candidate'
      || coordinatedPlan.candidateDistTag !== 'next'
      || coordinatedPlan.promotionDistTag !== 'latest') {
      errors.push('Coordinated stable release plan must define the approved next-to-latest package cohort');
    }
    const candidatePublication = publicationCommandText(coordinatedCandidateInspection);
    errors.push(...protectedPublicationFailures(
      'Coordinated stable candidate workflow',
      coordinatedCandidateInspection,
      workflowPublicationCommands(coordinatedCandidateInspection),
    ));
    if (coordinatedCandidateInspection.document.permissions?.['id-token'] !== 'write'
      || !workflowInput(coordinatedCandidateInspection.document, 'release_commit')?.required) {
      errors.push('Coordinated stable candidate workflow must require release_commit and OIDC provenance');
    }
    for (const name of expectedCoordinatedPackages) {
      if (!candidatePublication.includes(`--scope ${name}`)) errors.push(`Coordinated stable candidate workflow must publish ${name}`);
    }
    requireCommandBeforePublication(
      errors,
      coordinatedCandidateInspection,
      /^pnpm\s+verify:coordinated-stable-release-plan$/u,
      'Coordinated stable candidate workflow must validate the release plan before publication',
    );
    requireCommandBeforePublication(
      errors,
      coordinatedCandidateInspection,
      /^node\s+scripts\/verify-published-tool-consumers\.cjs\s+--local\s+--cohort-only\s+--packages "@context-action\/core,@context-action\/react"$/u,
      'Coordinated stable candidate workflow must validate the packed candidate closure before publication',
    );
    requireExactStepBeforePublication(
      errors,
      coordinatedCandidateInspection,
      'Re-verify approved source immediately before publication',
      approvedSourceStatements,
      { RELEASE_COMMIT: releaseCommitInputExpression },
      'Coordinated stable candidate workflow must re-verify the approved clean source immediately before publication',
      { adjacent: true },
    );

    const promotionJob = coordinatedPromotionInspection.jobs[0];
    const promotionStatements = coordinatedPromotionInspection.statements.map(({ statement }) => statement);
    if (coordinatedPromotionInspection.document.permissions?.['id-token'] !== 'write'
      || !workflowInput(coordinatedPromotionInspection.document, 'release_commit')?.required
      || !workflowInput(coordinatedPromotionInspection.document, 'confirmation')?.required
      || environmentName(promotionJob) !== 'npm-stable') {
      errors.push('Coordinated stable promotion workflow must require reviewed inputs, OIDC, and npm-stable protection');
    }
    for (const required of [
      'test "$CONFIRMATION" = "PROMOTE_COORDINATED_STABLE"',
      'test "$RELEASE_COMMIT" = "$GITHUB_SHA"',
      'pnpm verify:coordinated-stable-release-plan',
      'node scripts/verify-coordinated-stable-provenance.mjs --tag next --commit "$RELEASE_COMMIT" --output reports/npm-coordinated-stable-promotion-preflight-provenance.json',
      'pnpm verify:published-tool-consumers -- --tag next --packages "@context-action/core,@context-action/react"',
      'node scripts/promote-coordinated-stable.mjs --output reports/npm-coordinated-stable-promotion-summary.json',
      'pnpm verify:published-tool-consumers -- --tag latest --packages "@context-action/core,@context-action/react"',
      'node scripts/verify-coordinated-stable-provenance.mjs --tag latest --commit "$RELEASE_COMMIT" --output reports/npm-coordinated-stable-promotion-provenance.json',
      'pnpm capture:published-release -- --tag latest --packages "@context-action/core,@context-action/react" --consumer-status passed --output reports/npm-coordinated-stable-promotion-registry-evidence.json',
    ]) {
      if (!promotionStatements.includes(required)) errors.push(`Coordinated stable promotion workflow must include ${required}`);
    }
    if (!coordinatedPromotionInspection.steps.some(step =>
      step.definition.name === 'Upload coordinated stable promotion evidence'
      && step.definition.if === 'always()'
      && step.definition.with?.path === 'reports/npm-coordinated-stable-promotion-*.json'
      && step.definition.with?.['if-no-files-found'] === 'error')) {
      errors.push('Coordinated stable promotion workflow must upload its exact evidence path');
    }
  }

  if (!Object.hasOwn(stableInspection.document.on ?? {}, 'workflow_dispatch')) {
    errors.push('Stable candidate workflow must be manually dispatched');
  }
  const stableReleaseInput = workflowInput(stableInspection.document, 'release_commit');
  if (!stableReleaseInput || typeof stableReleaseInput !== 'object' || stableReleaseInput.required !== true) {
    errors.push('Stable candidate workflow must require an explicit release_commit');
  }
  if (stableInspection.document.permissions?.['id-token'] !== 'write') {
    errors.push('Stable candidate workflow must permit npm provenance through OIDC');
  }
  errors.push(...protectedPublicationFailures(
    'Stable candidate workflow',
    stableInspection,
    workflowPublicationCommands(stableInspection),
  ));
  requireExecutableCommand(
    errors,
    stableInspection,
    'test "$GITHUB_REF" = "refs/heads/main"',
    'Stable candidate workflow must reject runs outside main',
  );
  requireExecutableCommand(
    errors,
    stableInspection,
    'test "$RELEASE_COMMIT" = "$GITHUB_SHA"',
    'Stable candidate workflow must bind npm provenance GITHUB_SHA to RELEASE_COMMIT',
  );
  requireCommandBeforePublication(
    errors,
    stableInspection,
    /^pnpm\s+verify:stable-publish-authorization\s+--\s+--commit "\$RELEASE_COMMIT"$/u,
    'Stable candidate workflow must verify publish authorization before publication',
  );
  const stablePublication = publicationCommandText(stableInspection);
  for (const [name, version] of packages) {
    if (name === '@context-action/webmcp') continue;
    if (!stablePublication.includes(`--scope ${name}`)) {
      errors.push(`Stable candidate workflow must publish ${name}@${version}`);
    }
  }

  const generalPublication = publicationCommandText(generalInspection);
  for (const name of [
    '@context-action/typedoc-vitepress-sync',
    '@context-action/ai-sdk',
    '@context-action/tool-durable-operations',
    '@context-action/llms-generator',
  ]) {
    if (!generalPublication.includes(`--scope ${name}`)) {
      errors.push(`General publish workflow must use the approved regular-package allow-list entry ${name}`);
    }
  }
  for (const name of ['@context-action/mutative-core', '@context-action/mutative']) {
    if (generalPublication.includes(`--scope ${name}`)) {
      errors.push(`General publish workflow must leave ${name} exclusively to the protected Mutative publisher`);
    }
  }
  errors.push(...protectedPublicationFailures(
    'Mutative workflow',
    mutativeInspection,
    workflowPublicationCommands(mutativeInspection),
  ));
  requireExecutableCommand(
    errors,
    mutativeInspection,
    'test "$RELEASE_COMMIT" = "$GITHUB_SHA"',
    'Mutative workflow must bind npm provenance GITHUB_SHA to RELEASE_COMMIT',
  );
  for (const [name] of packages) {
    if (generalPublication.includes(`--scope ${name}`)) {
      errors.push(`General publish workflow must not scope into the v1 artifact cohort package ${name}`);
    }
  }
  if (rootPackage.scripts?.release !== 'node scripts/refuse-direct-release.mjs'
    || rootPackage.scripts?.['release:patch'] !== 'node scripts/refuse-direct-release.mjs') {
    errors.push('Root release scripts must refuse direct npm publication');
  }
  requireText(
    errors,
    publishHelper,
    "process.env.GITHUB_ACTIONS !== 'true'",
    'Publish helper must reject direct local publication',
  );

  const maintenanceSemantic = workflowSemanticText(maintenanceInspection);
  if (maintenanceSemantic.includes('local_consumers=')
    || maintenanceSemantic.includes('PATCH_LOCAL_CONSUMERS')
    || maintenanceSemantic.includes('--local-package')) {
    errors.push('Maintenance candidate matrix must consume only published registry artifacts');
  }

  const journalStep = stepByName(maintenanceInspection, 'Prepare registry rollback journal');
  const journalScript = stepRunText(maintenanceInspection, 'Prepare registry rollback journal');
  const promotionStep = stepByName(maintenanceInspection, 'Promote verified candidate to latest');
  const promotionScript = stepRunText(maintenanceInspection, 'Promote verified candidate to latest');
  const journalEvidenceStep = stepByName(maintenanceInspection, 'Capture maintenance journal evidence');
  const journalEvidenceScript = stepRunText(maintenanceInspection, 'Capture maintenance journal evidence');
  const finalizationStep = stepByName(maintenanceInspection, 'Finalize successful promotion journal');
  const finalizationScript = stepRunText(maintenanceInspection, 'Finalize successful promotion journal');
  const rollbackStep = stepByName(maintenanceInspection, 'Roll back latest after post-promotion failure');
  const rollbackScript = stepRunText(maintenanceInspection, 'Roll back latest after post-promotion failure');

  if (!journalStep || !isUnconditionalFailClosedStep(journalStep)) {
    errors.push('Maintenance rollback journal must be prepared in a straight-line fail-closed step');
  }
  if (promotionStep?.definition.if
    !== "env.JOURNAL_COMPLETED != 'true' && env.LATEST_ALREADY_PROMOTED != 'true'") {
    errors.push('Maintenance promotion must skip only registry-confirmed completed or already-promoted states');
  }
  if (!finalizationStep || !isUnconditionalFailClosedStep(finalizationStep)) {
    errors.push('Maintenance promotion journal must finalize in a straight-line fail-closed step');
  }
  if (!journalEvidenceStep || !isUnconditionalFailClosedStep(journalEvidenceStep)) {
    errors.push('Maintenance journal evidence must be captured in a straight-line fail-closed step');
  }
  if (journalEvidenceStep?.definition.env?.JOURNAL_EVIDENCE_PATH
    !== 'reports/maintenance-patch-journal-evidence.json'
    || journalEvidenceStep?.definition.env?.RELEASE_COMMIT !== releaseCommitInputExpression) {
    errors.push('Maintenance journal evidence must bind its exact artifact path and release commit input');
  }
  if (rollbackStep?.definition.if !== failureOrCancellationCondition) {
    errors.push('Maintenance rollback must run after failure or cancellation without a run-local promotion flag');
  }

  for (const required of [
    'for attempt in {1..12}',
    'npm view "$PACKAGE_NAME" dist-tags --json --registry=https://registry.npmjs.org',
    'JSON.parse(process.env.DIST_TAGS_JSON)',
    'maintenance-previous-$PACKAGE_VERSION',
    'maintenance-previous-absent-$PACKAGE_VERSION',
    'maintenance-journal-ready-$PACKAGE_VERSION',
    'maintenance-journal-completed-$PACKAGE_VERSION',
    'maintenance-journal-rolled-back-$PACKAGE_VERSION',
    'CURRENT_CANDIDATE="$PACKAGE_VERSION"',
    foreignJournalErrorTemplate,
    'both previous and absent markers exist',
    'both completed and rolled-back markers exist',
    'Candidate is already latest but its rollback predecessor is missing',
    'Rollback journal must contain exactly one predecessor representation',
    'return 1',
  ]) {
    requireText(errors, journalScript, required, `Maintenance rollback journal must include ${required}`);
  }
  if (journalScript.includes('dist-tags.latest') || journalScript.includes('|| true')) {
    errors.push('Maintenance rollback journal must not collapse registry failures into absent state');
  }
  const previousWrite = 'npm dist-tag add "$PACKAGE_NAME@$current_latest" "$journal_previous_tag"';
  const absentWrite = 'npm dist-tag add "$PACKAGE_NAME@$PACKAGE_VERSION" "$journal_absent_tag"';
  const readyWrite = 'npm dist-tag add "$PACKAGE_NAME@$PACKAGE_VERSION" "$journal_ready_tag"';
  const previousWriteIndex = journalScript.indexOf(previousWrite);
  const absentWriteIndex = journalScript.indexOf(absentWrite);
  const readyWriteIndex = journalScript.indexOf(readyWrite);
  const predecessorReadbackIndex = journalScript.indexOf(
    'dist_tags="$(read_dist_tags)"',
    Math.max(previousWriteIndex + previousWrite.length, absentWriteIndex + absentWrite.length),
  );
  const readyReadbackIndex = journalScript.indexOf(
    'dist_tags="$(read_dist_tags)"',
    readyWriteIndex + readyWrite.length,
  );
  const readyVerificationIndex = journalScript.indexOf(
    'test "$ready_marker" = "$PACKAGE_VERSION"',
    readyReadbackIndex,
  );
  if (previousWriteIndex < 0 || absentWriteIndex < 0 || readyWriteIndex < 0
    || previousWriteIndex >= readyWriteIndex || absentWriteIndex >= readyWriteIndex
    || predecessorReadbackIndex < 0 || predecessorReadbackIndex >= readyWriteIndex
    || readyReadbackIndex < 0 || readyVerificationIndex <= readyReadbackIndex) {
    errors.push('Maintenance rollback journal must persist and verify one predecessor before arming promotion');
  }

  for (const required of [
    'test "$(tag_value maintenance)" = "$PACKAGE_VERSION"',
    'test "$ready_marker" = "$PACKAGE_VERSION"',
    'test -z "$completed_marker"',
    'test -z "$rolled_back_marker"',
    'test "$current_latest" = "$previous_latest"',
    'test -z "$current_latest"',
    'npm dist-tag add "$PACKAGE_NAME@$PACKAGE_VERSION" latest',
  ]) {
    requireText(errors, promotionScript, required, `Maintenance promotion must include ${required}`);
  }
  requireOrderedText(
    errors,
    promotionScript,
    'test "$current_latest" = "$previous_latest"',
    'npm dist-tag add "$PACKAGE_NAME@$PACKAGE_VERSION" latest',
    'Maintenance promotion must compare latest with the recorded predecessor before mutation',
  );
  requireOrderedText(
    errors,
    promotionScript,
    'npm dist-tag add "$PACKAGE_NAME@$PACKAGE_VERSION" latest',
    'test "$(tag_value latest)" = "$PACKAGE_VERSION"',
    'Maintenance promotion must read back latest after mutation',
  );

  for (const required of [
    'JOURNAL_EVIDENCE_PATH',
    'process.env.RELEASE_COMMIT !== process.env.GITHUB_SHA',
    'tags.maintenance !== candidate || tags.latest !== candidate || ready !== candidate',
    'journal evidence requires exactly one predecessor representation',
    'releaseCommit: process.env.RELEASE_COMMIT',
    'workflowEventSha: process.env.GITHUB_SHA',
    'predecessor,',
    'completed: completed ?? null',
    'writeFileSync(process.env.JOURNAL_EVIDENCE_PATH',
  ]) {
    requireText(errors, journalEvidenceScript, required, `Maintenance journal evidence must include ${required}`);
  }

  for (const required of [
    'test "$current_latest" = "$PACKAGE_VERSION"',
    'test "$ready_marker" = "$PACKAGE_VERSION"',
    'test -z "$rolled_back_marker"',
    'npm dist-tag add "$PACKAGE_NAME@$PACKAGE_VERSION" "$journal_completed_tag"',
    'test "$(tag_value "$journal_completed_tag")" = "$PACKAGE_VERSION"',
  ]) {
    requireText(errors, finalizationScript, required, `Maintenance promotion finalization must include ${required}`);
  }
  requireOrderedText(
    errors,
    finalizationScript,
    'test "$current_latest" = "$PACKAGE_VERSION"',
    'npm dist-tag add "$PACKAGE_NAME@$PACKAGE_VERSION" "$journal_completed_tag"',
    'Maintenance promotion must verify latest before recording completion',
  );
  requireOrderedText(
    errors,
    finalizationScript,
    'npm dist-tag add "$PACKAGE_NAME@$PACKAGE_VERSION" "$journal_completed_tag"',
    'test "$(tag_value "$journal_completed_tag")" = "$PACKAGE_VERSION"',
    'Maintenance promotion must read back its completed marker',
  );

  for (const required of [
    'for attempt in {1..12}',
    'npm view "$PACKAGE_NAME" dist-tags --json --registry=https://registry.npmjs.org',
    'test "$maintenance_candidate" = "$PACKAGE_VERSION"',
    'Promotion journal is completed; preserving verified latest',
    'Rollback journal must contain exactly one predecessor representation',
    'if [ "$current_latest" != "$PACKAGE_VERSION" ]',
    'npm dist-tag add "$PACKAGE_NAME@$PACKAGE_VERSION" "$journal_rolled_back_tag"',
    'test "$(tag_value "$journal_rolled_back_tag")" = "$PACKAGE_VERSION"',
    'npm dist-tag add "$PACKAGE_NAME@$rollback_target" latest',
    'npm dist-tag rm "$PACKAGE_NAME" latest',
    'test "$(tag_value latest)" = "$rollback_target"',
  ]) {
    requireText(errors, rollbackScript, required, `Maintenance latest rollback must include ${required}`);
  }
  if (rollbackScript.includes('LATEST_PROMOTED') || rollbackScript.includes('PREVIOUS_LATEST')) {
    errors.push('Maintenance rollback must recover exclusively from the registry journal');
  }
  const rollbackCasIndex = rollbackScript.indexOf('if [ "$current_latest" != "$PACKAGE_VERSION" ]');
  const rollbackMarkerWriteIndex = rollbackScript.indexOf(
    'npm dist-tag add "$PACKAGE_NAME@$PACKAGE_VERSION" "$journal_rolled_back_tag"',
  );
  const rollbackMarkerReadbackIndex = rollbackScript.indexOf(
    'dist_tags="$(read_dist_tags)"',
    rollbackMarkerWriteIndex,
  );
  const rollbackMarkerVerifyIndex = rollbackScript.indexOf(
    'test "$(tag_value "$journal_rolled_back_tag")" = "$PACKAGE_VERSION"',
    rollbackMarkerReadbackIndex,
  );
  const rollbackRestoreIndex = rollbackScript.indexOf(
    'npm dist-tag add "$PACKAGE_NAME@$rollback_target" latest',
  );
  const rollbackRemoveIndex = rollbackScript.indexOf('npm dist-tag rm "$PACKAGE_NAME" latest');
  const rollbackLatestReadbackIndex = rollbackScript.indexOf(
    'dist_tags="$(read_dist_tags)"',
    Math.max(rollbackRestoreIndex, rollbackRemoveIndex),
  );
  const rollbackLatestVerifyIndex = rollbackScript.indexOf(
    'test "$(tag_value latest)" = "$rollback_target"',
    rollbackLatestReadbackIndex,
  );
  if (rollbackCasIndex < 0 || rollbackMarkerWriteIndex <= rollbackCasIndex
    || rollbackMarkerReadbackIndex <= rollbackMarkerWriteIndex
    || rollbackMarkerVerifyIndex <= rollbackMarkerReadbackIndex
    || rollbackRestoreIndex <= rollbackMarkerVerifyIndex
    || rollbackRemoveIndex <= rollbackMarkerVerifyIndex
    || rollbackLatestReadbackIndex <= Math.max(rollbackRestoreIndex, rollbackRemoveIndex)
    || rollbackLatestVerifyIndex <= rollbackLatestReadbackIndex) {
    errors.push('Maintenance rollback must commit and verify rollback intent before restoring a compare-checked latest');
  }

  requireText(
    errors,
    changelogVerifier,
    "const requireReleaseDate = process.argv.includes('--require-release-date');",
    'Changelog verifier must support explicit prepublish ISO release-date validation',
  );
  requireText(
    errors,
    changelogVerifier,
    'options.requireReleaseDate || options.forbidUnreleased || options.requirePublishedRelease',
    'Source and local tarball changelog validation must require an ISO date for release artifacts',
  );
  requireText(
    errors,
    changelogVerifier,
    '{ forbidUnreleased: true, requireReleaseDate: true }',
    'Published changelog validation must retain the ISO release-date requirement',
  );

  const packageInput = workflowInput(maintenanceInspection.document, 'package');
  for (const packageName of ['core', 'react', 'ai-sdk', 'tool-protocol', 'webmcp']) {
    if (!packageInput || typeof packageInput !== 'object' || !Array.isArray(packageInput.options)
      || !packageInput.options.includes(packageName)) {
      errors.push(`Maintenance patch workflow must include ${packageName}`);
    }
  }
  const maintenanceReleaseInput = workflowInput(maintenanceInspection.document, 'release_commit');
  if (!maintenanceReleaseInput || typeof maintenanceReleaseInput !== 'object'
    || maintenanceReleaseInput.required !== true) {
    errors.push('Maintenance patch workflow must include release_commit:');
  }
  errors.push(...protectedPublicationFailures(
    'Maintenance patch workflow',
    maintenanceInspection,
    workflowPublicationCommands(maintenanceInspection),
  ));
  if (!maintenanceInspection.commands.some(({ command }) =>
    /^pnpm\s+(?:run\s+)?publish:packages\b.*--dist-tag maintenance(?:\s|$)/u.test(command))) {
    errors.push('Maintenance patch workflow must include --dist-tag maintenance');
  }
  requireExecutableCommand(
    errors,
    maintenanceInspection,
    'test "$CONFIRMATION" = publish-maintenance-patch',
    'Maintenance patch workflow must include test "$CONFIRMATION" = publish-maintenance-patch',
  );
  requireExecutableCommand(
    errors,
    maintenanceInspection,
    'test "$RELEASE_COMMIT" = "$GITHUB_SHA"',
    'Maintenance patch workflow must bind npm provenance GITHUB_SHA to RELEASE_COMMIT',
  );
  requireExactStepBeforePublication(
    errors,
    maintenanceInspection,
    maintenanceBuildStepName,
    maintenanceBuildStatements,
    {},
    'Maintenance patch workflow must build the complete workspace dependency graph before target type-check and test',
  );
  requireExactStepBeforePublication(
    errors,
    maintenanceInspection,
    'Re-verify approved source immediately before publication',
    approvedSourceStatements,
    { RELEASE_COMMIT: releaseCommitInputExpression },
    'Maintenance patch workflow must re-verify the approved clean source immediately before publication',
    { adjacent: true },
  );

  for (const required of [
    'node scripts/verify-tool-protocol-changelog.mjs --package "$PACKAGE_DIRECTORY" --forbid-unreleased --require-release-date',
    'PATCH_CONSUMER_CLOSURE=$consumer_closure',
    'verify-maintenance-patch-version.mjs',
    '--allow-initial',
    'Resume an existing verified candidate when safe',
    'PUBLISH_REQUIRED=false',
    'dist-tags.maintenance',
    'dist.integrity',
    'Verify local tarball reverse dependency closure',
    '--dist-tag maintenance',
    '--package-tag "$PACKAGE_NAME=maintenance"',
    'Verify published AI SDK Tool Protocol deduplication',
    'git show "$GITHUB_SHA:scripts/verify-ai-sdk-tool-protocol-contract.mjs"',
    'verifier_path="scripts/.verify-ai-sdk-tool-protocol-contract.workflow.mjs"',
    'node scripts/.verify-ai-sdk-tool-protocol-contract.workflow.mjs --published --version "$PACKAGE_VERSION"',
    'verify-maintenance-patch-provenance.mjs',
    'Prepare registry rollback journal',
    'ROLLBACK_JOURNAL_READY=true',
    'LATEST_ALREADY_PROMOTED=true',
    'Promote verified candidate to latest',
    'verify:published-tool-consumers -- --tag latest --packages "$PATCH_CONSUMER_CLOSURE"',
    'capture:published-release -- --tag latest --packages "$PACKAGE_NAME"',
    'Capture maintenance journal evidence',
    'maintenance-patch-journal-evidence.json',
    'Finalize successful promotion journal',
    'Roll back latest after post-promotion failure',
  ]) {
    requireText(
      errors,
      maintenanceSemantic,
      required,
      `Maintenance patch workflow must include ${required}`,
    );
  }

  requireStepOrder(errors, maintenanceInspection, 'Verify source and packed changelog', 'Publish the new patch candidate', 'Maintenance changelog validation must occur before candidate publication');
  requireStepOrder(errors, maintenanceInspection, maintenanceBuildStepName, 'Publish the new patch candidate', 'Maintenance package validation must occur before candidate publication');
  requireStepOrder(errors, maintenanceInspection, 'Verify local tarball reverse dependency closure', 'Publish the new patch candidate', 'Maintenance local consumer closure must run before candidate publication');
  requireStepOrder(errors, maintenanceInspection, 'Verify local tarball reverse dependency closure', 'Re-verify approved source immediately before publication', 'Maintenance approved-source recheck must follow local consumer validation');
  requireStepOrder(errors, maintenanceInspection, 'Resume an existing verified candidate when safe', 'Publish the new patch candidate', 'Maintenance candidate resume decision must occur before publication');
  requireStepOrder(errors, maintenanceInspection, 'Resume an existing verified candidate when safe', 'Verify patch-only semantic version increment', 'Maintenance candidate resume decision must precede patch version validation');
  requireStepOrder(errors, maintenanceInspection, 'Verify published candidate reverse dependency closure', 'Prepare registry rollback journal', 'Candidate consumer closure must pass before rollback journal mutation');
  requireStepOrder(errors, maintenanceInspection, 'Verify published candidate changelog and provenance', 'Prepare registry rollback journal', 'Candidate provenance must pass before rollback journal mutation');
  requireStepOrder(errors, maintenanceInspection, 'Prepare registry rollback journal', 'Promote verified candidate to latest', 'Maintenance workflow must persist a complete rollback journal before latest mutation');
  requireStepOrder(errors, maintenanceInspection, 'Promote verified candidate to latest', 'Verify latest closure and capture evidence', 'Latest consumer closure must run after promotion');
  requireStepOrder(errors, maintenanceInspection, 'Verify latest closure and capture evidence', 'Capture maintenance journal evidence', 'Maintenance journal snapshot must follow post-promotion verification');
  requireStepOrder(errors, maintenanceInspection, 'Capture maintenance journal evidence', 'Upload maintenance-patch evidence', 'Maintenance journal snapshot must be included in the evidence upload');
  requireStepOrder(errors, maintenanceInspection, 'Capture maintenance journal evidence', 'Finalize successful promotion journal', 'Maintenance completion marker must follow journal evidence capture');
  requireStepOrder(errors, maintenanceInspection, 'Upload maintenance-patch evidence', 'Finalize successful promotion journal', 'Maintenance completion marker must follow successful evidence upload');
  requireStepOrder(errors, maintenanceInspection, 'Finalize successful promotion journal', 'Roll back latest after post-promotion failure', 'Maintenance rollback recovery must follow completion finalization');

  return { errors, packages };
}

async function main() {
  const [stableCandidate, coordinatedCandidate, coordinatedPromotion, generalPublish, mutativePublish, maintenancePatch, manifestSource, packageSource, publishHelper, changelogVerifier, coordinatedPlanSource] = await Promise.all([
    readFile(path.join(workflowDirectory, 'publish-v1-stable-candidate.yml'), 'utf8'),
    readFile(path.join(workflowDirectory, 'publish-coordinated-stable-candidate.yml'), 'utf8'),
    readFile(path.join(workflowDirectory, 'promote-coordinated-stable.yml'), 'utf8'),
    readFile(path.join(workflowDirectory, 'publish-packages.yml'), 'utf8'),
    readFile(path.join(workflowDirectory, 'publish-mutative.yml'), 'utf8'),
    readFile(path.join(workflowDirectory, 'publish-maintenance-patch.yml'), 'utf8'),
    readFile(manifestPath, 'utf8'),
    readFile(path.join(repositoryRoot, 'package.json'), 'utf8'),
    readFile(path.join(repositoryRoot, 'scripts', 'publish-packages.cjs'), 'utf8'),
    readFile(path.join(repositoryRoot, 'scripts', 'verify-tool-protocol-changelog.mjs'), 'utf8'),
    readFile(path.join(repositoryRoot, 'releases', 'coordinated-stable-2026-08.json'), 'utf8'),
  ]);
  const { errors, packages } = validateReleaseWorkflowSources({
    stableCandidate,
    coordinatedCandidate,
    coordinatedPromotion,
    generalPublish,
    mutativePublish,
    maintenancePatch,
    manifestSource,
    packageSource,
    publishHelper,
    changelogVerifier,
    coordinatedPlanSource,
  });
  if (errors.length > 0) {
    console.error(`v1 release workflow contract failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({
      status: 'ok',
      workflows: [
        'publish-v1-stable-candidate.yml',
        'publish-coordinated-stable-candidate.yml',
        'promote-coordinated-stable.yml',
        'publish-mutative.yml',
        'publish-maintenance-patch.yml',
      ],
      cohort: packages.map(([name]) => name),
    }));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
}
