[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/react/src](../README.md) / ExternalTimeTravelStoresMap

# Type Alias: ExternalTimeTravelStoresMap\<T\>

> **ExternalTimeTravelStoresMap**&lt;`T`&gt; = \{ \[K in keyof T\]?: Store\<T\[K\]\> \| TimeTravelStore\<T\[K\]\> \}

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:117](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L117)

Map of externally created Store or TimeTravelStore instances injected into
createTimeTravelStoreContext().Provider.

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>
