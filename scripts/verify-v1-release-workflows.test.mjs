import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { validateReleaseWorkflowSources } from './verify-v1-release-workflows.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failureOrCancellationCondition = '$' + '{{ failure() || cancelled() }}';
const foreignJournalError = 'foreign maintenance journal $' + '{candidate} is unresolved';

function replaceAfter(source, anchor, target, replacement) {
  const anchorIndex = source.indexOf(anchor);
  assert.notEqual(anchorIndex, -1, `Missing mutation anchor: ${anchor}`);
  const targetIndex = source.indexOf(target, anchorIndex);
  assert.notEqual(targetIndex, -1, `Missing mutation target after ${anchor}: ${target}`);
  return source.slice(0, targetIndex) + replacement + source.slice(targetIndex + target.length);
}

function releaseSources() {
  const read = relativePath => readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
  return {
    stableCandidate: read('.github/workflows/publish-v1-stable-candidate.yml'),
    coordinatedCandidate: read('.github/workflows/publish-coordinated-stable-candidate.yml'),
    coordinatedPromotion: read('.github/workflows/promote-coordinated-stable.yml'),
    generalPublish: read('.github/workflows/publish-packages.yml'),
    mutativePublish: read('.github/workflows/publish-mutative.yml'),
    maintenancePatch: read('.github/workflows/publish-maintenance-patch.yml'),
    manifestSource: read('docs/releases/v1.0.0/release-manifest.json'),
    packageSource: read('package.json'),
    publishHelper: read('scripts/publish-packages.cjs'),
    changelogVerifier: read('scripts/verify-tool-protocol-changelog.mjs'),
    coordinatedPlanSource: read('releases/coordinated-stable-2026-08.json'),
  };
}

test('accepts the reviewed release workflow structures', () => {
  const { errors } = validateReleaseWorkflowSources(releaseSources());
  assert.deepEqual(errors, []);
});

test('requires the coordinated candidate closure before publication', () => {
  const sources = releaseSources();
  sources.coordinatedCandidate = sources.coordinatedCandidate.replace(
    '          node scripts/verify-published-tool-consumers.cjs --local --cohort-only \\',
    '          echo "candidate closure disabled"',
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.includes(
    'Coordinated stable candidate workflow must validate the packed candidate closure before publication',
  ));
});

test('requires explicit coordinated promotion confirmation', () => {
  const sources = releaseSources();
  sources.coordinatedPromotion = sources.coordinatedPromotion.replace(
    '          test "$CONFIRMATION" = "PROMOTE_COORDINATED_STABLE"',
    '          # test "$CONFIRMATION" = "PROMOTE_COORDINATED_STABLE"',
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.some(error => error.includes('PROMOTE_COORDINATED_STABLE')));
});

test('does not accept a commented stable-release guard', () => {
  const sources = releaseSources();
  sources.stableCandidate = sources.stableCandidate.replace(
    '          test "$GITHUB_REF" = "refs/heads/main"',
    '          # test "$GITHUB_REF" = "refs/heads/main"',
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.some(error => /main dispatch-ref guard|reject runs outside main/u.test(error)));
});

test('does not accept protected guard text emitted by another command', () => {
  const sources = releaseSources();
  sources.stableCandidate = sources.stableCandidate.replace(
    '          test "$GITHUB_REF" = "refs/heads/main"',
    '          echo \'test "$GITHUB_REF" = "refs/heads/main"\'',
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.some(error => /main dispatch-ref guard|reject runs outside main/u.test(error)));
});

for (const [sourceName, description] of [
  ['stableCandidate', 'Stable candidate workflow'],
  ['mutativePublish', 'Mutative workflow'],
  ['maintenancePatch', 'Maintenance patch workflow'],
]) {
  test(`${description} binds the provenance event SHA to the approved commit`, () => {
    const sources = releaseSources();
    sources[sourceName] = sources[sourceName].replace(
      '          test "$RELEASE_COMMIT" = "$GITHUB_SHA"',
      '          # test "$RELEASE_COMMIT" = "$GITHUB_SHA"',
    );
    const { errors } = validateReleaseWorkflowSources(sources);
    assert.ok(errors.includes(
      `${description} must bind npm provenance GITHUB_SHA to RELEASE_COMMIT`,
    ));
  });
}

test('does not accept a provenance SHA equality whose failure is neutralized', () => {
  const sources = releaseSources();
  sources.mutativePublish = sources.mutativePublish.replace(
    '          test "$RELEASE_COMMIT" = "$GITHUB_SHA"',
    '          test "$RELEASE_COMMIT" = "$GITHUB_SHA" || true',
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.some(error =>
    error.includes('Mutative workflow must bind npm provenance GITHUB_SHA to RELEASE_COMMIT')
    || error.includes('dispatch event SHA equality')));
});

