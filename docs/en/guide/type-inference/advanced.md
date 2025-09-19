# Advanced Type Features

Explore advanced TypeScript features and utilities available in Context-Action for enhanced type safety.

## 🏷️ Branded Types

### Basic Branded Types

Branded types provide nominal typing for enhanced type safety:

```typescript
import { TypeUtils } from '@context-action/core';

// ✅ Create branded types for domain safety
type UserId = TypeUtils.Brand<string, 'UserId'>;
type ProductId = TypeUtils.Brand<string, 'ProductId'>;
type EmailAddress = TypeUtils.Brand<string, 'EmailAddress'>;

// ✅ Type-safe constructors
const createUserId = (id: string): UserId => id as UserId;
const createProductId = (id: string): ProductId => id as ProductId;
const createEmail = (email: string): EmailAddress => {
  if (!email.includes('@')) {
    throw new Error('Invalid email format');
  }
  return email as EmailAddress;
};

// ✅ Use in store and action definitions
interface EcommerceStores {
  currentUser: { id: UserId; name: string };
  cart: { productId: ProductId; quantity: number }[];
  notifications: { email: EmailAddress; message: string }[];
}

interface EcommerceActions {
  loadUser: { userId: UserId };
  addToCart: { productId: ProductId; quantity: number };
  sendNotification: { email: EmailAddress; message: string };
}
```

### Branded Type Safety in Practice

```typescript
function EcommerceComponent() {
  const dispatch = useActionDispatch();

  const handleAddToCart = () => {
    const productId = createProductId('prod-123');
    const userId = createUserId('user-456');

    // ✅ Type-safe branded type usage
    dispatch('addToCart', {
      productId,      // Type: ProductId
      quantity: 1
    });

    dispatch('loadUser', {
      userId          // Type: UserId
    });

    // ❌ Type error: cannot mix branded types
    // dispatch('loadUser', { userId: productId }); // Type error!

    // ❌ Type error: raw strings not allowed
    // dispatch('loadUser', { userId: 'user-456' }); // Type error!
  };
}
```

### Advanced Branded Type Patterns

```typescript
// ✅ Branded types with constraints
type PositiveNumber = TypeUtils.Brand<number, 'PositiveNumber'>;
type ValidatedString = TypeUtils.Brand<string, 'ValidatedString'>;

const createPositiveNumber = (n: number): PositiveNumber => {
  if (n <= 0) throw new Error('Number must be positive');
  return n as PositiveNumber;
};

const createValidatedString = (s: string): ValidatedString => {
  if (s.length < 3) throw new Error('String too short');
  return s as ValidatedString;
};

// ✅ Branded enums
type OrderStatus = TypeUtils.Brand<'pending' | 'confirmed' | 'shipped' | 'delivered', 'OrderStatus'>;
const OrderStatus = {
  PENDING: 'pending' as OrderStatus,
  CONFIRMED: 'confirmed' as OrderStatus,
  SHIPPED: 'shipped' as OrderStatus,
  DELIVERED: 'delivered' as OrderStatus
} as const;

interface OrderActions {
  updateOrderStatus: { orderId: string; status: OrderStatus };
}
```

## 🔧 Type Utilities

### Core TypeUtils Namespace

```typescript
import { TypeUtils } from '@context-action/core';

// ✅ Deep readonly for immutable structures
type AppState = {
  user: { name: string; settings: { theme: string } };
  posts: { id: string; title: string }[];
};

type ImmutableAppState = TypeUtils.DeepReadonly<AppState>;
// Result: {
//   readonly user: {
//     readonly name: string;
//     readonly settings: {
//       readonly theme: string;
//     };
//   };
//   readonly posts: readonly {
//     readonly id: string;
//     readonly title: string;
//   }[];
// }

// ✅ Require specific fields
type UserWithRequiredEmail = TypeUtils.RequireFields<User, 'email'>;
// Makes 'email' field required even if optional in original type

// ✅ Extract keys of specific types
interface MixedState {
  name: string;
  age: number;
  hobbies: string[];
  settings: object;
  isActive: boolean;
}

type StringKeys = TypeUtils.KeysOfType<MixedState, string>;     // 'name'
type NumberKeys = TypeUtils.KeysOfType<MixedState, number>;     // 'age'
type ArrayKeys = TypeUtils.KeysOfType<MixedState, unknown[]>;   // 'hobbies'
type ObjectKeys = TypeUtils.KeysOfType<MixedState, object>;     // 'settings'
```

