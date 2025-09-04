# ActionRegisterConfig Interface

## 1. Purpose

The `ActionRegisterConfig` interface is used to provide configuration options when initializing a new `ActionRegister` instance. It allows for customization of the register's name, debugging verbosity, default execution modes, and other advanced behaviors.

## 2. Structure

The `ActionRegisterConfig` interface has the following properties:

```typescript
export interface ActionRegisterConfig {
  /** Name identifier for this ActionRegister instance */
  name?: string;
  
  /** Registry-specific configuration options */
  registry?: {
    /** Debug mode for registry operations - enables detailed logging */
    debug?: boolean;
    
    /** Auto-cleanup configuration for one-time handlers */
    autoCleanup?: boolean;
    
    /** Default execution mode for actions */
    defaultExecutionMode?: ExecutionMode;
    
    /** Use concurrency queue for thread safety. Default: true */
    useConcurrencyQueue?: boolean;
    
    /** Maximum number of handlers per action. Default: 1000. Use Infinity to disable limit (not recommended) */
    maxHandlersPerAction?: number;
    
    /** Global error handler for unhandled errors */
    errorHandler?: (error: Error, context: unknown) => void;
  };
}
```

## 3. Usage Patterns

You pass an `ActionRegisterConfig` object to the `ActionRegister` constructor.

### Basic Configuration

Provide a `name` for easier debugging and set a `defaultExecutionMode`.

```typescript
import { ActionRegister, ActionRegisterConfig } from '@context-action/core';

const config: ActionRegisterConfig = {
  name: 'MyActionRegister',
  registry: {
    defaultExecutionMode: 'sequential',
  },
};

const actionRegister = new ActionRegister(config);
```

### Debugging and Development

In a development environment, you can enable `debug` mode for verbose logging.

```typescript
const devConfig: ActionRegisterConfig = {
  name: 'DevActionRegister',
  registry: {
    debug: process.env.NODE_ENV === 'development',
    defaultExecutionMode: 'parallel',
  },
};

const devActionRegister = new ActionRegister(devConfig);
```

### Advanced Configuration

You can set limits on handlers, provide a global error handler, and configure other advanced features.

```typescript
const advancedConfig: ActionRegisterConfig = {
  name: 'AdvancedActionRegister',
  registry: {
    maxHandlersPerAction: 50,
    errorHandler: (error, context) => {
      console.error(`An error occurred in the action register: ${error.message}`, context);
    },
  },
};

const advancedActionRegister = new ActionRegister(advancedConfig);
```

## 4. TypeDoc Link

[ActionRegisterConfig in types.ts](../../../packages/core/src/types.ts)
