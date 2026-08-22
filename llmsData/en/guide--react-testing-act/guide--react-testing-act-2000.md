---
document_id: guide--react-testing-act
category: guide
source_path: en/guide/react-testing-act.md
character_limit: 2000
last_update: '2026-08-22T10:53:40.641Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React UI Testing with `act`

React UI Testing with act Use this convention for Context-Action examples and application integrations that render React components. It makes pending React work observable before an assertion and prevents an apparently passing test from leaving an update behind. React recommends the asynchronous form, await act(async () => { ... }), for renders and interactions that can cross an async boundary. React Testing Library already wraps its render and interaction helpers, but direct store mutations, action dispatches, timers, and externally resolved promises still need an explicit boundary. See the official React act reference. Required test environment The example app sets ISREACTACTENVIRONMENT in example/src/test/setup.ts. Its setup also turns the actionable “not wrapped in act” diagnostic into a test failure. Keep both safeguards in a new React example's test setup: Do not silence a React act warning with a global console.error mock. Fix the test boundary instead. A test that intentionally exercise

Key points:
• it renders without a React `act` diagnostic or uncaught browser error;
• one primary keyboard, pointer, or dispatch interaction changes visible UI;
• one asynchronous completion or error state is observable; and
• cleanup does not leave a pending timer, subscription, or request.