---
document_id: guide--patterns--store--path-based-subscription
category: guide
source_path: en/guide/patterns/store/path-based-subscription.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.205Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Path-Based Subscription

Path-Based Subscription Optimized subscription pattern that uses JSON patches to determine when to re-render, providing fine-grained control over component updates. Overview Traditional selectors run on every state change and compare results. Path-based subscription instead analyzes JSON patches to determine if subscribed paths are affected, avoiding unnecessary selector execution. Core APIs useStorePath Subscribe to a specific path in the store. Only re-renders when that path changes. useStoreSelectorWithPaths Combine selector transformation with path-based optimization. Comparison with Selectors | Feature | useStoreSelector | useStorePath | useStoreSelectorWithPaths | |---------|------------------|--------------|---------------------------| | Selector Execution | Every change | Path match only | Path match only | | Comparison Target | Selector result | Patch paths | Patch paths | | Derived Values | ✅ Yes | ❌ No | ✅ Yes | | Performance | Depends on selector | Fast (string compare) | Best of both | When to Use Each useStorePath Best for direct property access without transformation: useStoreSelector Best for complex transformations where path hints aren't practical: useStoreSelectorWithPaths Best for derived values with known dependencies: Path Format Reference Path Type Definition - string: Object property keys - number: Array indices Path Examples | State Access | Path | |-------------|------| | state.user | ['user'] | | state.user.name | ['user', 'name'] | | state.user.profile.address.city | ['user', 'profile', 'address', 'city'] | | state.items[0] | ['items', 0] | | state.items[1].name | ['items', 1, 'name'] | | state.matrix[0][1] | ['matrix', 0, 1] | Path String Normalization (JSON Pointer RFC 6901) Internally, paths are converted to JSON Pointer strings (RFC 6901) for efficient prefix matching: Special Character Escaping (RFC 6901 Section 3): Keys containing or / are escaped. The order matters - must be escaped first: - → 0 - / → 1 RFC 6901 Section 5 Examples: Path Boundary Matching: The matching algorithm correctly handles path boundaries: Utility Functions (exported): How Path Matching Works A patch affects a subscribed path when: 1. Exact match: Patch path equals subscribed path 2. Parent changed: Patch path is prefix of subscribed path 3. Child changed: Subscribed path is prefix of patch path Matching Algorithm Array Operations and Patches Understanding how array mutations generate patches is crucial for effective path subscriptions. Array Mutation Patch Patterns | Operation | Patches Generated | Example | |-----------|------------------|---------| | arr[i] = value | replace at index | { path: ['items', 1], op: 'replace' } | | arr[i].prop = value | replace at nested path | { path: ['items', 1, 'name'], op: 'replace' } | |

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
• [useStoreValue Patterns](./useStoreValue-patterns.md) - Basic subscription patterns
• [Subscription Optimization](./subscription-optimization.md) - General optimization strategies
• [Memoization Patterns](./memoization-patterns.md) - Prevent unnecessary re-computations
• [Comparison Strategies](./comparison-strategies.md) - Choose the right comparison method
• **Exact match**: Patch path equals subscribed path
• **Parent changed**: Patch path is prefix of subscribed path
• **Child changed**: Subscribed path is prefix of patch path