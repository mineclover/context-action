import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  buildExampleRouteIndex,
  canonicalRoutes,
  selectAffectedRoutes,
} from './example-route-impact.mjs';

async function readRepositorySource(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

test('indexes every public route and preserves one smoke target per route entry', () => {
  const routes = buildExampleRouteIndex();
  const canonical = canonicalRoutes(routes);

  assert.ok(routes.length >= 100, 'expected the example app route catalog');
  assert.ok(canonical.length < routes.length, 'expected legacy aliases to share a smoke target');
  assert.equal(
    new Set(canonical.map((route) => route.entry)).size,
    canonical.length,
    'a canonical smoke route must have one entry module'
  );
});

test('selects the React Aria route from its page implementation change', () => {
  const affected = selectAffectedRoutes([
    'example/src/pages/integrations/react-aria/ReactAriaReferencePage.tsx',
  ]);

  assert.deepEqual(
    affected.map((route) => route.path),
    ['/integrations/react-aria-reference']
  );
  assert.equal(
    affected[0].unitTest,
    'example/src/pages/integrations/react-aria/ReactAriaReferencePage.test.tsx'
  );
});

test('does not assign documentation-only changes to an example route', () => {
  assert.deepEqual(
    selectAffectedRoutes(['docs/en/guide/react-testing-act.md']),
    []
  );
});

test('assigns shared runtime changes to every canonical public route', () => {
  const routes = buildExampleRouteIndex();
  assert.equal(
    selectAffectedRoutes(['packages/react/src/index.ts'], routes).length,
    canonicalRoutes(routes).length
  );
});

test('keeps Core Advanced on the page-scoped context boundary', async () => {
  const [contexts, business, handlers, actions, viewModel, page, basic, priority, asyncView] =
    await Promise.all([
      readRepositorySource(
        'example/src/pages/foundations/core/contexts/CoreAdvancedContexts.tsx'
      ),
      readRepositorySource(
        'example/src/pages/foundations/core/business/core-advanced-rules.ts'
      ),
      readRepositorySource(
        'example/src/pages/foundations/core/handlers/CoreAdvancedHandlerRegistry.tsx'
      ),
      readRepositorySource(
        'example/src/pages/foundations/core/actions/useCoreAdvancedActions.ts'
      ),
      readRepositorySource(
        'example/src/pages/foundations/core/hooks/useCoreAdvancedViewModel.ts'
      ),
      readRepositorySource('example/src/pages/foundations/core/AdvancedPage.tsx'),
      readRepositorySource(
        'example/src/pages/foundations/core/components/BasicActionsDemo.tsx'
      ),
      readRepositorySource(
        'example/src/pages/foundations/core/components/PriorityDemo.tsx'
      ),
      readRepositorySource(
        'example/src/pages/foundations/core/components/AsyncDemo.tsx'
      ),
    ]);

  assert.match(contexts, /createActionContext(?:<|\()/u);
  assert.match(contexts, /createStoreContext(?:<|\()/u);
  assert.match(contexts, /useConcurrencyQueue:\s*false/u);
  assert.doesNotMatch(business, /from ['"](?:react|@context-action\/)/u);
  assert.match(handlers, /useCoreAdvancedActionHandler\(/u);
  assert.match(handlers, /core-advanced-priority-reset/u);
  assert.match(actions, /useCoreAdvancedDispatch\(/u);
  assert.doesNotMatch(
    actions,
    /useCoreAdvancedStore|useCoreAdvancedStoreManager/u
  );
  assert.match(viewModel, /useStoreValue\(/u);
  assert.match(page, /<CoreAdvancedProviders>/u);
  assert.match(page, /useCoreAdvancedViewModel\(/u);

  for (const view of [basic, priority, asyncView]) {
    assert.doesNotMatch(view, /new\s+ActionRegister\(/u);
    assert.doesNotMatch(view, /useEffect\(|useState\(/u);
  }
});

test('keeps Advanced Filtering on the page-scoped context boundary', async () => {
  const [contexts, business, handlers, actions, viewModel, page, flow, demo, info] =
    await Promise.all([
      readRepositorySource(
        'example/src/pages/performance/action-guard/advanced-filtering/contexts/AdvancedFilteringContexts.tsx'
      ),
      readRepositorySource(
        'example/src/pages/performance/action-guard/advanced-filtering/business/filtering-demo-rules.ts'
      ),
      readRepositorySource(
        'example/src/pages/performance/action-guard/advanced-filtering/handlers/AdvancedFilteringHandlerRegistry.tsx'
      ),
      readRepositorySource(
        'example/src/pages/performance/action-guard/advanced-filtering/actions/useAdvancedFilteringActions.ts'
      ),
      readRepositorySource(
        'example/src/pages/performance/action-guard/advanced-filtering/hooks/useAdvancedFilteringViewModel.ts'
      ),
      readRepositorySource(
        'example/src/pages/performance/action-guard/AdvancedFilteringPage.tsx'
      ),
      readRepositorySource(
        'example/src/pages/performance/action-guard/advanced-filtering/components/ExecutionFlowVisualization.tsx'
      ),
      readRepositorySource(
        'example/src/pages/performance/action-guard/advanced-filtering/components/FilteringDemo.tsx'
      ),
      readRepositorySource(
        'example/src/pages/performance/action-guard/advanced-filtering/components/HandlerInformationPanel.tsx'
      ),
    ]);

  assert.match(contexts, /createActionContext(?:<|\()/u);
  assert.match(contexts, /createStoreContext(?:<|\()/u);
  assert.match(contexts, /useConcurrencyQueue:\s*false/u);
  assert.doesNotMatch(business, /from ['"](?:react|@context-action\/)/u);
  assert.match(handlers, /useAdvancedFilteringActionHandler\(/u);
  assert.match(handlers, /dispatchWithResult\(\s*'processData'/u);
  assert.match(actions, /useAdvancedFilteringDispatch\(/u);
  assert.doesNotMatch(
    actions,
    /useAdvancedFilteringStore|useAdvancedFilteringStoreManager/u
  );
  assert.match(viewModel, /useStoreValue\(/u);
  assert.match(page, /<AdvancedFilteringProviders>/u);
  assert.match(page, /useAdvancedFilteringViewModel\(/u);

  for (const view of [flow, demo, info]) {
    assert.doesNotMatch(
      view,
      /setValue\(|useAdvancedFiltering(?:Store|Dispatch|ActionHandler)/u
    );
  }
});

test('keeps the Toast Context token outside its refreshable provider module', async () => {
  const [token, provider, app] = await Promise.all([
    readRepositorySource(
      'example/src/components/ToastSystem/ToastSystemContext.ts'
    ),
    readRepositorySource('example/src/components/ToastSystem/ToastContext.tsx'),
    readRepositorySource('example/src/App.tsx'),
  ]);

  assert.match(token, /createContext<ToastSystemController\s*\|\s*null>/u);
  assert.doesNotMatch(provider, /createContext\(/u);
  assert.match(provider, /from ['"]\.\/ToastSystemContext['"]/u);
  assert.match(
    app,
    /from ['"]\.\/components\/ToastSystem\/ToastContext['"]/u
  );
});
