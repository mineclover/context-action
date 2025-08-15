[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / HandlerConfig

# Interface: HandlerConfig

Defined in: [packages/core/src/types.ts:117](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L117)

파이프라인 내에서 액션 핸들러의 동작을 제어하는 설정 옵션들입니다.

## Implements

## Memberof

core-concepts

## Example

```typescript
register('searchUser', searchHandler, {
  priority: 100,          // 높은 우선순위로 먼저 실행
  debounce: 300,          // 300ms 디바운싱
  blocking: true,         // 완료까지 대기
  validation: (payload) => payload.query.length > 2
});
```

## Properties

### priority?

> `optional` **priority**: `number`

Defined in: [packages/core/src/types.ts:119](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L119)

Priority level (higher numbers execute first). Default: 0

***

### id?

> `optional` **id**: `string`

Defined in: [packages/core/src/types.ts:122](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L122)

Unique identifier for the handler. Auto-generated if not provided

***

### blocking?

> `optional` **blocking**: `boolean`

Defined in: [packages/core/src/types.ts:125](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L125)

Whether to wait for async handlers to complete. Default: false

***

### once?

> `optional` **once**: `boolean`

Defined in: [packages/core/src/types.ts:128](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L128)

Whether this handler should run once and then be removed. Default: false

***

### condition()?

> `optional` **condition**: () => `boolean`

Defined in: [packages/core/src/types.ts:131](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L131)

Condition function to determine if handler should run

#### Returns

`boolean`

***

### debounce?

> `optional` **debounce**: `number`

Defined in: [packages/core/src/types.ts:134](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L134)

Debounce delay in milliseconds

***

### throttle?

> `optional` **throttle**: `number`

Defined in: [packages/core/src/types.ts:137](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L137)

Throttle delay in milliseconds

***

### validation()?

> `optional` **validation**: (`payload`) => `boolean`

Defined in: [packages/core/src/types.ts:140](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L140)

Validation function that must return true for handler to execute

#### Parameters

##### payload

`any`

#### Returns

`boolean`

***

### middleware?

> `optional` **middleware**: `boolean`

Defined in: [packages/core/src/types.ts:143](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L143)

Mark this handler as middleware

***

### tags?

> `optional` **tags**: `string`[]

Defined in: [packages/core/src/types.ts:147](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L147)

Tags for categorizing and filtering handlers

***

### category?

> `optional` **category**: `string`

Defined in: [packages/core/src/types.ts:150](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L150)

Category for grouping related handlers

***

### description?

> `optional` **description**: `string`

Defined in: [packages/core/src/types.ts:153](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L153)

Human-readable description of what this handler does

***

### version?

> `optional` **version**: `string`

Defined in: [packages/core/src/types.ts:156](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L156)

Version identifier for this handler

***

### returnType?

> `optional` **returnType**: `"merge"` \| `"value"` \| `"collect"`

Defined in: [packages/core/src/types.ts:159](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L159)

How to handle the result from this handler

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [packages/core/src/types.ts:162](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L162)

Timeout for this specific handler in milliseconds

***

### retries?

> `optional` **retries**: `number`

Defined in: [packages/core/src/types.ts:165](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L165)

Number of retries if handler fails

***

### dependencies?

> `optional` **dependencies**: `string`[]

Defined in: [packages/core/src/types.ts:168](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L168)

Other handler IDs that this handler depends on

***

### conflicts?

> `optional` **conflicts**: `string`[]

Defined in: [packages/core/src/types.ts:171](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L171)

Handler IDs that conflict with this handler

***

### environment?

> `optional` **environment**: `"development"` \| `"production"` \| `"test"`

Defined in: [packages/core/src/types.ts:174](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L174)

Environment where this handler should run

***

### feature?

> `optional` **feature**: `string`

Defined in: [packages/core/src/types.ts:177](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L177)

Feature flag to control handler availability

***

### metrics?

> `optional` **metrics**: `object`

Defined in: [packages/core/src/types.ts:180](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L180)

Metrics collection configuration

#### collectTiming?

> `optional` **collectTiming**: `boolean`

Whether to collect timing information

#### collectErrors?

> `optional` **collectErrors**: `boolean`

Whether to collect error information

#### customMetrics?

> `optional` **customMetrics**: `Record`\<`string`, `any`\>

Custom metrics to collect

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `any`\>

Defined in: [packages/core/src/types.ts:192](https://github.com/mineclover/context-action/blob/2861d61b4b5d930e9e7f5277983455dc296dc859/packages/core/src/types.ts#L192)

Custom metadata for this handler
