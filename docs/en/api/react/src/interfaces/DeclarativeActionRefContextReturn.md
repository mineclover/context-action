[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / DeclarativeActionRefContextReturn

# Interface: DeclarativeActionRefContextReturn\<A, R\>

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:199](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L199)

Unified context return type combining actions and refs

Extended return type that includes both action management and ref management
capabilities for integrated patterns. Currently includes placeholder hooks
for future ref system integration.

## Extends

- [`DeclarativeActionContextReturn`](DeclarativeActionContextReturn.md)&lt;`A`&gt;

## Type Parameters

### Generic type A

`A` *extends* [`ActionDefinitions`](../type-aliases/ActionDefinitions.md)

Action definitions type

### Generic type R

`R` *extends* `Record`\<`string`, `any`\>

Refs definitions type

## Properties

### Provider

> **Provider**: `FC`\<\{ `children`: `ReactNode`; \}\>

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:164](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L164)

#### Inherited from

[`DeclarativeActionContextReturn`](DeclarativeActionContextReturn.md).[`Provider`](DeclarativeActionContextReturn.md#provider)

***

### useAction()

> **useAction**: () => &lt;`K`&gt;(`action`, `payload?`) => `Promise`&lt;`void`&gt;

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:167](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L167)

#### Returns

> &lt;`K`&gt;(`action`, `payload?`): `Promise`&lt;`void`&gt;

##### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

##### Parameters

###### action

Type parameter **K**

###### payload?

[`InferActionTypes`](../type-aliases/InferActionTypes.md)&lt;`A`&gt;\[`K`\]

##### Returns

`Promise`&lt;`void`&gt;

#### Inherited from

[`DeclarativeActionContextReturn`](DeclarativeActionContextReturn.md).[`useAction`](DeclarativeActionContextReturn.md#useaction)

***

### useActionHandler()

> **useActionHandler**: &lt;`K`&gt;(`action`, `handler`, `config?`) => `void`

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:173](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L173)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

##### handler

`ActionHandler`\<[`InferActionTypes`](../type-aliases/InferActionTypes.md)&lt;`A`&gt;\[`K`\]\>

##### config?

Type parameter **HandlerConfig**

#### Returns

`void`

#### Inherited from

[`DeclarativeActionContextReturn`](DeclarativeActionContextReturn.md).[`useActionHandler`](DeclarativeActionContextReturn.md#useactionhandler)

***

### useActionRegister()

> **useActionRegister**: () => `null` \| `ActionRegister`\<[`InferActionTypes`](../type-aliases/InferActionTypes.md)&lt;`A`&gt;\>

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:180](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L180)

#### Returns

`null` \| `ActionRegister`\<[`InferActionTypes`](../type-aliases/InferActionTypes.md)&lt;`A`&gt;\>

#### Inherited from

[`DeclarativeActionContextReturn`](DeclarativeActionContextReturn.md).[`useActionRegister`](DeclarativeActionContextReturn.md#useactionregister)

***

### contextName

> **contextName**: `string`

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:183](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L183)

#### Inherited from

[`DeclarativeActionContextReturn`](DeclarativeActionContextReturn.md).[`contextName`](DeclarativeActionContextReturn.md#contextname)

***

### actionDefinitions

> **actionDefinitions**: `A`

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:184](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L184)

#### Inherited from

[`DeclarativeActionContextReturn`](DeclarativeActionContextReturn.md).[`actionDefinitions`](DeclarativeActionContextReturn.md#actiondefinitions)

***

### useRef()?

> `optional` **useRef**: &lt;`K`&gt;(`refName`) => `any`

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:204](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L204)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### refName

Type parameter **K**

#### Returns

`any`

***

### useRefManager()?

> `optional` **useRefManager**: () => `any`

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:205](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L205)

#### Returns

`any`
