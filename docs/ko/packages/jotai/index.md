# @context-action/jotai

Jotai 상태 관리와 Context Action을 통합하는 패키지입니다.

## 개요

Jotai의 아톰 기반 상태 관리와 Context Action을 결합하여 반응형 액션 시스템을 구축할 수 있습니다.

## 주요 기능

- actionAtom
- 상태 관리 아톰들
- Jotai 통합 유틸리티

## 설치

```bash
npm install @context-action/jotai jotai
```

## 기본 사용법

```typescript
import { actionAtom } from '@context-action/jotai'
import { useAtom } from 'jotai'

const loginAtom = actionAtom({
  type: 'user/login',
  handler: async (credentials) => {
    // 로그인 로직
  }
})

function LoginComponent() {
  const [, login] = useAtom(loginAtom)
  
  return <button onClick={() => login(credentials)}>로그인</button>
}
```

## API 참조

- [actionAtom](../../api/jotai/action-atom.md)
- [아톰들](../../api/jotai/atoms.md)
- [유틸리티](../../api/jotai/utilities.md)