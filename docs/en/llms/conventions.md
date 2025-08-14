# Context-Action Conventions

This document outlines coding conventions, best practices, and patterns for the Context-Action framework to ensure consistency and maintainability.

## Code Style Conventions

### TypeScript Style

#### Interface Naming
```typescript
// Action interfaces must extend ActionPayloadMap
interface UserActions extends ActionPayloadMap {
  login: { username: string; password: string };
  logout: void;
}

// Store configuration uses descriptive names
interface UserStoreConfig {
  profile: UserProfile;
  preferences: UserPreferences;
}

// Component props use descriptive suffixes
interface UserProfileProps {
  className?: string;
  onUpdate?: (user: User) => void;
}
```

#### Type Definitions
```typescript
// Use specific types over any
type Theme = 'light' | 'dark';
type Language = 'en' | 'es' | 'fr' | 'de';

// Use void for actions without payload
interface AppActions extends ActionPayloadMap {
  initialize: void;        // ✅ Correct
  initialize: undefined;   // ❌ Avoid
  initialize: {};          // ❌ Avoid
}

// Optional properties in action payloads
interface UpdateUserAction {
  id: string;              // Required
  name?: string;           // Optional
  email?: string;          // Optional
}
```

#### Import Organization
```typescript
// 1. External libraries
import React, { useCallback, useEffect } from 'react';
import { z } from 'zod';

// 2. Internal framework imports
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';
import { createActionContext, useStoreValue } from '@context-action/react';

// 3. Local imports
import type { UserActions } from '../types/actions';
import { validateUser } from '../utils/validation';
import { UserComponent } from './UserComponent';
```

### Component Conventions

#### Action Context Creation
```typescript
// Use descriptive variable names with renaming
const {
  Provider: UserActionProvider,        // ✅ Clear purpose
  useActionDispatch: useUserAction,    // ✅ Domain-specific
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('UserActions');

// Avoid generic names
const { Provider, useActionDispatch } = createActionContext<UserActions>(); // ❌
```

#### Store Pattern Creation
```typescript
// Use descriptive names with domain prefix
const {
  Provider: UserStoreProvider,
  useStore: useUserStore,
  useStoreManager: useUserStoreManager,
  withProvider: withUserStoreProvider
} = createDeclarativeStorePattern('User', userStoreConfig);
```

#### Handler Component Structure
```typescript
// Handler components should be separate and focused
export function UserActionHandlers() {
  const dispatch = useUserAction();
  const userStore = useAppStore('user');
  
  // One handler per action, with clear priority and ID
  useUserActionHandler('login', useCallback(async (payload, controller) => {
    // Handler logic
  }, [dispatch, userStore]), { 
    priority: 100, 
    id: 'login-handler' 
  });
  
  return null; // Handler components don't render UI
}
```

## File Organization

### Directory Structure
```
src/
├── contexts/
│   ├── actions/          # Action context definitions
│   │   ├── UserActions.tsx
│   │   ├── SystemActions.tsx
│   │   └── index.ts
│   └── stores/           # Store pattern definitions
│       ├── UserStores.tsx
│       ├── AppStores.tsx
│       └── index.ts
├── components/
│   ├── handlers/         # Action handler components
│   │   ├── UserHandlers.tsx
│   │   └── SystemHandlers.tsx
│   ├── ui/              # Pure UI components
│   │   ├── UserProfile.tsx
│   │   └── Dashboard.tsx
│   └── App.tsx
├── types/               # TypeScript definitions
│   ├── actions.ts
│   ├── stores.ts
│   └── common.ts
├── utils/              # Utility functions
│   ├── validation.ts
│   └── helpers.ts
└── hooks/              # Custom React hooks
    ├── usePersistence.ts
    └── useAuth.ts
```

### File Naming
- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (`useUserAuth.ts`)
- **Types**: camelCase (`userActions.ts`) 
- **Utilities**: camelCase (`userValidation.ts`)
- **Contexts**: PascalCase with suffix (`UserStores.tsx`, `UserActions.tsx`)

## Handler Conventions

### Priority Guidelines
```typescript
// Priority ranges for different handler types
const PRIORITIES = {
  VALIDATION: 100,        // Input validation, security checks
  RATE_LIMITING: 90,      // Rate limiting, throttling
  AUTH_CHECK: 80,         // Authentication verification
  BUSINESS_LOGIC: 70,     // Core business logic
  SIDE_EFFECTS: 60,       // API calls, external services
  ANALYTICS: 50,          // Event tracking, analytics
  CLEANUP: 40,            // Cleanup operations
  LOGGING: 30,            // Audit logging
  NOTIFICATIONS: 20       // User notifications
} as const;

// Example usage
useActionHandler('processOrder', handler, { 
  priority: PRIORITIES.VALIDATION,
  id: 'order-validator' 
});
```

