#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const reactDistDirectory = path.join(repositoryRoot, 'packages/react/dist');
const failures = [];

async function readArtifact(relativePath) {
  try {
    return await readFile(path.join(reactDistDirectory, relativePath), 'utf8');
  } catch (error) {
    failures.push(`missing React production artifact ${relativePath}: ${error.message}`);
    return '';
  }
}

function expectAbsent(content, relativePath, pattern, description) {
  if (pattern.test(content)) {
    failures.push(`${relativePath}: ${description}`);
  }
}

function expectPresent(content, relativePath, pattern, description) {
  if (!pattern.test(content)) {
    failures.push(`${relativePath}: ${description}`);
  }
}

const [rootEsm, rootCjs, rootTypes, toolsEsm, toolsCjs, toolsTypes] = await Promise.all([
  readArtifact('index.js'),
  readArtifact('index.cjs'),
  readArtifact('index.d.ts'),
  readArtifact('tools/index.js'),
  readArtifact('tools/index.cjs'),
  readArtifact('tools/index.d.ts'),
]);

const toolRuntimePattern = /@context-action\/tool-(?:protocol|durable-operations)/;
const toolPublicApiPattern = /\b(?:createToolContext|ToolContextConfig|ToolRegistry)\b/;

for (const [relativePath, content] of [
  ['index.js', rootEsm],
  ['index.cjs', rootCjs],
]) {
  expectAbsent(
    content,
    relativePath,
    toolRuntimePattern,
    'the default entry must not load tool protocol or durable-operation runtimes; use @context-action/react/tools instead',
  );
  expectAbsent(
    content,
    relativePath,
    /console\.log\(`\[TimeTravelStore:/,
    'development-only TimeTravelStore logging must not be present in the production build',
  );
}

expectAbsent(
  rootTypes,
  'index.d.ts',
  toolPublicApiPattern,
  'the default entry must not expose ToolContext types; use @context-action/react/tools instead',
);

for (const [relativePath, content] of [
  ['tools/index.js', toolsEsm],
  ['tools/index.cjs', toolsCjs],
]) {
  expectPresent(
    content,
    relativePath,
    /@context-action\/tool-protocol/,
    'the explicit tools entry must retain its tool-protocol runtime dependency',
  );
}

expectPresent(
  toolsTypes,
  'tools/index.d.ts',
  /\bcreateToolContext\b/,
  'the explicit tools entry must expose createToolContext',
);

if (failures.length > 0) {
  console.error(`React production artifact boundary verification failed with ${failures.length} error(s):`);
  failures.forEach((failure) => console.error(`  ✗ ${failure}`));
  process.exitCode = 1;
} else {
  console.log('Verified React production artifact boundaries: default entry is tool-free and tools entry is explicit.');
}
