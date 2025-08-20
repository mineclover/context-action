[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / SimpleActionContextReturn

# Interface: SimpleActionContextReturn\<T\>

Defined in: [packages/react/src/actions/createActionContext.ts:37](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/createActionContext.ts#L37)

Simple Action Context return type with clean, clear API

Provides a minimal interface for action dispatching and handler registration
following the Action Only Pattern. This is the return type from createActionContext.

## Example

```typescript
interface AppActions extends Record<string, any> {
  updateUser: { id: string; name: string }
  deleteUser: { id: string }
  resetApp: void
}

const actionContext: SimpleActionContextReturn<AppActions> = 
  createActionContext<AppActions>('AppActions')
```

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>

Action payload mapping extending Record<string, any>

## Properties

### Provider

> **Provider**: `FC`\<\{ `children`: `ReactNode`; \}\>

Defined in: [packages/react/src/actions/createActionContext.ts:39](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/createActionContext.ts#L39)

Provider component for action context

***

### useAction()

> **useAction**: () => &lt;`K`&gt;(`action`, `payload?`) => `Promise`&lt;`void`&gt;

Defined in: [packages/react/src/actions/createActionContext.ts:42](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/createActionContext.ts#L42)

Hook for dispatching actions

#### Returns

> &lt;`K`&gt;(`action`, `payload?`): `Promise`&lt;`void`&gt;

##### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

##### Parameters

###### action

Type parameter **K**

###### payload?

`T`\[`K`\]

##### Returns

`Promise`&lt;`void`&gt;

***

### useActionHandler()

> **useActionHandler**: &lt;`K`&gt;(`action`, `handler`, `config?`) => `void`

Defined in: [packages/react/src/actions/createActionContext.ts:48](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/createActionContext.ts#L48)

Hook for registering action handlers

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

##### handler

`ActionHandler`\<`T`\[`K`\]\>

##### config?

Type parameter **HandlerConfig**

#### Returns

`void`

***

### contextName

> **contextName**: `string`

Defined in: [packages/react/src/actions/createActionContext.ts:55](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/createActionContext.ts#L55)

Context name identifier
