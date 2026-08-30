#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reactDirectory = path.join(repositoryRoot, 'packages/react');
const [
  manifestSource,
  reactEntrySource,
  toolsSource,
  toolsReadmeSource,
  toolContextSource,
  webmcpSource,
  typedocSource,
] = await Promise.all([
  readFile(path.join(reactDirectory, 'package.json'), 'utf8'),
  readFile(path.join(reactDirectory, 'src/index.ts'), 'utf8'),
  readFile(path.join(reactDirectory, 'src/tools/index.ts'), 'utf8'),
  readFile(path.join(reactDirectory, 'src/tools/README.md'), 'utf8'),
  readFile(path.join(reactDirectory, 'src/tools/ToolContext.tsx'), 'utf8'),
  readFile(path.join(reactDirectory, 'src/webmcp.ts'), 'utf8'),
  readFile(path.join(repositoryRoot, 'typedoc.json'), 'utf8'),
]);
const manifest = JSON.parse(manifestSource);

assert.equal(
  manifest.exports?.['./tools'],
  undefined,
  'React 3 must not export the development-only ToolContext subpath.',
);
assert.doesNotMatch(
  typedocSource,
  /packages\/react\/src\/tools\/index\.ts/u,
  'Public API reference generation must not publish the development-only ToolContext source.',
);
assert.ok(manifest.exports?.['./webmcp'], 'Experimental WebMCP subpath must be exported.');
assert.doesNotMatch(
  reactEntrySource,
  /@context-action\/react\/tools/u,
  'The public React entry must not describe an unavailable ToolContext subpath.',
);
assert.doesNotMatch(toolsSource, /WebMCP/, 'The development-only ToolContext source must not export WebMCP APIs.');
assert.match(
  toolsReadmeSource,
  /not\s+an installable `@context-action\/react\/tools` entry/u,
  'The ToolContext source track must document that it is not an installable React 3 entry.',
);
assert.match(
  toolContextSource,
  /repository source only/u,
  'ToolContext source documentation must identify the development-track boundary.',
);
assert.doesNotMatch(
  toolContextSource,
  /from '@context-action\/react\/tools'/u,
  'ToolContext source examples must not recommend an unavailable React 3 package import.',
);
assert.match(webmcpSource, /useWebMCPToolScope/, 'Experimental subpath must expose the lifecycle hook.');
assert.match(webmcpSource, /experimental/i, 'Experimental status must be documented at the entry point.');
assert.match(
  webmcpSource,
  /ToolManagementInterface/u,
  'The public WebMCP adapter must document its registry-agnostic boundary.',
);

console.log('React 3 excludes the development-only ToolContext track and isolates WebMCP behind @context-action/react/webmcp.');
