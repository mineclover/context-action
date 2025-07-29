# @context-action/core

The core package provides the fundamental action pipeline management system.

## Installation

```bash
npm install @context-action/core
```

## Overview

The core package includes:

- **ActionRegister**: Main pipeline management class
- **Type definitions**: TypeScript interfaces and types for type-safe usage
- **Pipeline system**: Priority-based handler execution with async support

## Key Features

- 🔒 **Type-safe**: Full TypeScript support with generic types
- ⚡ **Performance**: Optimized pipeline execution with minimal overhead
- 🔄 **Async Support**: Handle both sync and async operations
- 🎯 **Priority Control**: Execute handlers in defined order
- 🛡️ **Error Handling**: Built-in error handling and abort mechanisms

## Basic Usage

```typescript
import { ActionRegister, ActionPayloadMap } from '@context-action/core';

// Define your actions
interface AppActions extends ActionPayloadMap {
  increment: void;
  setCount: number;
  updateUser: { id: string; name: string };
}

// Create action register
const actionRegister = new ActionRegister<AppActions>();

// Register handlers
actionRegister.register('increment', () => {
  console.log('Increment action triggered');
});

actionRegister.register('setCount', (count) => {
  console.log(`Count set to: ${count}`);
});

// Dispatch actions
await actionRegister.dispatch('increment');
await actionRegister.dispatch('setCount', 42);
```

## API Reference

### Classes

- [`ActionRegister`](../generated/classes/ActionRegister.md) - Main pipeline management class

### Interfaces

- [`ActionPayloadMap`](../generated/interfaces/ActionPayloadMap.md) - Base interface for action definitions

### Type Aliases

- [`ActionHandler`](../generated/type-aliases/ActionHandler.md) - Handler function type
- [`PipelineController`](../generated/type-aliases/PipelineController.md) - Pipeline control interface
- [`HandlerConfig`](../generated/type-aliases/HandlerConfig.md) - Handler configuration options

## Advanced Usage

### Handler Priority

Control execution order with priority values:

```typescript
actionRegister.register('increment', () => {
  console.log('This runs first');
}, { priority: 10 });

actionRegister.register('increment', () => {
  console.log('This runs second');  
}, { priority: 5 });
```

### Async Handlers

Handle asynchronous operations:

```typescript
actionRegister.register('saveData', async (data) => {
  await api.save(data);
  console.log('Data saved');
}, { blocking: true }); // Wait for completion

actionRegister.register('logEvent', async (event) => {
  await analytics.track(event);
}, { blocking: false }); // Fire and forget
```

### Pipeline Control

Control pipeline execution flow:

```typescript
actionRegister.register('validate', (data, controller) => {
  if (!isValid(data)) {
    controller.abort('Invalid data');
    return;
  }
  
  // Modify payload for next handlers
  controller.modifyPayload(payload => ({
    ...payload,
    validated: true
  }));
  
  controller.next();
});
```

## Next Steps

- Learn about [React Integration](/api/react/) with hooks and Context
- Explore [Examples](/examples/) for real-world usage patterns
- Check out the [Getting Started Guide](/guide/getting-started) for comprehensive tutorials