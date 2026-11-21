[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/preact-ui/src](../README.md) / PreactElementLifecycle

# Interface: PreactElementLifecycle\<Input, Expose\>

Defined in: [packages/preact-ui/src/custom-element.ts:56](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L56)

## Type Parameters

### Input

`Input`

### Expose

`Expose` *extends* `object` = `Record`\<`never`, `never`\>

## Methods

### getInput()

> **getInput**(): `Input`

Defined in: [packages/preact-ui/src/custom-element.ts:63](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L63)

Returns the current input snapshot for mount and update

#### Returns

`Input`

***

### onConnect()?

> `optional` **onConnect**(): `void`

Defined in: [packages/preact-ui/src/custom-element.ts:67](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L67)

Starts connection-session resources immediately before the renderer mounts.

#### Returns

`void`

***

### onDisconnect()?

> `optional` **onDisconnect**(): `void`

Defined in: [packages/preact-ui/src/custom-element.ts:69](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L69)

Releases connection-session resources immediately after the renderer unmounts.

#### Returns

`void`

***

### onAttributeChange()?

> `optional` **onAttributeChange**(`name`, `oldValue`, `newValue`): `void`

Defined in: [packages/preact-ui/src/custom-element.ts:71](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L71)

Optional handler for observed attribute changes

#### Parameters

##### name

`string`

##### oldValue

`string` \| `null`

##### newValue

`string` \| `null`

#### Returns

`void`

***

### onDestroy()?

> `optional` **onDestroy**(): `void`

Defined in: [packages/preact-ui/src/custom-element.ts:73](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L73)

Optional cleanup callback for permanent teardown

#### Returns

`void`

***

### onFormReset()?

> `optional` **onFormReset**(): `void`

Defined in: [packages/preact-ui/src/custom-element.ts:75](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L75)

Form lifecycle: called when the associated form is reset

#### Returns

`void`

***

### onFormDisabled()?

> `optional` **onFormDisabled**(`disabled`): `void`

Defined in: [packages/preact-ui/src/custom-element.ts:77](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L77)

Form lifecycle: called when the element or its parent fieldset is enabled/disabled

#### Parameters

##### disabled

`boolean`

#### Returns

`void`

***

### onFormStateRestore()?

> `optional` **onFormStateRestore**(`state`, `mode`): `void`

Defined in: [packages/preact-ui/src/custom-element.ts:79](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L79)

Form lifecycle: called when the browser restores form state

#### Parameters

##### state

`unknown`

##### mode

`"restore"` \| `"autocomplete"`

#### Returns

`void`

## Properties

### view

> **view**: `ComponentType`\<\{ `input`: `Input`; \}\>

Defined in: [packages/preact-ui/src/custom-element.ts:61](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L61)

The Preact view component to mount inside Shadow DOM

***

### expose?

> `optional` **expose?**: `Expose` & `ThisType`\<`HTMLElement` & `Expose`\>

Defined in: [packages/preact-ui/src/custom-element.ts:65](https://github.com/mineclover/context-action/blob/main/packages/preact-ui/src/custom-element.ts#L65)

Optional public properties and methods installed onto the custom element instance
