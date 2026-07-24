---
document_id: guide--react-context-migration
category: guide
source_path: en/guide/react-context-migration.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.248Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React Context to Context-Action Migration Guide

React Context to Context-Action Migration Guide This guide helps developers migrate from traditional React Context patterns to Context-Action. It covers common patterns, their context-action equivalents, and patterns that require different approaches. Overview Context-Action provides a more structured approach to state management compared to vanilla React Context. While most patterns can be directly translated, some require architectural adjustments due to the framework's separation of concerns philosophy. Key Differences | Aspect | React Context | Context-Action | |--------|--------------|----------------| | State + Logic | Combined in Provider | Separated (Store + Handler) | | State Updates | setState / dispatch | setValue / update | | Cross-context | Hook calls in Provider | Handler accesses multiple stores | | Side Effects | In Provider's useEffect | Separate components/hooks | | Immutability | Manual | Automatic (Mutative) | --- Pattern Migration Guide 1. Basic State Management Reac

Key points:
• `setValue(value)` - Direct replacement (no access to previous)
• `update(prev => newValue)` - Functional update with previous value access
• Create a wrapper function if you need both patterns in one API
• [ ] Identify all Context providers in your app
• [ ] Map out cross-context dependencies
• [ ] List all side effects in providers (localStorage, DOM, API calls)
• [ ] Identify smart setter patterns (function/value dual support)
• [ ] Create store contexts for each state domain
• [ ] Separate business logic into handler components
• [ ] Extract side effects into dedicated components/hooks
• [...