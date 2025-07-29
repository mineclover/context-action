# API Reference

Complete API documentation for Context Action library.

## Packages

### [@context-action/core](/api/core/)

The core library providing type-safe action pipeline management.

**Key Classes:**
- [`ActionRegister`](/api/generated/classes/ActionRegister.md) - Main pipeline management class

**Key Types:**
- [`ActionPayloadMap`](/api/generated/interfaces/ActionPayloadMap.md) - Base interface for action definitions
- [`ActionHandler`](/api/generated/type-aliases/ActionHandler.md) - Handler function type
- [`PipelineController`](/api/generated/type-aliases/PipelineController.md) - Pipeline control interface
- [`HandlerConfig`](/api/generated/type-aliases/HandlerConfig.md) - Handler configuration options

### [@context-action/react](/api/react/)

React integration layer with Context and hooks.

**Key Functions:**
- [`createActionContext`](/api/generated/functions/createAction.md) - Create React Context for actions

## Quick Navigation

::: tip Auto-Generated Documentation
This API reference is automatically generated from TypeScript source code using TypeDoc. 
All types, interfaces, and method signatures are guaranteed to be up-to-date with the latest code.
:::

### Core Concepts

- **ActionRegister**: The main class that manages action pipelines
- **Action Pipeline**: Sequential execution of handlers with priority control
- **Handler Configuration**: Options for controlling handler behavior
- **Type Safety**: Full TypeScript support with strict type checking

### Getting Started

If you're new to Context Action, start with our [Getting Started Guide](/guide/getting-started) before diving into the API reference.

### Examples

For practical usage examples, check out our [Examples section](/examples/).

## Search

Use the search functionality (Ctrl/Cmd + K) to quickly find specific API methods, types, or interfaces.