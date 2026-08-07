[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / createTimeTravelStoreContext

# Function: createTimeTravelStoreContext()

> **createTimeTravelStoreContext**&lt;`T`&gt;(`contextName`, `initialStores`, `options?`): `object`

Defined in: [packages/react/src/stores/patterns/time-travel-store-pattern.tsx:305](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/patterns/time-travel-store-pattern.tsx#L305)

Create a time travel store context with undo/redo capabilities

## Type Parameters

### Generic type T

`T` *extends* `Record`\<`string`, `any`\>

## Parameters

### contextName

`string`

### initialStores

[`TimeTravelInitialStores`](../type-aliases/TimeTravelInitialStores.md)&lt;`T`&gt;

### options?

#### defaultMaxHistory?

`number`

## Returns

### Provider

> **Provider**: (`__namedParameters`) => `Element`

#### Parameters

##### \_\_namedParameters

###### children

Type parameter **ReactNode**

###### registryId?

`string`

#### Returns

Type parameter **Element**

### useStore

> **useStore**: &lt;`K`&gt;(`storeName`) => [`Store`](../classes/Store.md)\<`T`\[`K`\]\> \| [`TimeTravelStore`](../classes/TimeTravelStore.md)\<`T`\[`K`\]\>

Get a store (regular or time-travel based on config)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### storeName

Type parameter **K**

#### Returns

[`Store`](../classes/Store.md)\<`T`\[`K`\]\> \| [`TimeTravelStore`](../classes/TimeTravelStore.md)\<`T`\[`K`\]\>

### useTimeTravelStore

> **useTimeTravelStore**: &lt;`K`&gt;(`storeName`) => [`TimeTravelStore`](../classes/TimeTravelStore.md)\<`T`\[`K`\]\>

Get a time-travel enabled store. Throws if store has timeTravel: false

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### storeName

Type parameter **K**

#### Returns

[`TimeTravelStore`](../classes/TimeTravelStore.md)\<`T`\[`K`\]\>

### useStorePath

> **useStorePath**: \<`K`, `R`\>(`storeName`, `path`) => `R`

Hook for subscribing to a specific path with patch-based optimization

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

##### R

`R` = `unknown`

#### Parameters

##### storeName

Type parameter **K**

##### path

Type parameter **StorePath**

#### Returns

Type parameter **R**

#### Example

```tsx
const userName = useStorePath('user', ['name']);
// Only re-renders when user.name changes
```

### useStoreSelector

> **useStoreSelector**: \<`K`, `R`\>(`storeName`, `selector`, `options`) => `R`

Hook for subscribing with selector and path hints

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

##### R

Type parameter **R**

#### Parameters

##### storeName

Type parameter **K**

##### selector

(`value`) => `R`

##### options?

###### dependsOn?

`StorePath`[]

###### equalityFn?

(`a`, `b`) => `boolean`

#### Returns

Type parameter **R**

#### Example

```tsx
const fullName = useStoreSelector('user',
  (user) => `${user.firstName} ${user.lastName}`,
  { dependsOn: [['firstName'], ['lastName']] }
);
```

### useTimeTravelControls

> **useTimeTravelControls**: &lt;`K`&gt;(`storeName`) => [`TimeTravelContextControlsState`](../interfaces/TimeTravelContextControlsState.md)

Hook for time travel controls with proper React subscription.
Throws if used on a store without time travel enabled.

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### storeName

Type parameter **K**

#### Returns

[`TimeTravelContextControlsState`](../interfaces/TimeTravelContextControlsState.md)

### useStoreManager

> **useStoreManager**: () => [`TimeTravelStoreManager`](../classes/TimeTravelStoreManager.md)&lt;`T`&gt;

#### Returns

[`TimeTravelStoreManager`](../classes/TimeTravelStoreManager.md)&lt;`T`&gt;

### useStoreInfo

> **useStoreInfo**: () => `object`

#### Returns

`object`

##### name

> **name**: `string`

##### storeCount

> **storeCount**: `number`

##### availableStores

> **availableStores**: `string`[]

### useStoreClear

> **useStoreClear**: () => () => `void`

#### Returns

() => `void`

### withProvider

> **withProvider**: &lt;`P`&gt;(`Component`, `config?`) => `FC`&lt;`P`&gt;

#### Type Parameters

##### P

`P` *extends* `object`

#### Parameters

##### Component

`ComponentType`&lt;`P`&gt;

##### config?

###### displayName?

`string`

###### registryId?

`string`

###### autoCleanup?

`boolean`

###### errorBoundary?

`boolean`

#### Returns

`FC`&lt;`P`&gt;

### contextName

> **contextName**: `string`

### initialStores

> **initialStores**: [`TimeTravelInitialStores`](../type-aliases/TimeTravelInitialStores.md)&lt;`T`&gt;

## Example

```tsx
const { Provider, useStore, useTimeTravelControls } = createTimeTravelStoreContext('App', {
  counter: { initialValue: { count: 0 }, maxHistory: 100 },
  todos: { initialValue: [], maxHistory: 50 },
});

function Counter() {
  const store = useStore('counter');
  const { count } = useStoreValue(store);
  const { canUndo, canRedo, undo, redo } = useTimeTravelControls('counter');

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => undo()} disabled={!canUndo}>Undo</button>
      <button onClick={() => redo()} disabled={!canRedo}>Redo</button>
    </div>
  );
}
```
