[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / TimeTravelContextControlsState

# Interface: TimeTravelContextControlsState

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:87](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L87)

Time travel controls state

## Properties

### canUndo

> **canUndo**: `boolean`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:88](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L88)

***

### canRedo

> **canRedo**: `boolean`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:89](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L89)

***

### position

> **position**: `number`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:90](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L90)

***

### historyLength

> **historyLength**: `number`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:91](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L91)

***

### undo

> **undo**: (`steps?`) => `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:92](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L92)

#### Parameters

##### steps?

`number`

#### Returns

`void`

***

### redo

> **redo**: (`steps?`) => `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:93](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L93)

#### Parameters

##### steps?

`number`

#### Returns

`void`

***

### goTo

> **goTo**: (`position`) => `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:94](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L94)

#### Parameters

##### position

`number`

#### Returns

`void`

***

### reset

> **reset**: () => `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:95](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L95)

#### Returns

`void`
