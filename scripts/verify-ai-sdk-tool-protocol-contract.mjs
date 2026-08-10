#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const aiSdkDirectory = path.join(repositoryRoot, 'packages/ai-sdk');
const aiSdkManifest = JSON.parse(readFileSync(path.join(aiSdkDirectory, 'package.json'), 'utf8'));
if (aiSdkManifest.dependencies?.['@context-action/tool-protocol'] !== '^1.0.0') {
  throw new Error('AI SDK must declare a Tool Protocol 1.x runtime dependency');
}

function isolatedNpmEnvironment() {
  return Object.fromEntries(Object.entries(process.env).filter(([name]) =>
    !/^(npm_config|pnpm_config)_/iu.test(name)));
}

function packAiSdk(destination) {
  const result = JSON.parse(execFileSync('pnpm', ['pack', '--json', '--pack-destination', destination], {
    cwd: aiSdkDirectory,
    encoding: 'utf8',
    env: { ...process.env, npm_config_update_notifier: 'false' },
  }));
  const filename = (Array.isArray(result) ? result[0] : result)?.filename;
  if (typeof filename !== 'string') throw new Error('pnpm pack did not return the AI SDK archive');
  return path.resolve(destination, filename);
}

const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'context-action-ai-sdk-contract-'));
try {
  const archive = packAiSdk(temporaryDirectory);
  for (const version of ['1.0.0', '1.0.1']) {
    const consumerDirectory = path.join(temporaryDirectory, version);
    const manifestPath = path.join(consumerDirectory, 'package.json');
    const npmConfigPath = path.join(consumerDirectory, '.npmrc');
    mkdirSync(consumerDirectory, { recursive: true });
    writeFileSync(manifestPath, JSON.stringify({
      name: `context-action-ai-sdk-tool-protocol-${version}`,
      private: true,
      dependencies: {
        '@context-action/ai-sdk': `file:${archive}`,
        '@context-action/tool-protocol': version,
        '@context-action/react': '1.0.0',
        ai: '7.0.34',
      },
    }, null, 2));
    writeFileSync(npmConfigPath, 'ignore-scripts=true\naudit=false\nfund=false\n');
    execFileSync('npm', [
      'install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock', '--registry=https://registry.npmjs.org',
      '--userconfig', npmConfigPath,
    ], { cwd: consumerDirectory, stdio: 'inherit', env: isolatedNpmEnvironment() });
    const tree = JSON.parse(execFileSync('npm', ['ls', '@context-action/tool-protocol', '--all', '--json'], {
      cwd: consumerDirectory, encoding: 'utf8', env: isolatedNpmEnvironment(),
    }));
    const protocol = tree.dependencies?.['@context-action/tool-protocol'];
    if (protocol?.version !== version || protocol?.dependencies?.['@context-action/tool-protocol']) {
      throw new Error(`AI SDK + React did not dedupe Tool Protocol ${version}`);
    }
    execFileSync(process.execPath, ['--input-type=module', '--eval', `
      import { createAISDKToolScope } from '@context-action/ai-sdk';
      import { createActionSchema } from '@context-action/tool-protocol';
      import { createToolContext } from '@context-action/react/tools';
      if (typeof createAISDKToolScope !== 'function' || typeof createActionSchema !== 'function' || typeof createToolContext !== 'function') throw new Error('Tool Protocol 1.x integration imports failed');
    `], { cwd: consumerDirectory, stdio: 'inherit' });
  }
  console.log('AI SDK and React share one Tool Protocol 1.x instance for 1.0.0 and 1.0.1.');
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
