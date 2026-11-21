[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src/effect](../README.md) / registerStandardSchemaGuard

# Function: registerStandardSchemaGuard()

## Call Signature

> **registerStandardSchemaGuard**\<`TActions`, `TResultMap`, `K`\>(`target`, `action`, `schema`, `options?`): `UnregisterFunction`

Defined in: [packages/xstate/src/effect.ts:287](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L287)

Registers a Standard Schema v1 (or Effect v4 `Schema`) validation + normalization
Guard onto either an async `ActionRegister` or a synchronous `SyncActionPipeline`.

### Type Parameters

#### TActions

`TActions` *extends* `object`

#### TResultMap

`TResultMap` *extends* `Partial`\<`Record`\<`Extract`\<keyof `TActions`, `string`\>, `unknown`\>\>

#### K

`K` *extends* `string`

### Parameters

#### target

`ActionRegister`\<`TActions`, `TResultMap`\>

#### action

Type parameter **K**

#### schema

[`StandardSchemaV1Like`](../interfaces/StandardSchemaV1Like.md)\<`TActions`\[`K`\], `TActions`\[`K`\]\>

#### options?

[`StandardSchemaGuardOptions`](../interfaces/StandardSchemaGuardOptions.md)

### Returns

`UnregisterFunction`

## Call Signature

> **registerStandardSchemaGuard**\<`TActions`, `K`\>(`target`, `action`, `schema`, `options?`): () => `void`

Defined in: [packages/xstate/src/effect.ts:297](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L297)

Registers a Standard Schema v1 (or Effect v4 `Schema`) validation + normalization
Guard onto either an async `ActionRegister` or a synchronous `SyncActionPipeline`.

### Type Parameters

#### TActions

`TActions` *extends* `Record`\<`string`, `unknown`\>

#### K

`K` *extends* `string`

### Parameters

#### target

`SyncActionPipeline`&lt;`TActions`&gt;

#### action

Type parameter **K**

#### schema

[`StandardSchemaV1Like`](../interfaces/StandardSchemaV1Like.md)\<`TActions`\[`K`\], `TActions`\[`K`\]\>

#### options?

[`StandardSchemaGuardOptions`](../interfaces/StandardSchemaGuardOptions.md)

### Returns

() => `void`
