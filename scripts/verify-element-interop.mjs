/** Local candidate evidence only: never publishes or changes release cohorts. */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sandbox = mkdtempSync(join(tmpdir(), 'context-action-element-interop-'));
const directories = ['core', 'preact', 'preact-ui', 'lit', 'lit-ui'];
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(npm_config|pnpm_config)_/iu.test(key) && key !== 'NODE_PATH'));
const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, env, stdio: 'inherit' });

const typeContract = `
import * as React from 'react';
import type { ElementBridgeContract, PublicActionMethods } from '@context-action/core/element';
import { createElementFacade, createCustomElementBridge, type CustomElementBridgeOptions } from '@context-action/preact-ui/react-bridge';
import { createLitElementBridge, type LitBridgeConfig, type LitBridgeOptions } from '@context-action/lit-ui/react-bridge';
interface Props { input?: { count: number }; onChange?: (event: CustomEvent<number>) => void }
interface Handle { readonly count: number; increment(): number }
type Host = HTMLElement & Handle;
const contract: ElementBridgeContract<Props, Host, Handle> = {
  tagName: 'packed-element-contract', properties: ['input'], events: { onChange: 'count-change' },
  createHandle: createElementFacade<Host, readonly ['count', 'increment']>(['count', 'increment']),
};
const preact: CustomElementBridgeOptions<Props, Host, Handle> = contract;
const lit: LitBridgeOptions<Props, Host, Handle> = preact;
const legacy: LitBridgeConfig<Props> = lit;
const PreactBridge = createCustomElementBridge<Props, Host, Handle>(preact);
const LitBridge = createLitElementBridge<Props, Host, Handle>(lit);
const LitLegacy = createLitElementBridge<Props, Host, Handle>(lit.tagName, legacy);
const ref = React.createRef<Handle>();
React.createElement(PreactBridge, { ref, input: { count: 1 } });
React.createElement(LitBridge, { ref });
React.createElement(LitLegacy, { ref });
function commands(handle: Handle, actions: PublicActionMethods<{ save: string; reset: void; secret: number }, 'save' | 'reset', { save: number }>) {
  const saved: Promise<number> = actions.save('typed');
  const reset: Promise<void> = actions.reset();
  // @ts-expect-error Facades hide raw DOM APIs.
  handle.shadowRoot;
  // @ts-expect-error Internal actions are not public commands.
  actions.secret(1);
  // @ts-expect-error Payload-less actions take no argument.
  actions.reset(1);
  // @ts-expect-error Wrong payload is rejected.
  actions.save(2);
  void [saved, reset];
}
void commands;
`;

const runtime = `
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://example.test' });
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'CustomEvent', 'customElements']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { act } = React;
const core = await import('@context-action/core/element');
const preact = await import('@context-action/preact-ui/react-bridge');
const lit = await import('@context-action/lit-ui/react-bridge');
const require = createRequire(import.meta.url);
for (const mode of [core, require('@context-action/core/element')]) {
  assert.equal(typeof mode.createElementFacade, 'function');
}
assert.equal(preact.createElementFacade, core.createElementFacade);
assert.equal(lit.createElementFacade, core.createElementFacade);
const cjsPreact = require('@context-action/preact-ui/react-bridge');
const cjsLit = require('@context-action/lit-ui/react-bridge');
class Probe extends HTMLElement {
  input = { count: 7 };
  get count() { return this.input?.count ?? 0; }
  increment() {
    this.input = { count: this.count + 1 };
    this.dispatchEvent(new CustomEvent('count-change', { detail: this.count }));
    return this.count;
  }
}
customElements.define('packed-element-contract', Probe);
for (const factory of [preact.createCustomElementBridge, lit.createLitElementBridge,
  cjsPreact.createCustomElementBridge, cjsLit.createLitElementBridge]) {
  const Bridge = factory({
    tagName: 'packed-element-contract', properties: ['input'], events: { onChange: 'count-change' },
    createHandle: core.createElementFacade(['count', 'increment']),
  });
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  const ref = React.createRef();
  const calls = [];
  const onChange = event => calls.push(event.detail);
  const render = props => act(async () => root.render(React.createElement(React.StrictMode, null,
    React.createElement(Bridge, { ref, onChange, ...props }))));
  await render({});
  assert.equal(ref.current.count, 7); // untouched defaults survive
  const input = { count: 2 };
  await render({ input });
  const host = container.firstElementChild;
  assert.equal(host.input, input);
  assert.equal(host.hasAttribute('input'), false);
  assert.equal('shadowRoot' in ref.current, false);
  assert.equal(Object.isFrozen(ref.current), true);
  ref.current.increment();
  assert.deepEqual(calls, [3]);
  await render({});
  assert.equal(host.input, undefined);
  const old = ref.current;
  await act(async () => root.unmount());
  host.dispatchEvent(new CustomEvent('count-change', { detail: 9 }));
  assert.deepEqual(calls, [3]);
  assert.equal(ref.current, null);
  assert.throws(() => old.increment(), /not mounted/);
  container.remove();
}
dom.window.close();
console.log('Both installed UI adapters satisfy the same bridge/facade contract on React ' + React.version);
`;

