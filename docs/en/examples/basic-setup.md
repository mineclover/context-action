# Basic Setup

This example shows the fundamental setup of Context-Action framework with both Action Only and Store Only patterns.

## Installation

First, install the required packages:

```bash
npm install @context-action/core @context-action/react
# or
pnpm add @context-action/core @context-action/react
# or  
yarn add @context-action/core @context-action/react
```

## Project Structure

```
src/
├── contexts/
│   ├── actions.tsx          # Action contexts
│   └── stores.tsx           # Store patterns
├── components/
│   ├── App.tsx              # Main application
│   ├── UserProfile.tsx      # User profile component
│   └── EventLogger.tsx      # Event logging component
└── types/
    └── actions.ts           # Action type definitions
```

## Step 1: Define Action Types

Create type definitions for your actions:

```typescript
// src/types/actions.ts
import type { ActionPayloadMap } from '@context-action/core';

export interface AppActions extends ActionPayloadMap {
  // User actions
  updateProfile: { name: string; email: string };
  login: { username: string; password: string };
  logout: void;
  
  // Event tracking
  trackEvent: { event: string; data: any };
  logError: { error: string; context: any };
  
  // UI actions
  showNotification: { message: string; type: 'success' | 'error' | 'info' };
  hideNotification: void;
}
```

## Step 2: Create Action Context

Set up the Action Only pattern for business logic:

```typescript
// src/contexts/actions.tsx
import { createActionContext } from '@context-action/react';
import type { AppActions } from '../types/actions';

export const {
  Provider: AppActionProvider,
  useActionDispatch: useAppAction,
  useActionHandler: useAppActionHandler
} = createActionContext<AppActions>('App');
```

## Step 3: Create Store Pattern

Set up the Store Only pattern for state management:

```typescript
// src/contexts/stores.tsx
import { createDeclarativeStorePattern } from '@context-action/react';

export const {
  Provider: AppStoreProvider,
  useStore: useAppStore,
  useStoreManager: useAppStoreManager,
  withProvider: withAppStoreProvider
} = createDeclarativeStorePattern('App', {
  // User state
  user: {
    id: '',
    name: '',
    email: '',
    isAuthenticated: false
  },
  
  // UI state
  ui: {
    loading: false,
    notification: null as { message: string; type: 'success' | 'error' | 'info' } | null
  },
  
  // Application settings
  settings: {
    initialValue: { theme: 'light', language: 'en' },
    validator: (value) => 
      typeof value === 'object' && 
      'theme' in value && 
      'language' in value
  }
});
```

## Step 4: Main Application Setup

Combine both patterns in your main app component:

```typescript
// src/components/App.tsx
import React from 'react';
import { AppActionProvider } from '../contexts/actions';
import { withAppStoreProvider } from '../contexts/stores';
import { UserProfile } from './UserProfile';
import { EventLogger } from './EventLogger';

// Use HOC pattern to automatically wrap with store provider
const App = withAppStoreProvider(() => (
  <AppActionProvider>
    <div className="app">
      <header>
        <h1>Context-Action Example</h1>
      </header>
      
      <main>
        <UserProfile />
        <EventLogger />
      </main>
    </div>
  </AppActionProvider>
));

export default App;
```

## Step 5: User Profile Component

Example component using both patterns:

