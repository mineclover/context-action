[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / JSONSchema

# Interface: JSONSchema

Defined in: [packages/tool-protocol/src/json-schema.ts:48](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L48)

JSON Schema 인터페이스 (draft-07 호환)

Tool chain (MCP, OpenAI, Anthropic) 포맷 변환의 기반이 되는 타입입니다.
Zod 스키마에서 z.toJSONSchema()를 통해 변환됩니다.

## Example

```typescript
const schema: JSONSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'User ID' },
    name: { type: 'string', minLength: 1, maxLength: 50 }
  },
  required: ['id', 'name']
};
```

## Indexable

> \[`key`: `string`\]: `unknown`

## Properties

### type?

> `optional` **type?**: [`JSONSchemaType`](../type-aliases/JSONSchemaType.md) \| [`JSONSchemaType`](../type-aliases/JSONSchemaType.md)[]

Defined in: [packages/tool-protocol/src/json-schema.ts:50](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L50)

***

### title?

> `optional` **title?**: `string`

Defined in: [packages/tool-protocol/src/json-schema.ts:53](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L53)

***

### description?

> `optional` **description?**: `string`

Defined in: [packages/tool-protocol/src/json-schema.ts:54](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L54)

***

### default?

> `optional` **default?**: `unknown`

Defined in: [packages/tool-protocol/src/json-schema.ts:55](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L55)

***

### examples?

> `optional` **examples?**: `unknown`[]

Defined in: [packages/tool-protocol/src/json-schema.ts:56](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L56)

***

### minLength?

> `optional` **minLength?**: `number`

Defined in: [packages/tool-protocol/src/json-schema.ts:59](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L59)

***

### maxLength?

> `optional` **maxLength?**: `number`

Defined in: [packages/tool-protocol/src/json-schema.ts:60](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L60)

***

### pattern?

> `optional` **pattern?**: `string`

Defined in: [packages/tool-protocol/src/json-schema.ts:61](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L61)

***

### format?

> `optional` **format?**: `string`

Defined in: [packages/tool-protocol/src/json-schema.ts:62](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L62)

***

### minimum?

> `optional` **minimum?**: `number`

Defined in: [packages/tool-protocol/src/json-schema.ts:65](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L65)

***

### maximum?

> `optional` **maximum?**: `number`

Defined in: [packages/tool-protocol/src/json-schema.ts:66](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L66)

***

### exclusiveMinimum?

> `optional` **exclusiveMinimum?**: `number`

Defined in: [packages/tool-protocol/src/json-schema.ts:67](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L67)

***

### exclusiveMaximum?

> `optional` **exclusiveMaximum?**: `number`

Defined in: [packages/tool-protocol/src/json-schema.ts:68](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L68)

***

### multipleOf?

> `optional` **multipleOf?**: `number`

Defined in: [packages/tool-protocol/src/json-schema.ts:69](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L69)

***

### items?

> `optional` **items?**: `JSONSchema`

Defined in: [packages/tool-protocol/src/json-schema.ts:72](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L72)

***

### minItems?

> `optional` **minItems?**: `number`

Defined in: [packages/tool-protocol/src/json-schema.ts:73](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L73)

***

### maxItems?

> `optional` **maxItems?**: `number`

Defined in: [packages/tool-protocol/src/json-schema.ts:74](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L74)

***

### uniqueItems?

> `optional` **uniqueItems?**: `boolean`

Defined in: [packages/tool-protocol/src/json-schema.ts:75](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L75)

***

### properties?

> `optional` **properties?**: `Record`\<`string`, `JSONSchema`\>

Defined in: [packages/tool-protocol/src/json-schema.ts:78](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L78)

***

### required?

> `optional` **required?**: `string`[]

Defined in: [packages/tool-protocol/src/json-schema.ts:79](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L79)

***

### additionalProperties?

> `optional` **additionalProperties?**: `boolean` \| `JSONSchema`

Defined in: [packages/tool-protocol/src/json-schema.ts:80](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L80)

***

### enum?

> `optional` **enum?**: `unknown`[]

Defined in: [packages/tool-protocol/src/json-schema.ts:83](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L83)

***

### const?

> `optional` **const?**: `unknown`

Defined in: [packages/tool-protocol/src/json-schema.ts:84](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L84)

***

### allOf?

> `optional` **allOf?**: `JSONSchema`[]

Defined in: [packages/tool-protocol/src/json-schema.ts:87](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L87)

***

### anyOf?

> `optional` **anyOf?**: `JSONSchema`[]

Defined in: [packages/tool-protocol/src/json-schema.ts:88](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L88)

***

### oneOf?

> `optional` **oneOf?**: `JSONSchema`[]

Defined in: [packages/tool-protocol/src/json-schema.ts:89](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L89)

***

### not?

> `optional` **not?**: `JSONSchema`

Defined in: [packages/tool-protocol/src/json-schema.ts:90](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L90)

***

### $ref?

> `optional` **$ref?**: `string`

Defined in: [packages/tool-protocol/src/json-schema.ts:93](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L93)

***

### $defs?

> `optional` **$defs?**: `Record`\<`string`, `JSONSchema`\>

Defined in: [packages/tool-protocol/src/json-schema.ts:94](https://github.com/mineclover/context-action/blob/main/packages/tool-protocol/src/json-schema.ts#L94)
