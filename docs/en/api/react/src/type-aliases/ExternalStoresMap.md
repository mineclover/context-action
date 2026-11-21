[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/react/src](../README.md) / ExternalStoresMap

# Type Alias: ExternalStoresMap\<T\>

> **ExternalStoresMap**&lt;`T`&gt; = `{ [K in keyof T]?: Store<T[K]> }`

Defined in: [packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx:145](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/declarative-store-pattern-v2.tsx#L145)

Map of externally created Store instances injected into createStoreContext().Provider.
Partial injection lets callers pre-wire headless domain stores while allowing
non-injected keys in `initialStores` to still be lazily instantiated by the manager.

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>
