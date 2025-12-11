# Zod Schema Integration

This guide covers the Zod-based action definition system that provides runtime validation and type safety for your actions.

## Overview

The schema integration allows you to:

- **Define actions with Zod schemas** - Single source of truth for types and validation
- **Runtime payload validation** - Validate payloads on dispatch
- **Tool chain format conversion** - Export to MCP, OpenAI, and Anthropic formats
- **Type inference** - Automatic TypeScript type generation from schemas

## Quick Start

```typescript
import { z } from 'zod';
import { defineAction, createActionSchema, createActionContext } from '@context-action/react';

// 1. Define actions with Zod schemas
const updateUserAction = defineAction({
  name: 'updateUser',
  description: 'Update user profile',
  parameters: z.object({
    id: z.string().min(1),
    name: z.string().min(2).max(50),
    email: z.string().email().optional(),
  }),
}, z);

// 2. Create schema map
const userSchema = createActionSchema({
  updateUser: updateUserAction,
});

// 3. Create ActionContext with schema
const { Provider, useActionDispatch } = createActionContext<
  InferActionPayloadMap<typeof userSchema>
>('User', {
  schema: userSchema,
  registry: {
    validationMode: 'strict', // 'strict' | 'warn' | 'silent'
  },
});
```

## Documentation

- [Basic Usage](./basic-usage.md) - Getting started with schema definitions
- [Validation Modes](./validation-modes.md) - Configure how validation errors are handled
- [Tool Chain Export](./tool-chain.md) - Export schemas to LLM tool formats
- [Error Handling](./error-handling.md) - Handle validation errors in your app

## API Reference

### defineAction

Creates a unified action with validation and format conversion.

```typescript
function defineAction<TSchema extends ZodRawShape>(
  options: DefineActionOptions<TSchema>,
  zodModule: typeof z
): UnifiedAction<z.infer<ZodObject<TSchema>>>
```

### createActionSchema

Groups multiple actions into a schema map.

```typescript
function createActionSchema<T extends Record<string, UnifiedAction>>(
  actions: T
): T & ActionSchemaMap
```

### createActionFactory

Creates a factory with pre-bound Zod module.

```typescript
function createActionFactory(zodModule: typeof z): DefineActionFn
```

## Requirements

- `zod@^4.0.0` as a peer dependency (optional)
- Schema validation only activates when schema is provided
