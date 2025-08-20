[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / EventBus

# Class: EventBus

Defined in: [packages/react/src/stores/core/EventBus.ts:17](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/EventBus.ts#L17)

EventBus 클래스 - Store 간 비동기 통신

핵심 기능:
1. 이벤트 발행/구독 (publish-subscribe 패턴)
2. 이벤트 히스토리 관리
3. 스코프드 이벤트 버스 생성
4. 에러 처리 및 정리

사용 시나리오:
- Store 간 비동기 통신
- 전역 이벤트 관리
- 도메인별 이벤트 분리

## Implements

- [`IEventBus`](../interfaces/IEventBus.md)

## Constructors

### Constructor

> **new EventBus**(`maxHistorySize`): `EventBus`

Defined in: [packages/react/src/stores/core/EventBus.ts:22](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/EventBus.ts#L22)

#### Parameters

##### maxHistorySize

`number` = `100`

#### Returns

Type parameter **EventBus**

## Methods

### on()

> **on**&lt;`T`&gt;(`event`, `handler`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [packages/react/src/stores/core/EventBus.ts:30](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/EventBus.ts#L30)

이벤트 구독
핵심 기능: 특정 이벤트에 핸들러 등록 및 구독 해제 함수 반환

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### event

`string`

##### handler

[`StoreEventHandler`](../interfaces/StoreEventHandler.md)&lt;`T`&gt;

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Implementation of

[`IEventBus`](../interfaces/IEventBus.md).[`on`](../interfaces/IEventBus.md#on)

***

### once()

> **once**&lt;`T`&gt;(`event`, `handler`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [packages/react/src/stores/core/EventBus.ts:52](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/EventBus.ts#L52)

일회성 이벤트 구독
핵심 기능: 이벤트 한 번 발생 시 자동 구독 해제

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### event

`string`

##### handler

[`StoreEventHandler`](../interfaces/StoreEventHandler.md)&lt;`T`&gt;

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### emit()

> **emit**&lt;`T`&gt;(`event`, `data?`): `void`

Defined in: [packages/react/src/stores/core/EventBus.ts:66](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/EventBus.ts#L66)

이벤트 발행
핵심 기능: 등록된 모든 핸들러에게 이벤트 전달 및 히스토리 기록

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### event

`string`

##### data?

Type parameter **T**

#### Returns

`void`

#### Implementation of

[`IEventBus`](../interfaces/IEventBus.md).[`emit`](../interfaces/IEventBus.md#emit)

***

### off()

> **off**(`event`, `handler?`): `void`

Defined in: [packages/react/src/stores/core/EventBus.ts:86](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/EventBus.ts#L86)

Remove event handler(s)

#### Parameters

##### event

`string`

##### handler?

[`StoreEventHandler`](../interfaces/StoreEventHandler.md)&lt;`any`&gt;

#### Returns

`void`

#### Implementation of

[`IEventBus`](../interfaces/IEventBus.md).[`off`](../interfaces/IEventBus.md#off)

***

### clear()

> **clear**(): `void`

Defined in: [packages/react/src/stores/core/EventBus.ts:105](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/EventBus.ts#L105)

Clear all event handlers

#### Returns

`void`

#### Implementation of

[`IEventBus`](../interfaces/IEventBus.md).[`clear`](../interfaces/IEventBus.md#clear)

***

### getEventNames()

> **getEventNames**(): `string`[]

Defined in: [packages/react/src/stores/core/EventBus.ts:112](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/EventBus.ts#L112)

Get all event names

#### Returns

`string`[]

***

### getHandlerCount()

> **getHandlerCount**(`event`): `number`

Defined in: [packages/react/src/stores/core/EventBus.ts:119](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/EventBus.ts#L119)

Get handler count for an event

#### Parameters

##### event

`string`

#### Returns

`number`

***

### getTotalHandlerCount()

> **getTotalHandlerCount**(): `number`

Defined in: [packages/react/src/stores/core/EventBus.ts:127](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/EventBus.ts#L127)

Get total handler count

#### Returns

`number`

***

### getHistory()

> **getHistory**(): readonly `object`[]

Defined in: [packages/react/src/stores/core/EventBus.ts:138](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/EventBus.ts#L138)

Get event history

#### Returns

readonly `object`[]

***

### clearHistory()

> **clearHistory**(): `void`

Defined in: [packages/react/src/stores/core/EventBus.ts:145](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/EventBus.ts#L145)

Clear event history

#### Returns

`void`

***

### scope()

> **scope**(`prefix`): `ScopedEventBus`

Defined in: [packages/react/src/stores/core/EventBus.ts:152](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/stores/core/EventBus.ts#L152)

Create a scoped event emitter

#### Parameters

##### prefix

`string`

#### Returns

Type parameter **ScopedEventBus**
