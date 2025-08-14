/**
 * Unified Declarative Store Pattern Examples
 * 
 * Demonstrates the simplified, unified store pattern with excellent type inference
 */

import React from 'react';
import { createDeclarativeStorePattern } from '../../../src/stores/patterns/declarative-store-pattern-v2';
import { useStoreValue } from '../../../src/stores/hooks/useStoreValue';

/**
 * Example 1: Simple Direct Values
 * The cleanest and simplest way to define stores
 */
const SimpleStores = createDeclarativeStorePattern('Simple', {
  // Direct primitive values - no boilerplate needed
  counter: 0,
  userName: 'Guest',
  isLoggedIn: false,
  temperature: 20.5,
  
  // Arrays and objects work too
  todos: [] as string[],
  tags: ['react', 'typescript'] as const,
});

function SimpleExample() {
  // Full type inference - no manual type annotations needed
  const counter = SimpleStores.useStore('counter');      // Store<number>
  const userName = SimpleStores.useStore('userName');    // Store<string>
  const todos = SimpleStores.useStore('todos');         // Store<string[]>
  
  const count = useStoreValue(counter);
  const name = useStoreValue(userName);
  const todoList = useStoreValue(todos);
  
  return (
    <div>
      <h3>Simple Direct Values</h3>
      <p>Count: {count}</p>
      <p>User: {name}</p>
      <p>Todos: {todoList.join(', ')}</p>
      
      <button onClick={() => counter.setValue(count + 1)}>
        Increment
      </button>
      <button onClick={() => todos.update(t => [...t, `Task ${t.length + 1}`])}>
        Add Todo
      </button>
    </div>
  );
}

/**
 * Example 2: Mixed Configuration
 * Combine direct values with configured stores for flexibility
 */
const MixedStores = createDeclarativeStorePattern('Mixed', {
  // Simple values for straightforward data
  count: 0,
  message: 'Hello',
  
  // Configuration for complex objects
  user: {
    initialValue: {
      id: '',
      name: '',
      email: '',
      preferences: {
        theme: 'light' as 'light' | 'dark',
        notifications: true
      }
    },
    strategy: 'shallow',  // Optimize re-renders
    description: 'User profile with preferences'
  },
  
  // Configuration for performance-sensitive data
  largeDataset: {
    initialValue: [] as Array<{ id: number; data: string }>,
    strategy: 'reference',  // Only re-render on reference change
    description: 'Large dataset that changes infrequently'
  }
});

