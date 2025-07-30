# Test App

Development and testing environment for the [@context-action/core](../context-action) library.

## 🎯 Purpose

This test application serves as:
- **Development Environment**: Live testing during library development
- **Usage Examples**: Demonstrates how to use the library
- **Integration Testing**: Validates library functionality in a real React application
- **Documentation**: Shows practical implementation patterns

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

From the monorepo root:

```bash
# Install all dependencies
pnpm install

# Start the development server
pnpm dev
```

Or from this directory:

```bash
# Install dependencies (if not already done from root)
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## 📱 Application Features

The test app demonstrates the following @context-action/core features:

### 1. **Counter Component**
- Increment/decrement actions
- Set specific value action
- Reset action
- State management through action pipeline

### 2. **Logger Component**
- Action event logging
- Pipeline observer pattern
- Priority-based handler execution

### 3. **Type Safety**
- Strict TypeScript integration
- Action payload type checking
- IntelliSense support

## 🧩 Code Examples

### Action Type Definition

```typescript
interface AppActionMap extends ActionPayloadMap {
  increment: void;
  decrement: void;
  setCount: number;
  reset: void;
}
```

### Context Setup

```typescript
const { Provider, useAction, useActionHandler } = createActionContext<AppActionMap>()
```

### Handler Registration

```typescript
// High priority handler (runs first)
useActionHandler('increment', () => {
  setCount(prev => prev + 1)
  console.log('Counter incremented')
}, { priority: 1 })

// Low priority logger (runs after)
useActionHandler('increment', () => {
  console.log('Logger: Increment action detected')
}, { priority: 0 })
```

### Action Dispatching

```typescript
const action = useAction()

// Dispatch actions
dispatch('increment')
dispatch('setCount', 42)
dispatch('reset')
```

## 🔧 Development Workflow

1. **Make Changes**: Edit library code in `../context-action/src/`
2. **Hot Reload**: Vite automatically reloads the test app
3. **Test Functionality**: Interact with the UI to test changes
4. **Check Console**: Monitor action pipeline execution
5. **Iterate**: Repeat the process

## 📂 File Structure

```
packages/test-app/
├── src/
│   ├── App.tsx           # Main test application
│   ├── main.tsx          # React app entry point
│   └── vite-env.d.ts     # Vite type definitions
├── index.html            # HTML template
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── README.md            # This file
```

## ⚙️ Configuration

### Vite Configuration

The app is configured to:
- Use React with TypeScript
- Hot reload on changes
- Resolve `@context-action/core` to the local source code
- Serve on port 3000

### TypeScript Configuration

- Extends the monorepo root configuration
- References the library package for proper type resolution
- Enables strict type checking

## 🧪 Testing Scenarios

### Basic Functionality
- ✅ Action dispatching works
- ✅ Handlers execute in priority order
- ✅ State updates correctly
- ✅ Type safety is enforced

### Advanced Features
- ✅ Multiple handlers per action
- ✅ Pipeline controller methods
- ✅ Error handling and abort mechanisms
- ✅ Async handler support

### Integration
- ✅ React Context integration
- ✅ Component lifecycle compatibility
- ✅ TypeScript inference
- ✅ Hot module replacement

## 🐛 Debugging

### Console Logging
The app includes comprehensive logging:
- Action dispatch events
- Handler execution order
- State change notifications

### React DevTools
Use React DevTools to inspect:
- Component tree structure
- Context value changes
- Hook dependencies

### Browser DevTools
Monitor:
- Network requests (none expected)
- Performance metrics
- JavaScript errors

## 📝 Adding New Tests

To add new test scenarios:

1. **Define new actions** in the `AppActionMap` interface
2. **Create handler components** that register for the actions
3. **Add UI controls** to dispatch the actions
4. **Test the complete flow** from UI to state update

Example:

```typescript
// 1. Add to action map
interface AppActionMap extends ActionPayloadMap {
  // ... existing actions
  newAction: { data: string };
}

// 2. Create handler
useActionHandler('newAction', (payload) => {
  console.log('New action:', payload.data);
});

// 3. Add UI
<button onClick={() => dispatch('newAction', { data: 'test' })}>
  Test New Action
</button>
```

## 🔗 Related

- [Main Library](../context-action) - @context-action/core package
- [Monorepo Root](../../README.md) - Project overview
- [Vite Documentation](https://vitejs.dev/) - Build tool documentation