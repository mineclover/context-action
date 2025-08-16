[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/core/src](../README.md) / ActionPayloadMap

# Interface: ActionPayloadMap

Defined in: [packages/core/src/types.ts:17](https://github.com/mineclover/context-action/blob/08bf17d6ec1c09cfe0ffb9710189395df90c9772/packages/core/src/types.ts#L17)

액션 이름과 해당 페이로드 타입 간의 매핑을 정의하는 TypeScript 인터페이스입니다.

## Implements

## Memberof

core-concepts

## Example

```typescript
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email: string };
  deleteUser: { id: string };
  resetUser: void; // No payload required
}
```

## Indexable

\[`actionName`: `string`\]: `unknown`
