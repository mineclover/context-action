#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { buildSync } from 'esbuild';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const pagePath = path.join(repositoryRoot, 'example/src/pages/integrations/react-aria/ReactAriaReferencePage.tsx');

function isolatedNpmEnvironment() {
  return Object.fromEntries(Object.entries(process.env).filter(([name]) =>
    !/^(npm_config|pnpm_config)_/iu.test(name)));
}

const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'context-action-react-aria-hydration-'));
try {
  for (const reactVersion of ['18.3.1', '19.2.8']) {
    const consumerDirectory = path.join(temporaryDirectory, `react-${reactVersion}`);
    const npmConfigPath = path.join(consumerDirectory, '.npmrc');
    mkdirSync(consumerDirectory, { recursive: true });
    buildSync({
      entryPoints: [pagePath],
      outfile: path.join(consumerDirectory, 'reference-page.cjs'),
      bundle: true,
      format: 'cjs',
      platform: 'node',
      target: 'node18',
      jsx: 'automatic',
      external: [
        'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', 'react-dom/server',
        'react-aria-components', '@internationalized/date',
        '@context-action/core', '@context-action/react', '@context-action/react/tools',
      ],
    });
    writeFileSync(path.join(consumerDirectory, 'package.json'), JSON.stringify({
      name: `context-action-react-aria-hydration-${reactVersion}`,
      private: true,
      dependencies: {
        react: reactVersion,
        'react-dom': reactVersion,
        'react-aria-components': '1.20.0',
        '@internationalized/date': '3.12.3',
        '@context-action/core': '1.0.0',
        '@context-action/react': '1.0.0',
        '@context-action/tool-protocol': '1.0.1',
        jsdom: '26.1.0',
      },
    }, null, 2));
    writeFileSync(npmConfigPath, 'ignore-scripts=true\naudit=false\nfund=false\n');
    execFileSync('npm', [
      'install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock',
      '--userconfig', npmConfigPath, '--registry=https://registry.npmjs.org',
    ], { cwd: consumerDirectory, stdio: 'inherit', env: isolatedNpmEnvironment() });
    writeFileSync(path.join(consumerDirectory, 'hydration.cjs'), `
      const { JSDOM } = require('jsdom');
      const React = require('react');
      const { renderToString } = require('react-dom/server');
      const { hydrateRoot } = require('react-dom/client');
      const Page = require('./reference-page.cjs').default;
      const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/' });
      global.window = dom.window;
      global.document = dom.window.document;
      global.HTMLElement = dom.window.HTMLElement;
      global.SVGElement = dom.window.SVGElement;
      global.Node = dom.window.Node;
      global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
      global.requestAnimationFrame = callback => setTimeout(callback, 0);
      global.cancelAnimationFrame = clearTimeout;
      dom.window.CSS = dom.window.CSS || {};
      dom.window.CSS.escape = dom.window.CSS.escape || (value => String(value).replace(/[^a-zA-Z0-9_-]/g, '\\\\$&'));
      global.CSS = dom.window.CSS;
      const container = document.getElementById('root');
      const html = renderToString(React.createElement(Page));
      if (!html.includes('Release review queue') || !html.includes('Review schedule date')) throw new Error('React Aria reference SSR output is incomplete');
      container.innerHTML = html;
      let recoverableError;
      const root = hydrateRoot(container, React.createElement(Page), {
        onRecoverableError(error) {
          recoverableError = error;
        },
      });
      setTimeout(() => {
        if (recoverableError) throw recoverableError;
        root.unmount();
        console.log('React Aria hydration passed for React ' + React.version);
      }, 50);
    `);
    execFileSync(process.execPath, ['hydration.cjs'], { cwd: consumerDirectory, stdio: 'inherit' });
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
