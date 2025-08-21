[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / ActionContextReturn

# Interface: ActionContextReturn\<T\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:36](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/actions/ActionContext.types.ts#L36)

Return type for createActionContext with abort support

## Type Parameters

### Generic type T

`T` *extends* `object`

## Properties

### Provider

> **Provider**: `FC`\<\{ `children`: `ReactNode`; \}\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:37](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/actions/ActionContext.types.ts#L37)

***

### useActionContext()

> **useActionContext**: () => [`ActionContextType`](ActionContextType.md)&lt;`T`&gt;

Defined in: [packages/react/src/actions/ActionContext.types.ts:38](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/actions/ActionContext.types.ts#L38)

#### Returns

[`ActionContextType`](ActionContextType.md)&lt;`T`&gt;

***

### useActionDispatch()

> **useActionDispatch**: () => &lt;`K`&gt;(`action`, `payload?`, `options?`) => `Promise`&lt;`void`&gt;

Defined in: [packages/react/src/actions/ActionContext.types.ts:39](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/actions/ActionContext.types.ts#L39)

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

Defined in: [packages/react/src/actions/ActionContext.types.ts:40](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/actions/ActionContext.types.ts#L40)

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

Defined in: [packages/react/src/actions/ActionContext.types.ts:45](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/actions/ActionContext.types.ts#L45)

#### Returns

`null` \| `ActionRegister`&lt;`T`&gt;

***

### useActionDispatchWithResult()

> **useActionDispatchWithResult**: () => `object`

Defined in: [packages/react/src/actions/ActionContext.types.ts:46](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/actions/ActionContext.types.ts#L46)

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

Defined in: [packages/react/src/actions/ActionContext.types.ts:60](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/actions/ActionContext.types.ts#L60)
