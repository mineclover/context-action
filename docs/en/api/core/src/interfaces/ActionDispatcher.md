[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionDispatcher

# Interface: ActionDispatcher()\<T\>

Defined in: [packages/core/src/types.ts:817](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L817)

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

Defined in: [packages/core/src/types.ts:819](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L819)

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

Defined in: [packages/core/src/types.ts:825](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L825)

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

Defined in: [packages/core/src/types.ts:832](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/core/src/types.ts#L832)

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
