# Vanilla JavaScript Examples

This directory contains examples of using `@context-action/core` with vanilla JavaScript (no framework required).

## 📁 Examples

### 1. Basic Counter (`basic-counter.html`)

A simple counter application demonstrating:
- Creating an ActionRegister
- Registering action handlers
- Dispatching actions
- State management with `@context-action/store-core` (`createStateStore`)
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
- Multiple stores (`createStateStore` for todos + filter state)
- Priority-based action handlers
- Result collection and error handling
- Filtering and state composition
- XSS-safe DOM updates via `document.createElement` and `textContent`

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

### 1. Framework-Neutral Store Pattern (`@context-action/store-core`)

`createStateStore` provides a minimal reference store with `getValue()`, `setValue()`, `update()`, and zero-arg `subscribe(() => void)` listeners (render once initially after subscribing):

```javascript
import { createStateStore } from 'https://esm.sh/@context-action/store-core@0.1.4';

const counterStore = createStateStore('counter', { count: 0 });

function render() {
  document.getElementById('counter').textContent = String(counterStore.getValue().count);
}

counterStore.subscribe(render);
render();
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

### Option 1: CDN (Quick Start with Pinned Versions)

```html
<script type="module">
  import { ActionRegister } from 'https://esm.sh/@context-action/core@1.3.1';
  import { createStateStore } from 'https://esm.sh/@context-action/store-core@0.1.4';

  const countStore = createStateStore('count', 0);
  const actions = new ActionRegister({ name: 'MyApp' });
  // ...
</script>
```

### Option 2: NPM (Production)

```bash
pnpm add @context-action/core @context-action/store-core
```

```javascript
import { ActionRegister } from '@context-action/core';
import { createStateStore } from '@context-action/store-core';

const countStore = createStateStore('count', 0);
const actions = new ActionRegister({ name: 'MyApp' });
```

### Option 3: Build Tools (Vite, Rollup, etc.)

```bash
pnpm add @context-action/core @context-action/store-core
```

```javascript
// main.js
import { ActionRegister } from '@context-action/core';
import { createStateStore } from '@context-action/store-core';

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
