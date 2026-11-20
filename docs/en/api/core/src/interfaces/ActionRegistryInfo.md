[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/core/src](../README.md) / ActionRegistryInfo

# Interface: ActionRegistryInfo\<T\>

Defined in: [packages/core/src/types.ts:1238](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1238)

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

Defined in: [packages/core/src/types.ts:1240](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1240)

Registry name

***

### totalActions

> **totalActions**: `number`

Defined in: [packages/core/src/types.ts:1243](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1243)

Total number of registered actions

***

### totalHandlers

> **totalHandlers**: `number`

Defined in: [packages/core/src/types.ts:1246](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1246)

Total number of registered handlers across all actions

***

### registeredActions

> **registeredActions**: keyof `T`[]

Defined in: [packages/core/src/types.ts:1249](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1249)

List of all registered actions

***

### actionExecutionModes

> **actionExecutionModes**: `Map`\<keyof `T`, [`ExecutionMode`](../type-aliases/ExecutionMode.md)\>

Defined in: [packages/core/src/types.ts:1252](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1252)

Execution mode settings per action

***

### defaultExecutionMode

> **defaultExecutionMode**: [`ExecutionMode`](../type-aliases/ExecutionMode.md)

Defined in: [packages/core/src/types.ts:1255](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1255)

Default execution mode
