#!/usr/bin/env node
'use strict';

const { execFileSync } = require('node:child_process');
const { mkdirSync, writeFileSync } = require('node:fs');
const { dirname } = require('node:path');

const argumentsList = process.argv.slice(2).filter(argument => argument !== '--');

function optionValue(name, { required = false } = {}) {
  const matches = [];
  for (let index = 0; index < argumentsList.length; index += 1) {
    if (argumentsList[index] !== name) continue;
    const value = argumentsList[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
    matches.push(value);
    index += 1;
  }
  if (matches.length > 1) throw new Error(`${name} may be provided once`);
  if (required && matches.length === 0) throw new Error(`${name} is required`);
  return matches[0];
}

function npmView(name) {
  const output = execFileSync(
    'npm',
    ['view', name, 'dist-tags', '--json', '--registry=https://registry.npmjs.org'],
    { encoding: 'utf8', env: { ...process.env, npm_config_loglevel: 'error' } },
  );
  const tags = JSON.parse(output);
  if (!tags || typeof tags !== 'object' || Array.isArray(tags)) {
    throw new Error(`npm returned invalid dist-tags for ${name}`);
  }
  return tags;
}

function main() {
  const tag = optionValue('--tag', { required: true });
  const packages = optionValue('--packages', { required: true }).split(',').filter(Boolean);
  const output = optionValue('--output');
  if (!/^[a-z][a-z0-9._-]*$/u.test(tag)) throw new Error(`Invalid npm dist-tag: ${tag}`);
  if (packages.length === 0) throw new Error('--packages must contain at least one package');

  const results = packages.map(name => {
    const tags = npmView(name);
    const version = tags[tag];
    if (typeof version !== 'string' || !version.includes('-')) {
      throw new Error(`${name} dist-tag ${tag} must resolve to a prerelease version; received ${String(version)}`);
    }
    if (tags.latest === version) {
      throw new Error(`${name}@${version} is a prerelease and must not be tagged latest`);
    }
    return {
      package: name,
      [tag]: version,
      latest: typeof tags.latest === 'string' ? tags.latest : null,
      prereleaseLatestLeak: false,
    };
  });
  const report = { status: 'passed', distTag: tag, packages: results };
  if (output) {
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  }
  console.log(JSON.stringify(report, null, 2));
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
}