### Handler Error Patterns
```typescript
// Critical failures - use abort
useActionHandler('authenticate', async (payload, controller) => {
  if (!payload.credentials) {
    controller.abort('Missing credentials'); // ✅ Critical failure
    return;
  }
});

// Non-critical failures - return error and continue
useActionHandler('sendEmail', async (payload, controller) => {
  try {
    await emailService.send(payload.email);
    return { sent: true };
  } catch (error) {
    // ✅ Return error, let other handlers try fallback
    return { sent: false, error: (error as Error).message };
  }
});
```

### Payload Modification
```typescript
// Add metadata early in pipeline
useActionHandler('trackEvent', (payload, controller) => {
  controller.modifyPayload(current => ({
    ...current,
    timestamp: Date.now(),
    sessionId: getSessionId(),
    userId: getCurrentUserId()
  }));
}, { priority: PRIORITIES.VALIDATION });
```

## Store Conventions

### Store Configuration Patterns
```typescript
// Direct value configuration (simple)
const storeConfig = {
  user: { name: '', email: '' },           // ✅ Direct value
  settings: { theme: 'light' }             // ✅ Simple object
};

// Configuration object (complex)
const storeConfig = {
  analytics: {
    initialValue: { events: [] },          // ✅ Complex initial state
    validator: (value) => Array.isArray(value.events), // ✅ Validation
    derived: {                             // ✅ Computed properties
      eventCount: (analytics) => analytics.events.length
    }
  }
};
```

### Store Update Patterns
```typescript
// Prefer update() for partial changes
store.update(current => ({
  ...current,
  name: 'New Name'        // ✅ Partial update
}));

// Use setValue() for complete replacement
store.setValue({
  name: 'New Name',
  email: 'new@email.com'  // ✅ Complete replacement
});

// Avoid direct mutation
const current = store.getValue();
current.name = 'New Name'; // ❌ Don't mutate directly
store.setValue(current);   // ❌ This won't trigger updates
```

### Reactive Subscription Guidelines
```typescript
function UserComponent() {
  const userStore = useAppStore('user');
  
  // ✅ Reactive subscription (recommended)
  const user = useStoreValue(userStore);
  
  // ❌ Direct access (not reactive)
  const user = userStore.getValue();
  
  return <div>{user.name}</div>;
}
```

## Testing Conventions

### Unit Test Structure
```typescript
// Test file naming: *.test.ts or *.spec.ts
describe('ActionRegister', () => {
  let actionRegister: ActionRegister<TestActions>;
  
  beforeEach(() => {
    actionRegister = new ActionRegister<TestActions>();
  });
  
  describe('register', () => {
    it('should register handler with default priority', () => {
      // Test implementation
    });
  });
});
```

### Handler Testing
```typescript
// Test handlers independently
it('should handle login action', async () => {
  const mockController = createMockController();
  const handler = createLoginHandler();
  
  const result = await handler({ username: 'test', password: 'pass' }, mockController);
  
  expect(result).toEqual({ success: true, user: expect.any(Object) });
  expect(mockController.setResult).toHaveBeenCalled();
});
```

### Store Testing
```typescript
// Test store reactivity
it('should update subscribers when store changes', () => {
  const { result } = renderHook(() => {
    const userStore = useUserStore('profile');
    return useStoreValue(userStore);
  });
  
  act(() => {
    const userStore = useUserStore('profile');
    userStore.setValue({ name: 'New Name', email: 'test@example.com' });
  });
  
  expect(result.current.name).toBe('New Name');
});
```

## Project Configuration

### Package.json Scripts
```json
{
  "scripts": {
    "build": "tsdown",
    "build:watch": "tsdown --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.{ts,tsx}",
    "type-check": "tsc --noEmit",
    "clean": "rimraf dist"
  }
}
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### ESLint Rules
```javascript
module.exports = {
  rules: {
    // Enforce useCallback for action handlers
    'react-hooks/exhaustive-deps': 'error',
    
    // Prefer const assertions for store configs
    'prefer-const': 'error',
    
    // Consistent import ordering
    'simple-import-sort/imports': 'error'
  }
};
```

## Documentation Conventions

### JSDoc Patterns
```typescript
/**
 * Handles user authentication with validation and error handling.
 * 
 * @param payload - Login credentials
 * @param controller - Pipeline controller for flow management
 * @returns Authentication result with user data
 * 
 * @example
 * ```typescript
 * useActionHandler('login', loginHandler, { priority: 100 });
 * ```
 */
