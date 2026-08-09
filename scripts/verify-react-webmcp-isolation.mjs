#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reactDirectory = path.join(repositoryRoot, 'packages/react');
const [manifestSource, toolsSource, webmcpSource] = await Promise.all([
  readFile(path.join(reactDirectory, 'package.json'), 'utf8'),
  readFile(path.join(reactDirectory, 'src/tools/index.ts'), 'utf8'),
  readFile(path.join(reactDirectory, 'src/webmcp.ts'), 'utf8'),
]);
const manifest = JSON.parse(manifestSource);

assert.ok(manifest.exports?.['./tools'], 'Stable ToolContext subpath must remain exported.');
assert.ok(manifest.exports?.['./webmcp'], 'Experimental WebMCP subpath must be exported.');
assert.doesNotMatch(toolsSource, /WebMCP/, 'Stable @context-action/react/tools must not export WebMCP APIs.');
assert.match(webmcpSource, /useWebMCPToolScope/, 'Experimental subpath must expose the lifecycle hook.');
assert.match(webmcpSource, /experimental/i, 'Experimental status must be documented at the entry point.');

console.log('React WebMCP API is isolated behind @context-action/react/webmcp.');
