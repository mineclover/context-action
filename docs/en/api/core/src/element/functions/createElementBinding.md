[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src/element](../README.md) / createElementBinding

# Function: createElementBinding()

> **createElementBinding**&lt;`Props`&gt;(`element`, `config`, `options?`): [`ElementBinding`](../interfaces/ElementBinding.md)&lt;`Props`&gt;

Defined in: [packages/core/src/element/create-element-binding.ts:8](https://github.com/mineclover/context-action/blob/main/packages/core/src/element/create-element-binding.ts#L8)

Framework-neutral DOM transport. Lifecycle adapters supply complete snapshots, not patches.

## Type Parameters

### Props

`Props` *extends* `object`

## Parameters

### element

`HTMLElement`

### config

[`ElementBindingConfig`](../interfaces/ElementBindingConfig.md)&lt;`Props`&gt;

### options?

[`ElementBindingOptions`](../interfaces/ElementBindingOptions.md) = `{}`

## Returns

[`ElementBinding`](../interfaces/ElementBinding.md)&lt;`Props`&gt;
