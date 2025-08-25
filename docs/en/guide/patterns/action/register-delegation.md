# Register Delegation Pattern

Advanced pattern for organizing action handlers in separate modules using external functions and `useActionRegister()` hook.

## Import
```typescript
import { createActionContext, ActionPayloadMap, ActionRegister } from '@context-action/react';
```

## Features
- ✅ Modular handler organization
- ✅ External function delegation
- ✅ Team-based development support
- ✅ Plugin architecture enablement
- ✅ Cleanup management

## Prerequisites

🎯 **스펙 재사용**: For complete setup instructions including type definitions, context creation, and provider configuration, see **[Basic Action Setup](../setup/basic-action-setup.md)**.

📖 **이 문서의 모든 예제**는 아래 setup 스펙을 재사용합니다:
- 🎯 Action types → [EventActions Pattern](../setup/basic-action-setup.md#common-action-patterns)
- 🎯 Context creation → [Single Domain Context](../setup/basic-action-setup.md#single-domain-context)
- 🎯 Provider setup → [Single Provider Setup](../setup/basic-action-setup.md#single-provider-setup)

💡 **일관된 학습**: Setup 가이드를 먼저 읽으면 이 문서의 모든 예제를 **즉시 이해**할 수 있습니다.

## Overview

Register delegation enables modular handler organization by separating handler logic into external modules. This pattern is essential for large applications with complex business logic, team-based development, and plugin architectures.

## Basic Delegation Pattern

```tsx
// Framework imports
import { useEffect } from 'react';
import { ActionRegister } from '@context-action/react';
// Setup imports - reusing EventActions from setup guide
import { useEventRegister, EventActions } from '../setup/actions';

// External registration function
function setupAnalyticsHandlers(register: ActionRegister<EventActions>) {
  // Register handlers outside of React components
  register.register('analytics', async (payload, controller) => {
    await analyticsAPI.track(payload.event, payload.data);
  }, {
    priority: 100,
    tags: ['analytics']
  });
  
  register.register('userClick', async (payload, controller) => {
    await analyticsAPI.trackClick(payload.x, payload.y);
  }, {
    priority: 90,
    tags: ['analytics', 'interaction']
  });
}

// Component that delegates registration
function AnalyticsSetup() {
  const register = useEventRegister();
  
  useEffect(() => {
    if (!register) return;
    
    // Delegate registration to external function
    setupAnalyticsHandlers(register);
    
    // Cleanup on unmount
    return () => {
      register.unregisterByTags(['analytics']);
    };
  }, [register]);
  
  return null; // Setup component
}
```

## Modular Handler Registration

```tsx
// utils/handlers/userHandlers.ts - User domain handlers using UserActions from setup
import { ActionRegister } from '@context-action/react';
import { UserActions } from '../setup/actions';

export function registerUserHandlers(register: ActionRegister<UserActions>) {
  register.register('updateProfile', async (payload, controller) => {
    try {
      await userAPI.updateProfile(payload);
      controller.setResult({ success: true });
    } catch (error) {
      controller.abort('Profile update failed', error);
    }
  }, { tags: ['user', 'profile'] });
  
  register.register('changePassword', async (payload, controller) => {
    const isValid = await validatePassword(payload.currentPassword);
    if (!isValid) {
      controller.abort('Current password invalid');
      return;
    }
    
    await userAPI.updatePassword(payload.newPassword);
  }, { tags: ['user', 'security'] });
}

// utils/handlers/apiHandlers.ts - API domain handlers using APIActions from setup
import { ActionRegister } from '@context-action/react';
import { APIActions } from '../setup/actions';

export function registerAPIHandlers(register: ActionRegister<APIActions>) {
  register.register('fetchData', async (payload, controller) => {
    // API data fetching logic
    const result = await fetch(payload.endpoint + '?' + new URLSearchParams(payload.params));
    const data = await result.json();
    controller.setResult(data);
  }, { tags: ['api', 'fetch'] });
  
  register.register('uploadFile', async (payload, controller) => {
    // File upload logic
    const formData = new FormData();
    formData.append('file', payload.file);
    const result = await fetch('/upload', { method: 'POST', body: formData });
    controller.setResult(result);
  }, { tags: ['api', 'upload'] });
}

// Component that coordinates multiple handler modules
function AppHandlerSetup() {
  const userRegister = useUserRegister();
  const apiRegister = useAPIRegister();
  const eventRegister = useEventRegister();
  
  useEffect(() => {
    if (!userRegister || !apiRegister || !eventRegister) return;
    
    // Register handlers from different modules
    registerUserHandlers(userRegister);
    registerAPIHandlers(apiRegister);
    setupAnalyticsHandlers(eventRegister);
    
    // Cleanup by module tags on unmount
    return () => {
      userRegister.unregisterByTags(['user']);
      apiRegister.unregisterByTags(['api']);
      eventRegister.unregisterByTags(['analytics']);
    };
  }, [userRegister, apiRegister, eventRegister]);
  
  return null;
}
```

## Dynamic Handler Registration

```tsx
// Dynamic handler setup based on configuration
import { useStoreValue } from '@context-action/react';
import { useEventRegister } from '../setup/actions';

function DynamicHandlerSetup() {
  const register = useEventRegister();
  const config = useStoreValue(configStore);
  
  useEffect(() => {
    if (!register) return;
    
    // Register handlers based on current configuration
    if (config.enableAnalytics) {
      setupAnalyticsHandlers(register);
    }
    
    if (config.enableNotifications) {
      setupNotificationHandlers(register);
    }
    
    if (config.debugMode) {
      setupDebugHandlers(register);
    }
    
    // Return cleanup function
    return () => {
      register.clearHandlers();
    };
  }, [register, config.enableAnalytics, config.enableNotifications, config.debugMode]);
  
  return null;
}
```

## Team-Based Handler Organization

```tsx
// Team-specific handler modules using setup spec types
// team-auth/handlers.ts
import { ActionRegister } from '@context-action/react';
import { UserActions } from '../setup/actions';

export function registerAuthHandlers(register: ActionRegister<UserActions>) {
  register.register('login', authLoginHandler, { tags: ['auth'] });
  register.register('logout', authLogoutHandler, { tags: ['auth'] });
  // refreshToken handler would need to be added to UserActions in setup
}

// team-products/handlers.ts
import { ActionRegister } from '@context-action/react';
import { APIActions } from '../setup/actions';

export function registerProductHandlers(register: ActionRegister<APIActions>) {
  register.register('fetchData', productLoadHandler, { tags: ['products'] });
  register.register('postData', productSearchHandler, { tags: ['products'] });
  // Additional product handlers would extend APIActions in setup
}

// team-notifications/handlers.ts
import { ActionRegister } from '@context-action/react';
import { NotificationActions } from '../setup/actions';

export function registerNotificationHandlers(register: ActionRegister<NotificationActions>) {
  register.register('showNotification', orderNotificationHandler, { tags: ['orders'] });
  register.register('hideNotification', paymentNotificationHandler, { tags: ['orders'] });
}

// Main application handler coordination
function TeamHandlerCoordinator() {
  const userRegister = useUserRegister();
  const apiRegister = useAPIRegister();
  const notificationRegister = useNotificationRegister();
  
  useEffect(() => {
    if (!userRegister || !apiRegister || !notificationRegister) return;
    
    // Each team registers their handlers using setup specs
    registerAuthHandlers(userRegister);
    registerProductHandlers(apiRegister);
    registerNotificationHandlers(notificationRegister);
    
    return () => {
      userRegister.unregisterByTags(['auth']);
      apiRegister.unregisterByTags(['products']);
      notificationRegister.unregisterByTags(['orders']);
    };
  }, [userRegister, apiRegister, notificationRegister]);
  
  return null;
}
```

## Best Practices

1. **Module Organization**: Group related handlers in separate modules
2. **Cleanup Management**: Always unregister handlers on unmount
3. **Type Safety**: Pass typed ActionRegister to maintain type safety
4. **Configuration-Driven**: Use config to conditionally register handlers
5. **Error Handling**: Handle registration errors gracefully
6. **Performance**: Register handlers once, not on every render
7. **Team Boundaries**: Organize handlers by team or feature ownership
8. **Handler IDs**: Use descriptive IDs for easier debugging and management

## When to Use Register Delegation

- **Large Applications**: Complex handler logic across multiple modules
- **Team Development**: Different teams owning different handlers
- **Dynamic Configuration**: Handlers registered based on runtime config
- **Plugin Architecture**: Modular handler registration system
- **Testing**: Easier to mock and test individual handler modules