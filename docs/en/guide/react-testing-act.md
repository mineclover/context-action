# React UI Testing with `act`

Use this convention for Context-Action examples and application integrations
that render React components. It makes pending React work observable before an
assertion and prevents an apparently passing test from leaving an update behind.

React recommends the asynchronous form, `await act(async () => { ... })`, for
renders and interactions that can cross an async boundary. React Testing Library
already wraps its render and interaction helpers, but direct store mutations,
action dispatches, timers, and externally resolved promises still need an
explicit boundary. See the official [React `act` reference](https://react.dev/reference/react/act).

## Required test environment

The example app sets `IS_REACT_ACT_ENVIRONMENT` in
`example/src/test/setup.ts`. Its setup also turns the actionable “not wrapped in
act” diagnostic into a test failure. Keep both safeguards in a new React
example's test setup:

```ts
(globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
}).IS_REACT_ACT_ENVIRONMENT = true;
```

Do not silence a React `act` warning with a global `console.error` mock. Fix the
test boundary instead. A test that intentionally exercises an error path should
make a narrowly scoped spy and assert that error explicitly.

## Choose the correct boundary

| Work being tested | Convention |
| --- | --- |
| Pure business rule or schema | No `act`; test the function directly. |
| React Testing Library `render`, `userEvent`, `findBy*`, `waitFor` | Use the helper normally and `await` every asynchronous helper. |
| Direct Context-Action store mutation or action dispatch that affects a rendered component | Wrap the mutation and every resulting promise in `await act(async () => { ... })`. |
| Timer, subscription callback, externally resolved promise, or imperative ref update | Trigger it inside `await act(async () => { ... })`, then assert visible output. |
| Server rendering | Do not use client `act` for the server render; use it only when hydrating or updating the client tree. |

`waitFor` retries an assertion; it does not replace the `act` boundary for an
imperative update. Likewise, `userEvent` calls must be awaited so Testing
Library can complete its own `act` work.

## Context-Action example

When a rendered consumer reads a store, treat a direct store write as a UI
interaction in the test:

```tsx
import { act } from 'react';
import { render, screen } from '@testing-library/react';

it('renders the store update', async () => {
  const store = createCounterStore();
  render(<CounterView store={store} />);

  await act(async () => {
    store.setValue(3);
  });

  expect(screen.getByText('Count: 3')).toBeInTheDocument();
});
```

For an async action, await the dispatch inside the same boundary. Keep the
assertion outside it so the test verifies what a user can observe after React
has flushed the interaction.

```tsx
await act(async () => {
  await dispatch('saveProfile', { name: 'Ada' });
});

expect(screen.getByRole('status')).toHaveTextContent('Saved');
```

## Timers and external callbacks

Advance fake timers and resolve externally controlled promises inside async
`act`. This is particularly important for debounced actions, subscription
bridges, and delayed notifications.

```tsx
await act(async () => {
  await vi.advanceTimersByTimeAsync(300);
});

expect(screen.getByText('Search complete')).toBeInTheDocument();
```

## Example coverage baseline

Every publicly linked example should have at least one browser-facing test that
checks all of the following:

1. it renders without a React `act` diagnostic or uncaught browser error;
2. one primary keyboard, pointer, or dispatch interaction changes visible UI;
3. one asynchronous completion or error state is observable; and
4. cleanup does not leave a pending timer, subscription, or request.

This is a rollout baseline, not a claim that every legacy route is already
covered. Start by applying the guard to an existing interaction test, then add
route-level smoke coverage for each public example before treating the example
catalog as fully verified.

Run the current example and framework suites before adding or moving a guide:

```bash
pnpm --filter example test
pnpm --filter @context-action/react test
pnpm web-coding:verify
```

Use the standalone Web Coding Studio's browser verification for the deployed
`/web-coding/` surface. Internal example fixtures remain useful for contract
tests, but are not a substitute for a test of the publicly deployed route.
