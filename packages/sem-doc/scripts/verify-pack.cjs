#!/usr/bin/env node

const { execFileSync } = require('node:child_process');

const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  cwd: process.cwd(),
  encoding: 'utf8',
});
const packs = JSON.parse(output);
const files = packs.flatMap((pack) => pack.files ?? []).map((file) => file.path);
const forbidden = files.filter((file) =>
  /(?:sem-foundation-adapter|ttsc|lsp|packages\/sem-doc)/iu.test(file)
);
if (forbidden.length > 0) {
  throw new Error(
    `sem-doc package contains forbidden compatibility artifacts: ${forbidden.join(', ')}`
  );
}
if (!files.includes('dist/index.js') || !files.includes('dist/cli.js')) {
  throw new Error('sem-doc package is missing built entrypoints');
}
process.stdout.write(`sem-doc package verified: ${files.length} files\n`);
