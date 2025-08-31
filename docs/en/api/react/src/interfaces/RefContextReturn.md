[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / RefContextReturn

# Interface: RefContextReturn\<T\>

Defined in: [packages/react/src/refs/createRefContext.ts:25](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/refs/createRefContext.ts#L25)

RefContext 반환 타입 - 향상된 타입 추론 지원

## Type Parameters

### T

`T`

## Properties

### Provider

> **Provider**: `FC`\<\{ `children`: `ReactNode`; \}\>

Defined in: [packages/react/src/refs/createRefContext.ts:26](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/refs/createRefContext.ts#L26)

***

### useRefHandler()

> **useRefHandler**: \<`K`\>(`refName`) => `object`

Defined in: [packages/react/src/refs/createRefContext.ts:28](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/refs/createRefContext.ts#L28)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### refName

`K`

#### Returns

`object`

##### setRef()

> **setRef**: (`target`) => `void`

###### Parameters

###### target

`null` | `T`\[`K`\]

###### Returns

`void`

##### target

> **target**: `null` \| `T`\[`K`\]

##### waitForMount()

> **waitForMount**: () => `Promise`\<`T`\[`K`\]\>

###### Returns

`Promise`\<`T`\[`K`\]\>

##### withTarget()

> **withTarget**: \<`Result`\>(`operation`, `options?`) => `Promise`\<[`RefOperationResult`](RefOperationResult.md)\<`Result`\>\>

###### Type Parameters

###### Result

`Result`

###### Parameters

###### operation

`RefOperation`\<`T`\[`K`\] & [`RefTarget`](RefTarget.md), `Result`\>

###### options?

[`RefOperationOptions`](RefOperationOptions.md)

###### Returns

`Promise`\<[`RefOperationResult`](RefOperationResult.md)\<`Result`\>\>

##### isMounted

> **isMounted**: `boolean`

##### isWaitingForMount

> **isWaitingForMount**: `boolean`

##### onMount()

> **onMount**: (`callback`) => () => `void`

###### Parameters

###### callback

(`target`) => `void`

###### Returns

> (): `void`

###### Returns

`void`

##### executeIfMounted()

> **executeIfMounted**: \<`Result`\>(`operation`) => `null` \| `Result`

###### Type Parameters

###### Result

`Result`

###### Parameters

###### operation

(`target`) => `Result`

###### Returns

`null` \| `Result`

***

### useWaitForRefs()

> **useWaitForRefs**: () => \{\<`K`\>(...`refNames`): `Promise`\<`Pick`\<`T`, `K`\>\>; \<`K`\>(`timeout`, ...`refNames`): `Promise`\<`Pick`\<`T`, `K`\>\>; \}

Defined in: [packages/react/src/refs/createRefContext.ts:44](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/refs/createRefContext.ts#L44)

#### Returns

> \<`K`\>(...`refNames`): `Promise`\<`Pick`\<`T`, `K`\>\>

##### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

##### Parameters

###### refNames

...`K`[]

##### Returns

`Promise`\<`Pick`\<`T`, `K`\>\>

> \<`K`\>(`timeout`, ...`refNames`): `Promise`\<`Pick`\<`T`, `K`\>\>

##### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

##### Parameters

###### timeout

`number`

###### refNames

...`K`[]

##### Returns

`Promise`\<`Pick`\<`T`, `K`\>\>

***

### useGetAllRefs()

> **useGetAllRefs**: () => () => `Partial`\<`T`\>

Defined in: [packages/react/src/refs/createRefContext.ts:48](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/refs/createRefContext.ts#L48)

#### Returns

> (): `Partial`\<`T`\>

##### Returns

`Partial`\<`T`\>

***

### useRefPolling()

> **useRefPolling**: () => \<`K`\>(`refName`, `options?`) => `object`

Defined in: [packages/react/src/refs/createRefContext.ts:49](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/refs/createRefContext.ts#L49)

#### Returns

> \<`K`\>(`refName`, `options?`): `object`

##### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

##### Parameters

###### refName

`K`

###### options?

`RefPollingOptions`

##### Returns

`object`

###### promise

> **promise**: `Promise`\<`T`\[`K`\]\>

###### cancel()

> **cancel**: () => `void`

###### Returns

`void`

###### isMounted()

> **isMounted**: () => `boolean`

###### Returns

`boolean`

***

### useRefMountState()

> **useRefMountState**: \<`K`\>(`refName`) => `object`

Defined in: [packages/react/src/refs/createRefContext.ts:58](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/refs/createRefContext.ts#L58)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### refName

`K`

#### Returns

`object`

##### isMounted

> **isMounted**: `boolean`

##### isWaitingForMount

> **isWaitingForMount**: `boolean`

##### mountedTarget

> **mountedTarget**: `null` \| `T`\[`K`\]

***

### useOnMountStateChange()

> **useOnMountStateChange**: \<`K`\>(`refName`, `callback`) => `void`

Defined in: [packages/react/src/refs/createRefContext.ts:64](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/refs/createRefContext.ts#L64)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### refName

`K`

##### callback

(`mounted`, `target`) => `void`

#### Returns

`void`

***

### useRefMountChecker()

> **useRefMountChecker**: \<`K`\>(`refName`) => () => `object`

Defined in: [packages/react/src/refs/createRefContext.ts:69](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/refs/createRefContext.ts#L69)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### refName

`K`

#### Returns

> (): `object`

##### Returns

`object`

###### isMounted

> **isMounted**: `boolean`

###### isWaitingForMount

> **isWaitingForMount**: `boolean`

###### target

> **target**: `null` \| `T`\[`K`\]

***

### contextName

> **contextName**: `string`

Defined in: [packages/react/src/refs/createRefContext.ts:75](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/refs/createRefContext.ts#L75)

***

### refDefinitions?

> `optional` **refDefinitions**: `T` *extends* `RefDefinitions` ? `T`\<`T`\> : `undefined`

Defined in: [packages/react/src/refs/createRefContext.ts:76](https://github.com/mineclover/context-action/blob/b6ae71bed12be1901b81bb42abea6d55eaa5e7bc/packages/react/src/refs/createRefContext.ts#L76)
