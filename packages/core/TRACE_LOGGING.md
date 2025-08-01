# Context-Action Core Trace Logging

Debug your action pipelines with comprehensive trace logging functionality using `.env` configuration.

## Quick Start with .env

### 1. Create .env File

Copy the sample configuration:
```bash
cp .env.sample .env
```

### 2. Configure Logging

Edit your `.env` file:
```bash
# .env
CONTEXT_ACTION_TRACE=true
CONTEXT_ACTION_DEBUG=true
CONTEXT_ACTION_LOGGER_NAME=MyApp
```

### 3. Use in Your Application

```typescript
// Load .env file first (must be at the top)
import 'dotenv/config';
import { ActionRegister } from '@context-action/core';

// Logger automatically reads from .env
const actionRegister = new ActionRegister();
// Will use settings from .env file
```

## Configuration Options (.env)

### Essential Settings
```bash
# Quick trace enable (most detailed logging)
CONTEXT_ACTION_TRACE=true

# Enable debug mode (additional context)
CONTEXT_ACTION_DEBUG=true

# Custom logger name (useful for multiple instances)
CONTEXT_ACTION_LOGGER_NAME=MyActionRegister
```

### Advanced Settings
```bash
# Specific log level (overrides TRACE and DEBUG)
CONTEXT_ACTION_LOG_LEVEL=DEBUG

# Auto-configure based on environment
NODE_ENV=development  # Enables DEBUG level by default
NODE_ENV=production   # Uses ERROR level by default
```

## Log Levels

```typescript
enum LogLevel {
  TRACE = 0,    // Most detailed - shows all internal operations
  DEBUG = 1,    // Debug information and important events
  INFO = 2,     // General information
  WARN = 3,     // Warnings and potential issues
  ERROR = 4,    // Errors only
  NONE = 5      // No logging
}
```

## What Gets Traced

### Constructor & Initialization
- ActionRegister instantiation
- Configuration details
- Logger setup

### Handler Registration
- Handler registration process
- Pipeline creation and management
- Priority sorting
- Duplicate handler detection
- Unregistration process

### Action Dispatch
- Action dispatch initiation
- Pipeline lookup and validation
- Handler execution flow
- Payload modifications
- Pipeline abortion
- Completion metrics

### Pipeline Execution
- Handler-by-handler execution
- Condition checking
- Async handler waiting
- Error handling
- One-time handler removal

### Utility Operations
- Handler counting
- Action existence checks
- Pipeline clearing
- State queries

## Example Trace Output

```bash
# Set trace mode
export CONTEXT_ACTION_TRACE=true

# Run your application
node your-app.js
```

Example output:
```
[TRACE] TestRegister constructor called {"config":{"name":"TestRegister","debug":true}}
[INFO] TestRegister initialized {"logLevel":3,"debug":true}
[TRACE] TestRegister constructor completed
[TRACE] Registering handler for action 'simpleAction' {"priority":10,"id":"handler1"}
[TRACE] Generated handler ID: handler1
[TRACE] Created handler registration {"registration":{"id":"handler1","config":{"priority":10,"id":"handler1","blocking":false,"once":false}}}
[TRACE] Creating new pipeline for action: simpleAction
[DEBUG] Created pipeline for action: simpleAction
[TRACE] Current pipeline for 'simpleAction' has 0 handlers
[TRACE] Added handler to pipeline, current length: 1
[TRACE] Pipeline sorted by priority [{"id":"handler1","priority":10}]
[DEBUG] Registered handler for action 'simpleAction' {"handlerId":"handler1","priority":10,"blocking":false,"once":false}
[TRACE] Starting dispatch for action 'simpleAction' {"action":"simpleAction","startTime":1703123456789}
[TRACE] Emitted 'action:start' event
[DEBUG] Dispatching action 'simpleAction' {"payload":undefined}
[TRACE] Found 1 handlers for action 'simpleAction' {"handlerIds":["handler1"]}
[TRACE] Starting pipeline execution {"action":"simpleAction","handlerCount":1,"payload":undefined}
[TRACE] Executing handler 1/1 {"handlerId":"handler1","priority":10,"blocking":false,"once":false}
[TRACE] Calling handler 'handler1'
[TRACE] Handler 'handler1' returned {"isPromise":false,"blocking":false}
[TRACE] Handler 'handler1' completed successfully
[DEBUG] Completed action 'simpleAction' {"action":"simpleAction","executionTime":2,"handlerCount":1,"success":true,"timestamp":1703123456791}
```

