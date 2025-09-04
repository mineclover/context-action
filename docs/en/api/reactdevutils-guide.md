# ReactDevUtils Variable

## 1. Purpose

The `ReactDevUtils` object provides a collection of utility functions specifically designed to aid in debugging and development within React environments when using the `@context-action` framework. It offers features like enabling debug mode, logging React-specific information, and retrieving statistics about React integration.

## 2. Structure

`ReactDevUtils` is a constant object with the following methods:

```typescript
export const ReactDevUtils = {
  // Enables detailed React integration debugging.
  enableDebugMode(): void { /* ... */ },

  // Disables React integration debugging.
  disableDebugMode(): void { /* ... */ },

  // Checks if React debug mode is enabled.
  isDebugMode(): boolean { /* ... */ },

  // Logs React-specific debugging information.
  log(component: string, action: string, message: string, data?: any): void { /* ... */ },

  // Gets React integration statistics.
  getStats(registry: ActionRegister<any>): {
    totalHandlers: number;
    reactHandlers: number;
    registryInfo: ReturnType<ActionRegister<any>['getRegistryInfo']>;
  } { /* ... */ },
};
```

## 3. Usage Patterns

`ReactDevUtils` is primarily used in development environments for debugging and monitoring.

### Enabling Debug Mode

You can enable debug mode to get more verbose logging in the console.

```typescript
import { ReactDevUtils } from '@context-action/core';

ReactDevUtils.enableDebugMode();
```

### Logging Debug Information

When debug mode is enabled, you can use the `log` method to output specific debugging messages.

```typescript
import { ReactDevUtils } from '@context-action/core';

if (ReactDevUtils.isDebugMode()) {
  ReactDevUtils.log('MyComponent', 'dataFetch', 'Data fetched successfully', { data: fetchedData });
}
```

### Getting Statistics

You can retrieve statistics about the React integration, such as the number of handlers.

```typescript
import { ReactDevUtils, ActionRegister } from '@context-action/core';

const myRegister = new ActionRegister();
// ... register some handlers

const stats = ReactDevUtils.getStats(myRegister);
console.log('Total handlers:', stats.totalHandlers);
console.log('React handlers:', stats.reactHandlers);
```

## 4. TypeDoc Link

[ReactDevUtils in react-helpers.ts](../../../packages/core/src/react-helpers.ts)