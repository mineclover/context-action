[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / Store

# Class: Store\<T\>

Defined in: [packages/react/src/stores/core/Store.ts:22](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/Store.ts#L22)

Store 클래스 - 중앙화된 상태 관리의 핵심

핵심 기능:
1. 상태 저장 (_value) - 실제 데이터 보관
2. 구독 관리 (listeners) - React 컴포넌트들의 구독 추적
3. 스냅샷 관리 (_snapshot) - 불변성과 최적화를 위한 스냅샷
4. 변경 알림 (_notifyListeners) - 상태 변경 시 구독자들에게 알림

## Implements

store-integration-pattern

## Implements

model-layer

## Memberof

core-concepts

## Type Parameters

### Generic type T

`T` = `any`

## Implements

- [`IStore`](../interfaces/IStore.md)&lt;`T`&gt;

## Constructors

### Constructor

> **new Store**&lt;`T`&gt;(`name`, `initialValue`): `Store`&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/Store.ts:44](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/Store.ts#L44)

#### Parameters

##### name

`string`

##### initialValue

Type parameter **T**

#### Returns

`Store`&lt;`T`&gt;

## Methods

### subscribe()

> **subscribe**(`listener`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [packages/react/src/stores/core/Store.ts:60](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/Store.ts#L60)

Store 변경사항 구독
핵심 로직: React 컴포넌트가 Store 변경을 감지할 수 있도록 리스너 등록

#### Parameters

##### listener

[`Listener`](../type-aliases/Listener.md)

상태 변경 시 호출될 콜백 함수

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

unsubscribe 함수 - 구독 해제용

#### Implements

store-hooks

#### Memberof

api-terms

#### Implementation of

`IStore.subscribe`

***

### getSnapshot()

> **getSnapshot**(): [`Snapshot`](../interfaces/Snapshot.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/Store.ts:74](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/Store.ts#L74)

현재 Store 스냅샷 가져오기
핵심 로직: React의 useSyncExternalStore가 사용하는 불변 스냅샷 제공

#### Returns

[`Snapshot`](../interfaces/Snapshot.md)&lt;`T`&gt;

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`getSnapshot`](../interfaces/IStore.md#getsnapshot)

***

### getValue()

> **getValue**(): `T`

Defined in: [packages/react/src/stores/core/Store.ts:89](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/Store.ts#L89)

현재 값 직접 가져오기 (액션 핸들러용)
핵심 로직: 불변성을 보장하는 깊은 복사본 반환

#### Returns

Type parameter **T**

#### Implements

lazy-evaluation

#### Implements

store-immutability

#### Memberof

architecture-terms

사용 시나리오: Action handler에서 최신 상태 읽기
보안 강화: 외부에서 반환된 값을 수정해도 Store 내부 상태는 보호됨

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`getValue`](../interfaces/IStore.md#getvalue)

***

### setValue()

> **setValue**(`value`): `void`

Defined in: [packages/react/src/stores/core/Store.ts:111](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/Store.ts#L111)

Store 값 설정 및 구독자 알림
핵심 로직: 
1. 입력값의 불변성 보장을 위한 깊은 복사
2. 강화된 값 비교 시스템으로 불필요한 리렌더링 방지
3. 값 변경 시에만 스냅샷 재생성 및 알림

#### Parameters

##### value

Type parameter **T**

#### Returns

`void`

#### Implements

unidirectional-data-flow

#### Implements

store-immutability

#### Memberof

architecture-terms

보안 강화: 입력값을 복사하여 Store 내부 상태가 외부 참조에 의해 변경되지 않도록 보호
성능 강화: 다층 비교 시스템으로 정확한 변경 감지 및 렌더링 최적화

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`setValue`](../interfaces/IStore.md#setvalue)

***

### update()

> **update**(`updater`): `void`

Defined in: [packages/react/src/stores/core/Store.ts:137](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/Store.ts#L137)

Update value using updater function
핵심 로직: 
1. 현재 값의 안전한 복사본을 updater에 전달
2. updater 결과를 setValue로 안전하게 설정

#### Parameters

##### updater

(`current`) => `T`

#### Returns

`void`

#### Implements

store-immutability
보안 강화: updater 함수가 내부 상태를 직접 수정할 수 없도록 복사본 전달

***

### getListenerCount()

> **getListenerCount**(): `number`

Defined in: [packages/react/src/stores/core/Store.ts:168](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/Store.ts#L168)

Get number of active listeners

#### Returns

`number`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`getListenerCount`](../interfaces/IStore.md#getlistenercount)

***

### clearListeners()

> **clearListeners**(): `void`

Defined in: [packages/react/src/stores/core/Store.ts:175](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/Store.ts#L175)

Clear all listeners

#### Returns

`void`

***

### setCustomComparator()

> **setCustomComparator**(`comparator`): `void`

Defined in: [packages/react/src/stores/core/Store.ts:191](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/Store.ts#L191)

Store별 커스텀 비교 함수 설정
이 Store에만 적용되는 특별한 비교 로직 설정

#### Parameters

##### comparator

(`oldValue`, `newValue`) => `boolean`

커스텀 비교 함수 (oldValue, newValue) => boolean

#### Returns

`void`

#### Example

```typescript
userStore.setCustomComparator((oldUser, newUser) => 
  oldUser.id === newUser.id && oldUser.lastModified === newUser.lastModified
);
```

***

### setComparisonOptions()

> **setComparisonOptions**(`options`): `void`

Defined in: [packages/react/src/stores/core/Store.ts:212](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/Store.ts#L212)

Store별 비교 옵션 설정
이 Store에만 적용되는 비교 전략 설정

#### Parameters

##### options

`Partial`\<[`ComparisonOptions`](../interfaces/ComparisonOptions.md)&lt;`T`&gt;\>

비교 옵션

#### Returns

`void`

#### Example

```typescript
// 깊은 비교 사용
userStore.setComparisonOptions({ strategy: 'deep', maxDepth: 3 });

// 얕은 비교 사용하되 특정 키 무시
stateStore.setComparisonOptions({ 
  strategy: 'shallow', 
  ignoreKeys: ['timestamp', 'lastAccess'] 
});
```

***

### getComparisonOptions()

> **getComparisonOptions**(): `undefined` \| `Partial`\<[`ComparisonOptions`](../interfaces/ComparisonOptions.md)&lt;`T`&gt;\>

Defined in: [packages/react/src/stores/core/Store.ts:219](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/Store.ts#L219)

현재 비교 설정 조회

#### Returns

`undefined` \| `Partial`\<[`ComparisonOptions`](../interfaces/ComparisonOptions.md)&lt;`T`&gt;\>

***

### clearCustomComparator()

> **clearCustomComparator**(): `void`

Defined in: [packages/react/src/stores/core/Store.ts:226](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/Store.ts#L226)

커스텀 비교 함수 해제

#### Returns

`void`

***

### clearComparisonOptions()

> **clearComparisonOptions**(): `void`

Defined in: [packages/react/src/stores/core/Store.ts:233](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/Store.ts#L233)

비교 옵션 해제 (전역 설정 사용)

#### Returns

`void`

***

### setNotificationMode()

> **setNotificationMode**(`mode`): `void`

Defined in: [packages/react/src/stores/core/Store.ts:295](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/Store.ts#L295)

알림 모드 설정 - 테스트/디버그용

#### Parameters

##### mode

`"batched"` | `"immediate"`

#### Returns

`void`

***

### getNotificationMode()

> **getNotificationMode**(): `"batched"` \| `"immediate"`

Defined in: [packages/react/src/stores/core/Store.ts:302](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/Store.ts#L302)

현재 알림 모드 조회

#### Returns

`"batched"` \| `"immediate"`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/Store.ts:38](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/react/src/stores/core/Store.ts#L38)

Unique identifier for the store

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`name`](../interfaces/IStore.md#name)
