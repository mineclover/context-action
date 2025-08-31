[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / ActionContextReturn

# Interface: ActionContextReturn\<T\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:36](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/actions/ActionContext.types.ts#L36)

Return type for createActionContext with abort support

## Type Parameters

### T

`T` *extends* `object`

## Properties

### Provider

> **Provider**: `FC`\<\{ `children`: `ReactNode`; \}\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:37](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/actions/ActionContext.types.ts#L37)

***

### useActionContext()

> **useActionContext**: () => [`ActionContextType`](ActionContextType.md)\<`T`\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:38](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/actions/ActionContext.types.ts#L38)

#### Returns

[`ActionContextType`](ActionContextType.md)\<`T`\>

***

### useActionDispatch()

> **useActionDispatch**: () => \<`K`\>(`action`, `payload?`, `options?`) => `Promise`\<`void`\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:39](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/actions/ActionContext.types.ts#L39)

#### Returns

> \<`K`\>(`action`, `payload?`, `options?`): `Promise`\<`void`\>

##### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

##### Parameters

###### action

`K`

###### payload?

`T`\[`K`\]

###### options?

`DispatchOptions`

##### Returns

`Promise`\<`void`\>

***

### useActionHandler()

> **useActionHandler**: \<`K`\>(`action`, `handler`, `config?`) => `void`

Defined in: [packages/react/src/actions/ActionContext.types.ts:40](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/actions/ActionContext.types.ts#L40)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

`K`

##### handler

`ActionHandler`\<`T`\[`K`\]\>

##### config?

`HandlerConfig`

#### Returns

`void`

***

### useActionRegister()

> **useActionRegister**: () => `null` \| `ActionRegister`\<`T`\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:45](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/actions/ActionContext.types.ts#L45)

#### Returns

`null` \| `ActionRegister`\<`T`\>

***

### useActionDispatchWithResult()

> **useActionDispatchWithResult**: () => `object`

Defined in: [packages/react/src/actions/ActionContext.types.ts:46](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/actions/ActionContext.types.ts#L46)

#### Returns

`object`

##### dispatch()

> **dispatch**: \<`K`\>(`action`, `payload?`, `options?`) => `Promise`\<`void`\>

###### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

###### Parameters

###### action

`K`

###### payload?

`T`\[`K`\]

###### options?

`DispatchOptions`

###### Returns

`Promise`\<`void`\>

##### dispatchWithResult()

> **dispatchWithResult**: \<`K`, `R`\>(`action`, `payload?`, `options?`) => `Promise`\<`ExecutionResult`\<`R`\>\>

###### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

###### R

`R` = `void`

###### Parameters

###### action

`K`

###### payload?

`T`\[`K`\]

###### options?

`DispatchOptions`

###### Returns

`Promise`\<`ExecutionResult`\<`R`\>\>

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

> **context**: `Context`\<`null` \| [`ActionContextType`](ActionContextType.md)\<`T`\>\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:60](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/actions/ActionContext.types.ts#L60)
