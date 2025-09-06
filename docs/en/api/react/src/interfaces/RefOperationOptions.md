[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / RefOperationOptions

# Interface: RefOperationOptions

Defined in: [packages/react/src/refs/types.ts:56](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/types.ts#L56)

참조 작업 옵션

## Properties

### timeout?

> `optional` **timeout**: `number`

Defined in: [packages/react/src/refs/types.ts:58](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/types.ts#L58)

작업 타임아웃 (ms)

***

### retries?

> `optional` **retries**: `number`

Defined in: [packages/react/src/refs/types.ts:61](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/types.ts#L61)

재시도 횟수

***

### signal?

> `optional` **signal**: `AbortSignal`

Defined in: [packages/react/src/refs/types.ts:64](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/types.ts#L64)

AbortSignal for cancellation

***

### priority?

> `optional` **priority**: `number`

Defined in: [packages/react/src/refs/types.ts:67](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/types.ts#L67)

작업 우선순위

***

### operationId?

> `optional` **operationId**: `string`

Defined in: [packages/react/src/refs/types.ts:70](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/types.ts#L70)

작업 식별자

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `any`\>

Defined in: [packages/react/src/refs/types.ts:73](https://github.com/mineclover/context-action/blob/9ef553971e551d0c040b094ff64383ff10f16722/packages/react/src/refs/types.ts#L73)

추가 메타데이터
