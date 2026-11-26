import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  verifyBasicArtifactGraph,
  verifyReachableGraphAbsent,
  verifyReachableGraphContains,
} from './verify-react-artifact-boundary.mjs';

async function withArtifacts(files, run) {
  const directory = await mkdtemp(path.join(tmpdir(), 'react-artifact-boundary-'));
  try {
    for (const [name, content] of Object.entries(files)) {
      const target = path.join(directory, name);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, content);
    }
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('follows declaration chunks rather than similarly named runtime chunks', async () => {
  await withArtifacts({
    'index.d.ts': 'export * from "./chunks/action.js";',
    'chunks/action.js': 'export {};',
    'chunks/action.d.ts': 'export type Schema = import("@context-action/tool-protocol").Schema;',
  }, async directory => {
    const errors = await verifyBasicArtifactGraph(directory, ['index.d.ts']);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /action\.d\.ts:.*tool-protocol/);
  });
});

test('follows CommonJS declarations and runtime require/dynamic import edges', async () => {
  await withArtifacts({
    'index.d.cts': 'export * from "./action.cjs";',
    'action.d.cts': 'import api = require("@context-action/ai-sdk");',
    'index.cjs': 'require("./chunks/shared.cjs");',
    'chunks/shared.cjs': 'import("@context-action/webmcp"); require("../index.cjs");',
  }, async directory => {
    const errors = await verifyBasicArtifactGraph(directory, ['index.d.cts', 'index.cjs']);
    assert.equal(errors.length, 2);
    assert.match(errors.join('\n'), /ai-sdk/);
    assert.match(errors.join('\n'), /webmcp/);
  });
});

test('allows basic imports and ignores an unreachable opt-in adapter', async () => {
  await withArtifacts({
    'index.js': 'export * from "./store.js";',
    'store.js': 'import "@context-action/mutative"; import "@context-action/core"; import "react";',
    'index.d.ts': 'export * from "@context-action/store-core";',
    'webmcp.js': 'import "@context-action/webmcp";',
  }, async directory => {
    assert.deepEqual(await verifyBasicArtifactGraph(directory, ['index.js', 'index.d.ts']), []);
  });
});

test('fails closed when a reachable declaration chunk is missing', async () => {
  await withArtifacts({ 'index.d.ts': 'export * from "./missing.js";' }, async directory => {
    const errors = await verifyBasicArtifactGraph(directory, ['index.d.ts']);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /missing\.d\.ts: missing reachable artifact/);
  });
});

test('verifyReachableGraphAbsent rejects forbidden imports buried in transitive chunks', async () => {
  await withArtifacts({
    'transactions.js': 'export * from "./chunks/bridge.js";',
    'chunks/bridge.js': 'import "@context-action/mutative";',
  }, async directory => {
    const errors = await verifyReachableGraphAbsent(
      directory,
      ['transactions.js'],
      /@context-action\/mutative/,
      'forbidden mutative dependency',
    );
    assert.equal(errors.length, 1);
    assert.match(errors[0], /chunks\/bridge\.js: forbidden mutative dependency/);
  });
});

test('verifyReachableGraphContains verifies transitive compiler runtime across arbitrary chunk names', async () => {
  await withArtifacts({
    'index.js': 'export * from "./chunks/arbitrary-chunk.js";',
    'chunks/arbitrary-chunk.js': 'import "react-compiler-runtime";',
  }, async directory => {
    const okErrors = await verifyReachableGraphContains(
      directory,
      ['index.js'],
      /(?:react\/compiler-runtime|react-compiler-runtime)/,
      'missing compiler runtime',
    );
    assert.deepEqual(okErrors, []);

    const missingErrors = await verifyReachableGraphContains(
      directory,
      ['chunks/arbitrary-chunk.js'],
      /nonexistent-runtime-token/,
      'missing compiler runtime',
    );
    assert.equal(missingErrors.length, 1);
    assert.match(missingErrors[0], /missing compiler runtime/);
  });
});
