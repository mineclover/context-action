# Action Type Inference

Learn how to create type-safe actions with automatic payload inference in Context-Action.

## 🎯 Basic Action Type Inference

Define your action interfaces and let TypeScript infer payload types automatically:

```typescript
import { createActionContext } from '@context-action/react';

// ✅ Action interface with typed payloads
interface UserActions {
  updateProfile: { name: string; email: string };
  deleteUser: { userId: string };
  resetState: void;  // No payload needed
  uploadFile: { file: File; metadata?: object };
}

const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

function UserComponent() {
  const dispatch = useUserAction();

  // ✅ Type-safe dispatch calls
  const handleUpdate = () => {
    dispatch('updateProfile', {
      name: 'John Doe',
      email: 'john@example.com'
    }); // ✅ Correct payload type

    // dispatch('updateProfile', { invalid: true }); // ❌ Type error!
  };

  const handleReset = () => {
    dispatch('resetState'); // ✅ No payload required
  };

  return <button onClick={handleUpdate}>Update Profile</button>;
}
```

## 🔧 Action Handler Type Inference

Action handlers automatically infer payload types from your action interface:

```typescript
function UserLogic({ children }) {
  const userStore = useUserStore('profile');

  // ✅ Payload type automatically inferred as { name: string; email: string }
  useUserActionHandler('updateProfile', useCallback(async (payload, controller) => {
    // payload.name    ✅ string
    // payload.email   ✅ string
    // payload.invalid ❌ Property doesn't exist

    const currentProfile = userStore.getValue();
    const updatedProfile = {
      ...currentProfile,
      name: payload.name,
      email: payload.email
    };

    userStore.setValue(updatedProfile);
  }, [userStore]));

  // ✅ Void payload type - no payload parameter needed
  useUserActionHandler('resetState', useCallback(async (payload, controller) => {
    // payload is void - can be omitted or used as undefined
    userStore.setValue({ name: '', email: '', isLoggedIn: false });
  }, [userStore]));

  return children;
}
```

## 🏗️ Complex Action Payload Types

### Union Types and Discriminated Unions

```typescript
interface AppActions {
  // Union payload types
  updateSetting: { key: 'theme'; value: 'light' | 'dark' } | { key: 'language'; value: 'en' | 'ko' };

  // Discriminated union with status
  handleApiResponse:
    | { status: 'loading' }
    | { status: 'success'; data: User[] }
    | { status: 'error'; error: string };
}

const { useActionHandler } = createActionContext<AppActions>('App');

function AppLogic() {
  useActionHandler('updateSetting', useCallback(async (payload) => {
    // ✅ Type narrowing works
    if (payload.key === 'theme') {
      // payload.value is 'light' | 'dark'
      console.log('Theme:', payload.value);
    } else if (payload.key === 'language') {
      // payload.value is 'en' | 'ko'
      console.log('Language:', payload.value);
    }
  }, []));

  useActionHandler('handleApiResponse', useCallback(async (payload) => {
    // ✅ Discriminated union type narrowing
    switch (payload.status) {
      case 'loading':
        // payload: { status: 'loading' }
        break;
      case 'success':
        // payload: { status: 'success'; data: User[] }
        console.log('Users:', payload.data.length);
        break;
      case 'error':
        // payload: { status: 'error'; error: string }
        console.log('Error:', payload.error);
        break;
    }
  }, []));
}
```

### Generic Action Payloads

```typescript
interface DataActions<T = any> {
  loadData: { id: string; params?: Record<string, unknown> };
  saveData: { data: T; validate?: boolean };
  deleteData: { id: string };
}

// ✅ Specific data type
interface User {
  id: string;
  name: string;
  email: string;
}

type UserDataActions = DataActions<User>;

const { useActionDispatch, useActionHandler } = createActionContext<UserDataActions>('UserData');

function UserDataComponent() {
  const dispatch = useActionDispatch();

  const handleSave = (user: User) => {
    // ✅ data is typed as User
    dispatch('saveData', {
      data: user,        // Type: User
      validate: true
    });
  };

  useActionHandler('saveData', useCallback(async (payload) => {
    // payload.data is strongly typed as User
    const user = payload.data; // Type: User
    console.log('Saving user:', user.name, user.email);
  }, []));
}
```

## 🔍 Advanced Action Type Patterns

### Conditional Action Types

```typescript
interface ConditionalActions {
  // Different payload based on mode
  processData: Mode extends 'sync' ? { data: string } : { data: string; callback: () => void };
}

type Mode = 'sync' | 'async';

// Type-safe conditional dispatch
function processWithMode<M extends Mode>(mode: M, data: string, callback?: () => void) {
  const payload = mode === 'sync'
    ? { data }
    : { data, callback: callback! };

  dispatch('processData', payload);
}
```

### Branded Action Types

