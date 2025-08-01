# @context-action/core

Type-safe action pipeline management library for JavaScript/TypeScript applications.

## Installation

```bash
npm install @context-action/core dotenv
```

## Quick Start

### 1. Setup Environment Configuration

```bash
# Copy sample configuration
cp .env.sample .env

# Quick setup for maximum debugging detail
echo "NODE_ENV=development" >> .env
echo "CONTEXT_ACTION_TRACE=true" >> .env
echo "CONTEXT_ACTION_DEBUG=true" >> .env
echo "CONTEXT_ACTION_LOGGER_NAME=MyApp" >> .env
```

### 2. Basic Usage

```typescript
// Load environment variables first
import 'dotenv/config';
import { ActionRegister } from '@context-action/core';

// Define your action types
interface MyActions {
  increment: void;
  setCount: number;
  updateUser: { id: string; name: string };
}

// Create action register
const actions = new ActionRegister<MyActions>();

// Register handlers
actions.register('increment', (_, controller) => {
  console.log('Increment called');
  controller.next();
});

actions.register('setCount', (count, controller) => {
  console.log(`Setting count to: ${count}`);
  controller.next();
});

// Dispatch actions
await actions.dispatch('increment');
await actions.dispatch('setCount', 42);
```

## Environment Variables

| Variable | Description | Default | Max Detail |
|----------|-------------|---------|------------|
| `CONTEXT_ACTION_TRACE` | Enable detailed trace logging | `false` | `true` |
| `CONTEXT_ACTION_DEBUG` | Enable debug mode | `false` | `true` |
| `CONTEXT_ACTION_LOG_LEVEL` | Set specific log level (`TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`, `NONE`) | `ERROR` | `TRACE` |
| `CONTEXT_ACTION_LOGGER_NAME` | Custom logger name | `ActionRegister` | `YourAppName` |
| `NODE_ENV` | Auto-configure logging (`development` = DEBUG, `production` = ERROR) | - | `development` |

**💡 Tip**: For maximum debugging detail, set all variables in the "Max Detail" column.

## Features

- **Type-safe actions** - Full TypeScript support with compile-time checking
- **Priority-based execution** - Control handler execution order
- **Pipeline control** - Abort, modify payloads, conditional execution
- **Event system** - Listen to action lifecycle events
- **Comprehensive logging** - Detailed trace logging for debugging
- **Environment-based configuration** - Easy .env setup

## Advanced Usage

### Handler Configuration

```typescript
actions.register('myAction', handler, {
  priority: 10,        // Higher priority executes first
  blocking: true,      // Wait for async handlers
  once: true,         // Remove after first execution
  condition: () => shouldRun, // Conditional execution
  id: 'my-handler'    // Custom handler ID
});
```

### Pipeline Control

```typescript
actions.register('validate', (data, controller) => {
  if (!data.isValid) {
    controller.abort('Validation failed');
    return;
  }
  
  // Modify data for next handlers
  controller.modifyPayload(data => ({ ...data, validated: true }));
  controller.next();
});
```

### Event Listeners

```typescript
actions.on('action:start', ({ action, payload }) => {
  console.log(`Starting ${action}`, payload);
});

actions.on('action:complete', ({ action, metrics }) => {
  console.log(`Completed ${action} in ${metrics.executionTime}ms`);
});
```

## Debugging

### Maximum Detail Logging

For the most comprehensive debugging experience, use this .env configuration:

```bash
# .env - Maximum detail logging configuration
NODE_ENV=development
CONTEXT_ACTION_TRACE=true
CONTEXT_ACTION_DEBUG=true
CONTEXT_ACTION_LOGGER_NAME=DetailedApp

# This configuration will show:
# - Every function call and return
# - Handler registration and execution details
# - Pipeline flow and state changes
# - Payload modifications and conditions
# - Performance metrics and timing
# - Error details and stack traces
```

### Common Debug Configurations

```bash
# Development - Balanced detail
NODE_ENV=development
CONTEXT_ACTION_DEBUG=true
CONTEXT_ACTION_LOGGER_NAME=DevApp

# Production Debug - Errors only with context
NODE_ENV=production
CONTEXT_ACTION_LOG_LEVEL=ERROR
CONTEXT_ACTION_DEBUG=true
CONTEXT_ACTION_LOGGER_NAME=ProdApp

# Issue Investigation - Specific level
CONTEXT_ACTION_LOG_LEVEL=DEBUG
CONTEXT_ACTION_DEBUG=true
CONTEXT_ACTION_LOGGER_NAME=InvestigationSession
```

### Test Your Configuration

After setting up your .env file, test that maximum detail logging is working:

```bash
# Create a quick test file
echo "import 'dotenv/config';
import { ActionRegister } from '@context-action/core';

const actions = new ActionRegister();
actions.register('test', (payload, controller) => {
  console.log('Handler executed:', payload);
  controller.next();
});
await actions.dispatch('test', { message: 'Hello!' });" > test-logging.js

# Run the test
node test-logging.js
```

You should see detailed TRACE and DEBUG output if configured correctly.

### Troubleshooting

**Not seeing trace output?**

1. **Check dependencies**: Make sure `dotenv` is installed
   ```bash
   npm install dotenv
   # or
   pnpm install dotenv
   ```

2. **Verify .env file**: Confirm your .env file exists and has the correct settings
   ```bash
   cat .env
   # Should show: CONTEXT_ACTION_TRACE=true
   ```

3. **Check import order**: `dotenv/config` must be imported first
   ```typescript
   import 'dotenv/config'; // MUST be first
   import { ActionRegister } from '@context-action/core';
   ```

4. **Rebuild if needed**: After installing dotenv, rebuild the project if using a bundler

For detailed debugging information, see [TRACE_LOGGING.md](./TRACE_LOGGING.md).

## API Reference

### ActionRegister<T>

Main class for managing action pipelines.

- `register<K>(action, handler, config?)` - Register action handler
- `dispatch<K>(action, payload?)` - Dispatch action through pipeline
- `getHandlerCount(action)` - Get number of handlers for action
- `hasHandlers(action)` - Check if action has handlers
- `clearAction(action)` - Remove all handlers for action
- `clearAll()` - Remove all handlers
- `on(event, handler)` - Add event listener

### Configuration Options

```typescript
interface ActionRegisterConfig {
  logger?: Logger;           // Custom logger implementation
  logLevel?: LogLevel;       // Log filtering level
  name?: string;            // Logger name
  debug?: boolean;          // Enable debug mode
}
```

## TypeScript Support

Full TypeScript support with compile-time type checking:

```typescript
interface AppActions {
  // Action without payload
  reset: void;
  
  // Action with payload
  setUser: { id: string; name: string };
  
  // Action with optional payload
  navigate: string | undefined;
}

const actions = new ActionRegister<AppActions>();

// ✅ Type-safe dispatch
await actions.dispatch('reset');
await actions.dispatch('setUser', { id: '1', name: 'John' });

// ❌ TypeScript error - missing payload
await actions.dispatch('setUser');

// ❌ TypeScript error - wrong payload type
await actions.dispatch('setUser', 'invalid');
```

## License

Apache-2.0

## Contributing

See the main [repository](https://github.com/mineclover/context-action) for contribution guidelines.