async function loginHandler(
  payload: LoginPayload, 
  controller: PipelineController
): Promise<AuthResult> {
  // Implementation
}
```

### Code Comments
```typescript
// ✅ Explain business logic and complex operations
useActionHandler('processOrder', async (payload, controller) => {
  // Validate order data to prevent invalid processing
  if (!isValidOrder(payload.order)) {
    controller.abort('Invalid order data');
    return;
  }
  
  // Apply business rules for order processing
  const processedOrder = applyBusinessRules(payload.order);
  
  // Update inventory and send notifications
  await updateInventory(processedOrder);
  await sendOrderConfirmation(processedOrder);
});

// ❌ Avoid obvious comments
const user = store.getValue(); // Gets the user value
```

## Performance Guidelines

### Handler Performance
```typescript
// ✅ Use useCallback to prevent re-registration
const handler = useCallback(async (payload, controller) => {
  // Handler logic
}, [dependency1, dependency2]);

// ✅ Minimize dependencies in useCallback
const handler = useCallback(async (payload, controller) => {
  const store = stores.getStore('user'); // Get store inside handler
  // Handler logic
}, []); // Empty dependency array
```

### Store Performance
```typescript
// ✅ Use derived state for computations
const config = {
  analytics: {
    initialValue: { events: [] },
    derived: {
      eventCount: (analytics) => analytics.events.length // ✅ Computed
    }
  }
};

// ❌ Avoid expensive computations in components
function Component() {
  const analytics = useStoreValue(analyticsStore);
  const eventCount = analytics.events.length; // ❌ Recomputed on every render
}
```

## Naming Conventions

### Variable Naming
```typescript
// Use descriptive names
const userActionHandler = useCallback(...);     // ✅ Clear purpose
const handler = useCallback(...);               // ❌ Too generic

// Store variables
const userStore = useAppStore('user');          // ✅ Domain + store
const profileStore = useUserStore('profile');   // ✅ Pattern + domain
const store = useAppStore('user');              // ❌ Too generic
```

### Action Naming
```typescript
interface UserActions extends ActionPayloadMap {
  // Use verb + noun pattern
  createUser: CreateUserPayload;        // ✅ Clear action
  updateProfile: UpdateProfilePayload;  // ✅ Specific operation
  delete: DeletePayload;                // ❌ Too generic
  user: UserPayload;                    // ❌ Not descriptive
}
```

### Store Key Naming
```typescript
const storeConfig = {
  // Use domain-specific keys
  userProfile: { name: '', email: '' },    // ✅ Clear domain
  uiState: { loading: false },             // ✅ Clear purpose
  data: { items: [] },                     // ❌ Too generic
  state: { value: null }                   // ❌ Too generic
};
```

## Error Handling Conventions

### Error Message Format
```typescript
// Use consistent error message format
controller.abort('Authentication failed: Invalid credentials');        // ✅
controller.abort('Validation error: Missing required field "email"');  // ✅
controller.abort('Failed');                                            // ❌ Not descriptive
```

### Error Context
```typescript
// Provide meaningful context for errors
dispatch('reportError', {
  error: error.message,
  context: {
    component: 'UserProfile',
    action: 'updateProfile',
    userId: user.id,
    timestamp: Date.now()
  }
}); // ✅ Rich context

