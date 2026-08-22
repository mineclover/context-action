#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const pagePath = path.join(repositoryRoot, 'example/src/pages/integrations/react-aria/ReactAriaReferencePage.tsx');
const coreDirectory = path.join(repositoryRoot, 'packages/core');
const reactDirectory = path.join(repositoryRoot, 'packages/react');
const coreManifest = JSON.parse(
  readFileSync(path.join(coreDirectory, 'package.json'), 'utf8')
);
const reactManifest = JSON.parse(
  readFileSync(path.join(reactDirectory, 'package.json'), 'utf8')
);

function createLocalPackageSpec(packageName, directory, packDirectory) {
  execFileSync('npm', ['run', 'prepublishOnly', '--if-present'], {
    cwd: directory,
    stdio: 'inherit',
    env: isolatedNpmEnvironment(),
  });
  const output = execFileSync(
    'pnpm',
    ['pack', '--json', '--pack-destination', packDirectory],
    {
      cwd: directory,
      encoding: 'utf8',
      env: { ...isolatedNpmEnvironment(), npm_config_update_notifier: 'false' },
    }
  );
  let result;
  try {
    const parsed = JSON.parse(output);
    result = Array.isArray(parsed) ? parsed[0] : parsed;
  } catch (error) {
    throw new Error(
      `pnpm pack returned invalid JSON for ${packageName}: ${error.message}`
    );
  }
  if (!result || typeof result.filename !== 'string') {
    throw new Error(`pnpm pack returned no archive for ${packageName}`);
  }
  const archivePath = path.resolve(packDirectory, result.filename);
  if (!archivePath.startsWith(`${path.resolve(packDirectory)}${path.sep}`)) {
    throw new Error(`pnpm pack created an archive outside ${packDirectory}`);
  }
  return `file:${archivePath}`;
}

function isolatedNpmEnvironment() {
  return Object.fromEntries(Object.entries(process.env).filter(([name]) =>
    !/^(npm_config|pnpm_config)_/iu.test(name)));
}

const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'context-action-react-aria-hydration-'));
try {
  const packDirectory = path.join(temporaryDirectory, 'candidate-packages');
  mkdirSync(packDirectory, { recursive: true });
  const candidatePackages = {
    core: createLocalPackageSpec('@context-action/core', coreDirectory, packDirectory),
    react: createLocalPackageSpec('@context-action/react', reactDirectory, packDirectory),
  };
  for (const reactVersion of ['19.2.0', '19.2.8']) {
    const consumerDirectory = path.join(temporaryDirectory, `react-${reactVersion}`);
    const npmConfigPath = path.join(consumerDirectory, '.npmrc');
    mkdirSync(consumerDirectory, { recursive: true });
    execFileSync('pnpm', [
      '--dir', path.join(repositoryRoot, 'example'), 'exec', 'esbuild', pagePath,
      `--outfile=${path.join(consumerDirectory, 'reference-page.cjs')}`,
      '--bundle', '--format=cjs', '--platform=node', '--target=node18', '--jsx=automatic',
      '--external:react', '--external:react/jsx-runtime', '--external:react-dom',
      '--external:react-dom/client', '--external:react-dom/server',
      '--external:react-aria-components', '--external:@internationalized/date',
      '--external:@context-action/core', '--external:@context-action/react', '--external:@context-action/react/tools',
    ], { stdio: 'inherit', env: isolatedNpmEnvironment() });
    writeFileSync(path.join(consumerDirectory, 'package.json'), JSON.stringify({
      name: `context-action-react-aria-hydration-${reactVersion}`,
      private: true,
      dependencies: {
        react: reactVersion,
        'react-dom': reactVersion,
        'react-aria-components': '1.20.0',
        '@internationalized/date': '3.12.3',
        '@context-action/core': candidatePackages.core,
        '@context-action/react': candidatePackages.react,
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
      const fs = require('node:fs');
      const path = require('node:path');
      const Page = require('./reference-page.cjs').default;
      const installedManifest = specifier => JSON.parse(fs.readFileSync(
        path.resolve(require.resolve(specifier), '..', '..', 'package.json'),
        'utf8'
      ));
      const core = installedManifest('@context-action/core');
      const contextActionReact = installedManifest('@context-action/react');
      if (core.version !== ${JSON.stringify(coreManifest.version)}) {
        throw new Error('React Aria reference did not install the current Core candidate.');
      }
      if (contextActionReact.version !== ${JSON.stringify(reactManifest.version)}) {
        throw new Error('React Aria reference did not install the current React candidate.');
      }
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
