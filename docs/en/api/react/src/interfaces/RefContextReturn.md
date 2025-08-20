[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / RefContextReturn

# Interface: RefContextReturn\<T\>

Defined in: [packages/react/src/refs/createRefContext.ts:21](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/createRefContext.ts#L21)

RefContext 반환 타입 - 심플하고 명확한 API

## Type Parameters

### Generic type T

Type parameter **T**

## Properties

### Provider

> **Provider**: `FC`\<\{ `children`: `ReactNode`; \}\>

Defined in: [packages/react/src/refs/createRefContext.ts:23](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/createRefContext.ts#L23)

***

### useRefHandler()

> **useRefHandler**: &lt;`K`&gt;(`refName`) => `object`

Defined in: [packages/react/src/refs/createRefContext.ts:26](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/createRefContext.ts#L26)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### refName

Type parameter **K**

#### Returns

##### setRef()

> **setRef**: (`target`) => `void`

ref 값 설정

###### Parameters

###### target

`any`

###### Returns

`void`

##### target

> **target**: `any`

현재 ref 값

##### waitForMount()

> **waitForMount**: () => `Promise`&lt;`any`&gt;

ref가 마운트될 때까지 대기

###### Returns

`Promise`&lt;`any`&gt;

##### withTarget()

> **withTarget**: &lt;`Result`&gt;(`operation`, `options?`) => `Promise`\<[`RefOperationResult`](RefOperationResult.md)&lt;`Result`&gt;\>

ref와 함께 안전한 작업 수행

###### Type Parameters

###### Result

Type parameter **Result**

###### Parameters

###### operation

[`RefOperation`](../type-aliases/RefOperation.md)\<`any`, `Result`\>

###### options?

[`RefOperationOptions`](RefOperationOptions.md)

###### Returns

`Promise`\<[`RefOperationResult`](RefOperationResult.md)&lt;`Result`&gt;\>

##### isMounted

> **isMounted**: `boolean`

ref가 마운트되어 있는지 확인

***

### useWaitForRefs()

> **useWaitForRefs**: () => &lt;`K`&gt;(...`refNames`) => `Promise`\<`Partial`&lt;`T`&gt;\>

Defined in: [packages/react/src/refs/createRefContext.ts:43](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/createRefContext.ts#L43)

#### Returns

> &lt;`K`&gt;(...`refNames`): `Promise`\<`Partial`&lt;`T`&gt;\>

##### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

##### Parameters

###### refNames

...`K`[]

##### Returns

`Promise`\<`Partial`&lt;`T`&gt;\>

***

### useGetAllRefs()

> **useGetAllRefs**: () => () => `Partial`&lt;`T`&gt;

Defined in: [packages/react/src/refs/createRefContext.ts:46](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/createRefContext.ts#L46)

#### Returns

> (): `Partial`&lt;`T`&gt;

##### Returns

`Partial`&lt;`T`&gt;

***

### contextName

> **contextName**: `string`

Defined in: [packages/react/src/refs/createRefContext.ts:49](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/createRefContext.ts#L49)

***

### refDefinitions?

> `optional` **refDefinitions**: `T` *extends* `RefDefinitions` ? `T`&lt;`T`&gt; : `undefined`

Defined in: [packages/react/src/refs/createRefContext.ts:52](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/createRefContext.ts#L52)
