#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const REFERENCE_PATTERN = /(?:#[0-9]+|CA-[A-Z0-9]+(?:-[A-Z0-9]+)*)/i;
const TRACKED_PREFIXES = [
  '.github/',
  'docs/',
  'packages/',
  'scripts/',
];

function git(args) {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function readEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(eventPath, 'utf8'));
}

function getPullRequestRange(event) {
  const base = event?.pull_request?.base?.sha;
  const head = event?.pull_request?.head?.sha || process.env.GITHUB_SHA;
  if (!base || !head) {
    throw new Error('Pull request event is missing base or head commit SHA.');
  }
  return { base, head };
}

function collectChangedFiles(base, head) {
  return git(['diff', '--name-only', `${base}...${head}`])
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);
}

function collectCommitMessages(base, head) {
  return git(['log', '--format=%B', `${base}..${head}`]);
}

function isTrackedChange(file) {
  return TRACKED_PREFIXES.some((prefix) => file.startsWith(prefix));
}

function printReport({ files, hasReference, source }) {
  const trackedFiles = files.filter(isTrackedChange);
  console.log('Change traceability verification');
  console.log(`- source: ${source}`);
  console.log(`- changed files: ${files.length}`);
  console.log(`- contract-bearing files: ${trackedFiles.length}`);
  console.log(`- issue/spec reference: ${hasReference ? 'found' : 'missing'}`);

  if (trackedFiles.length > 0) {
    console.log('- tracked scope:');
    for (const file of trackedFiles.slice(0, 20)) {
      console.log(`  - ${file}`);
    }
    if (trackedFiles.length > 20) {
      console.log(`  - ... and ${trackedFiles.length - 20} more`);
    }
  }
}

function main() {
  const eventName = process.env.GITHUB_EVENT_NAME;
  if (eventName !== 'pull_request') {
    console.log(
      `Change traceability verification skipped outside pull requests (event: ${eventName || 'local'}).`
    );
    return;
  }

  const event = readEvent();
  const { base, head } = getPullRequestRange(event);
  const files = collectChangedFiles(base, head);
  const commitMessages = collectCommitMessages(base, head);
  const pullRequestBody = event?.pull_request?.body || '';
  const hasReference = REFERENCE_PATTERN.test(`${pullRequestBody}\n${commitMessages}`);

  printReport({ files, hasReference, source: `pull_request ${base.slice(0, 8)}...${head.slice(0, 8)}` });

  if (files.some(isTrackedChange) && !hasReference) {
    throw new Error(
      'Contract-bearing changes require an issue or stable specification reference. Add #<issue> or a CA-* decision/spec ID to the PR body or commit message.'
    );
  }
}

try {
  main();
} catch (error) {
  console.error(
    `Change traceability verification failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exitCode = 1;
}
