# Vanilla JavaScript Examples

This directory contains examples of using `@context-action/core` with vanilla JavaScript (no framework required).

## 📁 Examples

### 1. Basic Counter (`basic-counter.html`)

A simple counter application demonstrating:
- Creating an ActionRegister
- Registering action handlers
- Dispatching actions
- State management with a simple Store
- Async operations

**Features:**
- ➕ Increment counter
- ➖ Decrement counter
- 🔄 Reset counter
- ⏳ Async increment (+10 with delay)
- 📜 Action logging

**Run it:**
```bash
# Option 1: Open directly in browser
open basic-counter.html

# Option 2: Use a local server
npx serve .
# Then visit: http://localhost:3000/basic-counter.html
```

### 2. Todo App (`todo-app.html`)

A full-featured todo application demonstrating:
- Multiple stores (todos + filter state)
- Priority-based action handlers
- Result collection and error handling
- Filtering and state composition
- Complex UI interactions

**Features:**
- ➕ Add new todos
- ✅ Toggle todo completion
- 🗑️ Delete todos
- 🔍 Filter todos (All/Active/Completed)
- 📊 Statistics display

**Run it:**
```bash
# Option 1: Open directly in browser
open todo-app.html

# Option 2: Use a local server
npx serve .
# Then visit: http://localhost:3000/todo-app.html
```

## 🎯 Key Patterns Demonstrated

### 1. Simple Store Pattern

```javascript
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

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state); // Call immediately
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }
}
```

### 2. Store Integration Pattern

All action handlers follow the 3-step pattern:

```javascript
actions.register('actionName', (payload, controller) => {
  // 1. Read current state
  const current = store.getValue();

  // 2. Execute business logic
  const newState = processLogic(current, payload);

  // 3. Update store
  store.setValue(newState);

  // Optional: Set result
  controller.setResult({ success: true });
});
```

### 3. Action Pipeline

```javascript
// High priority - validation
actions.register('submitForm', (payload, controller) => {
  if (!isValid(payload)) {
    controller.abort('Validation failed');
    return;
  }
}, { priority: 100 });

// Medium priority - business logic
actions.register('submitForm', async (payload, controller) => {
  const result = await processData(payload);
  controller.setResult(result);
}, { priority: 50 });

// Low priority - side effects
actions.register('submitForm', (payload, controller) => {
  analytics.track('form_submitted');
}, { priority: 10 });
```

## 🚀 Using in Your Project

### Option 1: CDN (Quick Start)

```html
<script type="module">
  import { ActionRegister } from 'https://esm.sh/@context-action/core@latest';

  const actions = new ActionRegister({ name: 'MyApp' });
  // ...
</script>
```

### Option 2: NPM (Production)

```bash
npm install @context-action/core
```

```javascript
import { ActionRegister } from '@context-action/core';

const actions = new ActionRegister({ name: 'MyApp' });
```

### Option 3: Build Tools (Vite, Webpack, etc.)

```bash
npm install @context-action/core
```

```javascript
// main.js
import { ActionRegister } from '@context-action/core';
import { Store } from './store.js';

// Your application code
```

## 📚 Learn More

- [Vanilla JS Guide](../../docs/en/guide/vanilla-js-guide.md)
- [Core API Documentation](../../packages/core/README.md)
- [Action Pattern Guide](../../docs/en/guide/patterns/action/index.md)

## 💡 Tips

1. **Use TypeScript** for better type safety (optional but recommended)
2. **Follow Store Integration Pattern** for consistent state management
3. **Set appropriate priorities** for your action handlers
4. **Use debouncing/throttling** for high-frequency events
5. **Clean up handlers** when no longer needed
6. **Handle errors gracefully** using `controller.abort()`

## 🤝 Contributing

Found an issue or want to add more examples? Contributions are welcome!
