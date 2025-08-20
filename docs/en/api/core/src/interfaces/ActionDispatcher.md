[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionDispatcher

# Interface: ActionDispatcher()\<T\>

Defined in: [packages/core/src/types.ts:844](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L844)

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

### Generic type T

`T` *extends* [`ActionPayloadMap`](ActionPayloadMap.md)

The action payload map interface

## Call Signature

> **ActionDispatcher**&lt;`K`&gt;(`action`, `options?`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/types.ts:846](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L846)

Dispatch an action that doesn't require a payload

### Type Parameters

#### K

`K` *extends* `string` \| `number` \| `symbol`

### Parameters

#### action

Type parameter **K**

#### options?

[`DispatchOptions`](DispatchOptions.md)

### Returns

`Promise`&lt;`void`&gt;

## Call Signature

> **ActionDispatcher**&lt;`K`&gt;(`action`, `payload?`, `options?`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/types.ts:852](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L852)

Dispatch an action with optional payload parameter

### Type Parameters

#### K

`K` *extends* `string` \| `number` \| `symbol`

### Parameters

#### action

Type parameter **K**

#### payload?

`undefined`

#### options?

[`DispatchOptions`](DispatchOptions.md)

### Returns

`Promise`&lt;`void`&gt;

## Call Signature

> **ActionDispatcher**&lt;`K`&gt;(`action`, `payload`, `options?`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/types.ts:859](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/core/src/types.ts#L859)

Dispatch an action that requires a payload

### Type Parameters

#### K

`K` *extends* `string` \| `number` \| `symbol`

### Parameters

#### action

Type parameter **K**

#### payload

`T`\[`K`\]

#### options?

[`DispatchOptions`](DispatchOptions.md)

### Returns

`Promise`&lt;`void`&gt;
