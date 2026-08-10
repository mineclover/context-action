---
document_id: guide--react-aria-integration
category: guide
source_path: en/guide/react-aria-integration.md
character_limit: 2000
last_update: '2026-08-10T05:45:25.397Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React Aria Integration Boundary

React Aria Integration Boundary Context-Action integrates with React Aria at the domain boundary. It is not a replacement for React Stately's component-local interaction state. The runnable reference is available in the example application at /integrations/react-aria-reference. It uses react-aria-components for a sortable, multi-select table and a calendar, then uses Context-Action actions and stores for the product-facing decisions those components emit. Ownership model | Concern | Owner | Why | | --- | --- | --- | | Keyboard navigation, focus movement, typeahead, collection traversal | React Aria / React Stately | These behaviors depend on the component's accessibility state contract. | | Calendar month navigation and cell focus | React Aria / React Stately | Keep the high-frequency interaction loop local and synchronous. | | Selected work items, persisted sort, selected review date | Context-Action Store | These are application-level values that other views or handlers can consume. | |

Key points:
• Arrow-key navigation, range/multi-selection, and focus-visible behavior.
• Calendar month movement and selection with keyboard and pointer input.
• Overlay focus restoration for any related popover or dialog.
• React 18/19 SSR and hydration if the controlled values are server supplied.
• That action handlers do not delay the component's high-frequency interaction