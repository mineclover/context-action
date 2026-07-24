---
document_id: guide--patterns--async--wait-then-execute
category: guide
source_path: en/guide/patterns/async/wait-then-execute.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.168Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Wait-Then-Execute Pattern

Wait-Then-Execute Pattern Pattern for safely executing DOM operations after ensuring element availability. Prerequisites Required Setup: For complete RefContext setup instructions including type definitions, DOM element refs, and provider configuration, see RefContext Setup. This pattern demonstrates DOM waiting strategies using the setup patterns: - Type definitions → DOM Element Refs - Context creation → Basic RefContext Setup - Provider setup → Provider Setup Patterns - Advanced usage → Waiting for Multiple Refs For Store and Action integration, see: - Basic Store Setup - Store context for state management - Basic Action Setup - Action context for business logic Basic Pattern Advanced Example Store Integration Pattern Action Handler Integration Multi-Element Coordination Sequential Operations Best Practices 1. Always Check Element: Verify element exists after waiting (follows RefContext setup patterns) 2. Store Integration: Update stores to reflect DOM operation results 3. Error Handling: Implement try-catch blocks and store error states 4. Performance: Use hardware-accelerated properties and batch store updates 5. Cleanup: Proper cleanup handled by RefContext lifecycle management 6. Type Safety: Use setup guide type definitions for all refs Setup Integration Examples Form Validation with Store Updates Canvas Rendering with Progress Tracking Common Use Cases - Form Validation: Wait for form elements + store validation state - Animation Sequences: Coordinate animations + track animation progress in stores - Data Visualization: Wait for canvas/SVG + store render status and data - Modal Operations: Ensure modal is mounted + manage modal state in stores - Drag & Drop: Wait for drop zones + track drag operation state Related Patterns - RefContext Setup - Complete waiting patterns - Canvas Optimization - High-performance canvas operations - Store Integration Patterns - Store updates after DOM operations

Key points:
• **Type definitions** → [DOM Element Refs](../setup/ref-context-setup.md#dom-element-refs)
• **Context creation** → [Basic RefContext Setup](../setup/ref-context-setup.md#basic-refcontext-setup)
• **Provider setup** → [Provider Setup Patterns](../setup/ref-context-setup.md#provider-setup-patterns)
• **Advanced usage** → [Waiting for Multiple Refs](../setup/ref-context-setup.md#waiting-for-multiple-refs)
• **[Basic Store Setup](../setup/basic-store-setup.md)** - Store context for state management
• **[Basic Action Setup](../setup/basic-action-setup.md)** - Action context for business logic
• **Form Validation**: Wait for form elements + store validation state
• **Animation Sequences**: Coordinate animations + track animation progress in stores
• **Data Visualization**: Wait for canvas/SVG + store render status and data
• **Modal Operations**: Ensure modal is mounted + manage modal state in stores
• **Drag & Drop**: Wait for drop zones + track drag operation state
• **[RefContext Setup](../setup/ref-context-setup.md#waiting-for-multiple-refs)** - Complete waiting patterns
• **[Canvas Optimization](../ref/canvas-optimization.md)** - High-performance canvas operations
• **[Store Integration Patterns](../store/basic-usage.md)** - Store updates after DOM operations
• **Always Check Element**: Verify element exists after waiting (follows RefContext setup patterns)
• **Store Integration**: Update stores to reflect DOM operation results
• **Error Handling**: Implement try-catch blocks and store error states
• **Performance**: Use hardware-accelerated properties and batch store updates
• **Cleanup**: Proper cleanup handled by RefContext lifecycle management
• **Type Safety**: Use setup guide type definitions for all refs