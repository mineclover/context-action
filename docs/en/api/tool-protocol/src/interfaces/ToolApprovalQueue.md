[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolApprovalQueue

# Interface: ToolApprovalQueue

Defined in: packages/tool-protocol/src/tool-protocol.ts:113

Shared approval lifecycle used by browser and host tool surfaces.

## Properties

### store

> `readonly` **store**: [`ToolApprovalStore`](ToolApprovalStore.md)

Defined in: packages/tool-protocol/src/tool-protocol.ts:114

***

### request

> `readonly` **request**: (`input`) => `Promise`\<[`ToolApprovalDecision`](../type-aliases/ToolApprovalDecision.md)\>

Defined in: packages/tool-protocol/src/tool-protocol.ts:115

#### Parameters

##### input

[`ToolApprovalRequestInput`](ToolApprovalRequestInput.md)

#### Returns

`Promise`\<[`ToolApprovalDecision`](../type-aliases/ToolApprovalDecision.md)\>

***

### resolve

> `readonly` **resolve**: (`id`, `decision`) => `void`

Defined in: packages/tool-protocol/src/tool-protocol.ts:118

#### Parameters

##### id

`string`

##### decision

[`ToolApprovalDecision`](../type-aliases/ToolApprovalDecision.md)

#### Returns

`void`

***

### denyAll

> `readonly` **denyAll**: () => `void`

Defined in: packages/tool-protocol/src/tool-protocol.ts:119

#### Returns

`void`
