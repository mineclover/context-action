[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / Store

# Class: Store\<T\>

Defined in: [packages/react/src/stores/core/Store.ts:76](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L76)

Core Store class for centralized state management with memory leak prevention

Provides reactive state management with subscription capabilities, optimized for
React integration through useSyncExternalStore. Features advanced cleanup mechanisms,
automatic resource management, and comprehensive memory leak prevention.

Key Features:
- Automatic cleanup task registration and execution
- Memory leak prevention with disposal patterns
- Race condition protection for async operations
- Advanced error recovery with exponential backoff
- Resource monitoring and threshold management

## Example

```typescript
const userStore = createStore('user', { name: '', age: 0 });

// Register cleanup tasks
const unregister = userStore.registerCleanup(() => {
  console.log('Cleaning up user store resources');
});

// Automatic cleanup on disposal
userStore.dispose();
```

## See

https://mineclover.github.io/context-action/en/guide/patterns/store/basic-usage

## Type Parameters

### Generic type T

`T` = `unknown`

The type of value stored in this store

## Implements

- [`IStore`](../interfaces/IStore.md)&lt;`T`&gt;

## Constructors

### Constructor

> **new Store**&lt;`T`&gt;(`name`, `initialValue`): `Store`&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/Store.ts:132](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L132)

#### Parameters

##### name

`string`

##### initialValue

Type parameter **T**

#### Returns

`Store`&lt;`T`&gt;

## Methods

### subscribe()

> **subscribe**(`listener`): `Unsubscribe`

Defined in: [packages/react/src/stores/core/Store.ts:160](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L160)

Enhanced store subscription with metadata tracking and error recovery

Subscribes to store changes with advanced features including subscription
metadata tracking, automatic error recovery, and disposal safety.

#### Parameters

##### listener

Type parameter **Listener**

상태 변경 시 호출될 콜백 함수

#### Returns

Type parameter **Unsubscribe**

unsubscribe 함수 - 구독 해제용

#### Implements

store-hooks

#### Memberof

api-terms

#### Example

```typescript
const unsubscribe = store.subscribe(() => {
  console.log('Store value changed:', store.getValue());
});

// Cleanup
unsubscribe();
```

#### Implementation of

`IStore.subscribe`

***

### subscribeWithPatches()

> **subscribeWithPatches**(`listener`): `Unsubscribe`

Defined in: [packages/react/src/stores/core/Store.ts:217](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L217)

Subscribe with patches information for path-based optimization

Allows subscribers to receive JSON patches describing what changed,
enabling efficient path-based re-rendering decisions.

#### Parameters

##### listener

[`PatchAwareListener`](../type-aliases/PatchAwareListener.md)

Callback that receives patches array on each update

#### Returns

Type parameter **Unsubscribe**

Unsubscribe function

#### Example

```typescript
store.subscribeWithPatches((patches) => {
  if (patches?.some(p => p.path[0] === 'user')) {
    // Only handle user-related changes
    updateUserUI();
  }
});
```

***

### getLastPatches()

> **getLastPatches**(): `Patches` \| `null`

Defined in: [packages/react/src/stores/core/Store.ts:237](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L237)

Get the patches from the last state change

Returns the JSON patches that describe the most recent update. When the
store batches notifications, this contains the concatenated patches for
every transition included in the pending frame. Returns null if no patches
are available (e.g., initial state or full replacement).

#### Returns

`Patches` \| `null`

Array of JSON patches or null

***

### getSnapshot()

> **getSnapshot**(): [`Snapshot`](../interfaces/Snapshot.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/Store.ts:245](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L245)

현재 Store 스냅샷 가져오기
핵심 로직: React의 useSyncExternalStore가 사용하는 불변 스냅샷 제공

#### Returns

