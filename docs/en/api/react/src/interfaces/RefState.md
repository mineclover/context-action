[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / RefState

# Interface: RefState\<T\>

Defined in: [packages/react/src/refs/types.ts:49](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/types.ts#L49)

참조 객체의 현재 상태

## Type Parameters

### Generic type T

`T` *extends* [`RefTarget`](RefTarget.md) = [`RefTarget`](RefTarget.md)

## Properties

### target

> **target**: `null` \| `T`

Defined in: [packages/react/src/refs/types.ts:51](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/types.ts#L51)

참조 객체 (null이면 아직 마운트되지 않음)

***

### isReady

> **isReady**: `boolean`

Defined in: [packages/react/src/refs/types.ts:54](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/types.ts#L54)

객체가 준비되어 사용 가능한지 여부

***

### isMounted

> **isMounted**: `boolean`

Defined in: [packages/react/src/refs/types.ts:57](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/types.ts#L57)

마운트된 상태인지 여부

***

### mountPromise

> **mountPromise**: `null` \| `Promise`&lt;`T`&gt;

Defined in: [packages/react/src/refs/types.ts:60](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/types.ts#L60)

마운트 대기를 위한 Promise

***

### mountedAt?

> `optional` **mountedAt**: `number`

Defined in: [packages/react/src/refs/types.ts:63](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/types.ts#L63)

마운트된 시간 (타임스탬프)

***

### error?

> `optional` **error**: `null` \| `Error`

Defined in: [packages/react/src/refs/types.ts:66](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/types.ts#L66)

에러 상태

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `any`\>

Defined in: [packages/react/src/refs/types.ts:69](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/types.ts#L69)

추가 메타데이터
