[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src/element](../README.md) / ElementBinding

# Interface: ElementBinding\<Props\>

Defined in: [packages/core/src/element/contracts.ts:28](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L28)

One target, complete input snapshots, explicit terminal disposal. Never owns renderer teardown.

## Type Parameters

### Props

`Props` *extends* `object`

## Methods

### update()

> **update**(`input`): `void`

Defined in: [packages/core/src/element/contracts.ts:31](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L31)

Reconcile events first, then attributes, styles, and properties, to capture synchronous setter events.

#### Parameters

##### input

`Props`

#### Returns

`void`

***

### updateProperties()

> **updateProperties**(`input`): `void`

Defined in: [packages/core/src/element/contracts.ts:32](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L32)

#### Parameters

##### input

`Props`

#### Returns

`void`

***

### updateAttributes()

> **updateAttributes**(`input`): `void`

Defined in: [packages/core/src/element/contracts.ts:33](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L33)

#### Parameters

##### input

`Props`

#### Returns

`void`

***

### updateStyles()

> **updateStyles**(`input`): `void`

Defined in: [packages/core/src/element/contracts.ts:34](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L34)

#### Parameters

##### input

`Props`

#### Returns

`void`

***

### updateEvents()

> **updateEvents**(`input`): `void`

Defined in: [packages/core/src/element/contracts.ts:35](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L35)

#### Parameters

##### input

`Props`

#### Returns

`void`

***

### disconnectEvents()

> **disconnectEvents**(): `void`

Defined in: [packages/core/src/element/contracts.ts:37](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L37)

Replayable listener cleanup; property ownership survives lifecycle replay.

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [packages/core/src/element/contracts.ts:39](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L39)

Terminal, idempotent; does not reset properties, remove DOM, or call target.dispose().

#### Returns

`void`

## Properties

### disposed

> `readonly` **disposed**: `boolean`

Defined in: [packages/core/src/element/contracts.ts:29](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/contracts.ts#L29)
