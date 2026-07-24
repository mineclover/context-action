---
document_id: guide--patterns--store--path-based-subscription
category: guide
source_path: en/guide/patterns/store/path-based-subscription.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.205Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Path-Based Subscription

Path-Based Subscription Optimized subscription pattern that uses JSON patches to determine when to re-render, providing fine-grained control over component updates. Overview Traditional selectors run on every state change and compare results. Path-based subscription instead analyzes JSON patches to determine if subscribed paths are affected, avoiding unnecessary selector execution. Core APIs useStorePath Subscribe to a specific path in the store. Only re-renders when that path changes. useStoreSelectorWithPaths Combine selector transformation with path-based optimization. Comparison with Selectors | Feature | useStoreSelector | useStorePath | useStoreSelectorWithPaths | |---------|------------------|--------------|---------------------------| | Selector Execution | Every change | Path match only | Path match only | | Comparison Target | Selector result | Patch paths | Patch paths | | Derived Values | ✅ Yes | ❌ No | ✅ Yes | | Performance | Depends on selector | Fast (s

Key points:
• **string**: Object property keys
• **number**: Array indices
• `~` → `~0`
• `/` → `~1`
• Use `useStorePath` for simple property access
• Use `useStoreSelectorWithPaths` when you need both transformation and optimization
• Specify precise `dependsOn` paths for better filtering
• Use array indices for specific array element subscriptions
• Using `useStorePath` when you need derived/computed values
• Omitting `dependsOn` when paths are known (falls back to every-change behavior)
• Over-specifying paths (subscribe to parent if multiple children are needed)
• [useStoreValue...