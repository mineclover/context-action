#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const paths = {
  manifest: 'docs/releases/v1.0.0/release-manifest.json',
  status: 'docs/releases/v1.0.0/status.md',
  readiness: 'docs/releases/v1.0.0/readiness.md',
  englishRoadmap: 'docs/en/context-layered/v1-release-roadmap.md',
  koreanRoadmap: 'docs/ko/context-layered/v1-release-roadmap.md',
};

function frontmatterValue(source, key) {
  return source.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? null;
}

function expect(errors, condition, message) {
  if (!condition) errors.push(message);
}

const sources = await Promise.all(Object.values(paths).map(file => readFile(path.join(repositoryRoot, file), 'utf8')));
const [manifestSource, status, readiness, englishRoadmap, koreanRoadmap] = sources;
const manifest = JSON.parse(manifestSource);
const errors = [];
const artifactCommit = manifest.artifactCohort?.commit;
const promotion = manifest.stablePromotion;

expect(errors, manifest.status === 'promoted', 'Manifest must be promoted.');
expect(errors, promotion?.status === 'promoted', 'Stable-promotion record must be promoted.');
expect(errors, typeof artifactCommit === 'string' && /^[a-f0-9]{40}$/u.test(artifactCommit), 'Manifest must record an immutable artifact commit.');
const runId = promotion?.workflowRun?.match(/\/runs\/(\d+)$/u)?.[1] ?? null;
for (const [language, roadmap] of [['EN', englishRoadmap], ['KO', koreanRoadmap]]) {
  expect(errors, frontmatterValue(roadmap, 'status') === 'completed', `${language} roadmap status must be completed.`);
  expect(errors, frontmatterValue(roadmap, 'releaseStatus') === 'promoted', `${language} roadmap releaseStatus must be promoted.`);
  expect(errors, frontmatterValue(roadmap, 'artifactCommit') === artifactCommit, `${language} roadmap artifactCommit must match the manifest.`);
  expect(errors, frontmatterValue(roadmap, 'promotionRun') === runId, `${language} roadmap promotionRun must match the manifest.`);
}
for (const [name, document] of [['status.md', status], ['readiness.md', readiness]]) {
  expect(errors, document.includes('PROMOTED — stable surfaces at latest'), `${name} must declare the promoted verdict.`);
}
expect(errors, status.includes('| G9 Security/supply chain | `verified` |'), 'status.md must record G9 as verified for the completed release.');
expect(errors, !status.includes('## Blocking conditions'), 'status.md must not retain an active blocking-conditions heading after promotion.');
expect(errors, readiness.includes(promotion?.governance?.commit ?? ''), 'readiness.md must record the manifest governance evidence commit.');
for (const [packageName, state] of Object.entries(manifest.currentRegistryState?.packages ?? {})) {
  const latest = state.distTags?.latest;
  expect(errors, typeof latest === 'string' && status.includes(`| \`${packageName}\` | \`${latest}\` |`), `status.md must record current latest for ${packageName}.`);
}
const stablePromotionResult = status.match(/## Stable promotion result\n([\s\S]*?)(?=\n## |$)/u)?.[1] ?? '';
const webmcpLatest = manifest.currentRegistryState?.packages?.['@context-action/webmcp']?.distTags?.latest;
if (typeof webmcpLatest === 'string') {
  expect(errors, stablePromotionResult.includes(`\`latest\` is the separately\npublished changelog correction \`${webmcpLatest}\``), 'Stable promotion result must name the current WebMCP latest correction.');
  expect(errors, !stablePromotionResult.includes('`latest` is the separately\npublished hygiene patch `0.1.1`'), 'Stable promotion result must not retain WebMCP 0.1.1 as latest.');
}
if (errors.length > 0) {
  console.error(`v1 release state alignment failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ status: 'ok', release: manifest.release, artifactCommit, promotionRun: runId }));
}
