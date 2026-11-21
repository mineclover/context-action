[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src/advanced](../README.md) / HookOptions

# Interface: HookOptions\<T\>

Defined in: [packages/react/src/stores/core/types.ts:287](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L287)

Enhanced hook options with error recovery and performance features

## Type Parameters

### Generic type T

Type parameter **T**

## Properties

### defaultValue?

> `optional` **defaultValue?**: `T`

Defined in: [packages/react/src/stores/core/types.ts:289](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L289)

기본값

***

### onError?

> `optional` **onError?**: (`error`, `retryCount?`) => `boolean` \| `undefined`

Defined in: [packages/react/src/stores/core/types.ts:291](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L291)

Enhanced error handler with retry capability

#### Parameters

##### error

`Error`

##### retryCount?

`number`

#### Returns

`boolean` \| `undefined`

***

### dependencies?

> `optional` **dependencies?**: `DependencyList`

Defined in: [packages/react/src/stores/core/types.ts:293](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L293)

React useEffect 의존성

***

### enableRetry?

> `optional` **enableRetry?**: `boolean`

Defined in: [packages/react/src/stores/core/types.ts:295](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L295)

Enable automatic error recovery

***

### maxRetries?

> `optional` **maxRetries?**: `number`

Defined in: [packages/react/src/stores/core/types.ts:297](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L297)

Maximum retry attempts

***

### retryDelay?

> `optional` **retryDelay?**: `number`

Defined in: [packages/react/src/stores/core/types.ts:299](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L299)

Retry delay in milliseconds

***

### enableMetrics?

> `optional` **enableMetrics?**: `boolean`

Defined in: [packages/react/src/stores/core/types.ts:301](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L301)

Enable performance monitoring

***

### throttle?

> `optional` **throttle?**: `number`

Defined in: [packages/react/src/stores/core/types.ts:303](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L303)

Throttle updates (milliseconds)

***

### debounce?

> `optional` **debounce?**: `number`

Defined in: [packages/react/src/stores/core/types.ts:305](https://github.com/mineclover/context-action/blob/main/packages/react/src/stores/core/types.ts#L305)

Debounce updates (milliseconds)
