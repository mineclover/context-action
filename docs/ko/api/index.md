# API 레퍼런스

Context Action은 세 개의 주요 패키지로 구성되어 있습니다. 각 패키지는 특정 용도에 최적화되어 있으며, 필요에 따라 독립적으로 사용하거나 함께 조합할 수 있습니다.

## 패키지 개요

### [@context-action/core](/ko/api/core/)
핵심 액션 파이프라인 관리 시스템입니다. 프레임워크에 구애받지 않으며 다른 모든 패키지의 기반이 됩니다.

**주요 기능:**
- `ActionRegister` - 타입 안전한 액션 등록 및 디스패치
- 우선순위 기반 핸들러 시스템
- 비동기 액션 지원
- 내장 에러 처리

**주요 API:**
```typescript
import { ActionRegister } from '@context-action/core';

interface MyActions {
  increment: void;
  setCount: number;
}

const register = new ActionRegister<MyActions>();
register.addHandler('increment', () => console.log('증가'));
register.dispatch('increment');
```

### [@context-action/react](/ko/api/react/)
React 애플리케이션을 위한 통합 패키지입니다. Context API와 커스텀 훅을 제공하여 React 컴포넌트에서 쉽게 액션을 관리할 수 있습니다.

**주요 기능:**
- `createActionContext` - React Context 기반 액션 시스템
- `useAction` - 액션 디스패치 훅
- `useActionHandler` - 액션 핸들러 등록 훅
- React 생명주기와 완벽한 통합

**주요 API:**
```typescript
import { createActionContext } from '@context-action/react';

const { Provider, useAction, useActionHandler } = createActionContext<MyActions>();

function MyComponent() {
  const dispatch = useAction();
  useActionHandler('increment', () => setCount(prev => prev + 1));
  
  return <button onClick={() => dispatch('increment')}>클릭</button>;
}
```

### [@context-action/jotai](/ko/api/jotai/)
Jotai 상태 관리 라이브러리와의 통합을 제공합니다. Atomic 상태 관리 패턴과 Context Action의 액션 시스템을 결합합니다.

**주요 기능:**
- Jotai atoms와 액션 통합
- 원자적 상태 업데이트
- 세밀한 리렌더링 최적화
- 복잡한 상태 의존성 관리

**주요 API:**
```typescript
import { createActionAtom } from '@context-action/jotai';
import { atom } from 'jotai';

const countAtom = atom(0);
const actionAtom = createActionAtom<MyActions>();

// 컴포넌트에서 사용
const count = useAtomValue(countAtom);
const action = useAtomValue(actionAtom);
```

## 설치 가이드

각 패키지는 독립적으로 설치할 수 있습니다:

### Core 패키지만 사용
```bash
npm install @context-action/core
```

### React와 함께 사용
```bash
npm install @context-action/core @context-action/react
```

### Jotai와 함께 사용
```bash
npm install @context-action/core @context-action/jotai
```

### 모든 패키지 사용
```bash
npm install @context-action/core @context-action/react @context-action/jotai
```

## 타입 시스템

Context Action은 완전한 TypeScript 지원을 제공합니다. 모든 액션과 페이로드는 컴파일 타임에 타입 체크됩니다.

### 액션 인터페이스 정의

```typescript
interface AppActions {
  // 페이로드가 없는 액션
  reset: void;
  clear: void;
  
  // 단일 매개변수 액션
  setCount: number;
  setName: string;
  
  // 객체 매개변수 액션
  updateUser: {
    id: number;
    name: string;
    email: string;
  };
  
  // 선택적 매개변수 액션
  search: {
    query: string;
    filters?: string[];
  };
  
  // 유니온 타입 액션
  setTheme: 'light' | 'dark' | 'auto';
}
```

### 제네릭 활용

```typescript
// 재사용 가능한 액션 인터페이스
interface CrudActions<T> {
  create: { item: T };
  read: { id: string };
  update: { id: string; item: Partial<T> };
  delete: { id: string };
}

// 특정 엔티티에 적용
interface UserActions extends CrudActions<User> {
  login: { credentials: LoginCredentials };
  logout: void;
}
```

## 에러 처리

모든 패키지는 일관된 에러 처리 패턴을 제공합니다:

```typescript
try {
  await dispatch('asyncAction', payload);
} catch (error) {
  if (error instanceof ActionError) {
    console.error('액션 에러:', error.message);
    console.error('액션 타입:', error.actionType);
  }
}
```

## 성능 고려사항

- **Core 패키지**: 제로 디펜던시, 최소 번들 크기
- **React 패키지**: React 생명주기 최적화, 불필요한 리렌더링 방지
- **Jotai 패키지**: 원자적 업데이트로 세밀한 성능 제어

## 다음 단계

각 패키지의 자세한 API 문서를 참조하세요:

- [Core API 레퍼런스](/ko/api/core/) - ActionRegister와 핵심 타입들
- [React API 레퍼런스](/ko/api/react/) - React 통합 훅과 컨텍스트
- [Jotai API 레퍼런스](/ko/api/jotai/) - Jotai 통합과 atomic 패턴

또는 [고급 사용법 가이드](/ko/guide/advanced)에서 실제 사용 패턴을 살펴보세요.