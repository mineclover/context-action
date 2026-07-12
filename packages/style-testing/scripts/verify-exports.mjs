import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const packageName = '@context-action/style-testing';

const [root, babelPlugin] = await Promise.all([
  import(packageName),
  import(`${packageName}/babel-plugin`)
]);

assert.equal(typeof root.BrowserRunner, 'function');
assert.equal(typeof root.StyleExtractor, 'function');
assert.equal(typeof root.styleTestPlugin, 'function');
assert.equal(typeof babelPlugin.default, 'function');

const expectedArtifacts = [
  '../dist/index.js',
  '../dist/index.d.ts',
  '../dist/cli/index.js',
  '../dist/cli/index.d.ts',
  '../dist/analyzers/babel-plugin.js',
  '../dist/analyzers/babel-plugin.d.ts'
];

await Promise.all(expectedArtifacts.map(relativePath => access(new URL(relativePath, import.meta.url))));

const cliSource = await readFile(new URL('../dist/cli/index.js', import.meta.url), 'utf8');
assert.match(cliSource, /^#!\/usr\/bin\/env node/);

console.log(`Verified ${expectedArtifacts.length} style-testing export artifacts.`);
