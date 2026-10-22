import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const consumer = mkdtempSync(join(tmpdir(), 'context-action-lit-packed-'));

function isolatedNpmEnvironment() {
  return Object.fromEntries(Object.entries(process.env).filter(
    ([key]) => !/^(npm_config|pnpm_config)_/iu.test(key),
  ));
}

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    ...options,
  });
}

try {
  for (const packageName of ['@context-action/core', '@context-action/lit', '@context-action/lit-ui']) {
    run('pnpm', ['--filter', packageName, 'build']);
  }

  const tarballs = ['core', 'lit', 'lit-ui'].map((directory) => {
    const output = execFileSync(
      'npm',
      [
        'pack',
        resolve(root, 'packages', directory),
        '--pack-destination',
        consumer,
        '--silent',
      ],
      { cwd: root, encoding: 'utf8' },
    ).trim().split('\n').at(-1);
    if (!output) throw new Error(`Failed to pack ${directory}.`);
    return join(consumer, output);
  });

  writeFileSync(join(consumer, 'package.json'), JSON.stringify({
    name: 'context-action-lit-packed-consumer',
    private: true,
    type: 'module',
  }));

  execFileSync(
    'npm',
    [
      'install',
      '--no-save',
      '--ignore-scripts',
      'lit@3.3.3',
      '@lit/context@1.1.6',
      '@lit-labs/ssr@4.1.0',
      '@lit-labs/ssr-client@1.1.8',
      'react@19.3.1',
      'react-dom@19.3.1',
      '@types/react@19.2.17',
      '@types/react-dom@19.2.3',
      'typescript@6.0.3',
      ...tarballs,
    ],
    {
      cwd: consumer,
      env: isolatedNpmEnvironment(),
      stdio: 'inherit',
    },
  );

  writeFileSync(join(consumer, 'runtime.mjs'), `
import { LitElement, html } from 'lit';
import { ControllerScope, StoreController, ActionController } from '@context-action/lit';
import {
  createElementFacade,
  createLitElementBridge,
  createStoreContext,
} from '@context-action/lit-ui';
import { renderLitElement, renderLitTemplate } from '@context-action/lit-ui/ssr';
import { hydrateLit } from '@context-action/lit-ui/hydrate';

if (typeof ControllerScope !== 'function') throw new Error('ControllerScope export missing');
if (typeof StoreController !== 'function') throw new Error('StoreController export missing');
if (typeof ActionController !== 'function') throw new Error('ActionController export missing');
if (typeof createLitElementBridge !== 'function') throw new Error('createLitElementBridge export missing');
if (typeof createElementFacade !== 'function') throw new Error('createElementFacade export missing');
if (typeof createStoreContext !== 'function') throw new Error('createStoreContext export missing');
if (typeof hydrateLit !== 'function') throw new Error('hydrateLit export missing');

class PackedProbeElement extends LitElement {
  static properties = {
    label: { type: String, reflect: true },
    input: { attribute: false },
  };
  label = 'packed';
  input = { ok: true };
  render() {
    return html\`<span part="data" data-testid="data">\${this.label}:\${JSON.stringify(this.input)}</span>\`;
  }
}
if (!customElements.get('packed-probe-element')) {
  customElements.define('packed-probe-element', PackedProbeElement);
}

const elementOutput = renderLitElement(new PackedProbeElement());
if (!elementOutput.includes('part="data"') || !elementOutput.includes('data-testid="data"')) {
  throw new Error('packed element SSR lost part/data contract');
}
if (!elementOutput.includes('label="packed"')) {
  throw new Error('packed element SSR lost reflected property');
}
if (!elementOutput.includes('{&quot;ok&quot;:true}')) {
  throw new Error('packed element SSR lost complex property binding');
}

const templateOutput = renderLitTemplate(html\`<div part="ruler" data-x="1">ok</div>\`);
if (!templateOutput.includes('part="ruler"') || !templateOutput.includes('data-x="1"')) {
  throw new Error('packed template SSR lost part/data contract');
}

console.log('packed-lit-runtime-ok');
`);

  writeFileSync(join(consumer, 'consumer.ts'), `
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
  tagName: 'packed-timeline-element',
  ...config,
});

const options: RenderLitElementOptions = { includeLightDom: false };

export const packedConsumer: React.ReactElement = React.createElement(Bridge, {
  input: { id: 'packed' },
});
void options;
void ControllerScope;
void StoreController;
`);

  writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify({
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
  }));

  execFileSync(process.execPath, [join(consumer, 'runtime.mjs')], {
    cwd: consumer,
    stdio: 'inherit',
  });
  execFileSync(
    process.execPath,
    [join(consumer, 'node_modules/typescript/bin/tsc'), '--project', join(consumer, 'tsconfig.json')],
    { cwd: consumer, stdio: 'inherit' },
  );

  console.log('Lit packed consumer verification passed.');
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
