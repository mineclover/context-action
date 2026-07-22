[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ReactDevUtils

# Variable: ReactDevUtils

> `const` **ReactDevUtils**: `object`

Defined in: [packages/core/src/react-helpers.ts:169](https://github.com/mineclover/context-action/blob/dea90ac327b79839bf3b863ae1a23733da7e4ee3/packages/core/src/react-helpers.ts#L169)

🆕 React development utilities

Provides debugging and development helpers specifically for React environments.

## Type Declaration

### enableDebugMode()

> **enableDebugMode**(): `void`

Enable detailed React integration debugging

#### Returns

`void`

### disableDebugMode()

> **disableDebugMode**(): `void`

Disable React integration debugging

#### Returns

`void`

### isDebugMode()

> **isDebugMode**(): `boolean`

Check if React debug mode is enabled

#### Returns

`boolean`

### log()

> **log**(`component`, `action`, `message`, `data?`): `void`

Log React-specific debugging information

#### Parameters

##### component

`string`

##### action

`string`

##### message

`string`

##### data?

`unknown`

#### Returns

`void`

### getStats()

> **getStats**(`registry`): `object`

Get React integration statistics

#### Parameters

##### registry

[`ActionRegister`](../classes/ActionRegister.md)&lt;`any`&gt;

#### Returns

`object`

##### totalHandlers

> **totalHandlers**: `number`

##### reactHandlers

> **reactHandlers**: `number`

##### registryInfo

> **registryInfo**: `ActionRegistryInfo`&lt;`any`&gt;
