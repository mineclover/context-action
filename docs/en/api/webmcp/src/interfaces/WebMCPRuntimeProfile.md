[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/webmcp/src](../README.md) / WebMCPRuntimeProfile

# Interface: WebMCPRuntimeProfile\<TDocument\>

Defined in: [packages/webmcp/src/index.ts:57](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L57)

Isolates the volatile browser API surface from the canonical tool manager.
Profiles may adapt callback/registration shapes, but must receive the same
normalized browser tool definition.

## Type Parameters

### TDocument

`TDocument` = `unknown`

## Methods

### isSupported()

> **isSupported**(`document`): `document is TDocument`

Defined in: [packages/webmcp/src/index.ts:59](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L59)

#### Parameters

##### document

`unknown`

#### Returns

`document is TDocument`

***

### registerTool()

> **registerTool**(`document`, `tool`, `options`): `Promise`&lt;`void`&gt;

Defined in: [packages/webmcp/src/index.ts:60](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L60)

#### Parameters

##### document

Type parameter **TDocument**

##### tool

[`WebMCPToolDefinition`](WebMCPToolDefinition.md)

##### options

[`WebMCPRegistrationOptions`](WebMCPRegistrationOptions.md)

#### Returns

`Promise`&lt;`void`&gt;

## Properties

### id

> `readonly` **id**: `string`

Defined in: [packages/webmcp/src/index.ts:58](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/index.ts#L58)
