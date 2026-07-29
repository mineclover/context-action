[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / ReactDevUtils

# Variable: ReactDevUtils

> `const` **ReactDevUtils**: `object`

Defined in: [packages/react/src/actions/react-helpers.ts:58](https://github.com/mineclover/context-action/blob/main/packages/react/src/actions/react-helpers.ts#L58)

## Type Declaration

### enableDebugMode()

> **enableDebugMode**(): `void`

#### Returns

`void`

### disableDebugMode()

> **disableDebugMode**(): `void`

#### Returns

`void`

### isDebugMode()

> **isDebugMode**(): `boolean`

#### Returns

`boolean`

### log()

> **log**(`component`, `action`, `message`, `data?`): `void`

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

> **getStats**&lt;`T`&gt;(`registry`): `object`

#### Type Parameters

##### T

`T` *extends* `object`

#### Parameters

##### registry

`ActionRegister`&lt;`T`&gt;

#### Returns

`object`

##### totalHandlers

> **totalHandlers**: `number`

##### reactHandlers

> **reactHandlers**: `number`

##### registryInfo

> **registryInfo**: `ActionRegistryInfo`&lt;`T`&gt;
