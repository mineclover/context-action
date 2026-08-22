---
document_id: guide--react-testing-act
category: guide
source_path: en/guide/react-testing-act.md
character_limit: 5000
last_update: '2026-08-22T10:53:40.641Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React UI Testing with `act`

React UI Testing with act Use this convention for Context-Action examples and application integrations that render React components. It makes pending React work observable before an assertion and prevents an apparently passing test from leaving an update behind. React recommends the asynchronous form, await act(async () => { ... }), for renders and interactions that can cross an async boundary. React Testing Library already wraps its render and interaction helpers, but direct store mutations, action dispatches, timers, and externally resolved promises still need an explicit boundary. See the official React act reference. Required test environment The example app sets ISREACTACTENVIRONMENT in example/src/test/setup.ts. Its setup also turns the actionable “not wrapped in act” diagnostic into a test failure. Keep both safeguards in a new React example's test setup: Do not silence a React act warning with a global console.error mock. Fix the test boundary instead. A test that intentionally exercises an error path should make a narrowly scoped spy and assert that error explicitly. Choose the correct boundary | Work being tested | Convention | | --- | --- | | Pure business rule or schema | No act; test the function directly. | | React Testing Library render, userEvent, findBy, waitFor | Use the helper normally and await every asynchronous helper. | | Direct Context-Action store mutation or action dispatch that affects a rendered component | Wrap the mutation and every resulting promise in await act(async () => { ... }). | | Timer, subscription callback, externally resolved promise, or imperative ref update | Trigger it inside await act(async () => { ... }), then assert visible output. | | Server rendering | Do not use client act for the server render; use it only when hydrating or updating the client tree. | waitFor retries an assertion; it does not replace the act boundary for an imperative update. Likewise, userEvent calls must be awaited so Testing Library can complete its own act work. Context-Action example When a rendered consumer reads a store, treat a direct store write as a UI interaction in the test: For an async action, await the dispatch inside the same boundary. Keep the assertion outside it so the test verifies what a user can observe after React has flushed the interaction. Timers and external callbacks Advance fake timers and resolve externally controlled promises inside async act. This is particularly important for debounced actions, subscription bridges, and delayed notifications. Example coverage baseline Every publicly linked example should have at least one browser-facing test that checks all of the following: 1. it renders without a React act diagnostic or uncaught browser error; 2. one primary keyboard, pointer, or dispatch interaction change

Key points:
• it renders without a React `act` diagnostic or uncaught browser error;
• one primary keyboard, pointer, or dispatch interaction changes visible UI;
• one asynchronous completion or error state is observable; and
• cleanup does not leave a pending timer, subscription, or request.