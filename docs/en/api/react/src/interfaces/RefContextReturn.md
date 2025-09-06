[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / RefContextReturn

# Interface: RefContextReturn\<T\>

Defined in: [packages/react/src/refs/createRefContext.ts:25](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/createRefContext.ts#L25)

RefContext 반환 타입 - 향상된 타입 추론 지원

## Type Parameters

### Generic type T

Type parameter **T**

## Properties

### Provider

> **Provider**: `FC`\<\{ `children`: `ReactNode`; \}\>

Defined in: [packages/react/src/refs/createRefContext.ts:26](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/createRefContext.ts#L26)

***

### useRefHandler()

> **useRefHandler**: &lt;`K`&gt;(`refName`) => `object`

Defined in: [packages/react/src/refs/createRefContext.ts:28](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/createRefContext.ts#L28)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### refName

Type parameter **K**

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

> **withTarget**: &lt;`Result`&gt;(`operation`, `options?`) => `Promise`\<[`RefOperationResult`](RefOperationResult.md)&lt;`Result`&gt;\>

###### Type Parameters

###### Result

Type parameter **Result**

###### Parameters

###### operation

`RefOperation`\<`any`, `Result`\>

###### options?

[`RefOperationOptions`](RefOperationOptions.md)

###### Returns

`Promise`\<[`RefOperationResult`](RefOperationResult.md)&lt;`Result`&gt;\>

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

> **executeIfMounted**: &lt;`Result`&gt;(`operation`) => `null` \| `Result`

###### Type Parameters

###### Result

Type parameter **Result**

###### Parameters

###### operation

(`target`) => `Result`

###### Returns

`null` \| `Result`

***

### useWaitForRefs()

> **useWaitForRefs**: () => \{&lt;`K`&gt;(...`refNames`): `Promise`\<`Pick`\<`T`, `K`\>\>; &lt;`K`&gt;(`timeout`, ...`refNames`): `Promise`\<`Pick`\<`T`, `K`\>\>; \}

Defined in: [packages/react/src/refs/createRefContext.ts:44](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/createRefContext.ts#L44)

#### Returns

> &lt;`K`&gt;(...`refNames`): `Promise`\<`Pick`\<`T`, `K`\>\>

##### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

##### Parameters

###### refNames

...`K`[]

##### Returns

`Promise`\<`Pick`\<`T`, `K`\>\>

> &lt;`K`&gt;(`timeout`, ...`refNames`): `Promise`\<`Pick`\<`T`, `K`\>\>

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

> **useGetAllRefs**: () => () => `Partial`&lt;`T`&gt;

Defined in: [packages/react/src/refs/createRefContext.ts:48](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/createRefContext.ts#L48)

#### Returns

> (): `Partial`&lt;`T`&gt;

##### Returns

`Partial`&lt;`T`&gt;

***

### useRefPolling()

> **useRefPolling**: () => &lt;`K`&gt;(`refName`, `options?`) => `object`

Defined in: [packages/react/src/refs/createRefContext.ts:49](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/createRefContext.ts#L49)

#### Returns

> &lt;`K`&gt;(`refName`, `options?`): `object`

##### Type Parameters

###### K

`K` *extends* `string` \| `number` \| `symbol`

##### Parameters

###### refName

Type parameter **K**

###### options?

Type parameter **RefPollingOptions**

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

> **useRefMountState**: &lt;`K`&gt;(`refName`) => `object`

Defined in: [packages/react/src/refs/createRefContext.ts:58](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/createRefContext.ts#L58)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### refName

Type parameter **K**

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

> **useOnMountStateChange**: &lt;`K`&gt;(`refName`, `callback`) => `void`

Defined in: [packages/react/src/refs/createRefContext.ts:64](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/createRefContext.ts#L64)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### refName

Type parameter **K**

##### callback

(`mounted`, `target`) => `void`

#### Returns

`void`

***

### useRefMountChecker()

> **useRefMountChecker**: &lt;`K`&gt;(`refName`) => () => `object`

Defined in: [packages/react/src/refs/createRefContext.ts:69](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/createRefContext.ts#L69)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### refName

Type parameter **K**

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

Defined in: [packages/react/src/refs/createRefContext.ts:75](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/createRefContext.ts#L75)

***

### refDefinitions?

> `optional` **refDefinitions**: `T` *extends* `RefDefinitions` ? `T`&lt;`T`&gt; : `undefined`

Defined in: [packages/react/src/refs/createRefContext.ts:76](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/createRefContext.ts#L76)
