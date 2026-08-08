[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionAttemptSupersededError

# Class: ActionAttemptSupersededError

Defined in: [packages/core/src/errors.ts:42](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L42)

Signals work from a completed race attempt to stop before the next retry.

## Extends

- `Error`

## Constructors

### Constructor

> **new ActionAttemptSupersededError**(`attempt`): `ActionAttemptSupersededError`

Defined in: [packages/core/src/errors.ts:45](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L45)

#### Parameters

##### attempt

`number`

#### Returns

Type parameter **ActionAttemptSupersededError**

#### Overrides

`Error.constructor`

## Properties

### name

> **name**: `string` = `'ActionAttemptSupersededError'`

Defined in: [packages/core/src/errors.ts:43](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L43)

#### Overrides

`Error.name`

***

### attempt

> `readonly` **attempt**: `number`

Defined in: [packages/core/src/errors.ts:45](https://github.com/mineclover/context-action/blob/main/packages/core/src/errors.ts#L45)
