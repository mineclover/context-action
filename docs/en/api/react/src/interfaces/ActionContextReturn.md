[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / ActionContextReturn

# Interface: ActionContextReturn\<T\>

Defined in: [packages/react/src/actions/ActionContext.tsx:28](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/ActionContext.tsx#L28)

Return type for createActionContext with abort support

## Type Parameters

### Generic type T

`T` *extends* `object`

## Properties

### Provider

> **Provider**: `FC`\<\{ `children`: `ReactNode`; \}\>

Defined in: [packages/react/src/actions/ActionContext.tsx:29](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/ActionContext.tsx#L29)

***

### useActionContext()

> **useActionContext**: () => [`ActionContextType`](ActionContextType.md)&lt;`T`&gt;

Defined in: [packages/react/src/actions/ActionContext.tsx:30](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/ActionContext.tsx#L30)

#### Returns

[`ActionContextType`](ActionContextType.md)&lt;`T`&gt;

***

### useActionDispatch()

> **useActionDispatch**: () => &lt;`K`&gt;(`action`, `payload?`, `options?`) => `Promise`&lt;`void`&gt;

Defined in: [packages/react/src/actions/ActionContext.tsx:31](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/ActionContext.tsx#L31)

#### Returns

> &lt;`K`&gt;(`action`, `payload?`, `options?`): `Promise`&lt;`void`&gt;

##### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

##### Parameters

###### action

Type parameter **K**

###### payload?

`T`\[`K`\]

###### options?

Type parameter **DispatchOptions**

##### Returns

`Promise`&lt;`void`&gt;

***

### useActionHandler()

> **useActionHandler**: &lt;`K`&gt;(`action`, `handler`, `config?`) => `void`

Defined in: [packages/react/src/actions/ActionContext.tsx:32](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/ActionContext.tsx#L32)

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

### useActionRegister()

> **useActionRegister**: () => `null` \| `ActionRegister`&lt;`T`&gt;

Defined in: [packages/react/src/actions/ActionContext.tsx:37](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/ActionContext.tsx#L37)

#### Returns

`null` \| `ActionRegister`&lt;`T`&gt;

***

### useActionDispatchWithResult()

> **useActionDispatchWithResult**: () => `object`

Defined in: [packages/react/src/actions/ActionContext.tsx:38](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/ActionContext.tsx#L38)

#### Returns

`object`

##### dispatch()

> **dispatch**: &lt;`K`&gt;(`action`, `payload?`, `options?`) => `Promise`&lt;`void`&gt;

###### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

###### Parameters

###### action

Type parameter **K**

###### payload?

`T`\[`K`\]

###### options?

Type parameter **DispatchOptions**

###### Returns

`Promise`&lt;`void`&gt;

##### dispatchWithResult()

> **dispatchWithResult**: \<`K`, `R`\>(`action`, `payload?`, `options?`) => `Promise`\<`ExecutionResult`&lt;`R`&gt;\>

###### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

###### R

`R` = `void`

###### Parameters

###### action

Type parameter **K**

###### payload?

`T`\[`K`\]

###### options?

Type parameter **DispatchOptions**

###### Returns

`Promise`\<`ExecutionResult`&lt;`R`&gt;\>

##### abortAll()

> **abortAll**: () => `void`

###### Returns

`void`

##### resetAbortScope()

> **resetAbortScope**: () => `void`

###### Returns

`void`

***

### context

> **context**: `Context`\<`null` \| [`ActionContextType`](ActionContextType.md)&lt;`T`&gt;\>

Defined in: [packages/react/src/actions/ActionContext.tsx:52](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/ActionContext.tsx#L52)
