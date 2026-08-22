# Testing Context-Action by Boundary

Context-Action has a small set of runtime primitives, but they cross several
lifecycles: action registration, dispatch, store notification, React provider
mounting, and user-visible rendering. Test each responsibility at the boundary
that owns it instead of reproducing the same case in every example.

## Three test layers

| Layer | Owner | Verify | Avoid |
| --- | --- | --- | --- |
| Core contract | `@context-action/core` | handler order, abort, cancellation, queueing, result collection, disposal, and compile-time payload constraints | React rendering, DOM events, or application pages |
| React adapter contract | `@context-action/react` | Provider mount/unmount, handler registration cleanup, subscription delivery, hook identity, and React-visible updates | Copying business workflows from examples |
| Example behavior | `example/` and standalone demos | a public route loads, a user interaction changes visible UI, and one async success or failure state is observable | Re-testing every core execution mode |

This makes failures actionable: a core contract failure points to the primitive,
a React contract failure points to adapter lifecycle code, and an example failure
points to a public composition or presentation boundary.

## Core contracts: deterministic and direct

Core tests run in Node. Exercise `ActionRegister` and its controller directly:

```ts
const registry = new ActionRegister();
registry.register('save', async (_, controller) => {
  controller.setResult('saved');
});

const result = await registry.dispatch('save', undefined);
expect(result.results).toContain('saved');
```

Keep lifecycle cases independent: registration/unregistration, priority order,
abort, timeout/cancellation, and disposal should each state their expected
terminal condition. Type-only tests belong with the public type contract and
run through the package's strict test TypeScript project.

## React adapter contracts: use async `act`

The React adapter owns provider lifetime and subscriptions. Tests that call a
store, dispatch function, timer, or external callback directly must use
`await act(async () => { ... })` before asserting rendered output. The package
test setup enables `IS_REACT_ACT_ENVIRONMENT` for this reason.

```tsx
await act(async () => {
  store.setValue({ status: 'ready' });
});

expect(screen.getByRole('status')).toHaveTextContent('ready');
```

Use a narrowly scoped console spy only when the test explicitly verifies an
error path. The current legacy setup preserves console mocks for those tests,
but fails any captured “not wrapped in act” diagnostic after each test.

## Examples: behavior and impact only

Examples prove composition. Give every public route a browser smoke check and
add a co-located unit test whenever the route owns a non-trivial interaction.
The impact command reports both the selected route and whether that unit test
exists:

```bash
pnpm example:impact -- --changed-files \
  example/src/pages/integrations/react-aria/ReactAriaReferencePage.tsx
```

For ordinary changes, run the affected route only. For release-wide confidence,
run the canonical public catalog:

```bash
pnpm --filter example verify:route-smoke -- \
  --base origin/main --head HEAD
pnpm example:smoke
```

The route smoke check detects page exceptions and browser console errors. It is
not a replacement for domain or adapter contracts; it confirms that the public
composition reaches a usable baseline.

## Choosing a test before writing code

1. If the behavior can be expressed without React, add or update a core test.
2. If it depends on provider, hook, or subscription lifetime, add a React
   adapter test with `act`.
3. If it is visible only after composing a route, add a co-located example test
   and let the impact smoke verify the route.
4. If a shared runtime module changes, accept the broader smoke selection: every
   public example depends on that contract.
