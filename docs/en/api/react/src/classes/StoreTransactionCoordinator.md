[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreTransactionCoordinator

# Class: StoreTransactionCoordinator

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:125](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L125)

Groups updates across multiple TimeTravelStores into one history entry per
participant. The participant list is explicit so a transaction cannot
accidentally capture unrelated global stores.

## Constructors

### Constructor

> **new StoreTransactionCoordinator**(): `StoreTransactionCoordinator`

#### Returns

Type parameter **StoreTransactionCoordinator**

## Methods

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:139](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L139)

#### Parameters

##### listener

[`StoreTransactionListener`](../type-aliases/StoreTransactionListener.md)

#### Returns

() => `void`

***

### serializeHistory()

> **serializeHistory**(): `string`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:144](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L144)

#### Returns

`string`

***

### getInspectorSnapshot()

> **getInspectorSnapshot**(): [`StoreTransactionInspectorSnapshot`](../interfaces/StoreTransactionInspectorSnapshot.md)

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:148](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L148)

#### Returns

[`StoreTransactionInspectorSnapshot`](../interfaces/StoreTransactionInspectorSnapshot.md)

***

### bindInspector()

> **bindInspector**(`sink`): () => `void`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:153](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L153)

Connect a serializable snapshot stream to DevTools, logs, or a protocol adapter.

#### Parameters

##### sink

[`StoreTransactionInspectorSink`](../interfaces/StoreTransactionInspectorSink.md)

#### Returns

() => `void`

***

### begin()

> **begin**(`participants`, `options?`): [`StoreTransactionHandle`](../interfaces/StoreTransactionHandle.md)

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:204](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L204)

#### Parameters

##### participants

readonly [`StoreTransactionParticipant`](../interfaces/StoreTransactionParticipant.md)&lt;`any`&gt;[]

##### options?

`Omit`\<[`StoreTransactionMeta`](../interfaces/StoreTransactionMeta.md), `"id"`\> = `{}`

#### Returns

[`StoreTransactionHandle`](../interfaces/StoreTransactionHandle.md)

***

### run()

> **run**&lt;`R`&gt;(`participants`, `callback`, `options?`): `Promise`&lt;`R`&gt;

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:293](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L293)

#### Type Parameters

##### R

Type parameter **R**

#### Parameters

##### participants

readonly [`StoreTransactionParticipant`](../interfaces/StoreTransactionParticipant.md)&lt;`any`&gt;[]

##### callback

(`meta`) => `R` \| `Promise`&lt;`R`&gt;

##### options?

`Omit`\<[`StoreTransactionMeta`](../interfaces/StoreTransactionMeta.md), `"id"`\> = `{}`

#### Returns

`Promise`&lt;`R`&gt;

***

### canUndo()

> **canUndo**(): `boolean`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:309](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L309)

#### Returns

`boolean`

***

### canRedo()

> **canRedo**(): `boolean`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:310](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L310)

#### Returns

`boolean`

***

### getPosition()

> **getPosition**(): `number`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:311](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L311)

#### Returns

`number`

***

### getHistory()

> **getHistory**(): readonly [`StoreTransactionRecord`](../interfaces/StoreTransactionRecord.md)[]

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:312](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L312)

#### Returns

readonly [`StoreTransactionRecord`](../interfaces/StoreTransactionRecord.md)[]

***

### undo()

> **undo**(): `void`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:314](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L314)

#### Returns

`void`

***

### redo()

> **redo**(): `void`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:323](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L323)

#### Returns

`void`
