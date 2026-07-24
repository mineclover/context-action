---
document_id: guide--react-context-migration
category: guide
source_path: en/guide/react-context-migration.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.248Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React Context to Context-Action Migration Guide

React Context to Context-Action Migration Guide This guide helps developers migrate from traditional React Context patterns to Context-Action. It covers common patterns, their context-action equivalents, and patterns that require different approaches. Overview Context-Action provides a more structured approach to state management compared to vanilla React Context. While most patterns can be directly

Key points:
• `setValue(value)` - Direct replacement (no access to previous)
• `update(prev => newValue)` - Functional update with previous value access
• Create a wrapper function if you need both patterns in one...