test('requires the complete workspace build before maintenance target validation', () => {
  const sources = releaseSources();
  sources.maintenancePatch = sources.maintenancePatch.replace(
    '          pnpm build\n',
    '          pnpm --filter @context-action/react build\n',
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.includes(
    'Maintenance patch workflow must build the complete workspace dependency graph before target type-check and test',
  ));
});

test('requires maintenance target type-check and test after the workspace build', () => {
  const sources = releaseSources();
  sources.maintenancePatch = sources.maintenancePatch.replace(
    [
      '          pnpm build',
      '          pnpm --filter "$PACKAGE_NAME" type-check',
      '          pnpm --filter "$PACKAGE_NAME" test',
    ].join('\n'),
    [
      '          pnpm --filter "$PACKAGE_NAME" type-check',
      '          pnpm build',
      '          pnpm --filter "$PACKAGE_NAME" test',
    ].join('\n'),
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.includes(
    'Maintenance patch workflow must build the complete workspace dependency graph before target type-check and test',
  ));
});

test('requires the maintenance approved-source recheck immediately before publication', () => {
  const sources = releaseSources();
  sources.maintenancePatch = sources.maintenancePatch.replace(
    '      - name: Publish the new patch candidate\n',
    [
      '      - name: Intervening lifecycle mutation',
      '        run: true',
      '',
      '      - name: Publish the new patch candidate',
      '',
    ].join('\n'),
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.includes(
    'Maintenance patch workflow must re-verify the approved clean source immediately before publication',
  ));
});

test('does not accept a neutralized maintenance approved-source cleanliness check', () => {
  const sources = releaseSources();
  sources.maintenancePatch = replaceAfter(
    sources.maintenancePatch,
    '      - name: Re-verify approved source immediately before publication',
    '          git diff --exit-code',
    '          git diff --exit-code || true',
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.includes(
    'Maintenance patch workflow must re-verify the approved clean source immediately before publication',
  ));
});

test('does not accept stable-release guards from a continue-on-error step', () => {
  const sources = releaseSources();
  sources.stableCandidate = sources.stableCandidate.replace(
    '      - name: Verify approved main release commit\n',
    '      - name: Verify approved main release commit\n        continue-on-error: true\n',
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.some(error => /main dispatch-ref guard|reject runs outside main/u.test(error)));
});

test('does not accept stable-release guards under a custom job shell', () => {
  const sources = releaseSources();
  sources.stableCandidate = sources.stableCandidate.replace(
    '    runs-on: ubuntu-latest\n',
    '    runs-on: ubuntu-latest\n    defaults:\n      run:\n        shell: bash {0}\n',
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.some(error => /main dispatch-ref guard|reject runs outside main/u.test(error)));
});

test('requires stable authorization to be an executable prepublication command', () => {
  const sources = releaseSources();
  sources.stableCandidate = sources.stableCandidate.replace(
    '        run: pnpm verify:stable-publish-authorization -- --commit "$RELEASE_COMMIT"',
    '        run: echo \'pnpm verify:stable-publish-authorization -- --commit "$RELEASE_COMMIT"\'',
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.includes('Stable candidate workflow must verify publish authorization before publication'));
});

test('does not accept stable authorization whose failure is neutralized', () => {
  const sources = releaseSources();
  sources.stableCandidate = sources.stableCandidate.replace(
    '        run: pnpm verify:stable-publish-authorization -- --commit "$RELEASE_COMMIT"',
    '        run: pnpm verify:stable-publish-authorization -- --commit "$RELEASE_COMMIT" || true',
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.includes('Stable candidate workflow must verify publish authorization before publication'));
});

test('does not let a YAML comment satisfy a maintenance publication command contract', () => {
  const sources = releaseSources();
  sources.maintenancePatch = sources.maintenancePatch.replace(
    '          pnpm publish:packages -- --summary-file reports/maintenance-patch-summary.json \\',
    '          # pnpm publish:packages -- --summary-file reports/maintenance-patch-summary.json \\',
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.some(error =>
    error.includes('Maintenance patch workflow must include --dist-tag maintenance')));
});

test('requires the maintenance predecessor marker before the ready marker', () => {
  const sources = releaseSources();
  sources.maintenancePatch = sources.maintenancePatch.replace(
    '              npm dist-tag add "$PACKAGE_NAME@$current_latest" "$journal_previous_tag" --registry=https://registry.npmjs.org',
    '              echo "previous marker disabled"',
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.includes(
    'Maintenance rollback journal must persist and verify one predecessor before arming promotion',
  ));
});

