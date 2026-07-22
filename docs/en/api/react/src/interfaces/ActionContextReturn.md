[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / ActionContextReturn

# Interface: ActionContextReturn\<T\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:76](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/actions/ActionContext.types.ts#L76)

Return type for createActionContext with abort support

## Type Parameters

### Generic type T

`T` *extends* `object`

## Properties

### Provider

> **Provider**: `FC`\<\{ `children`: `ReactNode`; \}\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:77](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/actions/ActionContext.types.ts#L77)

***

### useActionContext

> **useActionContext**: () => [`ActionContextType`](ActionContextType.md)&lt;`T`&gt;

Defined in: [packages/react/src/actions/ActionContext.types.ts:78](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/actions/ActionContext.types.ts#L78)

#### Returns

[`ActionContextType`](ActionContextType.md)&lt;`T`&gt;

***

### useActionDispatch

> **useActionDispatch**: () => \{&lt;`K`&gt;(`action`, `payload`, `options?`): `Promise`&lt;`void`&gt;; &lt;`K`&gt;(`action`, `payload?`, `options?`): `Promise`&lt;`void`&gt;; \}

Defined in: [packages/react/src/actions/ActionContext.types.ts:79](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/actions/ActionContext.types.ts#L79)

#### Returns

\{&lt;`K`&gt;(`action`, `payload`, `options?`): `Promise`&lt;`void`&gt;; &lt;`K`&gt;(`action`, `payload?`, `options?`): `Promise`&lt;`void`&gt;; \}

***

### useActionHandler

> **useActionHandler**: \<`K`, `R`\>(`action`, `handler`, `config?`) => `void`

Defined in: [packages/react/src/actions/ActionContext.types.ts:80](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/actions/ActionContext.types.ts#L80)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

##### R

`R` = `void`

#### Parameters

##### action

Type parameter **K**

##### handler

`ActionContextHandler`\<`T`\[`K`\], `R`\>

##### config?

`HandlerConfig`&lt;`unknown`&gt;

#### Returns

`void`

***

### useActionRegister

> **useActionRegister**: () => `ActionRegister`&lt;`T`&gt; \| `null`

Defined in: [packages/react/src/actions/ActionContext.types.ts:85](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/actions/ActionContext.types.ts#L85)

#### Returns

`ActionRegister`&lt;`T`&gt; \| `null`

***

### useActionDispatchWithResult

> **useActionDispatchWithResult**: () => `object`

Defined in: [packages/react/src/actions/ActionContext.types.ts:86](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/actions/ActionContext.types.ts#L86)

#### Returns

`object`

##### dispatch

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

##### dispatchWithResult

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

##### abortAll

> **abortAll**: () => `void`

###### Returns

`void`

##### resetAbortScope

> **resetAbortScope**: () => `void`

###### Returns

`void`

***

### context

> **context**: `Context`\<[`ActionContextType`](ActionContextType.md)&lt;`T`&gt; \| `null`\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:100](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/actions/ActionContext.types.ts#L100)
