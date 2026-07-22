---
document_id: guide--dispatch-access
category: guide
source_path: en/guide/patterns/action/dispatch-access.md
character_limit: 5000
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

Access the ActionRegister instance through React context for advanced use cases within React applications. Advanced Dispatch with Register Access

React Integration with Register Access

Access the underlying register instance within React components when needed. Using Context-Generated useActionRegister Hook

Register Information Access

Comparison: Hook vs Register

Hook-Based Dispatch (Recommended)

Pros:
- React-optimized with automatic context management
- Cleaner component code with less boilerplate
- Automatic provider dependency injection
- Type-safe with excellent TypeScript integration
- Follows React patterns and conventions

Cons:
- React-specific, not usable outside React components
- Less control over advanced dispatch options
- Requires React Context setup

Use Cases:
- Standard React component interactions
- Form submissions and user events
- Component-level business logic
- Most React application scenarios

Register-Based Dispatch

Pros:
- Framework-agnostic, works in any JavaScript environment
- Full control over dispatch options and configuration
- Direct access to all ActionRegister features
- Advanced debugging and monitoring capabilities
- Suitable for utility functions and services

Cons:
- More verbose setup and usage
- Manual dependency management
- Requires explicit register instance passing
- More complex error handling

Use Cases:
- Advanced dispatch configurations within React components
- Testing and debugging scenarios
- Complex business logic requiring register metadata
- Service layer implementations within React context

Best Practices

When to Use Hooks

When to Use Register

Hybrid Approach

Error Handling Patterns

Hook Error Handling

Register Error Handling

Real-World Examples

- Todo List Demo - Hook-based dispatch patterns
- Chat Demo - Mixed hook and register usage
- User Profile Demo - Advanced dispatch patterns

Related Patterns

- Dispatch Patterns - Basic dispatching techniques
- Register Patterns - Handler registration patterns
- Action Basic Usage - Fundamental action concepts
- Type System - TypeScript integration.
