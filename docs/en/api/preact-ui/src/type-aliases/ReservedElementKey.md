[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/preact-ui/src](../README.md) / ReservedElementKey

# Type Alias: ReservedElementKey

> **ReservedElementKey** = keyof [`ManagedPreactElement`](../interfaces/ManagedPreactElement.md)&lt;`unknown`&gt;

Defined in: [packages/preact-ui/src/custom-element.ts:138](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L138)

Members that `expose` must never redefine: the `HTMLElement` platform
surface plus the managed FACE/lifecycle API (`dispose`, `updateInput`,
`name`, `form`, `checkValidity`, ...). Shadowing them would silently break
teardown, form participation, or platform semantics.
