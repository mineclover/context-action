[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionPayloadMap

# Type Alias: ActionPayloadMap

> **ActionPayloadMap** = `object`

Defined in: [packages/core/src/types.ts:20](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/types.ts#L20)

Marker type for action payload maps.

Deliberately does not declare a string index signature: adding one would
widen `keyof` to `string | number` and make unknown action names compile.
Applications extend this type from an interface with literal action keys.
