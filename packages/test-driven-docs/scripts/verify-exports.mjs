import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';

const packageName = '@context-action/test-driven-docs';

const [root, extractors, generators, validators, types] = await Promise.all([
  import(packageName),
  import(`${packageName}/extractors`),
  import(`${packageName}/generators`),
  import(`${packageName}/validators`),
  import(`${packageName}/types`)
]);

assert.equal(typeof root.TestMetadataExtractor, 'function');
assert.equal(typeof root.DocumentationGenerator, 'function');
assert.equal(typeof extractors.AnnotationExtractor, 'function');
assert.equal(typeof generators.EnhancedMarkdownGenerator, 'function');
assert.equal(typeof validators.ConsistencyValidator, 'function');
assert.deepEqual(Object.keys(types), []);

const expectedArtifacts = [
  '../dist/index.js',
  '../dist/index.d.ts',
  '../dist/cli/index.js',
  '../dist/cli/index.d.ts',
  '../dist/extractors/index.js',
  '../dist/extractors/index.d.ts',
  '../dist/generators/index.js',
  '../dist/generators/index.d.ts',
  '../dist/validators/index.js',
  '../dist/validators/index.d.ts',
  '../dist/types/index.js',
  '../dist/types/index.d.ts'
];

await Promise.all(expectedArtifacts.map(relativePath => access(new URL(relativePath, import.meta.url))));

console.log(`Verified ${expectedArtifacts.length} package export artifacts.`);
