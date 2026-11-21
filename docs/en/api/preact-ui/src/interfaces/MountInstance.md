[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/preact-ui/src](../README.md) / MountInstance

# Interface: MountInstance\<Input\>

Defined in: [packages/preact-ui/src/mount.ts:23](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/mount.ts#L23)

## Type Parameters

### Input

`Input`

## Methods

### update()

> **update**(`input`): `void`

Defined in: [packages/preact-ui/src/mount.ts:26](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/mount.ts#L26)

Replace the complete input snapshot, not a partial prop merge.

#### Parameters

##### input

`Input`

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: [packages/preact-ui/src/mount.ts:28](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/mount.ts#L28)

Unmount children; never remove the host-owned root. Idempotent.

#### Returns

`void`

## Properties

### destroyed

> `readonly` **destroyed**: `boolean`

Defined in: [packages/preact-ui/src/mount.ts:24](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/mount.ts#L24)
