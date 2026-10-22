import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const litUiRoot = join(root, 'packages/lit-ui');
const optionArgs = process.argv.slice(2).filter(argument => argument !== '--');
const args = new Map();
for (let index = 0; index < optionArgs.length; index += 2) {
  args.set(optionArgs[index], optionArgs[index + 1]);
}

const reactVersion = args.get('--react-version') ?? '18.3.1';
const reactDomVersion = args.get('--react-dom-version') ?? reactVersion;
const consumer = mkdtempSync(join(tmpdir(), 'context-action-lit-react18-'));

function isolatedNpmEnvironment() {
  return Object.fromEntries(Object.entries(process.env).filter(
    ([key]) => !/^(npm_config|pnpm_config)_/iu.test(key),
  ));
}

try {
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({
    name: 'context-action-lit-react-compat-consumer',
    private: true,
    type: 'module',
  }));

  execFileSync(
    'npm',
    [
      'install',
      '--no-save',
      '--ignore-scripts',
      `react@${reactVersion}`,
      `react-dom@${reactDomVersion}`,
    ],
    {
      cwd: consumer,
      env: isolatedNpmEnvironment(),
      stdio: 'inherit',
    },
  );

  const consumerModules = join(consumer, 'node_modules');
  const configPath = join(consumer, 'vitest.lit-react18.config.mjs');
  writeFileSync(configPath, `
const consumerModules = ${JSON.stringify(consumerModules)};
const litUiRoot = ${JSON.stringify(litUiRoot)};

export default {
  root: litUiRoot,
  resolve: {
    alias: [
      { find: /^react$/, replacement: consumerModules + '/react' },
      { find: /^react\\/jsx-runtime$/, replacement: consumerModules + '/react/jsx-runtime.js' },
      { find: /^react\\/jsx-dev-runtime$/, replacement: consumerModules + '/react/jsx-dev-runtime.js' },
      { find: /^react-dom$/, replacement: consumerModules + '/react-dom' },
      { find: /^react-dom\\/client$/, replacement: consumerModules + '/react-dom/client.js' },
      { find: /^react-dom\\/(.*)$/, replacement: consumerModules + '/react-dom/$1' },
    ],
  },
  test: {
    environment: 'jsdom',
    include: [
      'test/react-bridge.test.ts',
      'test/react-bridge-stress.test.tsx',
      'test/react-version.test.ts',
    ],
  },
};
`);

  execFileSync(
    'pnpm',
    [
      '--filter', '@context-action/lit-ui',
      'exec', 'vitest', 'run',
      '--config', configPath,
    ],
    {
      cwd: root,
      stdio: 'inherit',
      env: {
        ...process.env,
        CONTEXT_ACTION_LIT_REACT_COMPAT_VERSION: reactVersion,
      },
    },
  );

  console.log(`Lit bridge React ${reactVersion} compatibility passed.`);
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
