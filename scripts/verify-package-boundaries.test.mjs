import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'verify-package-boundaries.mjs',
);

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function createPackage(root, directory, manifest, files) {
  writeJson(path.join(root, directory, 'package.json'), manifest);
  for (const [relativePath, source] of Object.entries(files)) {
    const filePath = path.join(root, directory, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, source);
  }
}

function runVerifier(root) {
  return spawnSync(process.execPath, [scriptPath, '--root', root], {
    encoding: 'utf8',
  });
}

function withFixture(callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'context-action-boundary-'));
  try {
    callback(root);
  } finally {
    fs.rmSync(root, { force: true, recursive: true });
  }
}

test('accepts declared workspace imports through exported entry points', () => {
  withFixture((root) => {
    createPackage(root, 'packages/foundation', {
      name: '@context-action/foundation',
      exports: { '.': './dist/index.js', './tools': './dist/tools.js' },
    }, {});
    createPackage(root, 'packages/consumer', {
      name: '@context-action/consumer',
      dependencies: { '@context-action/foundation': 'workspace:*' },
      exports: { '.': './dist/index.js' },
    }, {
      'src/index.ts': "import { tool } from '@context-action/foundation/tools';\nexport { tool };\n",
    });

    const result = runVerifier(root);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /violations: 0/);
  });
});

test('rejects missing declarations and private workspace subpath imports', () => {
  withFixture((root) => {
    createPackage(root, 'packages/foundation', {
      name: '@context-action/foundation',
      exports: { '.': './dist/index.js' },
    }, {});
    createPackage(root, 'packages/consumer', {
      name: '@context-action/consumer',
      exports: { '.': './dist/index.js' },
    }, {
      'src/index.ts': "import { hidden } from '@context-action/foundation/internal';\nexport { hidden };\n",
    });

    const result = runVerifier(root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /missing @context-action\/foundation/);
    assert.match(result.stderr, /is not exported by @context-action\/foundation/);
  });
});

test('allows development-only imports in tests but rejects them from runtime source', () => {
  withFixture((root) => {
    createPackage(root, 'packages/foundation', {
      name: '@context-action/foundation',
      exports: { '.': './dist/index.js' },
    }, {});
    createPackage(root, 'packages/consumer', {
      name: '@context-action/consumer',
      devDependencies: { '@context-action/foundation': 'workspace:*' },
      exports: { '.': './dist/index.js' },
    }, {
      '__tests__/consumer.test.ts': "import { value } from '@context-action/foundation';\nexport { value };\n",
    });

    const testOnlyResult = runVerifier(root);
    assert.equal(testOnlyResult.status, 0, testOnlyResult.stderr);

    const runtimeSourcePath = path.join(root, 'packages/consumer/src/index.ts');
    fs.mkdirSync(path.dirname(runtimeSourcePath), { recursive: true });
    fs.writeFileSync(
      runtimeSourcePath,
      "import { value } from '@context-action/foundation';\nexport { value };\n",
    );
    const runtimeResult = runVerifier(root);
    assert.equal(runtimeResult.status, 1);
    assert.match(runtimeResult.stderr, /runtime import @context-action\/foundation is missing/);
  });
});

test('rejects relative imports that escape an owning package', () => {
  withFixture((root) => {
    createPackage(root, 'packages/foundation', {
      name: '@context-action/foundation',
      exports: { '.': './dist/index.js' },
    }, {
      'src/internal.ts': 'export const internal = true;\n',
    });
    createPackage(root, 'packages/consumer', {
      name: '@context-action/consumer',
      exports: { '.': './dist/index.js' },
    }, {
      'src/index.ts': "import { internal } from '../../foundation/src/internal';\nexport { internal };\n",
    });

    const result = runVerifier(root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /relative import \.\.\/\.\.\/foundation\/src\/internal escapes the owning package/);
  });
});
