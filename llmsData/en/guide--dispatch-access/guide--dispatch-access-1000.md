---
document_id: guide--dispatch-access
category: guide
source_path: en/guide/patterns/action/dispatch-access.md
character_limit: 1000
last_update: '2025-08-26T00:34:27.295Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Dispatch Access Patterns

Two main approaches for accessing action dispatch functionality in the Context-Action framework: register-based access and hook-based access. Import

Prerequisites

For complete setup instructions including type definitions, context creation, and provider configuration, see Basic Action Setup. This document uses the AppActions pattern from the setup guide:
- Type definitions → Extended Action Interface
- Context creation → Single Domain Context
- Provider setup → Single Provider Setup

The examples assume you have configured the following context:

Hook-Based Dispatch (Recommended)

Use React hooks from createActionContext to access dispatch functionality within components. This is the recommended approach for React applications. Basic Hook Usage

Hook with Result Collection

Complete Component Implementation

Register-Based Dispatch

Access the ActionRegister instance through React context for advanced use cases within React applications.
