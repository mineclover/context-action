# ActionRegister Class Guide

Core action pipeline management for type-safe handler execution.

## Purpose
Central hub for action registration, dispatch, and execution with priority-based handler management.

## Core Methods

### register()
```typescript
register<K, R>(action: K, handler: ActionHandler<T[K], R>, config?: HandlerConfig): UnregisterFunction
```
- **Purpose**: Register action handler with priority/configuration
- **Returns**: Cleanup function to remove handler
- **Usage**: Handler registration, priority ordering, metadata

### dispatch()
```typescript
dispatch<K>(action: K, payload?: T[K], options?: DispatchOptions): Promise<void>
```
- **Purpose**: Execute all handlers for action type
- **Usage**: Fire-and-forget action execution
- **Options**: Execution mode, filters, throttling

### dispatchWithResult()
```typescript
dispatchWithResult<K, R>(action: K, payload?: T[K], options?: DispatchOptions): Promise<ExecutionResult<R>>
```
- **Purpose**: Execute handlers and collect detailed results
- **Returns**: Success/error status, results collection
- **Usage**: Result processing, error handling, debugging

## Execution Control

### setExecutionMode()
```typescript
setExecutionMode(mode: ExecutionMode): void
setActionExecutionMode<K>(action: K, mode: ExecutionMode): void
```
- **Global**: Set default execution mode for all actions
- **Per-Action**: Override execution mode for specific action
- **Modes**: `'sequential' | 'parallel' | 'race'`

## Handler Management

### Introspection
```typescript
getHandlerCount<K>(action: K): number           // Count handlers for action
hasHandlers<K>(action: K): boolean              // Check if handlers exist
getRegisteredActions(): keyof T[]               // Get all action types
```

### Cleanup
```typescript
clearAction<K>(action: K): void                 // Remove all handlers for action
clearAll(): void                                // Remove all handlers
destroy(): void                                 // Complete cleanup + memory management
```

## Statistics & Debugging

### Registry Information
```typescript
getRegistryInfo(): ActionRegistryInfo<T>        // Comprehensive registry data
getActionStats<K>(action: K): ActionHandlerStats<T> | null  // Per-action stats
getAllActionStats(): ActionHandlerStats<T>[]    // All action statistics
```

### Debug Support
```typescript
getName(): string                               // Registry name
isDebugEnabled(): boolean                       // Check debug mode
getRegistryConfig(): ActionRegisterConfig       // Current configuration
```

## Usage Patterns

### Basic Pipeline Setup
```typescript
const register = new ActionRegister<MyActions>({ 
  defaultExecutionMode: 'sequential',
  debug: true 
});

// Register handlers with priority
const unregister = register.register('userAction', handler, { priority: 100 });

// Dispatch actions
await register.dispatch('userAction', payload);
```

### Advanced Configuration
```typescript
// Per-action execution modes
register.setActionExecutionMode('criticalAction', 'parallel');

// Handler configuration
register.register('complexAction', handler, {
  priority: 200,
  id: 'critical-handler',
  metadata: { category: 'business-logic' }
});

// Result collection
const result = await register.dispatchWithResult('dataAction', payload);
if (result.success) {
  console.log('Results:', result.results);
} else {
  console.error('Errors:', result.errors);
}
```

### Memory Management
```typescript
// Cleanup specific handlers
const unregister = register.register('tempAction', handler);
unregister(); // Remove this handler

// Cleanup all handlers for action
register.clearAction('tempAction');

// Complete cleanup
register.destroy(); // Call when ActionRegister no longer needed
```

## Performance Considerations

- **Sequential**: Default mode, priority-based execution
- **Parallel**: Independent handlers, better performance
- **Race**: First successful result, fallback patterns
- **Handler Limits**: Default 1000 handlers per action (configurable)
- **Memory**: Call `destroy()` for proper cleanup

## Error Handling

- **Handler Errors**: Isolated, don't affect other handlers
- **Pipeline Control**: Use `PipelineController` for abort/control
- **Global Error Handler**: Configure via `ActionRegisterConfig.errorHandler`
- **Debug Mode**: Enable detailed logging via `debug: true`

## Integration

- **Type Safety**: Extends `ActionPayloadMap` for compile-time validation
- **React Integration**: Used by `createActionContext()`
- **Pattern Support**: Core of Action-Only pattern
- **Framework Agnostic**: Pure TypeScript, no dependencies

## Links

- **TypeDoc**: [ActionRegister.md](./core/src/classes/ActionRegister.md)
- **Usage Guide**: [Action Patterns](/en/guide/patterns/action/)
- **Examples**: [Basic Usage](/en/guide/patterns/action/basic-usage)