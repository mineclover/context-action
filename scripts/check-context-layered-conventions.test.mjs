import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { runContextLayeredConventionCheck } from './check-context-layered-conventions.mjs';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

function writeFixtureFile(root, relativePath, contents) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, contents, 'utf8');
}

function createCanonicalFeatureFixture(root, prefix = 'src/features/demo') {
  writeFixtureFile(
    root,
    `${prefix}/contexts/DemoContexts.tsx`,
    [
      "import { createActionContext, createStoreContext } from '@context-action/react';",
      'export interface DemoActions { submit: void }',
      'export interface DemoStores { count: number }',
      "export const { Provider: DemoActionProvider, useActionDispatch: useDemoDispatch, useActionCommandHandler: useDemoActionCommandHandler } = createActionContext<DemoActions>('DemoActions');",
      "export const { Provider: DemoStoreProvider, useStore: useDemoStore } = createStoreContext<DemoStores>('DemoStores', { count: 0 });",
    ].join('\n')
  );
  writeFixtureFile(
    root,
    `${prefix}/business/demoRules.ts`,
    'export function incrementCount(value: number) { return value + 1; }\n'
  );
  writeFixtureFile(
    root,
    `${prefix}/handlers/DemoHandlerRegistry.tsx`,
    [
      "import { useCallback } from 'react';",
      "import { incrementCount } from '../business/demoRules';",
      "import { useDemoActionCommandHandler, useDemoStore } from '../contexts/DemoContexts';",
      'export function DemoHandlerRegistry() {',
      "  const countStore = useDemoStore('count');",
      "  useDemoActionCommandHandler('submit', useCallback(() => {",
      '    countStore.setValue(incrementCount(countStore.getValue()));',
      '  }, [countStore]));',
      '  return null;',
      '}',
    ].join('\n')
  );
  writeFixtureFile(
    root,
    `${prefix}/actions/useDemoActions.ts`,
    [
      "import { useCallback } from 'react';",
      "import { type DemoStores, useDemoDispatch } from '../contexts/DemoContexts';",
      'export function useDemoActions() {',
      '  const dispatch = useDemoDispatch();',
      "  const submit = useCallback(() => dispatch('submit'), [dispatch]);",
      '  return { submit } as { submit: () => Promise<void>; _typeHint?: DemoStores };',
      '}',
    ].join('\n')
  );
  writeFixtureFile(
    root,
    `${prefix}/hooks/useDemoData.ts`,
    [
      "import { useStoreValue } from '@context-action/react';",
      "import { useDemoStore } from '../contexts/DemoContexts';",
      'export function useDemoData() {',
      "  return { count: useStoreValue(useDemoStore('count')) };",
      '}',
    ].join('\n')
  );
  writeFixtureFile(
    root,
    `${prefix}/views/DemoView.tsx`,
    [
      "import { useDemoActions } from '../actions/useDemoActions';",
      "import { useDemoData } from '../hooks/useDemoData';",
      'export function DemoView() {',
      '  const { count } = useDemoData();',
      '  const { submit } = useDemoActions();',
      '  return <button type="button" onClick={() => void submit()}>{count}</button>;',
      '}',
    ].join('\n')
  );
}

test('real repository passes convention check across example/src and template-react/src', () => {
  const result = runContextLayeredConventionCheck();
  assert.equal(result.ok, true);
  assert.deepEqual(result.scanRoots, [
    'example/src',
    'packages/template-react/src',
  ]);
  assert.equal(result.layeredRoots.length, 36);
  assert.equal(
    result.astRuleViolations['no-deprecated-effect-handler'].length,
    0
  );
  assert.equal(
    result.astRuleViolations['no-store-access-in-actions'].length,
    0
  );
  assert.equal(
    result.astRuleViolations['no-store-subscription-in-handlers'].length,
    0
  );
  assert.equal(result.activeRuleExceptions.length, 1);
  assert.equal(
    result.activeRuleExceptions[0].file,
    'example/src/pages/performance/memoization/handlers/ComparisonHandlerRegistry.tsx'
  );
  assert.equal(result.ruleExceptionErrors.length, 0);
});

