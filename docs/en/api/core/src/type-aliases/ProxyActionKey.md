[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ProxyActionKey

# Type Alias: ProxyActionKey\<T\>

> **ProxyActionKey**&lt;`T`&gt; = `Exclude`\<keyof `T`, [`ReservedActionKey`](ReservedActionKey.md)\>

Defined in: [packages/core/src/types.ts:1096](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1096)

Action keys that can be exposed through `register.actions` proxies.

## Type Parameters

### Generic type T

`T` *extends* [`ActionPayloadMap`](ActionPayloadMap.md)
