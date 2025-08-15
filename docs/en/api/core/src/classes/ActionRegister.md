[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionRegister

# Class: ActionRegister\<T\>

Defined in: [packages/core/src/ActionRegister.ts:49](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L49)

중앙화된 액션 등록 및 디스패치 시스템으로, 타입 안전한 액션 파이프라인 관리를 제공하는 핵심 클래스입니다.

## Implements

## Implements

## Memberof

core-concepts

## Example

```typescript
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  calculateTotal: void;
}

const register = new ActionRegister<AppActions>({
  name: 'AppRegister',
  logLevel: LogLevel.DEBUG
});

// 핸들러 등록
register.register('updateUser', ({ id, name }, controller) => {
  userStore.setValue({ id, name });
  // 핸들러가 자동으로 다음 핸들러로 진행
}, { priority: 10 });

// 액션 디스패치
await register.dispatch('updateUser', { id: '1', name: 'John' });
```

## Type Parameters

### Generic type T

`T` *extends* [`ActionPayloadMap`](../interfaces/ActionPayloadMap.md) = [`ActionPayloadMap`](../interfaces/ActionPayloadMap.md)

## Constructors

### Constructor

> **new ActionRegister**&lt;`T`&gt;(`config`): `ActionRegister`&lt;`T`&gt;

Defined in: [packages/core/src/ActionRegister.ts:68](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L68)

#### Parameters

##### config

[`ActionRegisterConfig`](../interfaces/ActionRegisterConfig.md) = `{}`

#### Returns

`ActionRegister`&lt;`T`&gt;

## Methods

### register()

> **register**\<`K`, `R`\>(`action`, `handler`, `config`): [`UnregisterFunction`](../type-aliases/UnregisterFunction.md)

Defined in: [packages/core/src/ActionRegister.ts:91](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L91)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

##### R

`R` = `void`

#### Parameters

##### action

Type parameter **K**

##### handler

[`ActionHandler`](../type-aliases/ActionHandler.md)\<`T`\[`K`\], `R`\>

##### config

[`HandlerConfig`](../interfaces/HandlerConfig.md) = `{}`

#### Returns

[`UnregisterFunction`](../type-aliases/UnregisterFunction.md)

***

### dispatch()

> **dispatch**&lt;`K`&gt;(`action`, `payload?`, `options?`): `Promise`&lt;`void`&gt;

Defined in: [packages/core/src/ActionRegister.ts:311](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L311)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

##### payload?

`T`\[`K`\]

##### options?

[`DispatchOptions`](../interfaces/DispatchOptions.md)

#### Returns

`Promise`&lt;`void`&gt;

***

### dispatchWithResult()

> **dispatchWithResult**\<`K`, `R`\>(`action`, `payload?`, `options?`): `Promise`\<[`ExecutionResult`](../interfaces/ExecutionResult.md)&lt;`R`&gt;\>

Defined in: [packages/core/src/ActionRegister.ts:468](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L468)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

##### R

`R` = `void`

#### Parameters

##### action

Type parameter **K**

##### payload?

`T`\[`K`\]

##### options?

[`DispatchOptions`](../interfaces/DispatchOptions.md)

#### Returns

`Promise`\<[`ExecutionResult`](../interfaces/ExecutionResult.md)&lt;`R`&gt;\>

***

### getHandlerCount()

> **getHandlerCount**&lt;`K`&gt;(`action`): `number`

Defined in: [packages/core/src/ActionRegister.ts:947](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L947)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

#### Returns

`number`

***

### hasHandlers()

> **hasHandlers**&lt;`K`&gt;(`action`): `boolean`

Defined in: [packages/core/src/ActionRegister.ts:952](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L952)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

#### Returns

`boolean`

***

### getRegisteredActions()

> **getRegisteredActions**(): keyof `T`[]

Defined in: [packages/core/src/ActionRegister.ts:956](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L956)

#### Returns

keyof `T`[]

***

### clearAction()

> **clearAction**&lt;`K`&gt;(`action`): `void`

Defined in: [packages/core/src/ActionRegister.ts:960](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L960)

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

#### Returns

`void`

***

### clearAll()

> **clearAll**(): `void`

Defined in: [packages/core/src/ActionRegister.ts:964](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L964)

#### Returns

`void`

***

### getName()

> **getName**(): `string`

Defined in: [packages/core/src/ActionRegister.ts:968](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L968)

#### Returns

`string`

***

### getRegistryInfo()

> **getRegistryInfo**(): `ActionRegistryInfo`&lt;`T`&gt;

Defined in: [packages/core/src/ActionRegister.ts:977](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L977)

Get comprehensive registry information (similar to DeclarativeStoreRegistry pattern)

#### Returns

`ActionRegistryInfo`&lt;`T`&gt;

Registry information including actions, handlers, and execution modes

***

### getActionStats()

> **getActionStats**&lt;`K`&gt;(`action`): `null` \| `ActionHandlerStats`&lt;`T`&gt;

Defined in: [packages/core/src/ActionRegister.ts:999](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L999)

Get detailed statistics for a specific action

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

Action name to get statistics for

#### Returns

`null` \| `ActionHandlerStats`&lt;`T`&gt;

Detailed handler statistics

***

### getAllActionStats()

> **getAllActionStats**(): `ActionHandlerStats`&lt;`T`&gt;[]

Defined in: [packages/core/src/ActionRegister.ts:1049](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L1049)

Get statistics for all registered actions

#### Returns

`ActionHandlerStats`&lt;`T`&gt;[]

Array of statistics for all actions

***

### getHandlersByTag()

> **getHandlersByTag**(`tag`): `Map`\<keyof `T`, [`HandlerRegistration`](../interfaces/HandlerRegistration.md)\<`any`, `any`\>[]\>

Defined in: [packages/core/src/ActionRegister.ts:1061](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L1061)

Get handlers by tag across all actions

#### Parameters

##### tag

`string`

Tag to filter handlers by

#### Returns

`Map`\<keyof `T`, [`HandlerRegistration`](../interfaces/HandlerRegistration.md)\<`any`, `any`\>[]\>

Map of actions to handlers with the specified tag

***

### getHandlersByCategory()

> **getHandlersByCategory**(`category`): `Map`\<keyof `T`, [`HandlerRegistration`](../interfaces/HandlerRegistration.md)\<`any`, `any`\>[]\>

Defined in: [packages/core/src/ActionRegister.ts:1083](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L1083)

Get handlers by category across all actions

#### Parameters

##### category

`string`

Category to filter handlers by

#### Returns

`Map`\<keyof `T`, [`HandlerRegistration`](../interfaces/HandlerRegistration.md)\<`any`, `any`\>[]\>

Map of actions to handlers with the specified category

***

### setActionExecutionMode()

> **setActionExecutionMode**&lt;`K`&gt;(`action`, `mode`): `void`

Defined in: [packages/core/src/ActionRegister.ts:1105](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L1105)

Set execution mode for a specific action

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

Action name

##### mode

[`ExecutionMode`](../type-aliases/ExecutionMode.md)

Execution mode to set

#### Returns

`void`

***

### getActionExecutionMode()

> **getActionExecutionMode**&lt;`K`&gt;(`action`): [`ExecutionMode`](../type-aliases/ExecutionMode.md)

Defined in: [packages/core/src/ActionRegister.ts:1119](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L1119)

Get execution mode for a specific action

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

Action name

#### Returns

[`ExecutionMode`](../type-aliases/ExecutionMode.md)

Execution mode for the action, or default if not set

***

### removeActionExecutionMode()

> **removeActionExecutionMode**&lt;`K`&gt;(`action`): `void`

Defined in: [packages/core/src/ActionRegister.ts:1128](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L1128)

Remove execution mode override for a specific action

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

Action name

#### Returns

`void`

***

### clearExecutionStats()

> **clearExecutionStats**(): `void`

Defined in: [packages/core/src/ActionRegister.ts:1139](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L1139)

Clear execution statistics for all actions

#### Returns

`void`

***

### clearActionExecutionStats()

> **clearActionExecutionStats**&lt;`K`&gt;(`action`): `void`

Defined in: [packages/core/src/ActionRegister.ts:1152](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L1152)

Clear execution statistics for a specific action

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### action

Type parameter **K**

Action name

#### Returns

`void`

***

### getRegistryConfig()

> **getRegistryConfig**(): `undefined` \| \{ `debug?`: `boolean`; `autoCleanup?`: `boolean`; `maxHandlers?`: `number`; `defaultExecutionMode?`: [`ExecutionMode`](../type-aliases/ExecutionMode.md); \}

Defined in: [packages/core/src/ActionRegister.ts:1165](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L1165)

Get registry configuration (for debugging and inspection)

#### Returns

`undefined`

\{ `debug?`: `boolean`; `autoCleanup?`: `boolean`; `maxHandlers?`: `number`; `defaultExecutionMode?`: [`ExecutionMode`](../type-aliases/ExecutionMode.md); \}

##### debug?

> `optional` **debug**: `boolean`

Debug mode for registry operations

##### autoCleanup?

> `optional` **autoCleanup**: `boolean`

Auto-cleanup configuration for one-time handlers

##### maxHandlers?

> `optional` **maxHandlers**: `number`

Maximum number of handlers per action

##### defaultExecutionMode?

> `optional` **defaultExecutionMode**: [`ExecutionMode`](../type-aliases/ExecutionMode.md)

Default execution mode for actions

Current registry configuration

***

### isDebugEnabled()

> **isDebugEnabled**(): `boolean`

Defined in: [packages/core/src/ActionRegister.ts:1174](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L1174)

Check if registry has debug mode enabled

#### Returns

`boolean`

Whether debug mode is enabled

## Properties

### name

> `readonly` **name**: `string`

Defined in: [packages/core/src/ActionRegister.ts:55](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/ActionRegister.ts#L55)
