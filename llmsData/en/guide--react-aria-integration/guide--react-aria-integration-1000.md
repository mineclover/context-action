---
document_id: guide--react-aria-integration
category: guide
source_path: en/guide/react-aria-integration.md
character_limit: 1000
last_update: '2026-08-10T05:45:25.395Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React Aria Integration Boundary

React Aria Integration Boundary Context-Action integrates with React Aria at the domain boundary. It is not a replacement for React Stately's component-local interaction state. The runnable reference is available in the example application at /integrations/react-aria-reference. It uses react-aria-components for a sortable, multi-select table and a calendar, then uses Context-Action actions and stores

Key points:
• Arrow-key navigation, range/multi-selection, and focus-visible behavior.
• Calendar month movement and selection with keyboard and pointer input.
• Overlay focus restoration for any related popover or dialog.
• React...