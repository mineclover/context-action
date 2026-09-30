[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / StoreTransactionCoordinator

# Class: StoreTransactionCoordinator

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:69](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L69)

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

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:83](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L83)

#### Parameters

##### listener

[`StoreTransactionListener`](../type-aliases/StoreTransactionListener.md)

#### Returns

() => `void`

***

### serializeHistory()

> **serializeHistory**(): `string`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:88](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L88)

#### Returns

`string`

***

### getInspectorSnapshot()

> **getInspectorSnapshot**(): [`StoreTransactionInspectorSnapshot`](../interfaces/StoreTransactionInspectorSnapshot.md)

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:92](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L92)

#### Returns

[`StoreTransactionInspectorSnapshot`](../interfaces/StoreTransactionInspectorSnapshot.md)

***

### bindInspector()

> **bindInspector**(`sink`): () => `void`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:97](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L97)

Connect a serializable snapshot stream to DevTools, logs, or a protocol adapter.

#### Parameters

##### sink

[`StoreTransactionInspectorSink`](../interfaces/StoreTransactionInspectorSink.md)

#### Returns

() => `void`

***

### begin()

> **begin**(`participants`, `options?`): [`StoreTransactionHandle`](../interfaces/StoreTransactionHandle.md)

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:124](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L124)

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

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:199](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L199)

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

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:215](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L215)

#### Returns

`boolean`

***

### canRedo()

> **canRedo**(): `boolean`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:216](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L216)

#### Returns

`boolean`

***

### getPosition()

> **getPosition**(): `number`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:217](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L217)

#### Returns

`number`

***

### getHistory()

> **getHistory**(): readonly [`StoreTransactionRecord`](../interfaces/StoreTransactionRecord.md)[]

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:218](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L218)

#### Returns

readonly [`StoreTransactionRecord`](../interfaces/StoreTransactionRecord.md)[]

***

### undo()

> **undo**(): `void`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:220](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L220)

#### Returns

`void`

***

### redo()

> **redo**(): `void`

Defined in: [packages/react/src/stores/core/StoreTransactionCoordinator.ts:229](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/StoreTransactionCoordinator.ts#L229)

#### Returns

`void`
