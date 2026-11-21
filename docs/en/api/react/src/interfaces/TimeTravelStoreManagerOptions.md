[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/react/src](../README.md) / TimeTravelStoreManagerOptions

# Interface: TimeTravelStoreManagerOptions\<T\>

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:126](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L126)

Options accepted by TimeTravelStoreManager constructor for headless DI bindings.

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>

## Properties

### externalStores?

> `optional` **externalStores?**: [`ExternalTimeTravelStoresMap`](../type-aliases/ExternalTimeTravelStoresMap.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:128](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L128)

Pre-created Store or TimeTravelStore instances to register under this manager.

***

### externalOwnership?

> `optional` **externalOwnership?**: `"shared"` \| `"owned"`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:133](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L133)

Ownership policy for `externalStores`. `'shared'` keeps external stores alive
across clear/dispose; `'owned'` delegates disposal of external stores to TimeTravelStoreManager.
