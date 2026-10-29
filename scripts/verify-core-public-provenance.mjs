#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Map(process.argv.slice(2).filter(value => value !== '--').reduce((pairs, value, index, list) => {
  if (value.startsWith('--')) pairs.push([value, list[index + 1]]);
  return pairs;
}, []));
const tag = args.get('--tag');
const commit = args.get('--commit');
const output = args.get('--output');
if (!['next', 'latest'].includes(tag) || !/^[a-f0-9]{40}$/u.test(commit ?? '')) throw new Error('Usage: verify-core-public-provenance.mjs --tag <next|latest> --commit <40-char SHA> [--output <path>]');
const packageName = '@context-action/core';
const version = JSON.parse(await readFile(path.join(root, 'releases/core-public-2026-10-patch-1.json'), 'utf8')).packages[packageName];
const tags = JSON.parse(execFileSync('npm', ['view', packageName, 'dist-tags', '--json', '--registry=https://registry.npmjs.org'], { encoding: 'utf8' }));
if (tags?.[tag] !== version) throw new Error(`${packageName} ${tag} tag must resolve to ${version}`);
const gitHead = execFileSync('npm', ['view', `${packageName}@${version}`, 'gitHead', '--json', '--registry=https://registry.npmjs.org'], { encoding: 'utf8' }).trim().replace(/^"|"$/gu, '');
if (gitHead && gitHead !== commit) throw new Error(`${packageName}@${version} gitHead ${gitHead} does not match ${commit}`);
const report = { schemaVersion: 'context-action-core-public-provenance.v1', status: 'verified', package: packageName, version, distTag: tag, candidateCommit: commit, gitHead: gitHead || null };
if (output) await writeFile(path.resolve(root, output), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
