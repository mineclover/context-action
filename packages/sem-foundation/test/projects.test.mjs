import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAX_ANALYSIS_PROJECT_FILE_EXTENSIONS,
  MAX_ANALYSIS_PROJECT_FILE_EXTENSION_CHARS,
  MAX_ANALYSIS_PROJECTS,
  MAX_SYMBOL_SNAPSHOT_ENTRIES,
  normalizeAnalysisProject,
  normalizeAnalysisProjects,
  resolveSemFoundationLimits,
  resolveAnalysisProjects,
} from '../dist/index.js';

test('normalizes repository-root analysis projects and dot segments', () => {
  assert.deepEqual(normalizeAnalysisProject({ id: 'root', root: './packages/../.' }), {
    id: 'root',
    root: '.',
  });
  assert.deepEqual(normalizeAnalysisProjects([{ id: 'core', root: 'packages/core/.' }]), [
    { id: 'core', root: 'packages/core' },
  ]);
});

test('resolves the default project and rejects duplicate or escaping projects', () => {
  assert.deepEqual(resolveAnalysisProjects(), [{ id: 'default', root: '.' }]);
  assert.throws(
    () => normalizeAnalysisProjects([{ id: 'core', root: '.' }, { id: 'core', root: 'packages/core' }]),
    /duplicate project IDs/,
  );
  assert.throws(
    () => normalizeAnalysisProject({ id: 'escape', root: '../outside' }),
    /escapes its root/,
  );
});

test('bounds normalized file-extension filters', () => {
  assert.equal(MAX_ANALYSIS_PROJECT_FILE_EXTENSION_CHARS, 64);
  assert.equal(MAX_ANALYSIS_PROJECT_FILE_EXTENSIONS, 32);
  assert.throws(
    () => normalizeAnalysisProject({
      id: 'bounded',
      root: '.',
      fileExtensions: [`.${'a'.repeat(MAX_ANALYSIS_PROJECT_FILE_EXTENSION_CHARS)}`],
    }),
    /fileExtensions\[0\] must be a dot-prefixed file extension/,
  );
  assert.throws(
    () => normalizeAnalysisProject({
      id: 'too-many-extensions',
      root: '.',
      fileExtensions: Array.from(
        { length: MAX_ANALYSIS_PROJECT_FILE_EXTENSIONS + 1 },
        (_, index) => `.ext${index}`,
      ),
    }),
    /between 1 and 32 extensions/,
  );
});

test('bounds shared project and snapshot cardinalities', () => {
  assert.equal(MAX_ANALYSIS_PROJECTS, 4096);
  assert.equal(MAX_SYMBOL_SNAPSHOT_ENTRIES, 65_536);
  assert.throws(
    () => normalizeAnalysisProjects(
      Array.from(
        { length: MAX_ANALYSIS_PROJECTS + 1 },
        (_, index) => ({ id: `project-${index}`, root: '.' }),
      ),
    ),
    /exceeds 4096 projects/,
  );
});

test('allows trusted callers to raise shared contract limits explicitly', () => {
  const limits = {
    maxAnalysisProjects: 5000,
    maxAnalysisProjectFileExtensions: 40,
    maxAnalysisProjectFileExtensionChars: 80,
  };
  assert.deepEqual(resolveSemFoundationLimits(limits), {
    ...limits,
    maxSymbolSnapshotEntries: MAX_SYMBOL_SNAPSHOT_ENTRIES,
  });
  assert.equal(
    normalizeAnalysisProjects(
      Array.from({ length: 33 }, (_, index) => ({
        id: `project-${index}`,
        root: '.',
        fileExtensions: Array.from({ length: 33 }, (_, extension) => `.e${extension}`),
      })),
      'projects',
      limits,
    ).length,
    33,
  );
});

test('supports an explicit unbounded contract limit for trusted callers', () => {
  const limits = resolveSemFoundationLimits({
    maxAnalysisProjects: 'unbounded',
    maxSymbolSnapshotEntries: 'unbounded',
  });
  assert.equal(limits.maxAnalysisProjects, Number.MAX_SAFE_INTEGER);
  assert.equal(limits.maxSymbolSnapshotEntries, Number.MAX_SAFE_INTEGER);
});
