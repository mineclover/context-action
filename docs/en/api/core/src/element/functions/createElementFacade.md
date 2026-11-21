[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src/element](../README.md) / createElementFacade

# Function: createElementFacade()

> **createElementFacade**\<`Element`, `Keys`\>(`keys`): [`ImperativeHandleFactory`](../type-aliases/ImperativeHandleFactory.md)\<`Element`, `Pick`\<`Element`, `Keys`\[`number`\]\>\>

Defined in: [packages/core/src/element/create-element-facade.ts:5](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/create-element-facade.ts#L5)

DOM specialization of the internal object projection; not a revocable capability.

## Type Parameters

### Element

`Element` *extends* `HTMLElement`

### Keys

`Keys` *extends* readonly keyof `Element`[]

## Parameters

### keys

`Keys`

## Returns

[`ImperativeHandleFactory`](../type-aliases/ImperativeHandleFactory.md)\<`Element`, `Pick`\<`Element`, `Keys`\[`number`\]\>\>