try {
  for (const directory of directories) run('pnpm', ['--filter', `@context-action/${directory}`, 'build']);
  const tarballs = directories.map(directory => {
    const file = join(sandbox, `${directory}.tgz`);
    run('pnpm', ['--dir', join(root, 'packages', directory), 'pack', '--out', file]);
    return file;
  });
  const neutral = join(sandbox, 'neutral'); mkdirSync(neutral);
  writeFileSync(join(neutral, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  run('npm', ['install', '--no-save', '--ignore-scripts', tarballs[0], '@types/node@24.19.2'], neutral);
  run(process.execPath, ['--input-type=module', '-e', `
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ActionRegister } from '@context-action/core';
import { createElementFacade, createElementBinding } from '@context-action/core/element';
const require = createRequire(import.meta.url);
const manifest = JSON.parse(readFileSync(join(dirname(require.resolve('@context-action/core')), '../package.json')));
assert.deepEqual(manifest.dependencies ?? {}, {});
assert.deepEqual(manifest.peerDependencies ?? {}, {});
for (const peer of ['react', 'preact', 'lit']) assert.throws(() => require.resolve(peer), { code: 'MODULE_NOT_FOUND' });
assert.equal(typeof globalThis.HTMLElement, 'undefined');
assert.equal(typeof createElementFacade, 'function');
assert.equal(typeof createElementBinding, 'function');
assert.equal(typeof ActionRegister, 'function');
assert.equal(typeof require('@context-action/core/element').createElementFacade, 'function');
assert.equal(typeof require('@context-action/core/element/react').createReactElementBridge, 'function');
`], neutral);
  for (const extension of ['mts', 'cts']) {
    writeFileSync(join(neutral, `neutral.${extension}`), `
import { ActionRegister, type PublicActionMethods } from '@context-action/core';
const register = new ActionRegister<{ reset: void }>();
const methods: PublicActionMethods<{ reset: void }> = { reset: async () => { await register.dispatch('reset'); } };
void methods;
`);
    writeFileSync(join(neutral, 'tsconfig.json'), JSON.stringify({
      compilerOptions: { strict: true, skipLibCheck: false, noEmit: true, module: 'NodeNext', moduleResolution: 'NodeNext', target: 'ES2022', lib: ['ES2022'], types: ['node'] },
      include: [`neutral.${extension}`],
    }));
    run(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json'], neutral);
  }

  for (const version of ['18.3.1', '19.2.8']) {
    const consumer = join(sandbox, `react-${version}`); mkdirSync(consumer);
    writeFileSync(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
    run('npm', ['install', '--no-save', '--ignore-scripts',
      ...tarballs, `react@${version}`, `react-dom@${version}`, 'preact@10.27.3', '@preact/signals@2.11.3',
      'lit@3.3.3', '@lit/context@1.1.6', 'jsdom@26.1.0', 'typescript@6.0.3',
      ...(version.startsWith('18.') ? ['@types/react@18.3.12', '@types/react-dom@18.3.1'] : ['@types/react@19.2.17', '@types/react-dom@19.2.3'])], consumer);
    writeFileSync(join(consumer, 'contract.mts'), typeContract);
    writeFileSync(join(consumer, 'contract.cts'), typeContract);
    // Lit's two declaration graphs augment HTMLElementTagNameMap with nominal
    // element classes. Verify each consumer mode independently, not a mixed
    // program which imports both nominal class declarations into one global map.
    for (const entry of ['contract.mts', 'contract.cts']) {
      writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify({
        compilerOptions: { strict: true, skipLibCheck: false, noEmit: true, module: 'NodeNext', moduleResolution: 'NodeNext', target: 'ES2022', lib: ['ES2022', 'DOM'] },
        include: [entry],
      }));
      run(process.execPath, [join(consumer, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json'], consumer);
    }
    writeFileSync(join(consumer, 'runtime.mjs'), runtime);
    run(process.execPath, ['runtime.mjs'], consumer);
  }
  console.log('Local element-interop candidate evidence passed; this is not publication approval.');
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
