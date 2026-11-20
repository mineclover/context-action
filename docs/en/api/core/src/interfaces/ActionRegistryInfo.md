[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionRegistryInfo

# Interface: ActionRegistryInfo\<T\>

Defined in: [packages/core/src/types.ts:1402](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1402)

Registry information interface for ActionRegister introspection

Provides comprehensive information about the current state of an ActionRegister
instance, including registered actions, handler counts, and execution modes.
Similar to DeclarativeStoreRegistry pattern for consistent registry management.

## Example

```typescript
const info = register.getRegistryInfo()

console.log(`Registry: ${info.name}`)
console.log(`Total actions: ${info.totalActions}`)
console.log(`Total handlers: ${info.totalHandlers}`)
console.log(`Registered actions:`, info.registeredActions)
```

## Type Parameters

### Generic type T

`T` *extends* [`ActionPayloadMap`](../type-aliases/ActionPayloadMap.md)

The action payload map interface

## Properties

### name

> **name**: `string`

Defined in: [packages/core/src/types.ts:1404](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1404)

Registry name

***

### totalActions

> **totalActions**: `number`

Defined in: [packages/core/src/types.ts:1407](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1407)

Total number of registered actions

***

### totalHandlers

> **totalHandlers**: `number`

Defined in: [packages/core/src/types.ts:1410](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1410)

Total number of registered handlers across all actions

***

### registeredActions

> **registeredActions**: keyof `T`[]

Defined in: [packages/core/src/types.ts:1413](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1413)

List of all registered actions

***

### actionExecutionModes

> **actionExecutionModes**: `Map`\<keyof `T`, [`ExecutionMode`](../type-aliases/ExecutionMode.md)\>

Defined in: [packages/core/src/types.ts:1416](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1416)

Execution mode settings per action

***

### defaultExecutionMode

> **defaultExecutionMode**: [`ExecutionMode`](../type-aliases/ExecutionMode.md)

Defined in: [packages/core/src/types.ts:1419](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1419)

Default execution mode
