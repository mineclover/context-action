[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / IStore

# Interface: IStore\<T\>

Defined in: [packages/react/src/stores/core/types.ts:97](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/core/types.ts#L97)

Core Store interface for reactive state management

## Implements

store-interface

## Implements

usesyncexternalstore-compatible

## Implements

observer-pattern

## Memberof

core-concepts

## Since

1.0.0

Primary interface for Store instances, compatible with React's useSyncExternalStore
and implementing the Observer pattern for reactive state management.

## Example

```typescript
const userStore: IStore<User> = createStore('user', { 
  id: '', 
  name: '', 
  email: '' 
});

// Subscribe to changes
const unsubscribe = userStore.subscribe(() => {
  console.log('User store updated:', userStore.getSnapshot().value);
});

// Update store value
userStore.setValue({ id: '1', name: 'John', email: 'john@example.com' });

// Get current value for action handlers
const currentUser = userStore.getValue();
```

## Type Parameters

### Generic type T

`T` = `any`

The type of the stored value

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/react/src/stores/core/types.ts:99](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/core/types.ts#L99)

Unique identifier for the store

***

### subscribe

> **subscribe**: `Subscribe`

Defined in: [packages/react/src/stores/core/types.ts:102](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/core/types.ts#L102)

Subscribe to store changes (React useSyncExternalStore compatible)

***

### getSnapshot()

> **getSnapshot**: () => [`Snapshot`](Snapshot.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/core/types.ts:105](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/core/types.ts#L105)

Get immutable snapshot (React useSyncExternalStore compatible)

#### Returns

[`Snapshot`](Snapshot.md)&lt;`T`&gt;

***

### setValue()

> **setValue**: (`value`) => `void`

Defined in: [packages/react/src/stores/core/types.ts:108](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/core/types.ts#L108)

Set store value with change notification

#### Parameters

##### value

Type parameter **T**

#### Returns

`void`

***

### getValue()

> **getValue**: () => `T`

Defined in: [packages/react/src/stores/core/types.ts:111](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/core/types.ts#L111)

Get current value directly (for action handlers)

#### Returns

Type parameter **T**

***

### getListenerCount()?

> `optional` **getListenerCount**: () => `number`

Defined in: [packages/react/src/stores/core/types.ts:114](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/react/src/stores/core/types.ts#L114)

Get number of active listeners (debugging/monitoring)

#### Returns

`number`
