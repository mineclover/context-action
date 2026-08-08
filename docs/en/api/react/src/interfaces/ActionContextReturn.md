[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / ActionContextReturn

# Interface: ActionContextReturn\<T, TResultMap\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:83](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L83)

Return type for createActionContext with abort support

## Type Parameters

### Generic type T

`T` *extends* `ActionPayloadMap`

### TResultMap

`TResultMap` *extends* `ActionResultMap`&lt;`T`&gt; = \{ \}

## Properties

### Provider

> **Provider**: `FC`\<\{ `children`: `ReactNode`; \}\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:87](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L87)

***

### useActionContext

> **useActionContext**: () => [`ActionContextType`](ActionContextType.md)\<`T`, `TResultMap`\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:88](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L88)

#### Returns

[`ActionContextType`](ActionContextType.md)\<`T`, `TResultMap`\>

***

### useActionDispatch

> **useActionDispatch**: () => &lt;`K`&gt;(`action`, ...`args`) => `Promise`&lt;`void`&gt;

Defined in: [packages/react/src/actions/ActionContext.types.ts:89](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L89)

#### Returns

&lt;`K`&gt;(`action`, ...`args`) => `Promise`&lt;`void`&gt;

***

### useActionHandler

> **useActionHandler**: \<`K`, `R`\>(`action`, `handler`, `config?`) => `void`

Defined in: [packages/react/src/actions/ActionContext.types.ts:90](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L90)

#### Type Parameters

##### K

`K` *extends* `string`

##### R

`R` = `ActionResult`\<`TResultMap`, `K`\>

#### Parameters

##### action

Type parameter **K**

##### handler

`K` *extends* keyof `TResultMap` ? `ActionResultHandler`\<`T`\[`K`\], `ActionResult`\<`TResultMap`, `K`\>\> : `ActionContextHandler`\<`T`\[`K`\], `R`\>

##### config?

`HandlerConfig`\<`T`\[`K`\]\>

#### Returns

`void`

***

### useActionEffectHandler

> **useActionEffectHandler**: \<`K`, `R`\>(`action`, `handler`, `config?`) => `void`

Defined in: [packages/react/src/actions/ActionContext.types.ts:97](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L97)

#### Type Parameters

##### K

`K` *extends* `string`

##### R

`R` = `void`

#### Parameters

##### action

Type parameter **K**

##### handler

`ActionHandler`\<`T`\[`K`\], `R`\>

##### config?

`HandlerConfig`\<`T`\[`K`\]\>

#### Returns

`void`

***

### useActionResultHandler

> **useActionResultHandler**: &lt;`K`&gt;(`action`, `handler`, `config?`) => `void`

Defined in: [packages/react/src/actions/ActionContext.types.ts:102](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L102)

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### action

Type parameter **K**

##### handler

`ActionResultHandler`\<`T`\[`K`\], `ActionResult`\<`TResultMap`, `K`\>\>

##### config?

`HandlerConfig`\<`T`\[`K`\]\>

#### Returns

`void`

***

### useActionRegister

> **useActionRegister**: () => `ActionRegister`\<`T`, `TResultMap`\> \| `null`

Defined in: [packages/react/src/actions/ActionContext.types.ts:107](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L107)

#### Returns

`ActionRegister`\<`T`, `TResultMap`\> \| `null`

***

### useActionDispatchWithResult

> **useActionDispatchWithResult**: () => `object`

Defined in: [packages/react/src/actions/ActionContext.types.ts:108](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L108)

#### Returns

`object`

##### dispatch

> **dispatch**: &lt;`K`&gt;(`action`, ...`args`) => `Promise`&lt;`void`&gt;

###### Type Parameters

###### K

`K` *extends* `string`

###### Parameters

###### action

Type parameter **K**

###### args

...`DispatchArgs`\<`T`\[`K`\]\>

###### Returns

`Promise`&lt;`void`&gt;

##### dispatchWithResult

> **dispatchWithResult**: \{&lt;`K`&gt;(`action`, ...`args`): `Promise`\<`ExecutionResult`\<`ActionResult`\<`TResultMap`, `K`\>\>\>; \<`K`, `R`\>(`action`, ...`args`): `Promise`\<`ExecutionResult`&lt;`R`&gt;\>; \}

###### Call Signature

> &lt;`K`&gt;(`action`, ...`args`): `Promise`\<`ExecutionResult`\<`ActionResult`\<`TResultMap`, `K`\>\>\>

###### Type Parameters

###### K

`K` *extends* `string`

###### Parameters

###### action

Type parameter **K**

###### args

...`DispatchArgs`\<`T`\[`K`\]\>

###### Returns

`Promise`\<`ExecutionResult`\<`ActionResult`\<`TResultMap`, `K`\>\>\>

###### Call Signature

> \<`K`, `R`\>(`action`, ...`args`): `Promise`\<`ExecutionResult`&lt;`R`&gt;\>

###### Type Parameters

###### K

`K` *extends* `string`

###### R

`R` = `void`

###### Parameters

###### action

Type parameter **K**

###### args

...`DispatchArgs`\<`T`\[`K`\]\>

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

> **context**: `Context`\<[`ActionContextType`](ActionContextType.md)\<`T`, `TResultMap`\> \| `null`\>

Defined in: [packages/react/src/actions/ActionContext.types.ts:114](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/ActionContext.types.ts#L114)
