#!/usr/bin/env node

import { readFile, stat } from 'node:fs/promises';
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

async function expectArtifactAbsent(relativePath, description) {
  try {
    await stat(path.join(reactDistDirectory, relativePath));
    failures.push(`${relativePath}: ${description}`);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      failures.push(`could not inspect React production artifact ${relativePath}: ${error.message}`);
    }
  }
}

const [rootEsm, rootCjs, rootTypes] = await Promise.all([
  readArtifact('index.js'),
  readArtifact('index.cjs'),
  readArtifact('index.d.ts'),
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
    'the default entry must not load tool protocol or durable-operation runtimes',
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
  'the default entry must not expose ToolContext types',
);

await Promise.all([
  expectArtifactAbsent('tools/index.js', 'React 2 must not ship the development ToolContext entry'),
  expectArtifactAbsent('tools/index.cjs', 'React 2 must not ship the development ToolContext entry'),
  expectArtifactAbsent('tools/index.d.ts', 'React 2 must not ship the development ToolContext declarations'),
]);

if (failures.length > 0) {
  console.error(`React production artifact boundary verification failed with ${failures.length} error(s):`);
  failures.forEach((failure) => console.error(`  ✗ ${failure}`));
  process.exitCode = 1;
} else {
  console.log('Verified React production artifact boundaries: public React 2 entries are tool-free.');
}
