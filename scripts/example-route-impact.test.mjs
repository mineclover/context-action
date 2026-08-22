import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildExampleRouteIndex,
  canonicalRoutes,
  selectAffectedRoutes,
} from './example-route-impact.mjs';

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
