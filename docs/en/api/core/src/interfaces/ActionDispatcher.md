[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionDispatcher

# Interface: ActionDispatcher()\<T\>

Defined in: [packages/core/src/types.ts:755](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L755)

Type-safe action dispatcher interface

Provides overloaded dispatch methods that enforce correct payload types
based on the action being dispatched. Automatically handles actions
that require no payload versus those that do.

## Example

```typescript
interface AppActions extends ActionPayloadMap {
  resetApp: void
  updateUser: { id: string; name: string }
}

const dispatch: ActionDispatcher<AppActions> = register.dispatch.bind(register)

// No payload required - type-checked
await dispatch('resetApp')

// Payload required and type-checked
await dispatch('updateUser', { id: '123', name: 'John' })
```

## Type Parameters

### T

`T` *extends* [`ActionPayloadMap`](ActionPayloadMap.md)

The action payload map interface

## Call Signature

> **ActionDispatcher**\<`K`\>(`action`, `options?`): `Promise`\<`void`\>

Defined in: [packages/core/src/types.ts:757](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L757)

Dispatch an action that doesn't require a payload

### Type Parameters

#### K

`K` *extends* `string` \| `number` \| `symbol`

### Parameters

#### action

`K`

#### options?

[`DispatchOptions`](DispatchOptions.md)

### Returns

`Promise`\<`void`\>

## Call Signature

> **ActionDispatcher**\<`K`\>(`action`, `payload?`, `options?`): `Promise`\<`void`\>

Defined in: [packages/core/src/types.ts:763](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L763)

Dispatch an action with optional payload parameter

### Type Parameters

#### K

`K` *extends* `string` \| `number` \| `symbol`

### Parameters

#### action

`K`

#### payload?

`undefined`

#### options?

[`DispatchOptions`](DispatchOptions.md)

### Returns

`Promise`\<`void`\>

## Call Signature

> **ActionDispatcher**\<`K`\>(`action`, `payload`, `options?`): `Promise`\<`void`\>

Defined in: [packages/core/src/types.ts:770](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/core/src/types.ts#L770)

Dispatch an action that requires a payload

### Type Parameters

#### K

`K` *extends* `string` \| `number` \| `symbol`

### Parameters

#### action

`K`

#### payload

`T`\[`K`\]

#### options?

[`DispatchOptions`](DispatchOptions.md)

### Returns

`Promise`\<`void`\>
