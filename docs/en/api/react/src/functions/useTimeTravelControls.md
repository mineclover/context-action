[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / useTimeTravelControls

# Function: useTimeTravelControls()

> **useTimeTravelControls**&lt;`T`&gt;(`store`): [`TimeTravelControlsState`](../interfaces/TimeTravelControlsState.md)

Defined in: [packages/react/src/stores/hooks/useTimeTravelControls.ts:65](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/react/src/stores/hooks/useTimeTravelControls.ts#L65)

Hook for subscribing to TimeTravelStore's time travel controls

## Type Parameters

### Generic type T

Type parameter **T**

## Parameters

### store

[`TimeTravelStore`](../classes/TimeTravelStore.md)&lt;`T`&gt;

## Returns

[`TimeTravelControlsState`](../interfaces/TimeTravelControlsState.md)

## Example

```tsx
const store = createTimeTravelStore('counter', { count: 0 });

function Counter() {
  const value = useStoreValue(store);
  const { canUndo, canRedo, undo, redo, position, historyLength } = useTimeTravelControls(store);

  return (
    <div>
      <p>Count: {value.count}</p>
      <p>Position: {position} / {historyLength - 1}</p>
      <button onClick={() => undo()} disabled={!canUndo}>Undo</button>
      <button onClick={() => redo()} disabled={!canRedo}>Redo</button>
    </div>
  );
}
```
