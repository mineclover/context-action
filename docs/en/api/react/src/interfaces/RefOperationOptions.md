[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / RefOperationOptions

# Interface: RefOperationOptions

Defined in: [packages/react/src/refs/types.ts:86](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/types.ts#L86)

참조 작업 옵션

## Properties

### timeout?

> `optional` **timeout**: `number`

Defined in: [packages/react/src/refs/types.ts:88](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/types.ts#L88)

작업 타임아웃 (ms)

***

### retries?

> `optional` **retries**: `number`

Defined in: [packages/react/src/refs/types.ts:91](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/types.ts#L91)

재시도 횟수

***

### signal?

> `optional` **signal**: `AbortSignal`

Defined in: [packages/react/src/refs/types.ts:94](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/types.ts#L94)

AbortSignal for cancellation

***

### priority?

> `optional` **priority**: `number`

Defined in: [packages/react/src/refs/types.ts:97](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/types.ts#L97)

작업 우선순위

***

### operationId?

> `optional` **operationId**: `string`

Defined in: [packages/react/src/refs/types.ts:100](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/types.ts#L100)

작업 식별자

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `any`\>

Defined in: [packages/react/src/refs/types.ts:103](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/types.ts#L103)

추가 메타데이터
