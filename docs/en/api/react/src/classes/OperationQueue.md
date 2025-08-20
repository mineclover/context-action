[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / OperationQueue

# Class: OperationQueue

Defined in: [packages/react/src/refs/OperationQueue.ts:52](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/OperationQueue.ts#L52)

참조별 작업 큐 관리자

핵심 기능:
1. 참조별 독립적인 큐 관리
2. 우선순위 기반 작업 정렬
3. 동시성 제어 및 순차 실행
4. 취소 가능한 작업 지원
5. 에러 처리 및 재시도 로직

## Constructors

### Constructor

> **new OperationQueue**(): `OperationQueue`

Defined in: [packages/react/src/refs/OperationQueue.ts:59](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/OperationQueue.ts#L59)

#### Returns

Type parameter **OperationQueue**

## Methods

### enqueue()

> **enqueue**\<`T`, `R`\>(`refName`, `target`, `operation`, `options`): `Promise`\<[`RefOperationResult`](../interfaces/RefOperationResult.md)&lt;`R`&gt;\>

Defined in: [packages/react/src/refs/OperationQueue.ts:72](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/OperationQueue.ts#L72)

작업을 큐에 추가하고 실행 대기

#### Type Parameters

##### T

`T` *extends* [`RefTarget`](../interfaces/RefTarget.md)

##### R

`R` = `any`

#### Parameters

##### refName

`string`

참조 이름

##### target

Type parameter **T**

작업 대상 객체

##### operation

[`RefOperation`](../type-aliases/RefOperation.md)\<`T`, `R`\>

수행할 작업

##### options

[`RefOperationOptions`](../interfaces/RefOperationOptions.md) = `{}`

작업 옵션

#### Returns

`Promise`\<[`RefOperationResult`](../interfaces/RefOperationResult.md)&lt;`R`&gt;\>

작업 결과 Promise

***

### cancelOperations()

> **cancelOperations**(`refName`): `void`

Defined in: [packages/react/src/refs/OperationQueue.ts:138](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/OperationQueue.ts#L138)

특정 참조의 모든 대기 중인 작업 취소

#### Parameters

##### refName

`string`

#### Returns

`void`

***

### shutdown()

> **shutdown**(): `void`

Defined in: [packages/react/src/refs/OperationQueue.ts:157](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/OperationQueue.ts#L157)

모든 작업 취소 및 큐 종료

#### Returns

`void`

***

### getStats()

> **getStats**(`refName?`): [`QueueStats`](../interfaces/QueueStats.md) \| `Record`\<`string`, [`QueueStats`](../interfaces/QueueStats.md)\>

Defined in: [packages/react/src/refs/OperationQueue.ts:175](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/OperationQueue.ts#L175)

큐 상태 조회

#### Parameters

##### refName?

`string`

#### Returns

[`QueueStats`](../interfaces/QueueStats.md) \| `Record`\<`string`, [`QueueStats`](../interfaces/QueueStats.md)\>

***

### getPendingOperationCount()

> **getPendingOperationCount**(`refName`): `number`

Defined in: [packages/react/src/refs/OperationQueue.ts:191](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/OperationQueue.ts#L191)

특정 참조의 대기 중인 작업 수 확인

#### Parameters

##### refName

`string`

#### Returns

`number`

***

### isProcessing()

> **isProcessing**(`refName`): `boolean`

Defined in: [packages/react/src/refs/OperationQueue.ts:199](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/refs/OperationQueue.ts#L199)

특정 참조가 현재 처리 중인지 확인

#### Parameters

##### refName

`string`

#### Returns

`boolean`
