[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / TimeTravelContextControlsState

# Interface: TimeTravelContextControlsState

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:98](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L98)

Time travel controls state

## Properties

### canUndo

> **canUndo**: `boolean`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:99](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L99)

***

### canRedo

> **canRedo**: `boolean`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:100](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L100)

***

### position

> **position**: `number`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:101](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L101)

***

### historyLength

> **historyLength**: `number`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:102](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L102)

***

### undo

> **undo**: (`steps?`) => `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:103](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L103)

#### Parameters

##### steps?

`number`

#### Returns

`void`

***

### redo

> **redo**: (`steps?`) => `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:104](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L104)

#### Parameters

##### steps?

`number`

#### Returns

`void`

***

### goTo

> **goTo**: (`position`) => `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:105](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L105)

#### Parameters

##### position

`number`

#### Returns

`void`

***

### reset

> **reset**: () => `void`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:106](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L106)

#### Returns

`void`
