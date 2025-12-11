# Basic Usage

Learn how to define actions with Zod schemas for type-safe, validated payloads.

## Installation

Zod is an optional peer dependency. Install it if you want to use schema validation:

```bash
npm install zod@^4
# or
pnpm add zod@^4
```

## Defining Actions

### Simple Action

```typescript
import { z } from 'zod';
import { defineAction } from '@context-action/core';

const createUserAction = defineAction({
  name: 'createUser',
  description: 'Create a new user account',
  parameters: z.object({
    username: z.string().min(3).max(20),
    email: z.string().email(),
    age: z.number().int().positive().optional(),
  }),
}, z);
```

### Using the Factory Pattern

For cleaner code, use `createActionFactory` to avoid passing `z` every time:

```typescript
import { z } from 'zod';
import { createActionFactory } from '@context-action/core';

const defineAction = createActionFactory(z);

const updateProfile = defineAction({
  name: 'updateProfile',
  parameters: z.object({
    name: z.string(),
    bio: z.string().max(500).optional(),
  }),
});

const deleteAccount = defineAction({
  name: 'deleteAccount',
  parameters: z.object({
    confirmPhrase: z.literal('DELETE'),
  }),
});
```

## Creating Schema Maps

Group related actions into a schema map:

```typescript
import { createActionSchema } from '@context-action/core';

const userActionSchema = createActionSchema({
  createUser: defineAction({
    name: 'createUser',
    parameters: z.object({ username: z.string(), email: z.string().email() }),
  }, z),

  updateUser: defineAction({
    name: 'updateUser',
    parameters: z.object({ id: z.string(), name: z.string() }),
  }, z),

  deleteUser: defineAction({
    name: 'deleteUser',
    parameters: z.object({ id: z.string(), confirm: z.literal(true) }),
  }, z),
});
```

## Type Inference

Use `InferActionPayloadMap` to extract TypeScript types from your schema:

```typescript
import type { InferActionPayloadMap } from '@context-action/core';

type UserActions = InferActionPayloadMap<typeof userActionSchema>;
// Result:
// {
//   createUser: { username: string; email: string };
//   updateUser: { id: string; name: string };
//   deleteUser: { id: string; confirm: true };
// }
```

## Using with React

### With ActionContext

```typescript
import { createActionContext } from '@context-action/react';

const {
  Provider: UserActionProvider,
  useActionDispatch: useUserDispatch,
  useActionHandler: useUserHandler,
} = createActionContext<InferActionPayloadMap<typeof userActionSchema>>('User', {
  schema: userActionSchema,
});

function UserComponent() {
  const dispatch = useUserDispatch();

  const handleCreate = () => {
    // Type-safe: TypeScript knows the payload shape
    dispatch('createUser', {
      username: 'john',
      email: 'john@example.com',
    });
  };

  return <button onClick={handleCreate}>Create User</button>;
}
```

### Registering Handlers

```typescript
function UserLogic({ children }) {
  useUserHandler('createUser', useCallback(async (payload) => {
    // payload is typed as { username: string; email: string }
    await api.createUser(payload);
  }, []));

  return children;
}
```

## Manual Validation

You can also validate payloads manually:

```typescript
// Throws on invalid payload
const validated = userActionSchema.createUser.validate({
  username: 'john',
  email: 'john@example.com',
});

// Returns { success, data, error }
const result = userActionSchema.createUser.safeParse({
  username: 'jo', // Too short
  email: 'invalid',
});

if (!result.success) {
  console.log(result.error.issues);
}
```

## Next Steps

- [Validation Modes](./validation-modes.md) - Configure validation behavior
- [Error Handling](./error-handling.md) - Handle validation errors gracefully
- [Tool Chain Export](./tool-chain.md) - Use schemas with LLM APIs
