#!/usr/bin/env node

/**
 * verify-preact-public-consumer-smoke.mjs
 *
 * Isolated programmatic verification test runner for published Preact cohort:
 *   - @context-action/preact@0.1.0
 *   - @context-action/preact-ui@0.1.0
 *
 * Executes completely outside the monorepo workspace in a fresh temporary directory.
 * Connects directly to the public npm registry (https://registry.npmjs.org) to verify:
 *   Phase 1: Clean npm installation of published artifacts without optional peers
 *   Phase 2: Dual CJS and ESM module resolution & export contract verification
 *   Phase 3: Pure Preact client rendering & lifecycle without React present
 *   Phase 4: Fast-failing diagnostics when optional peer dependencies are omitted
 *   Phase 5: React 19 bridge execution (property sync, ref forwarding, event handling)
 *   Phase 6: Preact SSR rendering and client hydration lifecycle
 */

import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { retryTransientRegistryVisibility } from './registry-visibility-retry.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const keepSandbox = args.includes('--keep-sandbox');
const verbose = args.includes('--verbose');

const registryIndex = args.indexOf('--registry');
const REGISTRY = registryIndex !== -1 && args[registryIndex + 1] && !args[registryIndex + 1].startsWith('--')
  ? args[registryIndex + 1]
  : 'https://registry.npmjs.org';

const PACKAGES = [
  '@context-action/preact@0.1.0',
  '@context-action/preact-ui@0.1.0',
];

const JSDOM_VERSION = 'jsdom@26.1.0';
const REACT_VERSION = 'react@19.2.8';
const REACT_DOM_VERSION = 'react-dom@19.2.8';
const SSR_VERSION = 'preact-render-to-string@6.7.0';

let totalAssertions = 0;

function run(command, cmdArgs, options = {}) {
  const cwd = options.cwd || process.cwd();
  // Strip monorepo / npm configuration environment variables to ensure zero workspace bleed
  const sanitizedEnv = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !key.toLowerCase().startsWith('npm_config_') && key !== 'NODE_PATH'
    )
  );

  if (verbose) {
    console.log(`[EXEC] ${command} ${cmdArgs.join(' ')} (in ${cwd})`);
  }

  const result = spawnSync(command, cmdArgs, {
    cwd,
    encoding: 'utf8',
    env: { ...sanitizedEnv, ...options.env, NODE_PATH: '' },
    ...options,
  });

  if (result.status !== 0) {
    const error = new Error(
      `Command failed with exit code ${result.status}: ${command} ${cmdArgs.join(' ')}\n` +
      `STDOUT:\n${result.stdout}\n` +
      `STDERR:\n${result.stderr}`
    );
    error.status = result.status;
    error.stdout = result.stdout;
    error.stderr = result.stderr;
    throw error;
  }

  if (verbose && result.stdout) {
    console.log(result.stdout);
  }

  return result.stdout;
}

async function npmInstallWithRetry(cwd, packagesToInstall) {
  await retryTransientRegistryVisibility(async (attempt) => {
    const cacheDir = await mkdtemp(path.join(cwd, `.npm-cache-${attempt ?? 0}-`));
    try {
      const installArgs = [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--prefer-online',
        `--registry=${REGISTRY}`,
        '--cache', cacheDir,
        ...packagesToInstall,
      ];
      run('npm', installArgs, { cwd });
    } finally {
      await rm(cacheDir, { recursive: true, force: true }).catch(() => {});
    }
  }, {
    onRetry: ({ attempt, nextAttempt, delay }) => {
      console.warn(`[WARN] npm registry visibility retry in ${delay}ms (attempt ${nextAttempt})`);
    },
  });
}

async function createSandbox() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'context-action-preact-consumer-smoke-'));
  await writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify({
      name: 'preact-public-consumer-smoke',
      private: true,
      type: 'module',
    }, null, 2) + '\n'
  );

  await writeFile(
    path.join(dir, '.npmrc'),
    `registry=${REGISTRY}\npackage-lock=false\naudit=false\nfund=false\nignore-scripts=true\n`
  );

  return dir;
}