## Environment Variables Reference

| Variable | Values | Description |
|----------|--------|-------------|
| `CONTEXT_ACTION_TRACE` | `true`, `1`, `false`, `0` | Quick enable trace logging (most detailed) |
| `CONTEXT_ACTION_DEBUG` | `true`, `1`, `false`, `0` | Enable debug mode with additional context |
| `CONTEXT_ACTION_LOG_LEVEL` | `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`, `NONE` | Set specific log level (overrides TRACE/DEBUG flags) |
| `CONTEXT_ACTION_LOGGER_NAME` | any string | Custom name for logger instances |
| `NODE_ENV` | `development`, `production` | Auto-configures logging level |

## .env File Examples

### Development Configuration
```bash
# .env
NODE_ENV=development
CONTEXT_ACTION_TRACE=true
CONTEXT_ACTION_DEBUG=true
CONTEXT_ACTION_LOGGER_NAME=DevApp
```

### Production Configuration
```bash
# .env
NODE_ENV=production
CONTEXT_ACTION_LOG_LEVEL=ERROR
CONTEXT_ACTION_DEBUG=false
CONTEXT_ACTION_LOGGER_NAME=ProdApp
```

### Debug Specific Issues
```bash
# .env
CONTEXT_ACTION_LOG_LEVEL=DEBUG
CONTEXT_ACTION_DEBUG=true
CONTEXT_ACTION_LOGGER_NAME=DebugSession
```

## Performance Considerations

- **Trace logging is verbose** - only enable in development/debugging
- **Production impact** - disable trace logging in production (use ERROR level)
- **Log filtering** - Use appropriate log levels to reduce noise
- **Environment-based** - Control logging through environment variables

## Integration with Other Packages

The trace logging works seamlessly with other Context-Action packages:

```typescript
// React integration with trace logging
import 'dotenv/config'; // Load .env first
import { ActionRegister } from '@context-action/core';
import { ActionProvider } from '@context-action/react';

// Logger will be inherited by React components
const actionRegister = new ActionRegister(); // Uses .env configuration

function App() {
  return (
    <ActionProvider actionRegister={actionRegister}>
      {/* Your app components */}
    </ActionProvider>
  );
}
```

### Important Notes

1. **Load dotenv first**: Always import `'dotenv/config'` at the very top of your entry file
2. **Single import**: Only load dotenv once in your main application entry point
3. **Environment-specific**: Use different .env files for different environments (.env.development, .env.production)

## Troubleshooting

### No Trace Output?
1. Check environment variables are set correctly
2. Verify log level configuration
3. Ensure you're using a console that supports debug output

### Too Much Output?
1. Use `DEBUG` level instead of `TRACE`
2. Set specific log level: `CONTEXT_ACTION_LOG_LEVEL=INFO`
3. Filter by component name in your log viewer

### Performance Issues?
1. Disable trace logging in production
2. Use conditional logging based on environment
3. Consider using `NoopLogger` for production builds

## Advanced Usage

### Custom Logger Implementation

```typescript
import { Logger, LogLevel } from '@context-action/core';

class CustomLogger implements Logger {
  trace(message: string, data?: any): void {
    // Custom trace implementation
    console.log(`🔍 ${message}`, data);
  }
  
  debug(message: string, data?: any): void {
    console.log(`🐛 ${message}`, data);
  }
  
  // ... implement other methods
}

const actionRegister = new ActionRegister({
  logger: new CustomLogger()
});
```

### Conditional Logging

```typescript
const actionRegister = new ActionRegister({
  logLevel: process.env.NODE_ENV === 'development' 
    ? LogLevel.TRACE 
    : LogLevel.ERROR
});
```