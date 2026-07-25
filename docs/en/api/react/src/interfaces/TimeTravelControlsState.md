[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / TimeTravelControlsState

# Interface: TimeTravelControlsState

Defined in: [packages/react/src/stores/hooks/useTimeTravelControls.ts:24](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useTimeTravelControls.ts#L24)

Time travel control state with functions

## Extends

- `TimeTravelState`

## Properties

### canUndo

> **canUndo**: `boolean`

Defined in: [packages/react/src/stores/hooks/useTimeTravelControls.ts:15](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useTimeTravelControls.ts#L15)

#### Inherited from

`TimeTravelState.canUndo`

***

### canRedo

> **canRedo**: `boolean`

Defined in: [packages/react/src/stores/hooks/useTimeTravelControls.ts:16](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useTimeTravelControls.ts#L16)

#### Inherited from

`TimeTravelState.canRedo`

***

### position

> **position**: `number`

Defined in: [packages/react/src/stores/hooks/useTimeTravelControls.ts:17](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useTimeTravelControls.ts#L17)

#### Inherited from

`TimeTravelState.position`

***

### historyLength

> **historyLength**: `number`

Defined in: [packages/react/src/stores/hooks/useTimeTravelControls.ts:18](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useTimeTravelControls.ts#L18)

#### Inherited from

`TimeTravelState.historyLength`

***

### undo

> **undo**: (`steps?`) => `void`

Defined in: [packages/react/src/stores/hooks/useTimeTravelControls.ts:26](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useTimeTravelControls.ts#L26)

Undo function

#### Parameters

##### steps?

`number`

#### Returns

`void`

***

### redo

> **redo**: (`steps?`) => `void`

Defined in: [packages/react/src/stores/hooks/useTimeTravelControls.ts:28](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useTimeTravelControls.ts#L28)

Redo function

#### Parameters

##### steps?

`number`

#### Returns

`void`

***

### goTo

> **goTo**: (`position`) => `void`

Defined in: [packages/react/src/stores/hooks/useTimeTravelControls.ts:30](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useTimeTravelControls.ts#L30)

Go to specific position

#### Parameters

##### position

`number`

#### Returns

`void`

***

### reset

> **reset**: () => `void`

Defined in: [packages/react/src/stores/hooks/useTimeTravelControls.ts:32](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/hooks/useTimeTravelControls.ts#L32)

Reset to initial state

#### Returns

`void`
