---
document_id: examples--element-management
category: examples
source_path: en/examples/element-management.md
character_limit: 2000
last_update: '2025-08-21T02:13:42.356Z'
update_status: auto_generated
priority_score: 80
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
DOM Element Management

Advanced example demonstrating comprehensive DOM element management using the Context-Action framework. Overview

This example showcases how to effectively manage DOM elements in both React and Core packages using Context-Action's Action Pipeline and Store Pattern. It provides:

- Centralized Element Registry: All DOM elements managed from a central location
- Type-safe Element Management: Full TypeScript support for element operations
- Reactive State Management: Real-time reactions to element state changes
- Lifecycle Management: Automated element registration/cleanup
- Focus & Selection Management: Built-in focus and selection state management

Key Features

Core Package Features
- ElementManager Class: Centralized DOM element lifecycle management
- Action-based API: All element operations performed through action pipeline
- Automatic Cleanup: Periodic cleanup of removed DOM elements
- Type-safe Management: Complete type safety using TypeScript

React Package Features
- useElementRef Hook: Hook for automatic element registration
- Focus Management: useFocusedElement hook for focus state management
- Selection Management: useElementSelection hook for multi-selection support
- Type-based Queries: useElementsByType for type-specific element queries
- Managed Components: Auto-registering ManagedInput, ManagedButton components

Basic Usage

1. Setup

2. Element Registration & Management

3. Focus Management

4.
