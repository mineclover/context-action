[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative-core/src](../README.md) / markSimpleObject

# Function: markSimpleObject()

> **markSimpleObject**(`value`): `"immutable"` \| `undefined`

Defined in: [packages/mutative-core/src/utils/marker.ts:29](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/src/utils/marker.ts#L29)

A `mark` that drafts plain objects, objects without a prototype and plain
objects of other realms, such as same-origin iframes.

## Parameters

### value

`unknown`

## Returns

`"immutable"` \| `undefined`
