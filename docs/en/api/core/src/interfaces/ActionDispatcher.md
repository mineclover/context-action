[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionDispatcher

# Interface: ActionDispatcher()\<T\>

Defined in: [packages/core/src/types.ts:755](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/types.ts#L755)

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

Defined in: [packages/core/src/types.ts:757](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/types.ts#L757)

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

Defined in: [packages/core/src/types.ts:763](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/types.ts#L763)

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

Defined in: [packages/core/src/types.ts:770](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/core/src/types.ts#L770)

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