async function main() {
  const startTime = Date.now();
  console.log('='.repeat(78));
  console.log('Preact Public Consumer Smoke Verification');
  console.log(`Target Registry: ${REGISTRY}`);
  console.log(`Cohort Packages: ${PACKAGES.join(', ')}`);
  console.log('='.repeat(78));

  const sandbox = await createSandbox();
  console.log(`\n[INIT] Created isolated sandbox at: ${sandbox}`);

  try {
    // ------------------------------------------------------------------------
    // Phase 1: Clean npm installation of published packages
    // ------------------------------------------------------------------------
    console.log('\n--- Phase 1: Clean npm install from public registry ---');
    console.log(`Installing ${PACKAGES.join(' ')} and ${JSDOM_VERSION}...`);
    await npmInstallWithRetry(sandbox, [...PACKAGES, JSDOM_VERSION]);

    // Verify installed packages and lack of optional peers in sandbox node_modules
    const preactInstalled = run('node', ['-e', 'const fs = require("node:fs"); console.log(JSON.parse(fs.readFileSync("node_modules/@context-action/preact/package.json", "utf8")).version);'], { cwd: sandbox }).trim();
    const preactUiInstalled = run('node', ['-e', 'const fs = require("node:fs"); console.log(JSON.parse(fs.readFileSync("node_modules/@context-action/preact-ui/package.json", "utf8")).version);'], { cwd: sandbox }).trim();

    if (preactInstalled !== '0.1.0') throw new Error(`Expected @context-action/preact 0.1.0, got: ${preactInstalled}`);
    if (preactUiInstalled !== '0.1.0') throw new Error(`Expected @context-action/preact-ui 0.1.0, got: ${preactUiInstalled}`);
    totalAssertions += 2;
    console.log(`  [PASS] Verified installed package versions: preact@${preactInstalled}, preact-ui@${preactUiInstalled}`);

    // Verify react and preact-render-to-string are NOT installed yet
    const peerAbsenceCheck = `
      const fs = require('node:fs');
      const path = require('node:path');
      const hasReact = fs.existsSync(path.join(process.cwd(), 'node_modules', 'react'));
      const hasSsr = fs.existsSync(path.join(process.cwd(), 'node_modules', 'preact-render-to-string'));
      if (hasReact) throw new Error('react should NOT be installed in pure install');
      if (hasSsr) throw new Error('preact-render-to-string should NOT be installed in pure install');
      console.log('OK: Pure environment without optional peers');
    `;
    run('node', ['-e', peerAbsenceCheck], { cwd: sandbox });
    totalAssertions += 2;
    console.log('  [PASS] Confirmed pure Preact environment: react and preact-render-to-string are absent.');

    // ------------------------------------------------------------------------
    // Phase 2: Dual CJS and ESM module resolution & export contracts
    // ------------------------------------------------------------------------
    console.log('\n--- Phase 2: CJS and ESM module resolution & export contracts ---');

    // CJS resolution
    const cjsVerificationCode = `
      const assert = require('node:assert/strict');
      const preact = require('@context-action/preact');
      const preactUi = require('@context-action/preact-ui');

      const expectedPreactFns = [
        'connectSourceSignal',
        'createDispatchContext',
        'createSourceContext',
        'useProjection'
      ];
      for (const fn of expectedPreactFns) {
        assert.equal(typeof preact[fn], 'function', 'Missing Preact CJS function: ' + fn);
      }

      const expectedPreactUiFns = [
        'createDisposalScope',
        'definePreactElement',
        'hydratePreact',
        'mountPreact',
        'mountTemplate'
      ];
      for (const fn of expectedPreactUiFns) {
        assert.equal(typeof preactUi[fn], 'function', 'Missing Preact-UI CJS function: ' + fn);
      }

      // Runtime execution test in CJS
      const scope = preactUi.createDisposalScope();
      let disposed = false;
      scope.add(() => { disposed = true; });
      scope.dispose();
      assert.equal(disposed, true, 'CJS disposal scope execution failed');
      assert.equal(scope.disposed, true, 'CJS scope.disposed flag failed');

      console.log('CJS_ASSERTIONS_PASSED: 11');
    `;
    await writeFile(path.join(sandbox, 'test-cjs-exports.cjs'), cjsVerificationCode);
    const cjsOut = run('node', ['test-cjs-exports.cjs'], { cwd: sandbox });
    if (!cjsOut.includes('CJS_ASSERTIONS_PASSED: 11')) throw new Error('CJS verification failed');
    totalAssertions += 11;
    console.log('  [PASS] CJS module resolution & runtime execution (11 assertions passed)');

    // ESM resolution
    const esmVerificationCode = `
      import assert from 'node:assert/strict';
      import * as preact from '@context-action/preact';
      import * as preactUi from '@context-action/preact-ui';

      const expectedPreactFns = [
        'connectSourceSignal',
        'createDispatchContext',
        'createSourceContext',
        'useProjection'
      ];
      for (const fn of expectedPreactFns) {
        assert.equal(typeof preact[fn], 'function', 'Missing Preact ESM function: ' + fn);
      }

      const expectedPreactUiFns = [
        'createDisposalScope',
        'definePreactElement',
        'hydratePreact',
        'mountPreact',
        'mountTemplate'
      ];
      for (const fn of expectedPreactUiFns) {
        assert.equal(typeof preactUi[fn], 'function', 'Missing Preact-UI ESM function: ' + fn);
      }

      // Runtime execution test in ESM
      const scope = preactUi.createDisposalScope();
      let disposed = false;
      scope.add(() => { disposed = true; });
      scope.dispose();
      assert.equal(disposed, true, 'ESM disposal scope execution failed');
      assert.equal(scope.disposed, true, 'ESM scope.disposed flag failed');

      console.log('ESM_ASSERTIONS_PASSED: 11');
    `;
    await writeFile(path.join(sandbox, 'test-esm-exports.mjs'), esmVerificationCode);
    const esmOut = run('node', ['test-esm-exports.mjs'], { cwd: sandbox });
    if (!esmOut.includes('ESM_ASSERTIONS_PASSED: 11')) throw new Error('ESM verification failed');
    totalAssertions += 11;
    console.log('  [PASS] ESM module resolution & runtime execution (11 assertions passed)');

    // ------------------------------------------------------------------------
    // Phase 3: Pure Preact client rendering & lifecycle without React
    // ------------------------------------------------------------------------
    console.log('\n--- Phase 3: Pure Preact client rendering without react ---');
    const purePreactClientCode = `
      import assert from 'node:assert/strict';
      import { JSDOM } from 'jsdom';
      import { h } from 'preact';
      import {
        connectSourceSignal,
        createDispatchContext,
        createSourceContext,
        useProjection
      } from '@context-action/preact';
      import {
        mountPreact,
        createDisposalScope,
        mountTemplate,
        definePreactElement
      } from '@context-action/preact-ui';

      // 1. Assert react is NOT resolvable
      let reactResolved = false;
      try {
        await import('react');
        reactResolved = true;
      } catch (err) {
        assert.equal(err.code, 'ERR_MODULE_NOT_FOUND', 'Expected ERR_MODULE_NOT_FOUND for react');
      }
      assert.equal(reactResolved, false, 'react should NOT be resolvable');

      // 2. Setup DOM environment
      const dom = new JSDOM('<!DOCTYPE html><html><body><div id="mount-root"></div><div id="template-host"></div></body></html>');
      globalThis.window = dom.window;
      globalThis.document = dom.window.document;
      globalThis.Node = dom.window.Node;
      globalThis.Element = dom.window.Element;
      globalThis.HTMLElement = dom.window.HTMLElement;
      globalThis.HTMLTemplateElement = dom.window.HTMLTemplateElement;
      globalThis.customElements = dom.window.customElements;
      globalThis.CustomEvent = dom.window.CustomEvent;

      // 3. connectSourceSignal reactivity
      let currentSnapshot = { count: 10, label: 'Initial' };
      const subscribers = new Set();
      const mockSource = {
        getSnapshot: () => currentSnapshot,
        subscribe: (fn) => {
          subscribers.add(fn);
          return () => subscribers.delete(fn);
        }
      };

      const connection = connectSourceSignal(mockSource);
      assert.equal(connection.signal.value.count, 10, 'Initial signal value mismatch');
      assert.equal(connection.signal.value.label, 'Initial', 'Initial signal label mismatch');

      currentSnapshot = { count: 20, label: 'Updated' };
      for (const sub of subscribers) sub();
      assert.equal(connection.signal.value.count, 20, 'Updated signal value mismatch');

      // 4. Context creation contracts
      const dispatchContext = createDispatchContext('TestDispatch');
      assert.ok(dispatchContext.Provider, 'DispatchContext must have Provider');
      assert.ok(dispatchContext.useDispatch, 'DispatchContext must have useDispatch');

      const sourceContext = createSourceContext('TestSource');
      assert.ok(sourceContext.Provider, 'SourceContext must have Provider');
      assert.ok(sourceContext.useSourceSignal, 'SourceContext must have useSourceSignal');

      // 5. mountPreact DOM lifecycle
      const root = document.getElementById('mount-root');
      function CounterView({ input }) {
        return h('div', { class: 'counter-box' }, [
          h('span', { class: 'count-label' }, input.label),
          h('span', { class: 'count-value' }, String(input.count))
        ]);
      }

      const instance = mountPreact(root, CounterView, { count: 100, label: 'Active Count' });
      assert.ok(root.innerHTML.includes('Active Count'), 'Mounted HTML missing label');
      assert.ok(root.innerHTML.includes('100'), 'Mounted HTML missing count');
      assert.equal(instance.destroyed, false, 'Instance destroyed flag should be false');

      // Update
      instance.update({ count: 250, label: 'Updated Count' });
      assert.ok(root.innerHTML.includes('Updated Count'), 'Updated HTML missing label');
      assert.ok(root.innerHTML.includes('250'), 'Updated HTML missing count');

      // Destroy
      instance.destroy();
      assert.equal(root.childNodes.length, 0, 'Mount root should be empty after destroy');
      assert.equal(instance.destroyed, true, 'Instance destroyed flag should be true');

      // 6. mountTemplate DOM lifecycle
      const templateHost = document.getElementById('template-host');
      const template = document.createElement('template');
      template.innerHTML = '<div class="card-shell"><div data-preact-root></div></div>';
      
      const tplInstance = mountTemplate(templateHost, template, CounterView, { count: 300, label: 'Template Card' });
      assert.ok(templateHost.innerHTML.includes('Template Card'), 'Template host missing label');
      assert.ok(templateHost.innerHTML.includes('card-shell'), 'Template host missing card-shell');
      assert.equal(tplInstance.destroyed, false, 'Template instance destroyed should be false');

      tplInstance.update({ count: 350, label: 'Updated Template' });
      assert.ok(templateHost.innerHTML.includes('Updated Template'), 'Template host missing updated label');

      tplInstance.destroy();
      assert.equal(templateHost.childNodes.length, 0, 'Template host should be empty after destroy');
      assert.equal(tplInstance.destroyed, true, 'Template instance destroyed should be true');

      // 7. definePreactElement Custom Element lifecycle
      definePreactElement({
        tagName: 'pure-preact-widget',
        setup: (element, context) => {
          let widgetState = { count: 500, label: 'Web Component' };
          return {
            view: CounterView,
            getInput: () => widgetState
          };
        }
      });

      const customEl = document.createElement('pure-preact-widget');
      document.body.appendChild(customEl);
      assert.ok(customEl.shadowRoot, 'Custom element must have open shadowRoot');
      assert.ok(customEl.shadowRoot.innerHTML.includes('Web Component'), 'Shadow DOM missing label');
      assert.ok(customEl.shadowRoot.innerHTML.includes('500'), 'Shadow DOM missing count');

      customEl.dispose();
      assert.equal(customEl.shadowRoot.querySelector('[data-preact-root]')?.childNodes.length ?? 0, 0, 'Shadow root must be cleaned on dispose');
      document.body.removeChild(customEl);

      // 8. createDisposalScope cleanup
      const scope = createDisposalScope();
      let scopeCleaned = false;
      scope.add(() => { scopeCleaned = true; });
      scope.dispose();
      assert.equal(scopeCleaned, true, 'Disposal scope failed to invoke callback');

      // Teardown signal connection
      connection.dispose();

      console.log('PURE_PREACT_ASSERTIONS_PASSED: 25');
    `;
    await writeFile(path.join(sandbox, 'test-pure-preact-client.mjs'), purePreactClientCode);
    const purePreactOut = run('node', ['test-pure-preact-client.mjs'], { cwd: sandbox });
    if (!purePreactOut.includes('PURE_PREACT_ASSERTIONS_PASSED: 25')) throw new Error('Pure Preact verification failed');
    totalAssertions += 25;
    console.log('  [PASS] Pure Preact client rendering & component lifecycles verified without react (25 assertions passed)');

    // ------------------------------------------------------------------------
    // Phase 4: Missing optional peer failure diagnostics
    // ------------------------------------------------------------------------
    console.log('\n--- Phase 4: Failure diagnostics when optional peers are omitted ---');

    // 4A: ./react-bridge without React (CJS & ESM)
    const omittedPeerCjsCode = `
      const assert = require('node:assert/strict');

      // 1. react-bridge without react
      let cjsReactFailedCorrectly = false;
      try {
        require('@context-action/preact-ui/react-bridge');
      } catch (err) {
        assert.equal(err.code, 'MODULE_NOT_FOUND', 'Expected MODULE_NOT_FOUND for react in CJS');
        assert.ok(err.message.includes('react'), 'Error message must mention "react"');
        cjsReactFailedCorrectly = true;
      }
      assert.equal(cjsReactFailedCorrectly, true, 'require(@context-action/preact-ui/react-bridge) must fail without react');

      // 2. ssr without preact-render-to-string
      let cjsSsrFailedCorrectly = false;
      try {
        require('@context-action/preact-ui/ssr');
      } catch (err) {
        assert.equal(err.code, 'MODULE_NOT_FOUND', 'Expected MODULE_NOT_FOUND for preact-render-to-string in CJS');
        assert.ok(err.message.includes('preact-render-to-string'), 'Error message must mention "preact-render-to-string"');
        cjsSsrFailedCorrectly = true;
      }
      assert.equal(cjsSsrFailedCorrectly, true, 'require(@context-action/preact-ui/ssr) must fail without preact-render-to-string');

      console.log('OMITTED_PEER_CJS_PASSED: 6');
    `;
    await writeFile(path.join(sandbox, 'test-omitted-peer-diagnostics.cjs'), omittedPeerCjsCode);
    const omittedCjsOut = run('node', ['test-omitted-peer-diagnostics.cjs'], { cwd: sandbox });
    if (!omittedCjsOut.includes('OMITTED_PEER_CJS_PASSED: 6')) throw new Error('Omitted peer CJS diagnostic failed');
    totalAssertions += 6;
    console.log('  [PASS] CJS missing peer diagnostics (MODULE_NOT_FOUND) for ./react-bridge and ./ssr (6 assertions passed)');

    const omittedPeerEsmCode = `
      import assert from 'node:assert/strict';

      // 1. react-bridge without react in ESM
      let esmReactFailedCorrectly = false;
      try {
        await import('@context-action/preact-ui/react-bridge');
      } catch (err) {
        assert.equal(err.code, 'ERR_MODULE_NOT_FOUND', 'Expected ERR_MODULE_NOT_FOUND for react in ESM');
        assert.ok(err.message.includes('react'), 'Error message must mention "react"');
        esmReactFailedCorrectly = true;
      }
      assert.equal(esmReactFailedCorrectly, true, 'import(@context-action/preact-ui/react-bridge) must fail without react');

      // 2. ssr without preact-render-to-string in ESM
      let esmSsrFailedCorrectly = false;
      try {
        await import('@context-action/preact-ui/ssr');
      } catch (err) {
        assert.equal(err.code, 'ERR_MODULE_NOT_FOUND', 'Expected ERR_MODULE_NOT_FOUND for preact-render-to-string in ESM');
        assert.ok(err.message.includes('preact-render-to-string'), 'Error message must mention "preact-render-to-string"');
        esmSsrFailedCorrectly = true;
      }
      assert.equal(esmSsrFailedCorrectly, true, 'import(@context-action/preact-ui/ssr) must fail without preact-render-to-string');

      console.log('OMITTED_PEER_ESM_PASSED: 6');
    `;
    await writeFile(path.join(sandbox, 'test-omitted-peer-diagnostics.mjs'), omittedPeerEsmCode);
    const omittedEsmOut = run('node', ['test-omitted-peer-diagnostics.mjs'], { cwd: sandbox });
    if (!omittedEsmOut.includes('OMITTED_PEER_ESM_PASSED: 6')) throw new Error('Omitted peer ESM diagnostic failed');
    totalAssertions += 6;
    console.log('  [PASS] ESM missing peer diagnostics (ERR_MODULE_NOT_FOUND) for ./react-bridge and ./ssr (6 assertions passed)');

    // ------------------------------------------------------------------------
    // Phase 5: React Bridge Execution (React Present)
    // ------------------------------------------------------------------------
    console.log('\n--- Phase 5: Installing React 19 & validating ./react-bridge ---');
    console.log(`Installing ${REACT_VERSION} and ${REACT_DOM_VERSION}...`);
    await npmInstallWithRetry(sandbox, [REACT_VERSION, REACT_DOM_VERSION]);

    const reactBridgeCode = `
      import assert from 'node:assert/strict';
      import { createRequire } from 'node:module';
      import { JSDOM } from 'jsdom';
      import React from 'react';
      import ReactDOMClient from 'react-dom/client';
      import { createCustomElementBridge } from '@context-action/preact-ui/react-bridge';

      const require = createRequire(import.meta.url);
      const cjsBridge = require('@context-action/preact-ui/react-bridge');

      // Verify exports in both formats
      assert.equal(typeof createCustomElementBridge, 'function', 'ESM createCustomElementBridge must be function');
      assert.equal(typeof cjsBridge.createCustomElementBridge, 'function', 'CJS createCustomElementBridge must be function');

      // Setup DOM
      const dom = new JSDOM('<!DOCTYPE html><html><body><div id="react-root"></div></body></html>');
      globalThis.window = dom.window;
      globalThis.document = dom.window.document;
      globalThis.HTMLElement = dom.window.HTMLElement;
      globalThis.customElements = dom.window.customElements;
      globalThis.CustomEvent = dom.window.CustomEvent;

      // Define Custom Element
      class CounterWc extends HTMLElement {
        constructor() {
          super();
          this._value = 0;
          this._theme = 'light';
        }
        get value() { return this._value; }
        set value(v) { this._value = v; }
        get theme() { return this._theme; }
        set theme(t) { this._theme = t; }
      }
      customElements.define('test-counter-wc', CounterWc);

      // Create React Bridge
      const BridgeComponent = createCustomElementBridge({
        tagName: 'test-counter-wc',
        properties: ['value', 'theme'],
        events: {
          onCounterReset: 'counter-reset',
        },
      });

      const container = document.getElementById('react-root');
      const root = ReactDOMClient.createRoot(container);

      let forwardedRef = null;
      let capturedEvent = null;

      root.render(
        React.createElement(BridgeComponent, {
          ref: (el) => { forwardedRef = el; },
          value: 42,
          theme: 'dark',
          onCounterReset: (e) => { capturedEvent = e; },
        })
      );

      // React 19 renders asynchronously; wait for commit phase
      await new Promise((resolve) => setTimeout(resolve, 80));

      const domElement = document.querySelector('test-counter-wc');
      assert.ok(domElement, 'Bridge did not instantiate custom element in DOM');
      assert.equal(forwardedRef, domElement, 'Ref forwarding did not resolve to native DOM element');
      assert.equal(domElement.value, 42, 'Direct property assignment failed for "value"');
      assert.equal(domElement.theme, 'dark', 'Direct property assignment failed for "theme"');

      // Event forwarding check
      domElement.dispatchEvent(new CustomEvent('counter-reset', { detail: { reason: 'user-click' } }));
      assert.ok(capturedEvent, 'Custom event was not forwarded to React handler');
      assert.equal(capturedEvent.detail.reason, 'user-click', 'Event detail payload was not preserved');

      // Unmount React tree
      root.unmount();
      await new Promise((resolve) => setTimeout(resolve, 50));
      assert.equal(container.childNodes.length, 0, 'React root did not clean up on unmount');

      console.log('REACT_BRIDGE_ASSERTIONS_PASSED: 9');
    `;
    await writeFile(path.join(sandbox, 'test-react-bridge.mjs'), reactBridgeCode);
    const reactBridgeOut = run('node', ['test-react-bridge.mjs'], { cwd: sandbox });
    if (!reactBridgeOut.includes('REACT_BRIDGE_ASSERTIONS_PASSED: 9')) throw new Error('React bridge verification failed');
    totalAssertions += 9;
    console.log('  [PASS] React 19 bridge execution (property sync, ref forwarding, event handling) (9 assertions passed)');

    // ------------------------------------------------------------------------
    // Phase 6: SSR & Hydration (preact-render-to-string Present)
    // ------------------------------------------------------------------------
    console.log('\n--- Phase 6: Installing preact-render-to-string & validating ./ssr + hydration ---');
    console.log(`Installing ${SSR_VERSION}...`);
    await npmInstallWithRetry(sandbox, [SSR_VERSION]);

    const ssrCode = `
      import assert from 'node:assert/strict';
      import { createRequire } from 'node:module';
      import { JSDOM } from 'jsdom';
      import { h } from 'preact';
      import { hydratePreact } from '@context-action/preact-ui';
      import { createSSR } from '@context-action/preact-ui/ssr';

      const require = createRequire(import.meta.url);
      const cjsSSR = require('@context-action/preact-ui/ssr');

      // Verify exports
      assert.equal(typeof createSSR, 'function', 'ESM createSSR must be function');
      assert.equal(typeof cjsSSR.createSSR, 'function', 'CJS createSSR must be function');

      function HeaderComponent({ input }) {
        return h('header', { class: 'site-header' }, [
          h('h1', { class: 'title' }, input.title),
          h('p', { class: 'subtitle' }, input.subtitle)
        ]);
      }

      // 1. Server-side rendering (headless without DOM)
      const renderer = createSSR(HeaderComponent);
      const serverMarkup = renderer.render({ title: 'Welcome to SSR', subtitle: 'Server Rendered' });

      assert.ok(serverMarkup.includes('Welcome to SSR'), 'SSR output missing title');
      assert.ok(serverMarkup.includes('Server Rendered'), 'SSR output missing subtitle');
      assert.ok(serverMarkup.includes('<header class="site-header">'), 'SSR output missing header markup');

      // 2. Client-side hydration inside JSDOM
      const dom = new JSDOM('<!DOCTYPE html><html><body><div id="ssr-root">' + serverMarkup + '</div></body></html>');
      globalThis.window = dom.window;
      globalThis.document = dom.window.document;
      globalThis.Node = dom.window.Node;
      globalThis.Element = dom.window.Element;
      globalThis.HTMLElement = dom.window.HTMLElement;

      const root = document.getElementById('ssr-root');
      const hydration = hydratePreact(root, HeaderComponent, { title: 'Welcome to SSR', subtitle: 'Server Rendered' });

      assert.equal(hydration.destroyed, false, 'Hydration destroyed flag initially false');
      assert.ok(root.querySelector('h1.title')?.textContent === 'Welcome to SSR', 'Hydrated title content mismatch');

      // 3. Hydration update
      hydration.update({ title: 'Live Client Title', subtitle: 'Updated after hydration' });
      assert.equal(root.querySelector('h1.title')?.textContent, 'Live Client Title', 'Hydration update title mismatch');
      assert.equal(root.querySelector('p.subtitle')?.textContent, 'Updated after hydration', 'Hydration update subtitle mismatch');

      // 4. Hydration destroy
      hydration.destroy();
      assert.equal(hydration.destroyed, true, 'Hydration destroyed flag must be true after destroy');
      assert.equal(root.childNodes.length, 0, 'Hydration root must be empty after destroy');

      console.log('SSR_HYDRATION_ASSERTIONS_PASSED: 10');
    `;
    await writeFile(path.join(sandbox, 'test-ssr-hydration.mjs'), ssrCode);
    const ssrOut = run('node', ['test-ssr-hydration.mjs'], { cwd: sandbox });
    if (!ssrOut.includes('SSR_HYDRATION_ASSERTIONS_PASSED: 10')) throw new Error('SSR hydration verification failed');
    totalAssertions += 10;
    console.log('  [PASS] SSR markup rendering and client hydration lifecycle (10 assertions passed)');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(78));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(78));
    console.log(`Status: SUCCESS (All phases passed)`);
    console.log(`Total Assertions Passed: ${totalAssertions}`);
    console.log(`Total Execution Time: ${duration}s`);
    console.log(`Verified Packages:`);
    console.log(`  - @context-action/preact@0.1.0`);
    console.log(`  - @context-action/preact-ui@0.1.0`);
    console.log(`Verified Environments:`);
    console.log(`  - Pure Preact client (Node.js + JSDOM)`);
    console.log(`  - Node.js CJS & ESM dual module resolution`);
    console.log(`  - React 19 host integration (@context-action/preact-ui/react-bridge)`);
    console.log(`  - Preact SSR & Hydration (@context-action/preact-ui/ssr + preact-render-to-string)`);
    console.log('='.repeat(78));
  } finally {
    if (keepSandbox) {
      console.log(`[INFO] Kept temporary sandbox at: ${sandbox}`);
    } else {
      await rm(sandbox, { recursive: true, force: true }).catch(() => {});
      console.log(`[CLEANUP] Removed temporary sandbox: ${sandbox}`);
    }
  }
}

main().catch((err) => {
  console.error('\n[FATAL ERROR]: Verification failed');
  console.error(err.stack || err);
  process.exitCode = 1;
});