### Advanced Type Manipulation

```typescript
// ✅ Conditional type helpers
type ConditionalStores<T> = {
  [K in keyof T]: T[K] extends string
    ? Store<T[K]>
    : T[K] extends number
      ? Store<T[K]>
      : T[K] extends boolean
        ? Store<T[K]>
        : never;
};

// ✅ Function type extraction
type ExtractActionPayload<T> = T extends (payload: infer P) => any ? P : never;

// Example usage
type UpdateUserHandler = (payload: { name: string; email: string }) => Promise<void>;
type UpdateUserPayload = ExtractActionPayload<UpdateUserHandler>; // { name: string; email: string }

// ✅ Result type inference
type InferHandlerResult<T> = T extends (...args: any[]) => infer R ? R : never;

type AsyncHandler = () => Promise<{ success: boolean; data: User[] }>;
type HandlerResult = InferHandlerResult<AsyncHandler>; // Promise<{ success: boolean; data: User[] }>
```

## 🎯 Result Strategy Type Inference

### Advanced Result Processing

```typescript
import { TypeUtils } from '@context-action/core';

// ✅ Result strategy type definitions
type ResultStrategy = 'first' | 'last' | 'all' | 'race';

interface AdvancedActions {
  processData: { input: string };
  validateForm: { formData: FormData };
}

// ✅ Multiple handlers with different return types
function AdvancedLogic() {
  useActionHandler('processData', async (payload) => {
    return { step: 'validation', isValid: true };
  }, { priority: 1 });

  useActionHandler('processData', async (payload) => {
    return { step: 'processing', result: payload.input.toUpperCase() };
  }, { priority: 2 });

  useActionHandler('processData', async (payload) => {
    return { step: 'completion', timestamp: Date.now() };
  }, { priority: 3 });
}

function AdvancedComponent() {
  const dispatch = useActionDispatch();

  const handleProcessData = async () => {
    // ✅ Different result types based on strategy

    // Strategy: 'first' - returns first handler result
    const firstResult = await dispatch('processData',
      { input: 'hello' },
      { result: { strategy: 'first' } }
    );
    // Type: { step: 'validation', isValid: true } | undefined

    // Strategy: 'all' - returns array of all results
    const allResults = await dispatch('processData',
      { input: 'hello' },
      { result: { strategy: 'all' } }
    );
    // Type: Array<{ step: string, [key: string]: any }> | undefined

    // Strategy: 'last' - returns last handler result
    const lastResult = await dispatch('processData',
      { input: 'hello' },
      { result: { strategy: 'last' } }
    );
    // Type: { step: 'completion', timestamp: number } | undefined
  };
}
```

### Custom Result Type Inference

```typescript
// ✅ Advanced result type mapping
type ResultMap<T extends Record<string, any>, S extends ResultStrategy> = {
  first: T[keyof T] | undefined;
  last: T[keyof T] | undefined;
  all: Array<T[keyof T]> | undefined;
  race: T[keyof T] | undefined;
}[S];

// ✅ Handler-specific result types
interface TypedHandlers {
  calculate: () => Promise<{ total: number; items: number }>;
  validate: () => Promise<{ isValid: boolean; errors: string[] }>;
  process: () => Promise<{ data: ProcessedData; metadata: object }>;
}

type HandlerResults<K extends keyof TypedHandlers> =
  TypedHandlers[K] extends (...args: any[]) => Promise<infer R> ? R : never;

// Example usage
type CalculateResult = HandlerResults<'calculate'>; // { total: number; items: number }
type ValidateResult = HandlerResults<'validate'>;   // { isValid: boolean; errors: string[] }
```

## 🔍 Type Guards and Runtime Validation

### Custom Type Guards

```typescript
// ✅ Runtime type validation with type guards
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as User).id === 'string' &&
    typeof (value as User).name === 'string' &&
    typeof (value as User).email === 'string'
  );
}

function isUserId(value: unknown): value is UserId {
  return typeof value === 'string' && value.startsWith('user-');
}

// ✅ Type-safe store validation
const { Provider, useStore } = createStoreContext('ValidatedApp', {
  currentUser: {
    initialValue: null as User | null,
    validator: (value: unknown): value is User | null => {
      return value === null || isUser(value);
    }
  },
  userIds: {
    initialValue: [] as UserId[],
    validator: (value: unknown): value is UserId[] => {
      return Array.isArray(value) && value.every(isUserId);
    }
  }
});
```