test('fails on useActionEffectHandler and registerEffect calls (no-deprecated-effect-handler)', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-conv-effect-'));
  try {
    createCanonicalFeatureFixture(tmpDir);
    writeFixtureFile(
      tmpDir,
      'src/features/demo/handlers/DemoHandlerRegistry.tsx',
      [
        "import { useDemoActionEffectHandler } from '../contexts/DemoContexts';",
        'export function DemoHandlerRegistry({ register }: { register: { registerEffect: (name: string, fn: () => void) => void } }) {',
        "  useDemoActionEffectHandler('submit', () => {});",
        "  register.registerEffect('submit', () => {});",
        '  return null;',
        '}',
      ].join('\n')
    );

    const result = runContextLayeredConventionCheck({
      baseDir: tmpDir,
      roots: ['src'],
    });
    assert.equal(result.ok, false);
    const hits = result.astRuleViolations['no-deprecated-effect-handler'];
    assert.equal(hits.length, 2);
    assert.deepEqual(
      hits.map((hit) => hit.symbol),
      ['useDemoActionEffectHandler', 'registerEffect']
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('fails on store imports or mutations inside actions/ while allowing type-only imports (no-store-access-in-actions)', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-conv-actions-'));
  try {
    createCanonicalFeatureFixture(tmpDir);
    writeFixtureFile(
      tmpDir,
      'src/features/demo/actions/useDemoActions.ts',
      [
        "import { type DemoStores, useDemoStore } from '../contexts/DemoContexts';",
        'export function useDemoActions() {',
        "  const countStore = useDemoStore('count');",
        '  const reset = () => countStore.setValue(0);',
        '  const bump = () => countStore.update((prev: DemoStores["count"]) => prev + 1);',
        '  return { reset, bump };',
        '}',
      ].join('\n')
    );

    const result = runContextLayeredConventionCheck({
      baseDir: tmpDir,
      roots: ['src'],
    });
    assert.equal(result.ok, false);
    const hits = result.astRuleViolations['no-store-access-in-actions'];
    assert.equal(hits.length, 4);
    assert.deepEqual(
      hits.map((hit) => hit.symbol),
      ['useDemoStore', 'useDemoStore', 'setValue', 'update']
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('fails on useStoreValue/Selector/Path calls inside handlers/ and *HandlerRegistry (no-store-subscription-in-handlers)', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-conv-handlers-'));
  try {
    createCanonicalFeatureFixture(tmpDir);
    writeFixtureFile(
      tmpDir,
      'src/features/demo/handlers/DemoHandlerRegistry.tsx',
      [
        "import { useStoreSelector, useStoreValue } from '@context-action/react';",
        "import { useDemoStore } from '../contexts/DemoContexts';",
        'export function DemoHandlerRegistry() {',
        "  const countStore = useDemoStore('count');",
        '  useStoreValue(countStore);',
        '  useStoreSelector(countStore, (value) => value);',
        '  return null;',
        '}',
      ].join('\n')
    );

    const result = runContextLayeredConventionCheck({
      baseDir: tmpDir,
      roots: ['src'],
    });
    assert.equal(result.ok, false);
    const hits = result.astRuleViolations['no-store-subscription-in-handlers'];
    assert.equal(hits.length, 4);
    assert.deepEqual(
      hits.map((hit) => hit.symbol),
      ['useStoreSelector', 'useStoreValue', 'useStoreValue', 'useStoreSelector']
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('fails on aliased useStoreValue import inside handlers/ (no-store-subscription-in-handlers)', () => {
  const tmpDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'ca-conv-handler-alias-')
  );
  try {
    createCanonicalFeatureFixture(tmpDir);
    writeFixtureFile(
      tmpDir,
      'src/features/demo/handlers/DemoHandlerRegistry.tsx',
      [
        "import { useStoreValue as readStore, type Store } from '@context-action/react';",
        "import { useDemoStore } from '../contexts/DemoContexts';",
        'export function DemoHandlerRegistry() {',
        "  const countStore: Store<number> = useDemoStore('count');",
        '  readStore(countStore);',
        '  return null;',
        '}',
      ].join('\n')
    );

    const result = runContextLayeredConventionCheck({
      baseDir: tmpDir,
      roots: ['src'],
    });
    assert.equal(result.ok, false);
    const hits = result.astRuleViolations['no-store-subscription-in-handlers'];
    assert.equal(hits.length, 1);
    assert.equal(hits[0].symbol, 'useStoreValue');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('honors valid rule-exceptions.json and fails closed when stale or missing reason', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-conv-exc-'));
  try {
    createCanonicalFeatureFixture(tmpDir);
    writeFixtureFile(
      tmpDir,
      'src/features/demo/handlers/DemoHandlerRegistry.tsx',
      [
        "import { useStoreValue } from '@context-action/react';",
        "import { useDemoStore } from '../contexts/DemoContexts';",
        'export function DemoHandlerRegistry() {',
        "  useStoreValue(useDemoStore('count'));",
        '  return null;',
        '}',
      ].join('\n')
    );
    writeFixtureFile(
      tmpDir,
      'exceptions.json',
      JSON.stringify({
        version: 1,
        exceptions: [
          {
            rule: 'no-store-subscription-in-handlers',
            file: 'src/features/demo/handlers/DemoHandlerRegistry.tsx',
            reason: 'Intentional fixture subscription exception.',
          },
        ],
      })
    );

    const honored = runContextLayeredConventionCheck({
      baseDir: tmpDir,
      roots: ['src'],
      exceptionsPath: 'exceptions.json',
    });
    assert.equal(honored.ok, true);
    assert.equal(honored.activeRuleExceptions.length, 1);
    assert.equal(honored.ruleExceptionErrors.length, 0);

    // Fix the handler so exception becomes stale -> must fail closed
    createCanonicalFeatureFixture(tmpDir);
    const staleResult = runContextLayeredConventionCheck({
      baseDir: tmpDir,
      roots: ['src'],
      exceptionsPath: 'exceptions.json',
    });
    assert.equal(staleResult.ok, false);
    assert.equal(staleResult.ruleExceptionErrors.length, 1);

    // Empty reason -> must fail closed
    writeFixtureFile(
      tmpDir,
      'exceptions-empty-reason.json',
      JSON.stringify({
        version: 1,
        exceptions: [
          {
            rule: 'no-store-subscription-in-handlers',
            file: 'src/features/demo/handlers/DemoHandlerRegistry.tsx',
            reason: '   ',
          },
        ],
      })
    );
    const emptyReasonResult = runContextLayeredConventionCheck({
      baseDir: tmpDir,
      roots: ['src'],
      exceptionsPath: 'exceptions-empty-reason.json',
    });
    assert.equal(emptyReasonResult.ok, false);
    assert.equal(emptyReasonResult.ruleExceptionErrors.length, 1);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('supports --root CLI flag for external consumer apps', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-conv-cli-'));
  try {
    createCanonicalFeatureFixture(tmpDir, 'app/src/features/orders');
    const cliResult = spawnSync(
      process.execPath,
      [
        path.join(repositoryRoot, 'scripts/check-context-layered-conventions.mjs'),
        '--root',
        path.join(tmpDir, 'app/src'),
        '--quiet',
      ],
      { cwd: repositoryRoot, encoding: 'utf8' }
    );
    assert.equal(cliResult.status, 0, cliResult.stderr);

    writeFixtureFile(
      tmpDir,
      'app/src/features/orders/actions/useDemoActions.ts',
      [
        "import { useDemoStore } from '../contexts/DemoContexts';",
        "export function useDemoActions() { return useDemoStore('count'); }",
      ].join('\n')
    );
    const failResult = spawnSync(
      process.execPath,
      [
        path.join(repositoryRoot, 'scripts/check-context-layered-conventions.mjs'),
        '--root',
        path.join(tmpDir, 'app/src'),
        '--quiet',
      ],
      { cwd: repositoryRoot, encoding: 'utf8' }
    );
    assert.equal(failResult.status, 1);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
