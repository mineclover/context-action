[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolApprovalStore

# Interface: ToolApprovalStore

Defined in: [packages/tool-protocol/src/tool-protocol.ts:118](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L118)

Reactive snapshot boundary for approval surfaces.

## Properties

### getSnapshot

> `readonly` **getSnapshot**: () => readonly [`ToolApprovalSnapshot`](ToolApprovalSnapshot.md)[]

Defined in: [packages/tool-protocol/src/tool-protocol.ts:119](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L119)

#### Returns

readonly [`ToolApprovalSnapshot`](ToolApprovalSnapshot.md)[]

***

### subscribe

> `readonly` **subscribe**: (`listener`) => () => `void`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:120](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/tool-protocol.ts#L120)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`
