[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative-core/src](../README.md) / unsafe

# Function: unsafe()

> **unsafe**&lt;`T`&gt;(`callback`): `T`

Defined in: [packages/mutative-core/src/unsafe.ts:57](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/src/unsafe.ts#L57)

`unsafe(callback)` to access mutable data directly in strict mode.

## Example

```ts
import { create, unsafe } from 'mutative';

class Foobar {
  bar = 1;
}

const baseState = { foobar: new Foobar() };
const state = create(
  baseState,
  (draft) => {
   unsafe(() => {
     draft.foobar.bar = 2;
   });
  },
  {
    strict: true,
  }
);

expect(state).toBe(baseState);
expect(state.foobar).toBe(baseState.foobar);
expect(state.foobar.bar).toBe(2);
```

## Type Parameters

### Generic type T

Type parameter **T**

## Parameters

### callback

() => `T`

## Returns

Type parameter **T**
