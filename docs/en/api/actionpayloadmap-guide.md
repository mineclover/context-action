# ActionPayloadMap Interface Guide

Type-safe action payload mapping for Context-Action framework.

## Purpose
Foundation interface for defining action names and their corresponding payload types.

## Structure
```typescript
interface ActionPayloadMap {
  [actionName: string]: unknown
}
```

## Usage Patterns

### Basic Action Definitions
```typescript
interface MyActions extends ActionPayloadMap {
  // Action with object payload
  updateUser: { id: string; name: string; email: string };
  
  // Action with primitive payload
  setCount: number;
  
  // Action with no payload
  reset: void;
  
  // Action with union type payload
  showNotification: { type: 'success'; message: string } | { type: 'error'; error: Error };
}
```

### Complex Payload Structures
```typescript
interface AppActions extends ActionPayloadMap {
  // Nested objects
  updateSettings: {
    ui: { theme: 'light' | 'dark'; language: string };
    notifications: { email: boolean; push: boolean };
  };
  
  // Arrays
  updateItems: Array<{ id: string; value: any }>;
  
  // Optional properties  
  saveData: { data: any; options?: { compress: boolean; encrypt: boolean } };
  
  // Generic payloads
  apiCall: { endpoint: string; method: 'GET' | 'POST'; body?: any };
}
```

### Void Actions
```typescript
interface SystemActions extends ActionPayloadMap {
  // Actions without payload
  logout: void;
  refresh: void;
  clearCache: void;
  
  // Mix with payload actions
  login: { username: string; password: string };
  initialize: { config: AppConfig };
}
```

## Extension Patterns

### Interface Inheritance
```typescript
// Base actions
interface BaseActions extends ActionPayloadMap {
  log: { level: 'info' | 'warn' | 'error'; message: string };
  track: { event: string; data?: any };
}

// Extended actions
interface UserActions extends BaseActions {
  updateProfile: { name: string; email: string };
  changePassword: { oldPassword: string; newPassword: string };
}

// Usage with ActionRegister
const register = new ActionRegister<UserActions>();
register.register('log', handler);        // Base action
register.register('updateProfile', handler); // Extended action
```

### Module Composition
```typescript
// Authentication module
interface AuthActions extends ActionPayloadMap {
  login: { credentials: LoginCredentials };
  logout: void;
  refreshToken: { token: string };
}

// UI module  
interface UIActions extends ActionPayloadMap {
  showModal: { type: string; props?: any };
  hideModal: void;
  setTheme: { theme: 'light' | 'dark' };
}

// Combined application actions
interface AppActions extends AuthActions, UIActions {
  // App-specific actions
  initialize: { config: AppConfig };
  shutdown: void;
}
```

## Type Safety Benefits

### Compile-Time Validation
```typescript
interface TypedActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  deleteUser: { id: string };
}

const register = new ActionRegister<TypedActions>();

// ✅ Valid - correct payload type
register.dispatch('updateUser', { id: '123', name: 'John' });

// ❌ TypeScript error - missing required property
register.dispatch('updateUser', { id: '123' }); 

// ❌ TypeScript error - wrong payload type  
register.dispatch('deleteUser', { name: 'John' });

// ❌ TypeScript error - unknown action
register.dispatch('unknownAction', {});
```

### Handler Type Inference
```typescript
register.register('updateUser', (payload, controller) => {
  // payload is automatically typed as { id: string; name: string }
  console.log(payload.id);   // ✅ TypeScript knows this exists
  console.log(payload.name); // ✅ TypeScript knows this exists
  console.log(payload.age);  // ❌ TypeScript error - property doesn't exist
});
```

## Best Practices

### Naming Conventions
```typescript
interface AppActions extends ActionPayloadMap {
  // Use verb-noun pattern
  updateUser: UserData;
  deleteUser: { id: string };
  createPost: PostData;
  
  // Use present tense for events
  userUpdated: { user: User; timestamp: Date };
  postCreated: { post: Post; author: User };
  
  // Use imperative for commands
  showNotification: NotificationData;
  hideModal: void;
  saveToStorage: { key: string; value: any };
}
```

### Payload Design
```typescript
interface WellDesignedActions extends ActionPayloadMap {
  // ✅ Specific, descriptive payloads
  updateUserProfile: { 
    userId: string; 
    updates: Partial<UserProfile>; 
    metadata: { source: string; timestamp: Date } 
  };
  
  // ❌ Avoid generic, unclear payloads  
  doSomething: { data: any; type: string };
  
  // ✅ Use discriminated unions for variants
  handleApiResponse: 
    | { status: 'success'; data: any }
    | { status: 'error'; error: Error }
    | { status: 'loading' };
}
```

### Modular Organization
```typescript
// Separate by domain/feature
interface UserActions extends ActionPayloadMap {
  loginUser: LoginCredentials;
  logoutUser: void;
  updateUserProfile: UserProfileUpdate;
}

interface ProductActions extends ActionPayloadMap {
  addProduct: ProductData;
  removeProduct: { id: string };
  updateProduct: { id: string; updates: Partial<ProductData> };
}

// Combine in main app
interface AppActions extends UserActions, ProductActions {
  initializeApp: { config: AppConfig };
}
```

## Integration

- **ActionRegister**: Type parameter for pipeline type safety
- **createActionContext**: React integration with typed actions  
- **Handler Registration**: Automatic payload type inference
- **Dispatch Operations**: Compile-time payload validation

## Links

- **TypeDoc**: [ActionPayloadMap.md](./core/src/interfaces/ActionPayloadMap.md)
- **Type System Guide**: [Action Type System](/en/guide/patterns/action/type-system)
- **Usage Examples**: [Action Examples](/en/examples/action-only)