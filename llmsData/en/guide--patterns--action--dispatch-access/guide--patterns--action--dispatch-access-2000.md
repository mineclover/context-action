---
document_id: guide--patterns--action--dispatch-access
category: guide
source_path: en/guide/patterns/action/dispatch-access.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.194Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Dispatch Access Patterns

Dispatch Access Patterns Two main approaches for accessing action dispatch functionality in the Context-Action framework: register-based access and hook-based access. Import Prerequisites For complete setup instructions including type definitions, context creation, and provider configuration, see Basic Action Setup. This document uses the AppActions pattern from the setup guide: - Type definitions → Extended Action Interface - Context creation → Single Domain Context - Provider setup → Single Provider Setup The examples assume you have configured the following context: Hook-Based Dispatch (Recommended) Use React hooks from createActionContext to access dispatch functionality within components. This is the recommended approach for React applications. Basic Hook Usage Hook with Result Collection Complete Component Implementation Register-Based Dispatch Access the ActionRegister instance through React context for advanced use cases within React applications. Advanced Dispatch wit

Key points:
• Type definitions → [Extended Action Interface](../setup/basic-action-setup.md#extended-action-interface)
• Context creation → [Single Domain Context](../setup/basic-action-setup.md#single-domain-context)
• Provider setup → [Single Provider Setup](../setup/basic-action-setup.md#single-provider-setup)
• React-optimized with automatic context management
• Cleaner component code with less boilerplate
• Automatic provider dependency injection
• Type-safe with excellent TypeScript integration
• Follows React patterns and conventions
• React-specific, not usable outside React components
• Less control over advanced...