[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionSchemaLike

# Interface: ActionSchemaLike

Defined in: [packages/core/src/types.ts:29](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/types.ts#L29)

Minimal runtime contract consumed by ActionRegister for payload validation.

The concrete Zod-backed action schema lives in
`@context-action/tool-protocol`; keeping this structural contract here
avoids coupling the action runtime to transport and schema adapters.

## Methods

### safeParse()

> **safeParse**(`value`): \{ `success`: `true`; `data`: `unknown`; \} \| \{ `success`: `false`; `error`: \{ `message`: `string`; `issues`: readonly `object`[]; \}; \}

Defined in: [packages/core/src/types.ts:30](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/types.ts#L30)

#### Parameters

##### value

`unknown`

#### Returns

\{ `success`: `true`; `data`: `unknown`; \} \| \{ `success`: `false`; `error`: \{ `message`: `string`; `issues`: readonly `object`[]; \}; \}
