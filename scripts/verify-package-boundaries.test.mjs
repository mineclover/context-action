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

test('excludes only the explicitly separated ToolContext development track', () => {
  withFixture((root) => {
    createPackage(root, 'packages/tool-durable-operations', {
      name: '@context-action/tool-durable-operations',
      exports: { '.': './dist/index.js' },
    }, {});
    createPackage(root, 'packages/react', {
      name: '@context-action/react',
      exports: { '.': './dist/index.js' },
    }, {
      'src/tools/ToolContext.ts': "import { fence } from '@context-action/tool-durable-operations';\nexport { fence };\n",
    });

    const excludedResult = runVerifier(root);
    assert.equal(excludedResult.status, 0, excludedResult.stderr);
    assert.match(excludedResult.stdout, /development-track files excluded: 1/);

    const releasedSourcePath = path.join(root, 'packages/react/src/index.ts');
    fs.writeFileSync(
      releasedSourcePath,
      "import { fence } from '@context-action/tool-durable-operations';\nexport { fence };\n",
    );
    const releasedResult = runVerifier(root);
    assert.equal(releasedResult.status, 1);
    assert.match(releasedResult.stderr, /runtime import @context-action\/tool-durable-operations is missing/);
  });
});

test('basic packages reject integration dependencies even when correctly declared', () => {
  for (const name of ['core', 'store-core', 'react']) {
    for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
      withFixture((root) => {
        createPackage(root, `packages/${name}`, {
          name: `@context-action/${name}`,
          [field]: { '@context-action/tool-protocol': '^1.0.0' },
          exports: { '.': './dist/index.js' },
        }, {});
        const result = runVerifier(root);
        assert.equal(result.status, 1);
        assert.match(result.stderr, /must not install integration dependency @context-action\/tool-protocol/);
      });
    }
  }
});

test('React allows basic state dependencies and explicit optional integration peers', () => {
  withFixture((root) => {
    createPackage(root, 'packages/react', {
      name: '@context-action/react',
      dependencies: { '@context-action/core': '^1.2.6', '@context-action/store-core': '^0.1.3', '@context-action/mutative': '^0.8.15' },
      peerDependencies: { '@context-action/webmcp': '^0.1.2', '@context-action/tool-protocol': '^1.0.0' },
      peerDependenciesMeta: { '@context-action/webmcp': { optional: true }, '@context-action/tool-protocol': { optional: true } },
      devDependencies: { '@context-action/tool-durable-operations': 'workspace:*' },
      exports: { '.': './dist/index.js', './webmcp': './dist/webmcp.js' },
    }, {});
    const result = runVerifier(root);
    assert.equal(result.status, 0, result.stderr);
  });
});

test('optional peers do not grant basic packages arbitrary integration dependencies', () => {
  for (const [name, dependency] of [
    ['core', '@context-action/tool-protocol'],
    ['store-core', '@context-action/webmcp'],
    ['react', '@context-action/ai-sdk'],
    ['react', '@context-action/tool-durable-operations'],
  ]) {
    withFixture((root) => {
      createPackage(root, `packages/${name}`, {
        name: `@context-action/${name}`,
        peerDependencies: { [dependency]: '^1.0.0' },
        peerDependenciesMeta: { [dependency]: { optional: true } },
      }, {});
      const result = runVerifier(root);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /must not install integration dependency/);
    });
  }
});
