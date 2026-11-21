[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src/effect](../README.md) / StandardSchemaV1Like

# Interface: StandardSchemaV1Like\<TInput, TOutput\>

Defined in: [packages/xstate/src/effect.ts:45](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L45)

Minimal structural subset of `@standard-schema/spec` v1 (`Schema.toStandardSchemaV1`).

## Type Parameters

### TInput

`TInput` = `unknown`

### TOutput

`TOutput` = `TInput`

## Properties

### ~standard

> `readonly` **~standard**: `object`

Defined in: [packages/xstate/src/effect.ts:46](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L46)

#### version?

> `readonly` `optional` **version?**: `number`

#### vendor?

> `readonly` `optional` **vendor?**: `string`

#### types?

> `readonly` `optional` **types?**: `object`

##### types.input?

> `readonly` `optional` **input?**: `TInput`

##### types.output?

> `readonly` `optional` **output?**: `TOutput`

#### validate()

> **validate**(`value`): [`StandardSchemaV1Result`](../type-aliases/StandardSchemaV1Result.md)&lt;`TOutput`&gt; \| `Promise`\<[`StandardSchemaV1Result`](../type-aliases/StandardSchemaV1Result.md)&lt;`TOutput`&gt;\>

##### Parameters

###### value

`unknown`

##### Returns

[`StandardSchemaV1Result`](../type-aliases/StandardSchemaV1Result.md)&lt;`TOutput`&gt; \| `Promise`\<[`StandardSchemaV1Result`](../type-aliases/StandardSchemaV1Result.md)&lt;`TOutput`&gt;\>
