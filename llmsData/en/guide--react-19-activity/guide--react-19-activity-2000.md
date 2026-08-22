---
document_id: guide--react-19-activity
category: guide
source_path: en/guide/react-19-activity.md
character_limit: 2000
last_update: '2026-08-22T02:29:35.453Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React 19.2 Activity

React 19.2 Activity <Activity> is a React 19.2 component for keeping a part of the UI mounted while it is not visible. It preserves component, DOM, Store, and Action Provider state across a hide/reveal cycle without keeping that UI's effects and external subscriptions active. @context-action/react 3.0 requires React 19.2 or later. Activity is imported from React; Context-Action does not wrap or re-export it. Use it for resumable UI Activity is a good fit when a user is likely to return soon and losing local state would be disruptive: tabs, sidebars, search/filter panels, a draft form, or a detail pane. Use ordinary conditional rendering when leaving the UI should discard its state. The draft value and textarea DOM state are restored when the composer becomes visible again. Context-Action keeps the Store manager alive through the same cycle, so a Provider may be inside an Activity boundary. Provider and withProvider() placement Both direct Providers and withProvider() wrappers preserve their Sto