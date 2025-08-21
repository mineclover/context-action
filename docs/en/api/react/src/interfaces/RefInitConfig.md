[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / RefInitConfig

# Interface: RefInitConfig\<T\>

Defined in: [packages/react/src/refs/types.ts:117](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/refs/types.ts#L117)

참조 초기화 설정

## Type Parameters

### Generic type T

`T` *extends* [`RefTarget`](RefTarget.md) = [`RefTarget`](RefTarget.md)

## Properties

### name

> **name**: `string`

Defined in: [packages/react/src/refs/types.ts:119](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/refs/types.ts#L119)

참조 이름

***

### initialMetadata?

> `optional` **initialMetadata**: `Record`\<`string`, `any`\>

Defined in: [packages/react/src/refs/types.ts:122](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/refs/types.ts#L122)

초기 메타데이터

***

### mountTimeout?

> `optional` **mountTimeout**: `number`

Defined in: [packages/react/src/refs/types.ts:125](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/refs/types.ts#L125)

마운트 타임아웃 (ms)

***

### autoCleanup?

> `optional` **autoCleanup**: `boolean`

Defined in: [packages/react/src/refs/types.ts:128](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/refs/types.ts#L128)

자동 cleanup 여부

***

### validator()?

> `optional` **validator**: (`target`) => `target is T`

Defined in: [packages/react/src/refs/types.ts:131](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/refs/types.ts#L131)

커스텀 validation 함수

#### Parameters

##### target

`any`

#### Returns

`target is T`

***

### cleanup()?

> `optional` **cleanup**: (`target`) => `void` \| `Promise`&lt;`void`&gt;

Defined in: [packages/react/src/refs/types.ts:134](https://github.com/mineclover/context-action/blob/b621f50f568fd1a322ff6c6aa551ddc1f6dc3a65/packages/react/src/refs/types.ts#L134)

커스텀 cleanup 함수

#### Parameters

##### target

Type parameter **T**

#### Returns

`void` \| `Promise`&lt;`void`&gt;
