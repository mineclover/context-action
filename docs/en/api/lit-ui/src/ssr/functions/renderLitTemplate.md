[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/lit-ui/src/ssr](../README.md) / renderLitTemplate

# Function: renderLitTemplate()

> **renderLitTemplate**(`template`): `string`

Defined in: [packages/lit-ui/src/ssr.ts:103](https://github.com/mineclover/context-action/blob/main/packages/lit-ui/src/ssr.ts#L103)

Collects a Lit SSR render result synchronously.

## Parameters

### template

`TemplateResult`

## Returns

`string`

## Throws

When the template contains a value that resolves asynchronously
(for example an asynchronous element renderer). Use
[renderLitTemplateAsync](renderLitTemplateAsync.md) instead.
