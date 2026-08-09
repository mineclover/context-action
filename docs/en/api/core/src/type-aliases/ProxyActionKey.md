[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ProxyActionKey

# Type Alias: ProxyActionKey\<T\>

> **ProxyActionKey**&lt;`T`&gt; = `Exclude`\<[`ActionNames`](ActionNames.md)&lt;`T`&gt;, [`ReservedActionKey`](ReservedActionKey.md)\>

Defined in: [packages/core/src/types.ts:1283](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1283)

Action keys that can be exposed through `register.actions` proxies.

## Type Parameters

### Generic type T

`T` *extends* [`ActionPayloadMap`](ActionPayloadMap.md)