```typescript
// src/components/UserProfile.tsx
import React, { useCallback } from 'react';
import { useStoreValue } from '@context-action/react';
import { useAppAction, useAppActionHandler } from '../contexts/actions';
import { useAppStore } from '../contexts/stores';

export function UserProfile() {
  const dispatch = useAppAction();
  const userStore = useAppStore('user');
  const uiStore = useAppStore('ui');
  
  // Subscribe to store values
  const user = useStoreValue(userStore);
  const ui = useStoreValue(uiStore);
  
  // Register action handlers
  useAppActionHandler('updateProfile', useCallback(async (payload, controller) => {
    try {
      // Set loading state
      uiStore.update(current => ({ ...current, loading: true }));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user store
      userStore.update(current => ({
        ...current,
        name: payload.name,
        email: payload.email
      }));
      
      // Show success notification
      dispatch('showNotification', {
        message: 'Profile updated successfully!',
        type: 'success'
      });
      
    } catch (error) {
      // Handle error
      dispatch('logError', {
        error: (error as Error).message,
        context: { component: 'UserProfile', action: 'updateProfile' }
      });
      
      controller.abort('Profile update failed');
    } finally {
      // Clear loading state
      uiStore.update(current => ({ ...current, loading: false }));
    }
  }, [dispatch, userStore, uiStore]));
  
  // Login handler
  useAppActionHandler('login', useCallback(async (payload) => {
    uiStore.update(current => ({ ...current, loading: true }));
    
    try {
      // Simulate login API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update user state
      userStore.setValue({
        id: '123',
        name: 'John Doe',
        email: payload.username + '@example.com',
        isAuthenticated: true
      });
      
      dispatch('trackEvent', {
        event: 'user_login',
        data: { username: payload.username, timestamp: Date.now() }
      });
      
    } catch (error) {
      dispatch('showNotification', {
        message: 'Login failed. Please try again.',
        type: 'error'
      });
    } finally {
      uiStore.update(current => ({ ...current, loading: false }));
    }
  }, [dispatch, userStore, uiStore]));
  
  // Notification handler
  useAppActionHandler('showNotification', useCallback((payload) => {
    uiStore.update(current => ({
      ...current,
      notification: { message: payload.message, type: payload.type }
    }));
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      dispatch('hideNotification');
    }, 3000);
  }, [dispatch, uiStore]));
  
  useAppActionHandler('hideNotification', useCallback(() => {
    uiStore.update(current => ({ ...current, notification: null }));
  }, [uiStore]));
  
  // Event handlers
  const handleUpdateProfile = () => {
    dispatch('updateProfile', {
      name: 'John Doe Updated',
      email: 'john.updated@example.com'
    });
  };
  
  const handleLogin = () => {
    dispatch('login', {
      username: 'john.doe',
      password: 'secret123'
    });
  };
  
  const handleLogout = () => {
    userStore.setValue({
      id: '',
      name: '',
      email: '',
      isAuthenticated: false
    });
    
    dispatch('trackEvent', {
      event: 'user_logout',
      data: { timestamp: Date.now() }
    });
  };
  
  return (
    <div className="user-profile">
      <h2>User Profile</h2>
      
      {/* Loading indicator */}
      {ui.loading && <div className="loading">Loading...</div>}
      
      {/* Notification */}
      {ui.notification && (
        <div className={`notification notification--${ui.notification.type}`}>
          {ui.notification.message}
        </div>
      )}
      
      {/* User info */}
      {user.isAuthenticated ? (
        <div className="user-info">
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          
          <div className="actions">
            <button onClick={handleUpdateProfile} disabled={ui.loading}>
              Update Profile
            </button>
            <button onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div className="login-form">
          <p>Please log in to continue</p>
          <button onClick={handleLogin} disabled={ui.loading}>
            Login as John Doe
          </button>
        </div>
      )}
    </div>
  );
}
```

## Step 6: Event Logger Component

Component that handles event tracking:

