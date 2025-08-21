---
document_id: examples--element-management
category: examples
source_path: en/examples/element-management.md
character_limit: 5000
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

4. Selection Management

Real-world Scenarios

Form Builder Application

Dynamic form builder with element management:

Features:
- Dynamic form field addition/removal
- Click to select fields, Cmd/Ctrl+Click for multi-selection
- Bulk deletion of selected fields
- Real-time element state monitoring
- Keyboard shortcut support

Canvas Management

Canvas-based graphic editor with element management:

Features:
- Canvas element registration and state management
- Integration with graphic objects within canvas
- Tool panel display based on selection state
- Canvas metadata management

API Reference

Core API

ElementManager

React Hooks

useElementRef
Hook for automatic element registration

useElementManager
Comprehensive element management hook

useFocusedElement
Focus management hook

useElementSelection
Selection management hook

Key Benefits

1. Centralized Management
- All DOM elements managed from a central location for consistency
- Predictable element lifecycle management

2. Type Safety
- Complete type safety through TypeScript
- Type-specific specialized features for each element type

3. Memory Optimization
- Automatic cleanup prevents memory leaks
- Automatic detection and removal of stale elements

4. React Integration
- Perfect integration with React's declarative patterns
- Hook-based API maximizes reusability

5. Debugging Support
- Real-time element state monitoring with development tools
- Element metadata and lifecycle tracking

Source Code

The complete source code for this example is available in the /examples/element-management/ directory:

- core-element-registry.ts - Core element management system
- react-element-hooks.tsx - React integration hooks and components
- integration-example.tsx - Real-world usage examples
- README.md - Comprehensive documentation

This example demonstrates how the Context-Action framework elegantly solves complex DOM element management scenarios, applicable to various real-world use cases like form builders, canvas editors, and complex UIs.
