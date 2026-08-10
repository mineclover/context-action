#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const englishPath = path.join(repositoryRoot, 'docs/en/context-layered/v1-release-roadmap.md');
const koreanPath = path.join(repositoryRoot, 'docs/ko/context-layered/v1-release-roadmap.md');

function frontmatterValue(source, key) {
  return source.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? null;
}

function orderedMatches(source, expression) {
  return [...source.matchAll(expression)].map(match => match[1]);
}

function definitionOfReadyCount(source, heading) {
  const start = source.indexOf(heading);
  if (start < 0) return null;
  const section = source.slice(start).split('\n## ', 2)[0];
  return (section.match(/^[-*] /gm) ?? []).length;
}

const [english, korean] = await Promise.all([readFile(englishPath, 'utf8'), readFile(koreanPath, 'utf8')]);
const checks = [
  ['status', frontmatterValue(english, 'status'), frontmatterValue(korean, 'status')],
  ['roadmapRevision', frontmatterValue(english, 'roadmapRevision'), frontmatterValue(korean, 'roadmapRevision')],
  ['artifactCommit', frontmatterValue(english, 'artifactCommit'), frontmatterValue(korean, 'artifactCommit')],
  ['promotionRun', frontmatterValue(english, 'promotionRun'), frontmatterValue(korean, 'promotionRun')],
  ['completedAt', frontmatterValue(english, 'completedAt'), frontmatterValue(korean, 'completedAt')],
  ['releaseStatus', frontmatterValue(english, 'releaseStatus'), frontmatterValue(korean, 'releaseStatus')],
  ['milestones', orderedMatches(english, /^### (M\d)\b/g), orderedMatches(korean, /^### (M\d)\b/g)],
  ['gates', orderedMatches(english, /^\| (G\d) /gm), orderedMatches(korean, /^\| (G\d) /gm)],
  ['initial issue IDs', orderedMatches(english, /`(CA-1X-[A-Z]+-\d+)`/g), orderedMatches(korean, /`(CA-1X-[A-Z]+-\d+)`/g)],
  ['Definition of Ready item count', definitionOfReadyCount(english, '## 11. Definition of ready'), definitionOfReadyCount(korean, '## 11. Ready 정의')],
];
const failures = checks.filter(([, englishValue, koreanValue]) => JSON.stringify(englishValue) !== JSON.stringify(koreanValue));
if (failures.length > 0) {
  console.error('v1 release roadmap alignment failed:');
  failures.forEach(([name, englishValue, koreanValue]) => console.error(`- ${name}: EN=${JSON.stringify(englishValue)} KO=${JSON.stringify(koreanValue)}`));
  process.exitCode = 1;
} else {
  console.log(`v1 release roadmaps aligned (${checks.length} invariants).`);
}
