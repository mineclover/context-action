# 기본 설정

Context Action의 기본 설정 방법을 안내합니다.

## 프로젝트 설정

### 1. 패키지 설치

```bash
npm install @context-action/core
```

### 2. ActionRegister 초기화

```typescript
import { ActionRegister } from '@context-action/core'

const register = new ActionRegister()
```

### 3. 액션 등록

```typescript
register.register({
  type: 'hello',
  handler: () => {
    console.log('Hello, World!')
  }
})
```

## 다음 단계

- [첫 번째 액션 만들기](./first-action.md)
- [React와 통합하기](./react/context-setup.md)