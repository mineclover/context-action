#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const aiSdkDirectory = path.join(repositoryRoot, 'packages/ai-sdk');
const aiSdkManifest = JSON.parse(readFileSync(path.join(aiSdkDirectory, 'package.json'), 'utf8'));
const published = process.argv.includes('--published');
const versionOptionIndex = process.argv.indexOf('--version');
const expectedAiSdkVersion = versionOptionIndex === -1
  ? aiSdkManifest.version
  : process.argv[versionOptionIndex + 1];
if (!/^\d+\.\d+\.\d+$/u.test(expectedAiSdkVersion ?? '')) {
  throw new Error('--version must be a non-prerelease semantic version');
}
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

function publishedAiSdkVersion() {
  const version = execFileSync('npm', [
    'view', `@context-action/ai-sdk@${expectedAiSdkVersion}`, 'version', '--registry=https://registry.npmjs.org',
  ], { encoding: 'utf8', env: isolatedNpmEnvironment() }).trim();
  if (version !== expectedAiSdkVersion) {
    throw new Error(`Registry did not resolve @context-action/ai-sdk@${expectedAiSdkVersion}`);
  }
  return version;
}

function collectToolProtocolNodes(node, ancestry = []) {
  if (!node || typeof node !== 'object') return [];
  const matches = [];
  for (const [name, dependency] of Object.entries(node.dependencies ?? {})) {
    const dependencyAncestry = [...ancestry, name];
    if (name === '@context-action/tool-protocol') {
      matches.push({ version: dependency?.version, path: dependency?.path, ancestry: dependencyAncestry });
    }
    matches.push(...collectToolProtocolNodes(dependency, dependencyAncestry));
  }
  return matches;
}

const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'context-action-ai-sdk-contract-'));
try {
  const aiSdkSpec = published ? publishedAiSdkVersion() : `file:${packAiSdk(temporaryDirectory)}`;
  for (const version of ['1.0.0', '1.0.1']) {
    const consumerDirectory = path.join(temporaryDirectory, version);
    const manifestPath = path.join(consumerDirectory, 'package.json');
    const npmConfigPath = path.join(consumerDirectory, '.npmrc');
    mkdirSync(consumerDirectory, { recursive: true });
    writeFileSync(manifestPath, JSON.stringify({
      name: `context-action-ai-sdk-tool-protocol-${version}`,
      private: true,
      dependencies: {
        '@context-action/ai-sdk': aiSdkSpec,
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
    const tree = JSON.parse(execFileSync('npm', ['ls', '--all', '--json', '--long'], {
      cwd: consumerDirectory, encoding: 'utf8', env: isolatedNpmEnvironment(),
    }));
    if ((tree.problems?.length ?? 0) > 0) throw new Error(`npm dependency tree is invalid: ${tree.problems.join('; ')}`);
    const installedAiSdk = JSON.parse(readFileSync(
      path.join(consumerDirectory, 'node_modules/@context-action/ai-sdk/package.json'),
      'utf8',
    ));
    if (installedAiSdk.version !== expectedAiSdkVersion
      || installedAiSdk.dependencies?.['@context-action/tool-protocol'] !== '^1.0.0') {
      throw new Error(`Installed AI SDK artifact does not declare the required Tool Protocol runtime dependency: ${JSON.stringify(installedAiSdk.dependencies)}`);
    }
    const protocolNodes = collectToolProtocolNodes(tree);
    const paths = new Set(protocolNodes.map(node => node.path).filter(Boolean));
    if (protocolNodes.length === 0
      || protocolNodes.some(node => node.version !== version)
      || paths.size !== 1) {
      throw new Error(`AI SDK + React did not dedupe Tool Protocol ${version}: ${JSON.stringify(protocolNodes)}`);
    }
    execFileSync(process.execPath, ['--input-type=module', '--eval', `
      import { createAISDKToolScope } from '@context-action/ai-sdk';
      import { createActionSchema } from '@context-action/tool-protocol';
      import { createToolContext } from '@context-action/react/tools';
      if (typeof createAISDKToolScope !== 'function' || typeof createActionSchema !== 'function' || typeof createToolContext !== 'function') throw new Error('Tool Protocol 1.x integration imports failed');
    `], { cwd: consumerDirectory, stdio: 'inherit' });
  }
  console.log(`${published ? 'Published' : 'Local'} AI SDK and React share one Tool Protocol 1.x instance for 1.0.0 and 1.0.1.`);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
