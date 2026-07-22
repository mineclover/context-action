#!/usr/bin/env node

const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
if (packageJson.dependencies?.['@ataraxy-labs/sem'] === undefined) {
  throw new Error(
    'sem-doc must declare @ataraxy-labs/sem as a runtime dependency so published CLI installs include sem'
  );
}

// pnpm injects npm_config/pnpm_config variables that npm 11 reports as unknown
// configuration keys. Keep the pack check independent from the caller's package-manager
// configuration while preserving the runtime variables npm needs to locate Node.
const npmEnvironment = Object.fromEntries(
  ['PATH', 'HOME', 'TMPDIR', 'LANG', 'NODE_OPTIONS']
    .filter((key) => process.env[key] !== undefined)
    .map((key) => [key, process.env[key]]),
);

const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  env: npmEnvironment,
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
