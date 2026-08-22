---
document_id: guide--react-testing-act
category: guide
source_path: en/guide/react-testing-act.md
character_limit: 1000
last_update: '2026-08-22T10:53:40.640Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React UI Testing with `act`

React UI Testing with act Use this convention for Context-Action examples and application integrations that render React components. It makes pending React work observable before an assertion and prevents an apparently passing test from leaving an update behind. React recommends the asynchronous form, await act(async () => { ... }), for renders and interactions that can cross an async boundary. React Testi

Key points:
• it renders without a React `act` diagnostic or uncaught browser error;
• one primary keyboard, pointer, or dispatch interaction changes visible UI;
• one asynchronous completion or error state is observable; and
• cleanup...