dispatch('reportError', {
  error: error.message,
  context: {}
}); // ❌ No context
```

## Security Conventions

### Input Validation
```typescript
// Always validate inputs in high-priority handlers
useActionHandler('updateUser', async (payload, controller) => {
  // Validate all inputs
  if (!payload.id || typeof payload.id !== 'string') {
    controller.abort('Invalid user ID');
    return;
  }
  
  if (payload.email && !isValidEmail(payload.email)) {
    controller.abort('Invalid email format');
    return;
  }
  
  // Sanitize inputs
  const sanitizedPayload = {
    ...payload,
    name: sanitizeString(payload.name),
    bio: sanitizeString(payload.bio)
  };
  
  // Continue processing with sanitized data
}, { priority: PRIORITIES.VALIDATION });
```

### Authentication Checks
```typescript
// Check authentication in handlers that require it
useActionHandler('updateProfile', async (payload, controller) => {
  const user = userStore.getValue();
  
  if (!user.isAuthenticated) {
    controller.abort('Authentication required');
    return;
  }
  
  // Verify user owns the resource
  if (user.id !== payload.userId) {
    controller.abort('Unauthorized access');
    return;
  }
  
  // Continue with authorized operation
});
```

## Testing Conventions

### Test Organization
```typescript
// Group tests by functionality
describe('UserActionHandlers', () => {
  describe('login handler', () => {
    it('should authenticate valid credentials', async () => {});
    it('should reject invalid credentials', async () => {});
    it('should abort on missing credentials', async () => {});
  });
  
  describe('logout handler', () => {
    it('should clear user session', async () => {});
    it('should track logout event', async () => {});
  });
});
```

### Mock Patterns
```typescript
// Create reusable mock factories
const createMockController = (): PipelineController => ({
  abort: jest.fn(),
  return: jest.fn(),
  modifyPayload: jest.fn(),
  getPayload: jest.fn(() => ({})),
  setResult: jest.fn(),
  getResults: jest.fn(() => [])
});

const createMockStore = <T>(initialValue: T) => ({
  getValue: jest.fn(() => initialValue),
  setValue: jest.fn(),
  update: jest.fn()
});
```

## Documentation Conventions

### Component Documentation
```typescript
/**
 * UserProfile component displays and manages user profile information.
 * 
 * Uses Store Only pattern for state management and Action Only pattern
 * for user interactions and business logic.
 * 
 * @example
 * ```tsx
 * <UserStoreProvider>
 *   <UserActionProvider>
 *     <UserProfile />
 *   </UserActionProvider>
 * </UserStoreProvider>
 * ```
 */
export function UserProfile() {
  // Implementation
}
```

### Handler Documentation
```typescript
/**
 * Handles user login with comprehensive validation and error handling.
 * 
 * Pipeline stages:
 * 1. Input validation (abort on invalid)
 * 2. Rate limiting check
 * 3. Authentication with external service
 * 4. User data storage
 * 5. Analytics tracking
 * 
 * @priority 100 - Executes first in login pipeline
 * @throws Will abort pipeline if credentials are invalid
 */
const loginHandler = useCallback(async (payload, controller) => {
  // Implementation
}, [dependencies]);
```

## Git Conventions

### Commit Message Format
```
type(scope): description

feat(auth): add OAuth2 login handler with validation
fix(store): resolve race condition in store updates
docs(api): update ActionRegister documentation
test(handlers): add comprehensive login handler tests
refactor(core): simplify ActionRegister constructor
```

### Branch Naming
```
feature/oauth-authentication
fix/store-race-condition
docs/api-documentation-update
test/handler-coverage-improvement
```

## Build and Release Conventions

### Version Management
- Use semantic versioning (semver)
- Coordinate versions across packages
- Update CHANGELOG.md for all releases
- Tag releases with version numbers

### Build Output
```
dist/
├── index.js        # ESM build
├── index.cjs       # CommonJS build
├── index.d.ts      # TypeScript declarations
└── package.json    # Package metadata
```

## Common Patterns

### Provider Composition
```typescript
// ✅ Recommended: HOC pattern
const App = withUserStoreProvider(() => (
  <UserActionProvider>
    <SystemActionProvider>
      <AppContent />
    </SystemActionProvider>
  </UserActionProvider>
));

// ✅ Alternative: Manual composition
function App() {
  return (
    <UserStoreProvider>
      <UserActionProvider>
        <SystemActionProvider>
          <AppContent />
        </SystemActionProvider>
      </UserActionProvider>
    </UserStoreProvider>
  );
}
```

### Handler Component Organization
```typescript
// ✅ Separate handler components by domain
export function UserHandlers() {
  // All user-related action handlers
  return null;
}

export function SystemHandlers() {
  // All system-related action handlers  
  return null;
}

// ❌ Avoid mixing handlers in UI components
export function UserProfile() {
  useActionHandler('login', loginHandler); // ❌ Mixed concerns
  
  return <div>Profile UI</div>;
}
```

### Context Composition
```typescript
// ✅ Clean context organization
import { UserActionProvider, useUserAction } from './contexts/UserActions';
import { UserStoreProvider, useUserStore } from './contexts/UserStores';

// ✅ Consistent naming across contexts
const userDispatch = useUserAction();
const systemDispatch = useSystemAction();
const userStore = useUserStore('profile');
const appStore = useAppStore('settings');
```

These conventions ensure consistency, maintainability, and optimal performance when working with the Context-Action framework.