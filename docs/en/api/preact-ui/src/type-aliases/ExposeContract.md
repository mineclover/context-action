[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/preact-ui/src](../README.md) / ExposeContract

# Type Alias: ExposeContract\<Expose\>

> **ExposeContract**&lt;`Expose`&gt; = `{ [K in keyof Expose]: K extends ReservedElementKey ? never : Expose[K] }`

Defined in: [packages/preact-ui/src/custom-element.ts:144](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L144)

Self-referential constraint that rejects `expose` contracts declaring a
[ReservedElementKey](ReservedElementKey.md). Non-reserved members keep their declared type.

## Type Parameters

### Expose

`Expose`
