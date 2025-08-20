[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / DeclarativeActionContextReturn

# Interface: DeclarativeActionContextReturn\<A\>

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:162](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L162)

Return type for DeclarativeActionContext pattern

Defines the complete API returned by createDeclarativeActionPattern,
including Provider component, action dispatch hooks, handler registration,
and direct ActionRegister access.

## Extended by

- [`DeclarativeActionRefContextReturn`](DeclarativeActionRefContextReturn.md)

## Type Parameters

### Generic type A

`A` *extends* [`ActionDefinitions`](../type-aliases/ActionDefinitions.md)

Action definitions type

## Properties

### Provider

> **Provider**: `FC`\<\{ `children`: `ReactNode`; \}\>

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:164](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L164)

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

***

### useActionRegister()

> **useActionRegister**: () => `null` \| `ActionRegister`\<[`InferActionTypes`](../type-aliases/InferActionTypes.md)&lt;`A`&gt;\>

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:180](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L180)

#### Returns

`null` \| `ActionRegister`\<[`InferActionTypes`](../type-aliases/InferActionTypes.md)&lt;`A`&gt;\>

***

### contextName

> **contextName**: `string`

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:183](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L183)

***

### actionDefinitions

> **actionDefinitions**: `A`

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:184](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L184)
