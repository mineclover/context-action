[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / DispatchArgs

# Type Alias: DispatchArgs\<P\>

> **DispatchArgs**&lt;`P`&gt; = \[`P`\] *extends* \[`void`\] ? \[`undefined`, [`DispatchOptions`](../interfaces/DispatchOptions.md)\] : \[`P`, [`DispatchOptions`](../interfaces/DispatchOptions.md)\]

Defined in: [packages/core/src/types.ts:1159](https://github.com/mineclover/context-action/blob/main/packages/core/src/types.ts#L1159)

Arguments accepted by a dispatch method for a single action payload.
Payload-bearing actions must provide their payload; void actions may omit it.

## Type Parameters

### Generic type P

Type parameter **P**
