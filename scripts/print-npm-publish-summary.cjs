#!/usr/bin/env node
'use strict';

const { readFileSync } = require('node:fs');

const summaryFile = process.argv[2] ?? 'reports/npm-publish-summary.json';
const entries = JSON.parse(readFileSync(summaryFile, 'utf8'));

console.log('## npm publish result');
if (entries.length === 0) {
  console.log('No new package versions were published.');
} else {
  for (const entry of entries) {
    console.log(`- ${entry.packageName}@${entry.version}`);
  }
}
