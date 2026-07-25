[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolApprovalStore

# Interface: ToolApprovalStore

Defined in: [packages/tool-protocol/src/tool-protocol.ts:107](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/tool-protocol.ts#L107)

Reactive snapshot boundary for approval surfaces.

## Properties

### getSnapshot

> `readonly` **getSnapshot**: () => readonly [`ToolApprovalSnapshot`](ToolApprovalSnapshot.md)[]

Defined in: [packages/tool-protocol/src/tool-protocol.ts:108](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/tool-protocol.ts#L108)

#### Returns

readonly [`ToolApprovalSnapshot`](ToolApprovalSnapshot.md)[]

***

### subscribe

> `readonly` **subscribe**: (`listener`) => () => `void`

Defined in: [packages/tool-protocol/src/tool-protocol.ts:109](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/tool-protocol.ts#L109)

#### Parameters

##### listener

() => `void`

#### Returns

() => `void`
