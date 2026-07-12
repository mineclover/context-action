# Vanilla JavaScript Guide

The `@context-action/core` package is a framework-agnostic action pipeline management library that works perfectly with vanilla JavaScript. This guide shows you how to use Context-Action in plain JavaScript applications without React.

## 📦 Installation

```bash
npm install @context-action/core
# or
pnpm add @context-action/core
# or
yarn add @context-action/core
```

## 🎯 Core Concepts

Context-Action provides a powerful action pipeline system for vanilla JavaScript:

1. **ActionRegister**: Central action management system
2. **Type-safe Actions**: Define actions with payload types (TypeScript optional)
3. **Priority-based Handlers**: Execute handlers in priority order
4. **Multiple Execution Modes**: Sequential, parallel, or race execution
5. **Advanced Control**: Debouncing, throttling, filtering, and result collection

## 🚀 Quick Start

### Basic Example

```javascript
import { ActionRegister } from '@context-action/core';

// 1. Create an ActionRegister instance
const actionRegister = new ActionRegister({
  name: 'AppActions',
  registry: {
    debug: true, // Enable logging for development
    defaultExecutionMode: 'sequential'
  }
});

// 2. Register action handlers
const unregister = actionRegister.register(
  'greet',
  async (payload, controller) => {
    console.log(`Hello, ${payload.name}!`);
    controller.setResult({ greeted: true, name: payload.name });
  },
  { priority: 100 }
);

// 3. Dispatch actions
await actionRegister.dispatch('greet', { name: 'World' });

// 4. Cleanup when done
unregister();
```

### With TypeScript (Optional)

```typescript
import { ActionRegister, ActionPayloadMap } from '@context-action/core';

// Define your action types
interface AppActions extends ActionPayloadMap {
  greet: { name: string };
  updateUser: { id: string; name: string; email: string };
  logout: void; // Actions without payload
}

// Create typed ActionRegister
const actionRegister = new ActionRegister<AppActions>({
  name: 'AppActions'
});

// Type-safe registration
actionRegister.register('greet', async (payload, controller) => {
  // payload is typed as { name: string }
  console.log(`Hello, ${payload.name}!`);
});

// Type-safe dispatch
await actionRegister.dispatch('greet', { name: 'World' });
```

## 🎨 Real-World Examples

### Example 1: Form Validation with Multiple Handlers

```javascript
import { ActionRegister } from '@context-action/core';

const formActions = new ActionRegister({
  name: 'FormActions',
  registry: { defaultExecutionMode: 'sequential' }
});

// Priority-based validation pipeline
formActions.register('submitForm', async (payload, controller) => {
  console.log('Step 1: Validating required fields...');

  if (!payload.email || !payload.password) {
    controller.abort('Missing required fields');
    return;
  }

  controller.setResult({ validation: 'passed' });
}, { priority: 100 }); // Highest priority - validates first

formActions.register('submitForm', async (payload, controller) => {
  console.log('Step 2: Checking email format...');

  if (!payload.email.includes('@')) {
    controller.abort('Invalid email format');
    return;
  }
}, { priority: 90 });

formActions.register('submitForm', async (payload, controller) => {
  console.log('Step 3: Submitting to server...');

  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  controller.setResult({ success: true, user: data.user });
}, { priority: 50 }); // Lowest priority - executes last

// Usage
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    email: document.getElementById('email').value,
    password: document.getElementById('password').value
  };

  const result = await formActions.dispatchWithResult('submitForm', formData);

  if (result.success) {
    console.log('Login successful!', result.successResults);
    window.location.href = '/dashboard';
  } else {
    console.error('Login failed:', result.abortReason);
    alert(result.abortReason);
  }
});
```

### Example 2: Event System with Debouncing

```javascript
import { ActionRegister } from '@context-action/core';

const searchActions = new ActionRegister({
  name: 'SearchActions'
});

// Search handler with automatic debouncing
searchActions.register('search', async (payload, controller) => {
  console.log('Searching for:', payload.query);

  const results = await fetch(`/api/search?q=${encodeURIComponent(payload.query)}`)
    .then(res => res.json());

  controller.setResult(results);

  // Update UI
  displayResults(results);
}, { debounce: 300 }); // 300ms debounce

// Usage: Real-time search
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', (e) => {
  searchActions.dispatch('search', { query: e.target.value });
});

function displayResults(results) {
  const container = document.getElementById('results');
  container.innerHTML = results
    .map(item => `<div class="result">${item.title}</div>`)
    .join('');
}
```

### Example 3: State Management Pattern

