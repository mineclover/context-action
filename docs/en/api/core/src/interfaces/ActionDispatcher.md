[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionDispatcher

# Interface: ActionDispatcher()\<T\>

Defined in: [packages/core/src/types.ts:1024](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/core/src/types.ts#L1024)

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

`T` *extends* [`ActionPayloadMap`](../type-aliases/ActionPayloadMap.md)

The action payload map interface

## Call Signature

> **ActionDispatcher**&lt;`K`&gt;(`action`, `options?`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/types.ts:1026](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/core/src/types.ts#L1026)

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

Defined in: [packages/core/src/types.ts:1032](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/core/src/types.ts#L1032)

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

Defined in: [packages/core/src/types.ts:1039](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/core/src/types.ts#L1039)

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
