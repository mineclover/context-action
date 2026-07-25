[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / ToolObservationSinkRecord

# Interface: ToolObservationSinkRecord

Defined in: [packages/tool-protocol/src/observability.ts:89](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L89)

## Properties

### schemaVersion

> `readonly` **schemaVersion**: `"context-action-tool-observation-sink.v1"`

Defined in: [packages/tool-protocol/src/observability.ts:90](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L90)

***

### observationSchemaVersion

> `readonly` **observationSchemaVersion**: `"context-action-tool-observation.v1"`

Defined in: [packages/tool-protocol/src/observability.ts:91](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L91)

***

### serializedObservation

> `readonly` **serializedObservation**: `string`

Defined in: [packages/tool-protocol/src/observability.ts:93](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L93)

Serialized metadata-only observation; it never contains raw request/result values.

***

### policy

> `readonly` **policy**: `object`

Defined in: [packages/tool-protocol/src/observability.ts:94](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/observability.ts#L94)

#### schemaVersion

> `readonly` **schemaVersion**: `"context-action-tool-observability-policy.v1"`

#### maxBytes

> `readonly` **maxBytes**: `number`

#### retentionMs

> `readonly` **retentionMs**: `number`

#### maxEntries

> `readonly` **maxEntries**: `number`
