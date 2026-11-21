[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/react/src](../README.md) / StoreProviderProps

# Interface: StoreProviderProps\<T\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:169](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L169)

Props accepted by the Provider returned from createStoreContext().

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\>

## Properties

### children

> **children**: `ReactNode`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:170](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L170)

***

### registryId?

> `optional` **registryId?**: `string`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:172](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L172)

Optional custom registry identifier for isolation.

***

### manager?

> `optional` **manager?**: [`StoreManager`](../classes/StoreManager.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:178](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L178)

Optional externally constructed StoreManager instance for headless-first
orchestration and dependency injection. When both `manager` and `stores`
are provided, `manager` takes precedence.

***

### stores?

> `optional` **stores?**: [`ExternalStoresMap`](../type-aliases/ExternalStoresMap.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:183](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L183)

Optional partial or full map of externally constructed Store instances created
via `createStore(...)` outside React. Uninjected keys fall back to `initialStores`.

***

### ownership?

> `optional` **ownership?**: `"shared"` \| `"owned"`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:190](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L190)

Controls whether Provider unmount disposes injected `manager` or `stores`.
Defaults to `'shared'` when `manager` or `stores` is supplied; set to `'owned'`
to transfer disposal ownership to the Provider. Ignored when neither is supplied
(always `'owned'`).