```javascript
import { ActionRegister } from '@context-action/core';

// Simple state store
class Store {
  constructor(initialState) {
    this.state = initialState;
    this.listeners = new Set();
  }

  getValue() {
    return this.state;
  }

  setValue(newState) {
    this.state = newState;
    this.notify();
  }

  update(updater) {
    this.state = updater(this.state);
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }
}

// Create stores
const userStore = new Store({ name: '', email: '', isLoggedIn: false });
const uiStore = new Store({ loading: false, error: null });

// Create action register
const appActions = new ActionRegister({ name: 'AppActions' });

// Register handlers that follow Store Integration Pattern
appActions.register('login', async (payload, controller) => {
  // 1. Read current state
  const currentUser = userStore.getValue();

  // 2. Execute business logic
  uiStore.setValue({ loading: true, error: null });

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Login failed');

    const data = await response.json();

    // 3. Update stores
    userStore.setValue({
      name: data.user.name,
      email: data.user.email,
      isLoggedIn: true
    });

    uiStore.setValue({ loading: false, error: null });

    controller.setResult({ success: true });
  } catch (error) {
    uiStore.setValue({ loading: false, error: error.message });
    controller.abort(error.message);
  }
});

// Subscribe to store changes
userStore.subscribe((state) => {
  console.log('User state changed:', state);
  updateUI(state);
});

uiStore.subscribe((state) => {
  const loadingEl = document.getElementById('loading');
  loadingEl.style.display = state.loading ? 'block' : 'none';

  if (state.error) {
    alert(state.error);
  }
});

function updateUI(user) {
  if (user.isLoggedIn) {
    document.getElementById('userName').textContent = user.name;
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
  }
}

// Usage
document.getElementById('loginButton').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  await appActions.dispatch('login', { email, password });
});
```

### Example 4: Parallel Execution for Independent Operations

```javascript
import { ActionRegister } from '@context-action/core';

const analyticsActions = new ActionRegister({
  name: 'AnalyticsActions',
  registry: { defaultExecutionMode: 'parallel' }
});

// Register multiple analytics handlers that run in parallel
analyticsActions.register('trackEvent', async (payload) => {
  // Send to Google Analytics
  await fetch('https://www.google-analytics.com/collect', {
    method: 'POST',
    body: new URLSearchParams({ ...payload, provider: 'ga' })
  });
  console.log('Sent to Google Analytics');
}, { priority: 100 });

analyticsActions.register('trackEvent', async (payload) => {
  // Send to Mixpanel
  await fetch('https://api.mixpanel.com/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  console.log('Sent to Mixpanel');
}, { priority: 100 });

analyticsActions.register('trackEvent', async (payload) => {
  // Log to console (local)
  console.log('Event tracked:', payload);
}, { priority: 100 });

// All three handlers execute in parallel
document.getElementById('ctaButton').addEventListener('click', () => {
  analyticsActions.dispatch('trackEvent', {
    event: 'cta_clicked',
    timestamp: Date.now(),
    page: window.location.pathname
  });
});
```

### Example 5: Advanced Result Collection

```javascript
import { ActionRegister } from '@context-action/core';

const dataActions = new ActionRegister({ name: 'DataActions' });

// Register handlers that return different data
dataActions.register('fetchDashboardData', async (payload, controller) => {
  const users = await fetch('/api/users').then(r => r.json());
  controller.setResult({ users });
}, { priority: 100 });

dataActions.register('fetchDashboardData', async (payload, controller) => {
  const orders = await fetch('/api/orders').then(r => r.json());
  controller.setResult({ orders });
}, { priority: 90 });

dataActions.register('fetchDashboardData', async (payload, controller) => {
  const stats = await fetch('/api/stats').then(r => r.json());
  controller.setResult({ stats });
}, { priority: 80 });

// Collect and merge all results
const result = await dataActions.dispatchWithResult('fetchDashboardData', {}, {
  result: {
    strategy: 'merge',
    collect: true,
    merger: (results) => {
      // Merge all results into single object
      return results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
    }
  }
});

console.log('Dashboard data:', result.result);
// { users: [...], orders: [...], stats: {...} }
```

## 🎯 Advanced Patterns

### Pattern 1: Handler Filtering

```javascript
const actions = new ActionRegister({ name: 'FilteredActions' });

actions.register('processData', handler1, {
  priority: 100,
  id: 'validation'
});

actions.register('processData', handler2, {
  priority: 90,
  id: 'transformation'
});

actions.register('processData', handler3, {
  priority: 80,
  id: 'storage'
});

// Execute only specific handlers
await actions.dispatch('processData', data, {
  filter: {
    handlerIds: ['validation', 'storage'], // Skip transformation
    priority: { min: 80 } // Only handlers with priority >= 80
  }
});
```

### Pattern 2: Conditional Execution

