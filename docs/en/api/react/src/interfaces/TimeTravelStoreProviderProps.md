[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/react/src](../README.md) / TimeTravelStoreProviderProps

# Interface: TimeTravelStoreProviderProps\<T\>

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:141](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L141)

Props accepted by the Provider returned from createTimeTravelStoreContext().

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\>

## Properties

### children

> **children**: `ReactNode`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:142](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L142)

***

### registryId?

> `optional` **registryId?**: `string`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:144](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L144)

Optional custom registry identifier for isolation.

***

### manager?

> `optional` **manager?**: [`TimeTravelStoreManager`](../classes/TimeTravelStoreManager.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:150](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L150)

Optional externally constructed TimeTravelStoreManager instance for headless-first
orchestration and dependency injection. When both `manager` and `stores` are
provided, `manager` takes precedence.

***

### stores?

> `optional` **stores?**: [`ExternalTimeTravelStoresMap`](../type-aliases/ExternalTimeTravelStoresMap.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:155](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L155)

Optional partial or full map of externally constructed Store or TimeTravelStore
instances created outside React. Uninjected keys fall back to `initialStores`.

***

### ownership?

> `optional` **ownership?**: `"shared"` \| `"owned"`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:162](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L162)

Controls whether Provider unmount disposes injected `manager` or `stores`.
Defaults to `'shared'` when `manager` or `stores` is supplied; set to `'owned'`
to transfer disposal ownership to the Provider. Ignored when neither is supplied
(always `'owned'`).
