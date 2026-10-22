#!/usr/bin/env node

/**
 * verify-lit-public-consumer-smoke.mjs
 *
 * Isolated registry consumer verification for the published Lit cohort
 * (`@context-action/lit` + `@context-action/lit-ui`).
 *
 * Version selection:
 *   --cohort                     pin both packages to releases/lit-public-2026-10.json
 *   --version <v>                shared version
 *   --lit-version <v>            override @context-action/lit
 *   --lit-ui-version <v>         override @context-action/lit-ui
 *   --tag <dist-tag>             fallback dist-tag
 *
 * Verifies:
 *   1. Clean npm install from the public registry
 *   2. CJS and ESM export contracts
 *   3. Runtime SSR (part/data/reflected/complex property)
 *   4. TypeScript consumer typing for the bridge and SSR entry
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { retryTransientRegistryVisibility } from './registry-visibility-retry.cjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const keepSandbox = args.includes('--keep-sandbox');
const verbose = args.includes('--verbose');
const registryIndex = args.indexOf('--registry');
const REGISTRY = registryIndex !== -1 && args[registryIndex + 1] && !args[registryIndex + 1].startsWith('--')
  ? args[registryIndex + 1]
  : 'https://registry.npmjs.org';

function optionValue(name) {
  const index = args.indexOf(name);
  return index !== -1 && args[index + 1] && !args[index + 1].startsWith('--')
    ? args[index + 1]
    : null;
}

const cohortPlan = args.includes('--cohort')
  ? JSON.parse(readFileSync(path.join(repositoryRoot, 'releases', 'lit-public-2026-10.json'), 'utf8'))
  : null;
const sharedVersion = optionValue('--version');
const targetVersions = {
  lit: optionValue('--lit-version') ?? cohortPlan?.packages?.['@context-action/lit'] ?? sharedVersion,
  litUi: optionValue('--lit-ui-version') ?? cohortPlan?.packages?.['@context-action/lit-ui'] ?? sharedVersion,
};
const targetTag = optionValue('--tag');
const specifierFor = version => (version ? `@${version}` : targetTag ? `@${targetTag}` : '');

const PACKAGES = [
  `@context-action/lit${specifierFor(targetVersions.lit)}`,
  `@context-action/lit-ui${specifierFor(targetVersions.litUi)}`,
];

const DEPENDENCIES = [
  'lit@3.3.3',
  '@lit/context@1.1.6',
  '@lit-labs/ssr@4.1.0',
  '@lit-labs/ssr-client@1.1.8',
  'react@19.3.1',
  'react-dom@19.3.1',
  '@types/react@19.2.17',
  '@types/react-dom@19.2.3',
  'typescript@6.0.3',
];

let totalAssertions = 0;

function run(command, commandArgs, options = {}) {
  const cwd = options.cwd || process.cwd();
  const sanitizedEnv = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !key.toLowerCase().startsWith('npm_config_') && key !== 'NODE_PATH',
    ),
  );
  if (verbose) console.log(`[EXEC] ${command} ${commandArgs.join(' ')} (in ${cwd})`);
  const result = spawnSync(command, commandArgs, {
    cwd,
    encoding: 'utf8',
    env: { ...sanitizedEnv, ...options.env, NODE_PATH: '' },
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(
      `Command failed with exit code ${result.status}: ${command} ${commandArgs.join(' ')}\n`
        + `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
    );
  }
  if (verbose && result.stdout) console.log(result.stdout);
  return result.stdout;
}

async function npmInstallWithRetry(cwd, packagesToInstall) {
  await retryTransientRegistryVisibility(async attempt => {
    const cacheDir = await mkdtemp(path.join(cwd, `.npm-cache-${attempt ?? 0}-`));
    try {
      run('npm', [
        'install', '--ignore-scripts', '--no-audit', '--no-fund', '--prefer-online',
        `--registry=${REGISTRY}`, '--cache', cacheDir,
        ...packagesToInstall,
      ], { cwd });
    } finally {
      await rm(cacheDir, { recursive: true, force: true }).catch(() => {});
    }
  }, {
    onRetry: ({ nextAttempt, delay }) => {
      console.warn(`[WARN] npm registry visibility retry in ${delay}ms (attempt ${nextAttempt})`);
    },
  });
}

async function createSandbox() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'context-action-lit-consumer-smoke-'));
  await writeFile(path.join(dir, 'package.json'), `${JSON.stringify({
    name: 'lit-public-consumer-smoke',
    private: true,
    type: 'module',
  }, null, 2)}\n`);
  await writeFile(
    path.join(dir, '.npmrc'),
    `registry=${REGISTRY}\npackage-lock=false\naudit=false\nfund=false\nignore-scripts=true\n`,
  );
  return dir;
}

const runtimeScript = `
import assert from 'node:assert/strict';
import { LitElement, html } from 'lit';
import { ActionController, ControllerScope, StoreController } from '@context-action/lit';
import {
  createElementFacade,
  createLitElementBridge,
  createStoreContext,
} from '@context-action/lit-ui';
import { renderLitElement, renderLitTemplate } from '@context-action/lit-ui/ssr';
import { hydrateLit } from '@context-action/lit-ui/hydrate';

for (const [name, value] of Object.entries({
  ControllerScope,
  StoreController,
  ActionController,
  createElementFacade,
  createLitElementBridge,
  createStoreContext,
  renderLitElement,
  renderLitTemplate,
  hydrateLit,
})) {
  assert.equal(typeof value, 'function', name + ' export missing');
}

class PublishedProbeElement extends LitElement {
  static properties = {
    label: { type: String, reflect: true },
    input: { attribute: false },
  };
  label = 'published';
  input = { ok: true };
  render() {
    return html\`<span part="data" data-testid="data">\${this.label}:\${JSON.stringify(this.input)}</span>\`;
  }
}
if (!customElements.get('published-probe-element')) {
  customElements.define('published-probe-element', PublishedProbeElement);
}

const elementOutput = renderLitElement(new PublishedProbeElement());
assert.match(elementOutput, /part="data"/u);
assert.match(elementOutput, /data-testid="data"/u);
assert.match(elementOutput, /label="published"/u);
assert.match(elementOutput, /\\{&quot;ok&quot;:true\\}/u);

const templateOutput = renderLitTemplate(html\`<div part="ruler" data-x="1">ok</div>\`);
assert.match(templateOutput, /part="ruler"/u);
assert.match(templateOutput, /data-x="1"/u);

const scope = new ControllerScope({ addController() {}, removeController() {} });
let disposed = false;
scope.addCleanup(() => { disposed = true; });
scope.dispose();
assert.equal(disposed, true);
assert.equal(scope.disposed, true);

console.log('published-lit-runtime-ok');
`;

const consumerScript = `
import * as React from 'react';
import { ControllerScope, StoreController } from '@context-action/lit';
import {
  createElementFacade,
  createLitElementBridge,
  type ImperativeHandleFactory,
  type LitBridgeConfig,
} from '@context-action/lit-ui';
import type { RenderLitElementOptions } from '@context-action/lit-ui/ssr';

interface TimelineProps {
  input?: { id: string } | undefined;
  onSelect?: ((event: CustomEvent<{ id: string }>) => void) | undefined;
}

class TimelineElement extends HTMLElement {
  input?: { id: string };
  focusItem(): void {}
  scrollTo(): void {}
}

type TimelineHandle = Pick<TimelineElement, 'focusItem' | 'scrollTo'>;

const createHandle: ImperativeHandleFactory<TimelineElement, TimelineHandle> =
  createElementFacade<TimelineElement, readonly ['focusItem', 'scrollTo']>([
    'focusItem',
    'scrollTo',
  ]);

const config: LitBridgeConfig<TimelineProps, TimelineElement, TimelineHandle> = {
  properties: ['input'],
  events: { onSelect: 'select' },
  createHandle,
};

const Bridge = createLitElementBridge<TimelineProps, TimelineElement, TimelineHandle>({
  tagName: 'published-timeline-element',
  ...config,
});

const options: RenderLitElementOptions = { includeLightDom: false };

export const publishedConsumer: React.ReactElement = React.createElement(Bridge, {
  input: { id: 'published' },
});
void options;
void ControllerScope;
void StoreController;
`;

async function main() {
  console.log('='.repeat(78));
  console.log('Lit Public Consumer Smoke Verification');
  console.log(`Target Registry: ${REGISTRY}`);
  console.log(`Cohort Packages: ${PACKAGES.join(', ')}`);
  console.log('='.repeat(78));

  const sandbox = await createSandbox();
  console.log(`\n[INIT] Created isolated sandbox at: ${sandbox}`);

  try {
    console.log('\n--- Phase 1: Clean npm install from public registry ---');
    await npmInstallWithRetry(sandbox, [...PACKAGES, ...DEPENDENCIES]);

    for (const [packageName, expected] of [
      ['@context-action/lit', targetVersions.lit],
      ['@context-action/lit-ui', targetVersions.litUi],
    ]) {
      const installed = JSON.parse(
        run('node', [
          '-e',
          `const fs=require('node:fs');const path=require('node:path');console.log(fs.readFileSync(path.join(process.cwd(),'node_modules',${JSON.stringify(packageName)},'package.json'),'utf8'))`,
        ], { cwd: sandbox }),
      ).version;
      if (expected && installed !== expected) {
        throw new Error(`Expected ${packageName} ${expected}, got ${installed}`);
      }
      totalAssertions += 1;
      console.log(`  [PASS] ${packageName}@${installed}`);
    }

    console.log('\n--- Phase 2: CJS and ESM export contracts ---');
    const cjsScript = `
      const assert = require('node:assert/strict');
      const lit = require('@context-action/lit');
      const litUi = require('@context-action/lit-ui');
      const ssr = require('@context-action/lit-ui/ssr');
      const hydrate = require('@context-action/lit-ui/hydrate');
      for (const [name, value] of Object.entries({
        ControllerScope: lit.ControllerScope,
        StoreController: lit.StoreController,
        ActionController: lit.ActionController,
        createLitElementBridge: litUi.createLitElementBridge,
        createElementFacade: litUi.createElementFacade,
        renderLitElement: ssr.renderLitElement,
        renderLitTemplate: ssr.renderLitTemplate,
        hydrateLit: hydrate.hydrateLit,
      })) assert.equal(typeof value, 'function', name + ' missing');
      const scope = new lit.ControllerScope({ addController() {}, removeController() {} });
      let disposed = false;
      scope.addCleanup(() => { disposed = true; });
      scope.dispose();
      assert.equal(disposed, true);
      console.log('CJS_LIT_OK');
    `;
    await writeFile(path.join(sandbox, 'test-cjs.cjs'), cjsScript);
    const cjsOut = run('node', ['test-cjs.cjs'], { cwd: sandbox });
    if (!cjsOut.includes('CJS_LIT_OK')) throw new Error('CJS runtime verification failed');
    totalAssertions += 9;
    console.log('  [PASS] CJS exports and ControllerScope runtime');

    await writeFile(path.join(sandbox, 'runtime.mjs'), runtimeScript);
    const esmOut = run('node', ['runtime.mjs'], { cwd: sandbox });
    if (!esmOut.includes('published-lit-runtime-ok')) throw new Error('ESM runtime verification failed');
    totalAssertions += 13;
    console.log('  [PASS] ESM exports, SSR, reflected/complex properties');

    console.log('\n--- Phase 3: TypeScript consumer contract ---');
    await writeFile(path.join(sandbox, 'consumer.ts'), consumerScript);
    await writeFile(path.join(sandbox, 'tsconfig.json'), `${JSON.stringify({
      compilerOptions: {
        strict: true,
        skipLibCheck: false,
        noEmit: true,
        jsx: 'react-jsx',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        target: 'ES2022',
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      },
      include: ['consumer.ts'],
    }, null, 2)}\n`);
    run(process.execPath, [
      path.join(sandbox, 'node_modules/typescript/bin/tsc'),
      '--project', path.join(sandbox, 'tsconfig.json'),
    ], { cwd: sandbox });
    totalAssertions += 1;
    console.log('  [PASS] TypeScript bridge/SSR consumer types');

    console.log(`\nLit public consumer smoke passed (${totalAssertions} assertions).`);
  } finally {
    if (keepSandbox) {
      console.log(`[KEEP] Sandbox retained at ${sandbox}`);
    } else {
      await rm(sandbox, { recursive: true, force: true });
    }
  }
}

main().catch(error => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