```typescript
import { TypeUtils } from '@context-action/core';

type UserId = TypeUtils.Brand<string, 'UserId'>;
type PostId = TypeUtils.Brand<string, 'PostId'>;

interface BrandedActions {
  updateUser: { userId: UserId; name: string };
  deletePost: { postId: PostId };
  linkUserToPost: { userId: UserId; postId: PostId };
}

const createUserId = (id: string): UserId => id as UserId;
const createPostId = (id: string): PostId => id as PostId;

function BrandedComponent() {
  const dispatch = useActionDispatch();

  const handleUpdate = () => {
    const userId = createUserId('user-123');

    dispatch('updateUser', {
      userId,           // ✅ Branded type
      name: 'John Doe'
    });

    // dispatch('updateUser', {
    //   userId: 'user-123',  // ❌ Type error! Raw string not allowed
    //   name: 'John Doe'
    // });
  };
}
```

## 🎨 Action Result Type Inference

### Handler Return Types

```typescript
interface ResultActions {
  calculateTotal: { items: number[] };
  validateForm: { formData: FormData };
  fetchUser: { userId: string };
}

function ResultLogic() {
  // ✅ Return type inferred from handler
  useActionHandler('calculateTotal', useCallback(async (payload) => {
    const total = payload.items.reduce((sum, item) => sum + item, 0);
    return { total, count: payload.items.length }; // Return type inferred
  }, []));

  useActionHandler('validateForm', useCallback(async (payload) => {
    const errors: string[] = [];
    // Validation logic...
    return { isValid: errors.length === 0, errors }; // Return type inferred
  }, []));

  useActionHandler('fetchUser', useCallback(async (payload) => {
    const user = await api.fetchUser(payload.userId);
    return user; // Return type: User | undefined
  }, []));
}

function ResultComponent() {
  const dispatch = useActionDispatch();

  const handleCalculate = async () => {
    // ✅ Result type inferred from handler return
    const result = await dispatch('calculateTotal', { items: [1, 2, 3] });

    if (result) {
      console.log('Total:', result.total);   // ✅ Type: number
      console.log('Count:', result.count);   // ✅ Type: number
    }
  };
}
```

### Result Strategy Types

```typescript
import { TypeUtils } from '@context-action/core';

interface StrategyActions {
  multiStep: { steps: string[] };
}

function StrategyLogic() {
  // Multiple handlers for same action
  useActionHandler('multiStep', useCallback(async (payload) => {
    return { step: 1, result: 'first' };
  }, []), { priority: 1 });

  useActionHandler('multiStep', useCallback(async (payload) => {
    return { step: 2, result: 'second' };
  }, []), { priority: 2 });
}

function StrategyComponent() {
  const dispatch = useActionDispatch();

  const handleMultiStep = async () => {
    // ✅ Result type based on strategy
    const results = await dispatch('multiStep',
      { steps: ['a', 'b'] },
      { result: { strategy: 'all' } }
    );

    // results is array of handler returns
    results?.forEach(result => {
      console.log('Step:', result.step);    // ✅ Type: number
      console.log('Result:', result.result); // ✅ Type: string
    });
  };
}
```

## 🚨 Common Action Type Issues and Solutions

### Issue 1: Payload Type Widening

```typescript
// ❌ Problem: Type widening in dispatch calls
const actionType = 'updateUser'; // Type becomes string
const payload = { name: 'John' }; // Type becomes { name: string }

dispatch(actionType, payload); // ❌ Type error!

// ✅ Solution: Use const assertion or explicit typing
const actionType = 'updateUser' as const;
const payload = { name: 'John' } as const;

dispatch(actionType, payload); // ✅ Works correctly

// Or use explicit typing
dispatch('updateUser' as keyof UserActions, payload);
```

### Issue 2: Handler Registration Timing

```typescript
// ❌ Problem: Handler registered after dispatch
function BadComponent() {
  const dispatch = useActionDispatch();

  useEffect(() => {
    dispatch('updateUser', { name: 'John' }); // Handler not ready yet!
  }, []);

  useActionHandler('updateUser', handler); // Registered too late
}

// ✅ Solution: Register handlers in parent component
function GoodSetup({ children }) {
  useActionHandler('updateUser', handler); // Register early
  return children;
}

function GoodComponent() {
  const dispatch = useActionDispatch();

  useEffect(() => {
    dispatch('updateUser', { name: 'John' }); // ✅ Handler ready
  }, []);
}
```

### Issue 3: Generic Action Constraints

```typescript
// ❌ Problem: Loose generic constraints
interface BadActions<T> {
  process: T; // Any type allowed
}

// ✅ Solution: Proper constraints
interface GoodActions<T extends Record<string, unknown>> {
  process: T; // Object types only
}

// ✅ Better: Specific constraints
interface SpecificActions<T extends { id: string }> {
  process: T; // Must have id field
}
```

## 🔗 Related Sections

- [Store Type Inference](./stores.md) - Learn about store typing
- [Advanced Type Features](./advanced.md) - Explore branded types and utilities
- [Best Practices](./best-practices.md) - Type safety recommendations

---

**Next**: Learn about [Advanced Type Features](./advanced.md)