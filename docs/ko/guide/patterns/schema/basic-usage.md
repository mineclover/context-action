# 기본 사용법

Zod 스키마로 타입 안전하고 검증된 페이로드를 가진 액션을 정의하는 방법을 알아봅니다.

## 설치

Zod는 선택적 peer dependency입니다. 스키마 검증을 사용하려면 설치하세요:

```bash
npm install zod@^4
# 또는
pnpm add zod@^4
```

## 액션 정의하기

### 단순 액션

```typescript
import { z } from 'zod';
import { defineAction } from '@context-action/core';

const createUserAction = defineAction({
  name: 'createUser',
  description: '새 사용자 계정 생성',
  parameters: z.object({
    username: z.string().min(3).max(20),
    email: z.string().email(),
    age: z.number().int().positive().optional(),
  }),
}, z);
```

### 팩토리 패턴 사용

더 깔끔한 코드를 위해 `createActionFactory`를 사용하여 매번 `z`를 전달하지 않아도 됩니다:

```typescript
import { z } from 'zod';
import { createActionFactory } from '@context-action/core';

const defineAction = createActionFactory(z);

const updateProfile = defineAction({
  name: 'updateProfile',
  parameters: z.object({
    name: z.string(),
    bio: z.string().max(500).optional(),
  }),
});

const deleteAccount = defineAction({
  name: 'deleteAccount',
  parameters: z.object({
    confirmPhrase: z.literal('DELETE'),
  }),
});
```

## 스키마 맵 생성

관련 액션들을 스키마 맵으로 그룹화합니다:

```typescript
import { createActionSchema } from '@context-action/core';

const userActionSchema = createActionSchema({
  createUser: defineAction({
    name: 'createUser',
    parameters: z.object({ username: z.string(), email: z.string().email() }),
  }, z),

  updateUser: defineAction({
    name: 'updateUser',
    parameters: z.object({ id: z.string(), name: z.string() }),
  }, z),

  deleteUser: defineAction({
    name: 'deleteUser',
    parameters: z.object({ id: z.string(), confirm: z.literal(true) }),
  }, z),
});
```

## 타입 추론

`InferActionPayloadMap`을 사용하여 스키마에서 TypeScript 타입을 추출합니다:

```typescript
import type { InferActionPayloadMap } from '@context-action/core';

type UserActions = InferActionPayloadMap<typeof userActionSchema>;
// 결과:
// {
//   createUser: { username: string; email: string };
//   updateUser: { id: string; name: string };
//   deleteUser: { id: string; confirm: true };
// }
```

## React에서 사용하기

### ActionContext와 함께

```typescript
import { createActionContext } from '@context-action/react';

const {
  Provider: UserActionProvider,
  useActionDispatch: useUserDispatch,
  useActionHandler: useUserHandler,
} = createActionContext<InferActionPayloadMap<typeof userActionSchema>>('User', {
  schema: userActionSchema,
});

function UserComponent() {
  const dispatch = useUserDispatch();

  const handleCreate = () => {
    // 타입 안전: TypeScript가 페이로드 형태를 인식
    dispatch('createUser', {
      username: 'john',
      email: 'john@example.com',
    });
  };

  return <button onClick={handleCreate}>사용자 생성</button>;
}
```

### 핸들러 등록

```typescript
function UserLogic({ children }) {
  useUserHandler('createUser', useCallback(async (payload) => {
    // payload는 { username: string; email: string } 타입
    await api.createUser(payload);
  }, []));

  return children;
}
```

## 수동 검증

페이로드를 수동으로 검증할 수도 있습니다:

```typescript
// 유효하지 않은 페이로드에서 예외 발생
const validated = userActionSchema.createUser.validate({
  username: 'john',
  email: 'john@example.com',
});

// { success, data, error } 반환
const result = userActionSchema.createUser.safeParse({
  username: 'jo', // 너무 짧음
  email: 'invalid',
});

if (!result.success) {
  console.log(result.error.issues);
}
```

## 다음 단계

- [검증 모드](./validation-modes.md) - 검증 동작 설정
- [에러 처리](./error-handling.md) - 검증 에러를 우아하게 처리
- [Tool Chain 내보내기](./tool-chain.md) - LLM API와 스키마 사용