function MixedExample() {
  const user = MixedStores.useStore('user');
  const userData = useStoreValue(user);
  
  const toggleTheme = () => {
    user.update(u => ({
      ...u,
      preferences: {
        ...u.preferences,
        theme: u.preferences.theme === 'light' ? 'dark' : 'light'
      }
    }));
  };
  
  return (
    <div>
      <h3>Mixed Configuration</h3>
      <p>User: {userData.name || 'Not logged in'}</p>
      <p>Theme: {userData.preferences.theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}

/**
 * Example 3: Type-Safe Complex Structures
 * Demonstrates excellent type inference with complex nested types
 */
const ComplexStores = createDeclarativeStorePattern('Complex', {
  // Complex nested structure with full type safety
  appState: {
    initialValue: {
      version: '1.0.0',
      config: {
        api: {
          baseUrl: 'https://api.example.com',
          timeout: 5000,
          retryCount: 3
        },
        features: {
          darkMode: true,
          analytics: false,
          experimental: {
            newUI: false,
            fastSync: true
          }
        }
      },
      status: 'idle' as 'idle' | 'loading' | 'error' | 'success',
      lastSync: null as Date | null
    },
    strategy: 'deep',  // Deep comparison for nested updates
    description: 'Application state with nested configuration'
  },
  
  // Union types and discriminated unions
  notification: {
    initialValue: null as 
      | null 
      | { type: 'info'; message: string }
      | { type: 'warning'; message: string; action?: () => void }
      | { type: 'error'; message: string; details: string },
    strategy: 'reference'
  }
});

function ComplexExample() {
  const appState = ComplexStores.useStore('appState');
  const notification = ComplexStores.useStore('notification');
  
  const app = useStoreValue(appState);
  const notif = useStoreValue(notification);
  
  const updateApiUrl = (url: string) => {
    appState.update(state => ({
      ...state,
      config: {
        ...state.config,
        api: {
          ...state.config.api,
          baseUrl: url
        }
      }
    }));
  };
  
  const showNotification = () => {
    notification.setValue({
      type: 'info',
      message: 'Configuration updated successfully!'
    });
    
    setTimeout(() => notification.setValue(null), 3000);
  };
  
  return (
    <div>
      <h3>Complex Type-Safe Structures</h3>
      <p>API URL: {app.config.api.baseUrl}</p>
      <p>Dark Mode: {app.config.features.darkMode ? 'On' : 'Off'}</p>
      <p>Status: {app.status}</p>
      
      {notif && (
        <div className={`notification ${notif.type}`}>
          {notif.message}
          {notif.type === 'error' && ' - ' + notif.details}
        </div>
      )}
      
      <button onClick={() => updateApiUrl('https://new-api.example.com')}>
        Update API URL
      </button>
      <button onClick={showNotification}>
        Show Notification
      </button>
    </div>
  );
}

/**
 * Example 4: Using HOC Pattern
 * Demonstrates automatic provider wrapping with withProvider
 */
const FeatureStores = createDeclarativeStorePattern('Feature', {
  featureFlags: {
    betaAccess: false,
    newDashboard: true,
    aiAssistant: false
  },
  userRole: 'viewer' as 'viewer' | 'editor' | 'admin',
  credits: 100
});

// Component that uses stores
function FeatureComponent() {
  const flags = FeatureStores.useStore('featureFlags');
  const role = FeatureStores.useStore('userRole');
  const credits = FeatureStores.useStore('credits');
  
  const flagsValue = useStoreValue(flags);
  const roleValue = useStoreValue(role);
  const creditsValue = useStoreValue(credits);
  
  return (
    <div>
      <h3>Feature Flags</h3>
      <p>Role: {roleValue}</p>
      <p>Credits: {creditsValue}</p>
      <ul>
        <li>Beta Access: {flagsValue.betaAccess ? '✅' : '❌'}</li>
        <li>New Dashboard: {flagsValue.newDashboard ? '✅' : '❌'}</li>
        <li>AI Assistant: {flagsValue.aiAssistant ? '✅' : '❌'}</li>
      </ul>
      
      <button onClick={() => role.setValue('admin')}>
        Upgrade to Admin
      </button>
      <button onClick={() => credits.update(c => c + 10)}>
        Add 10 Credits
      </button>
    </div>
  );
}

// Wrap with HOC for automatic provider - 기본 사용법
const FeatureWithProvider = FeatureStores.withProvider(FeatureComponent);

// 고급 사용법 - 선택적 설정
const FeatureWithCustomProvider = FeatureStores.withProvider(FeatureComponent, {
  displayName: 'FeatureModuleWithStores',
  registryId: 'feature-module-stores'
});

/**
 * Main App demonstrating all patterns
 */
export function UnifiedPatternDemo() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Unified Declarative Store Pattern</h1>
      <p>Simplified API with excellent type inference</p>
      
      <SimpleStores.Provider>
        <SimpleExample />
      </SimpleStores.Provider>
      
      <MixedStores.Provider>
        <MixedExample />
      </MixedStores.Provider>
      
      <ComplexStores.Provider>
        <ComplexExample />
      </ComplexStores.Provider>
      
      {/* HOC patterns - no manual provider needed */}
      <FeatureWithProvider />
      <FeatureWithCustomProvider />
    </div>
  );
}

/**
 * Key Benefits of the Unified Pattern:
 * 
 * 1. **Simplified API**: Just `useStore()` as the primary method
 * 2. **Excellent Type Inference**: No manual type annotations needed
 * 3. **Flexible Initial Stores**: Direct values or configuration objects
 * 4. **Focus on Store Management**: No selector complexity
 * 5. **Clean Code**: Minimal boilerplate, maximum clarity
 * 6. **Performance**: Configurable comparison strategies
 * 7. **Flexible HOC**: `withProvider(Component, config?)` with optional configuration
 * 
 * ## withProvider API Examples:
 * 
 * // Basic usage
 * const Wrapped = Stores.withProvider(Component);
 * 
 * // With custom display name
 * const Wrapped = Stores.withProvider(Component, { 
 *   displayName: 'MyComponent'
 * });
 * 
 * // With custom registry ID
 * const Wrapped = Stores.withProvider(Component, { 
 *   registryId: 'my-feature'
 * });
 * 
 * // With both options
 * const Wrapped = Stores.withProvider(Component, { 
 *   displayName: 'MyFeatureComponent',
 *   registryId: 'my-feature-stores'
 * });
 */