[`Snapshot`](../interfaces/Snapshot.md)&lt;`T`&gt;

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`getSnapshot`](../interfaces/IStore.md#getsnapshot)

***

### getValue()

> **getValue**(): `T`

Defined in: [packages/react/src/stores/core/Store.ts:260](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L260)

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

> **setValue**(`value`, `options?`): `void`

Defined in: [packages/react/src/stores/core/Store.ts:304](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L304)

Store 값 설정 및 구독자 알림
핵심 로직:
1. 입력값의 불변성 보장을 위한 깊은 복사 (선택적 skip 가능)
2. 강화된 값 비교 시스템으로 불필요한 리렌더링 방지
3. Structural sharing을 통한 성능 최적화
4. 값 변경 시에만 스냅샷 재생성 및 알림

#### Parameters

##### value

Type parameter **T**

##### options?

`StoreSetValueOptions`&lt;`T`&gt;

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

Defined in: [packages/react/src/stores/core/Store.ts:427](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L427)

Update value using updater function with Mutative integration
핵심 로직:
1. Mutative create를 사용하여 draft 객체 제공 (패치 캡처 포함)
2. updater 결과를 불변성을 보장하며 설정

#### Parameters

##### updater

(`current`) => `T` \| `undefined`

#### Returns

`void`

#### Implements

store-immutability
보안 강화: Mutative draft를 통한 안전한 상태 수정

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`update`](../interfaces/IStore.md#update)

***

### getListenerCount()

> **getListenerCount**(): `number`

Defined in: [packages/react/src/stores/core/Store.ts:550](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L550)

Get number of active listeners (includes patch-aware listeners)

#### Returns

`number`

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`getListenerCount`](../interfaces/IStore.md#getlistenercount)

***

### clearListeners()

> **clearListeners**(): `void`

Defined in: [packages/react/src/stores/core/Store.ts:557](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L557)

Clear all listeners (includes patch-aware listeners)

#### Returns

`void`

***

### notifyPath()

> **notifyPath**(`path`): `void`

Defined in: [packages/react/src/stores/core/Store.ts:580](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L580)

Manually notify path-based subscribers without changing state value

Useful for external systems (WebSocket, async operations) that need to
trigger UI updates for specific paths without actual state changes.

#### Parameters

##### path

(`string` \| `number`)[]

The path to notify subscribers about

#### Returns

`void`

#### Example

```typescript
// External async logic
async function fetchData(store: Store<AppState>) {
  store.notifyPath(['ui', 'loading']); // Trigger loading UI
  const data = await api.fetch();
  store.setValue({ ...store.getValue(), data });
}
```

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`notifyPath`](../interfaces/IStore.md#notifypath)

***

### notifyPaths()

> **notifyPaths**(`paths`): `void`

Defined in: [packages/react/src/stores/core/Store.ts:608](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L608)

Manually notify multiple paths at once

#### Parameters

##### paths

(`string` \| `number`)[][]

Array of paths to notify subscribers about

#### Returns

`void`

#### Example

```typescript
store.notifyPaths([
  ['ui', 'loading'],
  ['ui', 'progress']
]);
```

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`notifyPaths`](../interfaces/IStore.md#notifypaths)

***

### registerCleanup()

> **registerCleanup**(`task`): () => `void`

Defined in: [packages/react/src/stores/core/Store.ts:656](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L656)

Register cleanup task for automatic execution on disposal

Registers a cleanup function that will be automatically called when the store
is disposed. This prevents memory leaks and ensures proper resource cleanup.

#### Parameters

##### task

() => `void`

Cleanup function to register

#### Returns

Unregister function to remove the cleanup task

() => `void`

#### Example

```typescript
const timer = setInterval(() => {}, 1000);
const unregister = store.registerCleanup(() => clearInterval(timer));

// Later, remove the cleanup task if needed
unregister();
```

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`registerCleanup`](../interfaces/IStore.md#registercleanup)

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/react/src/stores/core/Store.ts:684](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L684)

Enhanced Store disposal with comprehensive cleanup

Performs complete cleanup of all store resources including listeners,
timers, cleanup tasks, and internal state. Prevents memory leaks and
ensures proper resource disposal.

#### Returns

`void`

#### Example

```typescript
// Manual disposal
store.dispose();

// Auto-disposal with useEffect
useEffect(() => {
  return () => store.dispose();
}, [store]);
```

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`dispose`](../interfaces/IStore.md#dispose)

***

### isStoreDisposed()

> **isStoreDisposed**(): `boolean`

Defined in: [packages/react/src/stores/core/Store.ts:737](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L737)

Check if store is disposed

#### Returns

`boolean`

true if store has been disposed

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`isStoreDisposed`](../interfaces/IStore.md#isstoredisposed)

***

### setCustomComparator()

> **setCustomComparator**(`comparator`): `void`

Defined in: [packages/react/src/stores/core/Store.ts:748](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L748)

Store별 커스텀 비교 함수 설정
이 Store에만 적용되는 특별한 비교 로직 설정

#### Parameters

##### comparator

(`oldValue`, `newValue`) => `boolean`

커스텀 비교 함수 (oldValue, newValue) => boolean

#### Returns

`void`

#### See

https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-config

***

### setComparisonOptions()

> **setComparisonOptions**(`options`): `void`

Defined in: [packages/react/src/stores/core/Store.ts:759](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L759)

Store별 비교 옵션 설정
이 Store에만 적용되는 비교 전략 설정

#### Parameters

##### options

`Partial`\<`ComparisonOptions`&lt;`T`&gt;\>

비교 옵션

#### Returns

`void`

#### See

https://mineclover.github.io/context-action/en/guide/patterns/store/advanced-config

***

### setCloningEnabled()

> **setCloningEnabled**(`enabled`): `void`

Defined in: [packages/react/src/stores/core/Store.ts:772](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L772)

성능 최적화: Store별 복사 동작 제어

#### Parameters

##### enabled

`boolean`

true: 복사 활성화 (안전), false: 복사 비활성화 (성능 우선)

#### Returns

`void`

#### See

https://mineclover.github.io/context-action/en/guide/patterns/store/performance

***

### isCloningEnabled()

> **isCloningEnabled**(): `boolean`

Defined in: [packages/react/src/stores/core/Store.ts:779](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L779)

현재 복사 설정 조회

#### Returns

`boolean`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/Store.ts:124](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/core/Store.ts#L124)

Unique identifier for the store

#### Implementation of

[`IStore`](../interfaces/IStore.md).[`name`](../interfaces/IStore.md#name)
