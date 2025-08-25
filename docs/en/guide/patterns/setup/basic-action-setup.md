# Basic Action Setup

Shared action context setup patterns for the Context-Action framework.

## Import
```typescript
import { createActionContext, ActionPayloadMap } from '@context-action/react';
```

## Type Definitions

### Common Action Patterns
```typescript
// Event Actions (UI interactions)
interface EventActions {
  userClick: { x: number; y: number };
  userHover: { elementId: string };
  analytics: { event: string; data: any };
  trackInteraction: { type: string; metadata?: Record<string, any> };
}

// CRUD Actions (Data operations)
interface CRUDActions {
  createItem: { data: any };
  updateItem: { id: string; data: Partial<any> };
  deleteItem: { id: string };
  refreshData: void;
}

// User Management Actions
interface UserActions {
  login: { email: string; password: string };
  logout: void;
  updateProfile: { name: string; email: string };
  changePassword: { currentPassword: string; newPassword: string };
}

// API Actions
interface APIActions {
  fetchData: { endpoint: string; params?: Record<string, any> };
  postData: { endpoint: string; data: any };
  uploadFile: { file: File; metadata?: any };
}

// Notification Actions
interface NotificationActions {
  showNotification: { message: string; type: 'success' | 'error' | 'warning' | 'info' };
  hideNotification: { id: string };
  clearAllNotifications: void;
}
```

### Extended Action Interface
```typescript
// For applications requiring ActionPayloadMap extension
interface AppActions extends ActionPayloadMap {
  // User management
  updateUser: { id: string; name: string; email: string };
  deleteUser: { id: string };
  
  // Data operations
  saveData: { data: any };
  loadData: { id: string };
  
  // UI state
  showModal: { modalType: string; data?: any };
  hideModal: { modalType: string };
  
  // No payload actions
  refreshAll: void;
  resetState: void;
}
```

## Context Creation Patterns

### Single Domain Context
```typescript
// Basic action context for a specific domain
const {
  Provider: EventActionProvider,
  useActionDispatch: useEventDispatch,
  useActionHandler: useEventHandler,
  useActionDispatchWithResult: useEventDispatchWithResult,
  useActionRegister: useEventRegister,
  useActionContext: useEventContext
} = createActionContext<EventActions>('Events');
```

### Multi-Domain Context Setup
```typescript
// User Domain Actions
const {
  Provider: UserActionProvider,
  useActionDispatch: useUserDispatch,
  useActionHandler: useUserHandler
} = createActionContext<UserActions>('User');

// API Domain Actions
const {
  Provider: APIActionProvider,
  useActionDispatch: useAPIDispatch,
  useActionHandler: useAPIHandler
} = createActionContext<APIActions>('API');

// Notification Domain Actions
const {
  Provider: NotificationActionProvider,
  useActionDispatch: useNotificationDispatch,
  useActionHandler: useNotificationHandler
} = createActionContext<NotificationActions>('Notifications');
```

## Provider Setup Patterns

### Single Provider Setup
```typescript
// Basic single action provider
function App() {
  return (
    <EventActionProvider>
      <AppContent />
    </EventActionProvider>
  );
}
```

### Multiple Provider Setup
```typescript
// Manual nesting approach
function App() {
  return (
    <UserActionProvider>
      <APIActionProvider>
        <NotificationActionProvider>
          <AppContent />
        </NotificationActionProvider>
      </APIActionProvider>
    </UserActionProvider>
  );
}

// Using composeProviders utility (recommended)
import { composeProviders } from '@context-action/react';

const ActionProviders = composeProviders([
  UserActionProvider,
  APIActionProvider,
  NotificationActionProvider
]);

function App() {
  return (
    <ActionProviders>
      <AppContent />
    </ActionProviders>
  );
}
```

### Conditional Provider Setup
```typescript
// Conditional action providers based on features
interface AppConfig {
  features: {
    analytics: boolean;
    notifications: boolean;
    userManagement: boolean;
  };
}

function AppWithConfig({ config }: { config: AppConfig }) {
  const providers = [];
  
  // Always include basic event actions
  providers.push(EventActionProvider);
  
  if (config.features.userManagement) {
    providers.push(UserActionProvider);
  }
  
  if (config.features.notifications) {
    providers.push(NotificationActionProvider);
  }
  
  if (config.features.analytics) {
    providers.push(APIActionProvider);
  }
  
  const ConditionalProviders = composeProviders(providers);
  
  return (
    <ConditionalProviders>
      <AppContent />
    </ConditionalProviders>
  );
}
```

## Export Patterns

### Named Exports (Recommended)
```typescript
// actions/EventActions.ts
export interface EventActions {
  userClick: { x: number; y: number };
  userHover: { elementId: string };
  analytics: { event: string; data: any };
}

export const {
  Provider: EventActionProvider,
  useActionDispatch: useEventDispatch,
  useActionHandler: useEventHandler,
  useActionDispatchWithResult: useEventDispatchWithResult,
  useActionRegister: useEventRegister
} = createActionContext<EventActions>('Events');

// Re-export for easy import
export {
  EventActionProvider,
  useEventDispatch,
  useEventHandler,
  useEventDispatchWithResult,
  useEventRegister
};
```

### Barrel Exports
```typescript
// actions/index.ts - Barrel export file
export * from './EventActions';
export * from './UserActions';
export * from './APIActions';
export * from './NotificationActions';

// Usage in components
import {
  useEventDispatch,
  useUserDispatch,
  useAPIDispatch
} from '../actions';
```

### Context Bundle Exports
```typescript
// actions/ActionContexts.ts - All contexts in one file
export const EventContext = createActionContext<EventActions>('Events');
export const UserContext = createActionContext<UserActions>('User');
export const APIContext = createActionContext<APIActions>('API');

// Usage
import { EventContext, UserContext } from '../actions/ActionContexts';

const EventDispatch = EventContext.useActionDispatch;
const UserDispatch = UserContext.useActionDispatch;
```

## Best Practices

### Type Organization
1. **Domain-Driven Types**: Group actions by business domain
2. **Consistent Naming**: Use consistent verb-noun patterns (createUser, updateUser, deleteUser)
3. **Payload Structure**: Use objects for complex data, primitives for simple values
4. **Void Actions**: Use `void` for actions without payload

### Context Naming
1. **Descriptive Names**: Use clear domain names ('User', 'Events', 'API')
2. **Hook Renaming**: Create domain-specific hook names for clarity
3. **Provider Naming**: Follow Provider suffix convention

### Provider Organization
1. **Logical Grouping**: Group related action providers together
2. **Feature Flags**: Use conditional providers for optional features
3. **Provider Composition**: Prefer `composeProviders` over manual nesting
4. **Performance**: Consider provider placement in component tree

## Common Patterns Reference

This setup file provides reusable patterns for:

- **[Action Basic Usage](../action/basic-usage.md)** - Uses EventActions pattern
- **[Dispatch Access Patterns](../action/dispatch-access.md)** - Uses AppActions pattern  
- **[Advanced Action Patterns](../action/advanced-patterns.md)** - Uses multiple domain patterns
- **[MVVM Architecture](../architecture/mvvm.md)** - Uses UserActions pattern
- **[Domain Context Architecture](../architecture/domain-context.md)** - Uses multi-domain patterns

## Related Setup Guides

- **[Basic Store Setup](./basic-store-setup.md)** - Store context setup patterns
- **[Multi-Context Setup](./multi-context-setup.md)** - Complex architecture setup
- **[Provider Composition](../store/withProvider-pattern.md)** - Advanced provider patterns