### Integration with Action Handlers

```typescript
function ValidatedLogic() {
  const userStore = useStore('currentUser');

  useActionHandler('updateUser', async (payload, controller) => {
    // ✅ Runtime validation with type narrowing
    if (!isUser(payload.userData)) {
      controller.abort('Invalid user data provided');
      return;
    }

    // ✅ TypeScript knows payload.userData is User
    userStore.setValue(payload.userData);
  });

  useActionHandler('addUserIds', async (payload, controller) => {
    // ✅ Validate array of branded types
    if (!Array.isArray(payload.ids) || !payload.ids.every(isUserId)) {
      controller.abort('Invalid user IDs provided');
      return;
    }

    // ✅ TypeScript knows payload.ids is UserId[]
    const currentIds = userStore.getValue();
    userStore.setValue([...currentIds, ...payload.ids]);
  });
}
```

## 🎨 Template Literal Types

### Dynamic Action Types

```typescript
// ✅ Template literal types for dynamic actions
type CRUDAction = 'create' | 'read' | 'update' | 'delete';
type EntityType = 'user' | 'post' | 'comment';

type EntityActions<E extends EntityType> = {
  [K in CRUDAction as `${K}${Capitalize<E>}`]: {
    id: string;
    data?: any;
  };
};

// ✅ Generated action types
type UserActions = EntityActions<'user'>;
// Result: {
//   createUser: { id: string; data?: any };
//   readUser: { id: string; data?: any };
//   updateUser: { id: string; data?: any };
//   deleteUser: { id: string; data?: any };
// }

type PostActions = EntityActions<'post'>;
// Result: createPost, readPost, updatePost, deletePost

// ✅ Combine multiple entity actions
type AllEntityActions = UserActions & PostActions & EntityActions<'comment'>;
```

### Event-based Action Types

```typescript
// ✅ Event-driven action typing
type EventType = 'click' | 'hover' | 'focus' | 'blur';
type ElementType = 'button' | 'input' | 'link';

type UIEventActions = {
  [E in EventType as `on${Capitalize<E>}`]: {
    element: ElementType;
    target: HTMLElement;
    timestamp: number;
  };
};

// Result: {
//   onClick: { element: ElementType; target: HTMLElement; timestamp: number };
//   onHover: { element: ElementType; target: HTMLElement; timestamp: number };
//   onFocus: { element: ElementType; target: HTMLElement; timestamp: number };
//   onBlur: { element: ElementType; target: HTMLElement; timestamp: number };
// }
```

## 🚨 Advanced Type Safety Patterns

### Exhaustive Type Checking

```typescript
// ✅ Ensure exhaustive handling with never type
function handleOrderStatus(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PENDING:
      return 'Order is pending';
    case OrderStatus.CONFIRMED:
      return 'Order confirmed';
    case OrderStatus.SHIPPED:
      return 'Order shipped';
    case OrderStatus.DELIVERED:
      return 'Order delivered';
    default:
      // ✅ TypeScript error if new status added but not handled
      const _exhaustive: never = status;
      throw new Error(`Unhandled order status: ${_exhaustive}`);
  }
}
```

### Conditional Store Types

```typescript
// ✅ Different store configurations based on environment
type Environment = 'development' | 'production';

type ConditionalStores<E extends Environment> = {
  user: User;
  settings: AppSettings;
} & (E extends 'development' ? {
  debug: DebugInfo;
  mockData: MockDataSet;
} : {
  analytics: AnalyticsData;
});

// ✅ Environment-specific store creation
function createAppStores<E extends Environment>(env: E) {
  const baseStores = {
    user: { name: '', email: '' },
    settings: { theme: 'light' }
  };

  if (env === 'development') {
    return createStoreContext('App', {
      ...baseStores,
      debug: { enabled: true, level: 'verbose' },
      mockData: { users: [], posts: [] }
    } as ConditionalStores<E>);
  } else {
    return createStoreContext('App', {
      ...baseStores,
      analytics: { events: [], sessions: [] }
    } as ConditionalStores<E>);
  }
}
```

## 🔗 Related Sections

- [Store Type Inference](./stores.md) - Learn about store typing fundamentals
- [Action Type Inference](./actions.md) - Master action payload typing
- [Best Practices](./best-practices.md) - Type safety recommendations

---

**Next**: Learn about [Type Safety Best Practices](./best-practices.md)