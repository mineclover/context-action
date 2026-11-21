[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/react/src](../README.md) / StoreManagerOptions

# Interface: StoreManagerOptions\<T\>

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:153](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L153)

Options accepted by StoreManager constructor for headless DI bindings.

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>

## Properties

### externalStores?

> `optional` **externalStores?**: [`ExternalStoresMap`](../type-aliases/ExternalStoresMap.md)&lt;`T`&gt;

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:155](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L155)

Pre-created Store instances to register under this manager.

***

### externalOwnership?

> `optional` **externalOwnership?**: `"shared"` \| `"owned"`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:160](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L160)

Ownership policy for `externalStores`. `'shared'` keeps external stores alive
across clear/dispose; `'owned'` delegates disposal of external stores to StoreManager.