test('requires maintenance promotion to compare current latest with its recorded predecessor', () => {
  const sources = releaseSources();
  sources.maintenancePatch = replaceAfter(
    sources.maintenancePatch,
    '      - name: Promote verified candidate to latest',
    '            test "$current_latest" = "$previous_latest"\n          elif [ -z "$previous_latest" ]',
    '            :\n          elif [ -z "$previous_latest" ]',
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.includes(
    'Maintenance promotion must include test "$current_latest" = "$previous_latest"',
  ));
});

test('requires maintenance success to persist a completed marker', () => {
  const sources = releaseSources();
  sources.maintenancePatch = sources.maintenancePatch.replace(
    '          npm dist-tag add "$PACKAGE_NAME@$PACKAGE_VERSION" "$journal_completed_tag" --registry=https://registry.npmjs.org',
    '          echo "completed marker disabled"',
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.some(error => error.includes(
    'Maintenance promotion finalization must include npm dist-tag add',
  )));
});

test('requires successful evidence upload before maintenance completion', () => {
  const sources = releaseSources();
  sources.maintenancePatch = sources.maintenancePatch
    .replace('      - name: Upload maintenance-patch evidence\n', '      - name: TEMP maintenance evidence step\n')
    .replace('      - name: Finalize successful promotion journal\n', '      - name: Upload maintenance-patch evidence\n')
    .replace('      - name: TEMP maintenance evidence step\n', '      - name: Finalize successful promotion journal\n');
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.includes(
    'Maintenance completion marker must follow successful evidence upload',
  ));
});

test('requires uploaded maintenance journal evidence to bind the release commit and registry state', () => {
  const sources = releaseSources();
  sources.maintenancePatch = replaceAfter(
    sources.maintenancePatch,
    '      - name: Capture maintenance journal evidence',
    '              releaseCommit: process.env.RELEASE_COMMIT,',
    '              releaseCommit: "unbound",',
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.includes(
    'Maintenance journal evidence must include releaseCommit: process.env.RELEASE_COMMIT',
  ));
});

test('requires rollback recovery on cancellation without a run-local promotion flag', () => {
  const sources = releaseSources();
  sources.maintenancePatch = sources.maintenancePatch.replace(
    `        if: ${failureOrCancellationCondition}`,
    "        if: failure() && env.LATEST_PROMOTED == 'true'",
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.includes(
    'Maintenance rollback must run after failure or cancellation without a run-local promotion flag',
  ));
});

test('requires rollback intent to be durable before latest restoration', () => {
  const sources = releaseSources();
  const markerWrite = '            npm dist-tag add "$PACKAGE_NAME@$PACKAGE_VERSION" "$journal_rolled_back_tag" --registry=https://registry.npmjs.org\n';
  sources.maintenancePatch = sources.maintenancePatch.replace(markerWrite, '');
  sources.maintenancePatch = sources.maintenancePatch.replace(
    '          dist_tags="$(read_dist_tags)"\n          test "$(tag_value maintenance)" = "$PACKAGE_VERSION"\n          test "$(tag_value latest)" = "$rollback_target"',
    `${markerWrite}          dist_tags="$(read_dist_tags)"\n          test "$(tag_value maintenance)" = "$PACKAGE_VERSION"\n          test "$(tag_value latest)" = "$rollback_target"`,
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.includes(
    'Maintenance rollback must commit and verify rollback intent before restoring a compare-checked latest',
  ));
});

test('rejects maintenance journal logic that omits foreign active-journal detection', () => {
  const sources = releaseSources();
  sources.maintenancePatch = sources.maintenancePatch.replace(
    `                  throw new Error(\`${foreignJournalError}\`);`,
    '                  throw new Error(`foreign state ignored`);',
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.includes(
    `Maintenance rollback journal must include ${foreignJournalError}`,
  ));
});

test('rejects Mutative scopes from the general publisher', () => {
  const sources = releaseSources();
  sources.generalPublish = sources.generalPublish.replace(
    '            --scope @context-action/ai-sdk \\',
    [
      '            --scope @context-action/mutative-core \\',
      '            --scope @context-action/ai-sdk \\',
    ].join('\n'),
  );
  const { errors } = validateReleaseWorkflowSources(sources);
  assert.ok(errors.includes(
    'General publish workflow must leave @context-action/mutative-core exclusively to the protected Mutative publisher',
  ));
});
