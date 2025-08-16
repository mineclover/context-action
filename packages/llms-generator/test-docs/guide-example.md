# Getting Started with Context-Action Framework

This guide will walk you through the process of setting up and using the Context-Action framework in your React application.

## Overview

The Context-Action framework provides a clean separation between your UI components and business logic through a powerful action pipeline system. Instead of mixing state management and business rules directly in your components, you can organize your application logic into reusable action handlers.

## Installation

First, install the required packages:

```bash
npm install @context-action/core @context-action/react
```

## Basic Setup

### Step 1: Define Your Action Types

Create a type definition for your actions:

```typescript
import { ActionPayloadMap } from '@context-action/core';

interface UserActions extends ActionPayloadMap {
  loadUser: { userId: string };
  updateUser: { id: string; name: string; email: string };
  deleteUser: { userId: string };
  refreshUserList: void;
}
```

### Step 2: Create Action Context

Set up your action context:

```typescript
import { createActionContext } from '@context-action/react';

const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('User');
```

### Step 3: Set Up Action Handlers

Create components that register action handlers:

```typescript
function UserActionHandlers() {
  const userStore = useUserStore();
  
  const loadUserHandler = useCallback(async (payload, controller) => {
    try {
      const user = await userAPI.getUser(payload.userId);
      userStore.setValue(user);
      return { success: true, data: user };
    } catch (error) {
      controller.abort('Failed to load user', error);
    }
  }, [userStore]);
  
  useUserActionHandler('loadUser', loadUserHandler);
  
  return null; // This is a handler-only component
}
```

### Step 4: Use in Components

Dispatch actions from your UI components:

```typescript
function UserProfile({ userId }: { userId: string }) {
  const dispatch = useUserAction();
  const user = useStoreValue(userStore);
  
  useEffect(() => {
    dispatch('loadUser', { userId });
  }, [userId, dispatch]);
  
  const handleUpdate = () => {
    dispatch('updateUser', {
      id: userId,
      name: 'Updated Name',
      email: 'new@email.com'
    });
  };
  
  return (
    <div>
      <h2>{user?.name}</h2>
      <p>{user?.email}</p>
      <button onClick={handleUpdate}>Update User</button>
    </div>
  );
}
```

### Step 5: Wire Everything Together

```typescript
function App() {
  return (
    <UserActionProvider>
      <UserActionHandlers />
      <UserProfile userId="123" />
    </UserActionProvider>
  );
}
```

## Key Concepts

### Action Pipeline
Actions are processed through a pipeline that allows multiple handlers to participate in processing a single action. Handlers are executed in priority order.

### Separation of Concerns
- **Components**: Focus purely on rendering UI and user interactions
- **Action Handlers**: Contain all business logic and side effects
- **Stores**: Manage application state in isolation

### Type Safety
The framework provides full TypeScript support, ensuring that action dispatches are type-safe and payloads match expected types.

## Next Steps

Now that you have the basics set up, you can:
1. Explore advanced action handler patterns
2. Learn about store integration
3. Implement error handling strategies
4. Set up testing for your action handlers

For more detailed information, check out the API reference and advanced guides.