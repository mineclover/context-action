[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/react/src](../README.md) / ActionRefDefinitions

# Interface: ActionRefDefinitions\<A, R\>

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:142](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L142)

Unified definitions combining actions and refs for integrated patterns

Interface for defining both actions and refs together for future integration
with ref management systems. Currently focuses on actions with placeholder
support for refs.

## Example

```typescript
const definitions: ActionRefDefinitions<UserActions, UserRefs> = {
  contextName: 'UserManagement',
  actions: {
    updateProfile: { name: string; email: string },
    deleteAccount: void
  },
  refs: {
    profileForm: HTMLFormElement,
    avatarInput: HTMLInputElement
  }
}
```

## Type Parameters

### Generic type A

`A` *extends* [`ActionDefinitions`](../type-aliases/ActionDefinitions.md) = [`ActionDefinitions`](../type-aliases/ActionDefinitions.md)

Action definitions type

### Generic type R

`R` *extends* `Record`\<`string`, `any`\> = `Record`\<`string`, `any`\>

Refs definitions type

## Properties

### actions

> **actions**: `A`

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:146](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L146)

***

### refs?

> `optional` **refs**: `R`

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:147](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L147)

***

### contextName?

> `optional` **contextName**: `string`

Defined in: [packages/react/src/actions/declarative-action-pattern.ts:148](https://github.com/mineclover/context-action/blob/cd08d4e3b87a65a1296f2b120f18fcabd78f2914/packages/react/src/actions/declarative-action-pattern.ts#L148)
