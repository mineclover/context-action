[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/tool-protocol/src](../README.md) / SafeParseResult

# Type Alias: SafeParseResult\<T\>

> **SafeParseResult**&lt;`T`&gt; = \{ `success`: `true`; `data`: `T`; \} \| \{ `success`: `false`; `error`: `z.ZodError`; \}

Defined in: [packages/tool-protocol/src/action-schema.ts:52](https://github.com/mineclover/context-action/blob/bafa0b51cfbdb9acbddc23c96a5ee1060e42d446/packages/tool-protocol/src/action-schema.ts#L52)

Safe parse 결과 타입 (Zod 4 호환)

## Type Parameters

### Generic type T

Type parameter **T**
