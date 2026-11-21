[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / [packages/mutative/src](../README.md) / MutativeTimelineBackendOptions

# Interface: MutativeTimelineBackendOptions

Defined in: [packages/mutative/src/backend.ts:37](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L37)

## Extends

- `Omit`\<[`TimeTravelOptions`](../type-aliases/TimeTravelOptions.md)\<`false`, `true`\>, `"autoArchive"`\>

## Properties

### readMode?

> `readonly` `optional` **readMode?**: [`MutativeReadMode`](../type-aliases/MutativeReadMode.md)

Defined in: [packages/mutative/src/backend.ts:40](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L40)

Clone values exposed through snapshots. Defaults to reference reads.

***

### cloneOnSet?

> `readonly` `optional` **cloneOnSet?**: `boolean`

Defined in: [packages/mutative/src/backend.ts:42](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L42)

Clone values passed to setValue before archiving them.

***

### notificationMode?

> `readonly` `optional` **notificationMode?**: [`MutativeNotificationMode`](../type-aliases/MutativeNotificationMode.md)

Defined in: [packages/mutative/src/backend.ts:44](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L44)

Immediate notifications or microtask-coalesced notifications.

***

### onListenerError?

> `readonly` `optional` **onListenerError?**: (`error`) => `void`

Defined in: [packages/mutative/src/backend.ts:46](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/backend.ts#L46)

Observe listener failures without changing the mutation result.

#### Parameters

##### error

`unknown`

#### Returns

`void`

#### Overrides

`Omit.onListenerError`

***

### maxHistory?

> `optional` **maxHistory?**: `number`

Defined in: [packages/mutative/src/types.ts:33](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L33)

Maximum number of history entries to keep

#### Default

```ts
10
```

#### Inherited from

`Omit.maxHistory`

***

### initialPosition?

> `optional` **initialPosition?**: `number`

Defined in: [packages/mutative/src/types.ts:39](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L39)

Initial position in history

#### Default

```ts
0
```

#### Inherited from

`Omit.initialPosition`

***

### initialPatches?

> `optional` **initialPatches?**: [`TravelPatches`](../type-aliases/TravelPatches.md)&lt;`object`&gt;

Defined in: [packages/mutative/src/types.ts:44](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L44)

Initial patches for restoring history

#### Inherited from

`Omit.initialPatches`

***

### mutable?

> `optional` **mutable?**: `boolean`

Defined in: [packages/mutative/src/types.ts:56](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L56)

Mutable mode - apply patches in place (for observable state)

#### Default

```ts
false
```

#### Inherited from

`Omit.mutable`

***

### patchesOptions?

> `optional` **patchesOptions?**: `object`

Defined in: [packages/mutative/src/types.ts:61](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L61)

Patches options for mutative

#### Inherited from

`Omit.patchesOptions`

***

### enableAutoFreeze?

> `optional` **enableAutoFreeze?**: `false`

Defined in: [packages/mutative/src/types.ts:64](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L64)

Forwarded to @context-action/mutative-core.

#### Inherited from

`Omit.enableAutoFreeze`

***

### strict?

> `optional` **strict?**: `boolean`

Defined in: [packages/mutative/src/types.ts:67](https://github.com/mineclover/context-action/blob/main/packages/mutative/src/types.ts#L67)

Reject non-draft replacement values in strict mode.

#### Inherited from

`Omit.strict`

***

### mark?

> `optional` **mark?**: `Mark`\<`true`, `false`\> \| `Mark`\<`true`, `false`\>[]

Defined in: [packages/mutative-core/dist/index.d.ts:122](https://github.com/mineclover/context-action/blob/main/packages/mutative-core/dist/index.d.ts#L122)

Decide how values are drafted: a mark returns `immutable` to make a value
draftable, such as a class instance, `mutable` to keep it out of drafts so
that the recipe changes it in place, or a function that returns a shallow
copy of the value, which needs patches and auto-freeze off. With several
marks, the first one that returns a value decides.

#### Inherited from

`Omit.mark`
