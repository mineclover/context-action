# TypeScript 타입 추론 가이드

Context-Action은 별도의 장황한 보일러플레이트 없이도 컴파일 타임 타입 안전성과 IDE 자동 완성을 제공하도록 설계되어 있습니다.

## 🎯 빠른 설정

### Strict TypeScript 설정 권장

프로젝트의 `tsconfig.json`에서 strict 모드를 활성화하는 것을 권장합니다:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 초기값 기반 자동 타입 추론

`createStoreContext`는 초기값이나 `StoreConfig` 객체로부터 각 스토어의 정확한 타입을 자동으로 추론합니다:

```tsx
import { createStoreContext } from '@context-action/react';

// ✅ 초기값으로부터 스토어 타입이 자동 추론됩니다
const { Provider, useStore, useStoreManager } = createStoreContext('MyApp', {
  user: { name: 'Kim', age: 30 },            // 타입: { name: string; age: number }
  count: 0,                                  // 타입: number
  isLoading: false,                          // 타입: boolean
  items: ['apple', 'banana'],                // 타입: string[]
  settings: { theme: 'dark' as const }       // 타입: { theme: 'dark' }
});
```

## 📋 목차

- [Store 타입 추론](./patterns/store/basic-usage.md)
- [Action 타입 시스템](./patterns/action/type-system.md)
- [타입 안전성 모범 사례](./best-practices.md)
- [실전 예제](../examples/basic-setup.md)

## 🔑 핵심 특징

### 🎯 **자동 타입 추론**
- 단순한 스토어는 수동 제네릭 선언 없이 추론 가능
- 중첩 객체, 배열, 리터럴(`as const`)까지 정확한 추론 유지
- `initialValue` 키를 데이터 필드로 쓰는 경우 `asStoreValue(...)`로 의도 구분 가능

### 🛡️ **컴파일 타임 안전성**
- 액션 이름 및 페이로드 불일치를 빌드/에디터 단계에서 즉시 차단
- `ActionResultMap`을 통한 `dispatchWithResult` / `useActionResultHandler` 반환 타입 전파
- Guard / Command / Result / Observer 역할별 핸들러 시그니처 검증

### ⚡ **개발자 경험(DX)**
- IntelliSense 자동 완성 및 안전한 심볼 리팩터링
- 잘못된 스토어 키나 잘못된 액션 페이로드 전달 시 즉각적인 컴파일 오류 안내

## 💡 전체 동작 예제

```tsx
import { createActionContext, createStoreContext, useStoreValue } from '@context-action/react';
import type { ActionPayloadMap } from '@context-action/core';

// 1. 액션 페이로드 타입 정의
interface UserActions extends ActionPayloadMap {
  updateProfile: { name: string; email: string };
  deleteUser: { userId: string };
  resetState: void;
}

// 2. 타입 안전한 Action / Store 컨텍스트 생성
const { Provider: UserActionProvider, useActionDispatch } =
  createActionContext<UserActions>('UserActions');

const { Provider: DataProvider, useStore } =
  createStoreContext('UserData', {
    user: { id: '', name: '', email: '' },
    isLoading: false
  });

// 3. UI에서 타입 추론과 함께 사용
function UserComponent() {
  const dispatch = useActionDispatch();
  const userStore = useStore('user');
  const user = useStoreValue(userStore); // 타입: { id: string; name: string; email: string }

  const handleUpdate = () => {
    // ✅ 페이로드 타입이 정확히 검증됨
    void dispatch('updateProfile', {
      name: user.name,
      email: user.email
    });
  };

  return (
    <div>
      <h1>{user.name}</h1>
      <button type="button" onClick={handleUpdate}>프로필 업데이트</button>
    </div>
  );
}
```

## 🔗 관련 문서

- [시작하기 가이드](./getting-started.md)
- [모범 사례](./best-practices.md)
- [API 레퍼런스](/ko/context-layered/repository-surface-catalog)
- [아키텍처 개요](../concept/architecture-guide.md)

---

**다음 단계**: [Store 기본 사용법](./patterns/store/basic-usage.md)과 [Action 타입 시스템](./patterns/action/type-system.md)에서 세부 패턴을 확인하세요.