```typescript
// src/components/EventLogger.tsx
import React, { useCallback, useState } from 'react';
import { useAppActionHandler } from '../contexts/actions';

export function EventLogger() {
  const [events, setEvents] = useState<Array<{ event: string; data: any; timestamp: number }>>([]);
  const [errors, setErrors] = useState<Array<{ error: string; context: any; timestamp: number }>>([]);
  
  // Register event tracking handler
  useAppActionHandler('trackEvent', useCallback((payload) => {
    const eventLog = {
      event: payload.event,
      data: payload.data,
      timestamp: Date.now()
    };
    
    setEvents(current => [...current, eventLog]);
    console.log('Event tracked:', eventLog);
    
    // In a real app, send to analytics service
    // analytics.track(payload.event, payload.data);
  }, []));
  
  // Register error logging handler
  useAppActionHandler('logError', useCallback((payload) => {
    const errorLog = {
      error: payload.error,
      context: payload.context,
      timestamp: Date.now()
    };
    
    setErrors(current => [...current, errorLog]);
    console.error('Error logged:', errorLog);
    
    // In a real app, send to error reporting service
    // errorReporter.captureException(payload.error, payload.context);
  }, []));
  
  return (
    <div className="event-logger">
      <h2>Event Logger</h2>
      
      {/* Recent Events */}
      <div className="events-section">
        <h3>Recent Events ({events.length})</h3>
        <div className="log-container">
          {events.slice(-5).reverse().map((event, index) => (
            <div key={index} className="log-entry log-entry--event">
              <div className="log-time">
                {new Date(event.timestamp).toLocaleTimeString()}
              </div>
              <div className="log-content">
                <strong>{event.event}</strong>
                <pre>{JSON.stringify(event.data, null, 2)}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Errors */}
      <div className="errors-section">
        <h3>Recent Errors ({errors.length})</h3>
        <div className="log-container">
          {errors.slice(-3).reverse().map((error, index) => (
            <div key={index} className="log-entry log-entry--error">
              <div className="log-time">
                {new Date(error.timestamp).toLocaleTimeString()}
              </div>
              <div className="log-content">
                <strong>Error:</strong> {error.error}
                <pre>{JSON.stringify(error.context, null, 2)}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Clear buttons */}
      <div className="actions">
        <button onClick={() => setEvents([])}>
          Clear Events
        </button>
        <button onClick={() => setErrors([])}>
          Clear Errors
        </button>
      </div>
    </div>
  );
}
```

## Step 7: Basic Styles

Add some basic CSS for the example:

```css
/* src/App.css */
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

.user-profile, .event-logger {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.loading {
  color: #007bff;
  font-weight: bold;
  margin-bottom: 10px;
}

.notification {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.notification--success { background: #d4edda; color: #155724; }
.notification--error { background: #f8d7da; color: #721c24; }
.notification--info { background: #d1ecf1; color: #0c5460; }

.user-info {
  background: white;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: white;
  cursor: pointer;
}

.actions button:hover {
  background: #0056b3;
}

.actions button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.log-entry {
  padding: 10px;
  border-bottom: 1px solid #eee;
  display: flex;
  gap: 10px;
}

.log-entry--event {
  border-left: 4px solid #28a745;
}

.log-entry--error {
  border-left: 4px solid #dc3545;
}

.log-time {
  color: #666;
  font-size: 0.9em;
  min-width: 80px;
}

.log-content pre {
  font-size: 0.8em;
  background: #f8f9fa;
  padding: 5px;
  border-radius: 2px;
  margin: 5px 0 0 0;
}
```

## Key Concepts Demonstrated

This example demonstrates several key Context-Action concepts:

### 1. Pattern Separation
- **Action Only Pattern** for business logic and events
- **Store Only Pattern** for state management
- Clear separation between actions and state

### 2. MVVM Architecture
- **View Layer**: React components (`UserProfile`, `EventLogger`)
- **ViewModel Layer**: Action handlers with business logic
- **Model Layer**: Store pattern for data management

### 3. Handler Registration
- Handlers registered in components using `useAppActionHandler`
- Priority-based execution (implicit default priority)
- Proper cleanup with `useCallback` dependencies

### 4. Store Management
- Reactive subscriptions with `useStoreValue`
- Store updates with `setValue()` and `update()`
- Type-safe store access

### 5. Error Handling
- Graceful error handling in action handlers
- Error logging and user feedback
- Pipeline control with `controller.abort()`

### 6. Event System
- Event tracking for analytics
- Error logging for monitoring
- Separation of concerns between different event types

## Running the Example

1. Set up a new React project
2. Install the dependencies
3. Copy the code files to your project
4. Add the CSS styles
5. Start the development server

```bash
npm create react-app context-action-example --template typescript
cd context-action-example
npm install @context-action/core @context-action/react
# Copy the files above
npm start
```

## Next Steps

- **[Action Only Pattern](./action-only)** - Deep dive into pure action dispatching
- **[Store Only Pattern](./store-only)** - Focus on state management patterns
- **[Pattern Composition](./pattern-composition)** - Advanced pattern combinations