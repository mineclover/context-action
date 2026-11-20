[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/react/src](../README.md) / StoreTransactionCoordinator

# Class: StoreTransactionCoordinator

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:75](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L75)

Groups updates across multiple TimeTravelStores into one history entry per
participant. The participant list is explicit so a transaction cannot
accidentally capture unrelated global stores.

## Implements

- `TransactionCoordinatorPort`

## Constructors

### Constructor

> **new StoreTransactionCoordinator**(): `StoreTransactionCoordinator`

#### Returns

`StoreTransactionCoordinator`

## Methods

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:90](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L90)

#### Parameters

##### listener

[`StoreTransactionListener`](../type-aliases/StoreTransactionListener.md)

#### Returns

() => `void`

***

### serializeHistory()

> **serializeHistory**(): `string`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:95](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L95)

#### Returns

`string`

***

### getInspectorSnapshot()

> **getInspectorSnapshot**(): [`StoreTransactionInspectorSnapshot`](../interfaces/StoreTransactionInspectorSnapshot.md)

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:99](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L99)

#### Returns

[`StoreTransactionInspectorSnapshot`](../interfaces/StoreTransactionInspectorSnapshot.md)

***

### bindInspector()

> **bindInspector**(`sink`): () => `void`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:104](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L104)

Connect a serializable snapshot stream to DevTools, logs, or a protocol adapter.

#### Parameters

##### sink

[`StoreTransactionInspectorSink`](../interfaces/StoreTransactionInspectorSink.md)

#### Returns

() => `void`

***

### begin()

> **begin**(`participants`, `options?`): [`StoreTransactionHandle`](../interfaces/StoreTransactionHandle.md)

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:165](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L165)

#### Parameters

##### participants

readonly `TransactionParticipant`&lt;`unknown`&gt;[]

##### options?

[`StoreTransactionOptions`](../type-aliases/StoreTransactionOptions.md) = `{}`

#### Returns

[`StoreTransactionHandle`](../interfaces/StoreTransactionHandle.md)

#### Implementation of

`TransactionCoordinatorPort.begin`

***

### run()

> **run**&lt;`R`&gt;(`participants`, `callback`, `options?`): `Promise`&lt;`R`&gt;

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:318](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L318)

#### Type Parameters

##### R

Type parameter **R**

#### Parameters

##### participants

readonly `TransactionParticipant`&lt;`unknown`&gt;[]

##### callback

(`meta`) => `R` \| `Promise`&lt;`R`&gt;

##### options?

[`StoreTransactionOptions`](../type-aliases/StoreTransactionOptions.md) = `{}`

#### Returns

`Promise`&lt;`R`&gt;

***

### canUndo()

> **canUndo**(): `boolean`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:334](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L334)

#### Returns

`boolean`

***

### canRedo()

> **canRedo**(): `boolean`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:337](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L337)

#### Returns

`boolean`

***

### getPosition()

> **getPosition**(): `number`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:340](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L340)

#### Returns

`number`

***

### getHistory()

> **getHistory**(): readonly [`StoreTransactionRecord`](../interfaces/StoreTransactionRecord.md)[]

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:341](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L341)

#### Returns

readonly [`StoreTransactionRecord`](../interfaces/StoreTransactionRecord.md)[]

***

### undo()

> **undo**(): `void`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:343](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L343)

#### Returns

`void`

***

### redo()

> **redo**(): `void`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:354](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L354)

#### Returns

`void`