```javascript
let isAuthenticated = false;

actions.register('sensitiveOperation', async (payload, controller) => {
  // Only execute if authenticated
  if (!isAuthenticated) {
    controller.abort('Not authenticated');
    return;
  }

  // Proceed with sensitive operation
  await performSensitiveAction(payload);
}, {
  priority: 100,
  condition: (payload) => isAuthenticated // Check before execution
});
```

### Pattern 3: Retry on Error

```javascript
await actions.dispatch('fetchData', { url: '/api/data' }, {
  retryOnError: {
    maxAttempts: 3,
    delay: 1000 // 1 second between retries
  },
  timeout: 5000 // 5 second wall-clock timeout, including queue and retry delays
});
```

### Pattern 4: AbortController Integration

```javascript
const controller = new AbortController();

// Cancel button
document.getElementById('cancelButton').addEventListener('click', () => {
  controller.abort('User cancelled');
});

// Long-running operation
await actions.dispatch('longOperation', data, {
  signal: controller.signal,
  autoAbort: {
    enabled: true,
    onControllerCreated: (ctrl) => {
      // Auto-abort after 10 seconds
      setTimeout(() => ctrl.abort('Timeout'), 10000);
    }
  }
});
```

## 🛠️ Utility Helpers

### Simple Vanilla JS Store

```javascript
export class VanillaStore {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = new Set();
  }

  getValue() {
    return this.state;
  }

  setValue(newState) {
    this.state = typeof newState === 'function'
      ? newState(this.state)
      : newState;
    this.notify();
  }

  update(updater) {
    this.setValue(updater(this.state));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state); // Immediate call
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }
}
```

### Simple Action Helper

```javascript
export function createVanillaActions(config = {}) {
  const register = new ActionRegister(config);
  const stores = new Map();

  return {
    register: register.register.bind(register),
    dispatch: register.dispatch.bind(register),
    dispatchWithResult: register.dispatchWithResult.bind(register),

    createStore(name, initialState) {
      const store = new VanillaStore(initialState);
      stores.set(name, store);
      return store;
    },

    getStore(name) {
      return stores.get(name);
    },

    cleanup() {
      register.cleanup();
      stores.clear();
    }
  };
}

// Usage
const app = createVanillaActions({ name: 'MyApp' });

const userStore = app.createStore('user', { name: '', email: '' });

app.register('updateUser', (payload, controller) => {
  const currentUser = userStore.getValue();
  userStore.setValue({ ...currentUser, ...payload });
});

await app.dispatch('updateUser', { name: 'John' });
```

## 📚 API Reference

### ActionRegister Methods

- `register(action, handler, config?)` - Register an action handler
- `dispatch(action, payload?, options?)` - Dispatch an action
- `dispatchWithResult(action, payload?, options?)` - Dispatch and get detailed result
- `unregister(action, handlerId?)` - Remove handler(s)
- `cleanup()` - Remove all handlers
- `getRegistryInfo()` - Get registry statistics
- `getActionStats(action)` - Get action-specific statistics

### Handler Configuration

```typescript
interface HandlerConfig {
  priority?: number;          // Higher executes first
  id?: string;               // Unique identifier
  blocking?: boolean;        // Wait for completion
  once?: boolean;           // Execute once then remove
  debounce?: number;        // Debounce delay (ms)
  throttle?: number;        // Throttle delay (ms)
  condition?: (payload) => boolean; // Execution condition
  cleanup?: () => void;     // Cleanup function
}
```

### Dispatch Options

```typescript
interface DispatchOptions {
  debounce?: number;
  throttle?: number;
  executionMode?: 'sequential' | 'parallel' | 'race';
  signal?: AbortSignal;
  timeout?: number;
  retryOnError?: { maxAttempts: number; delay: number };
  filter?: { handlerIds?: string[]; priority?: { min?: number; max?: number } };
  result?: { strategy?: 'first' | 'last' | 'all' | 'merge'; collect?: boolean };
}
```

## 🎓 Best Practices

1. **Use TypeScript for Type Safety** (optional but recommended)
2. **Follow Store Integration Pattern**: Read → Execute → Update
3. **Set Appropriate Priorities**: Validation (high) → Business Logic (medium) → Side Effects (low)
4. **Use Debouncing for User Input**: Search, form validation, etc.
5. **Use Throttling for High-Frequency Events**: Scroll, mouse move, resize
6. **Clean Up Handlers**: Call unregister functions when no longer needed
7. **Handle Errors Gracefully**: Use controller.abort() for validation errors
8. **Leverage Execution Modes**: Sequential for dependent operations, parallel for independent

## 🔗 See Also

- [Action Pattern Guide](./patterns/action/index.md)
- [Store Integration Pattern](../concept/store-conventions.md)
- [TypeScript API Reference](../../api/core/README.md)
- [React Integration Guide](./patterns/action/react-integration.md)
