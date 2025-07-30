# Jotai 유틸리티

Jotai와 Context Action을 함께 사용할 때 도움이 되는 유틸리티들입니다.

## createActionFamily

액션 패밀리를 생성하는 헬퍼 함수입니다.

```typescript
import { createActionFamily } from '@context-action/jotai'

const userActionFamily = createActionFamily({
  login: loginHandler,
  logout: logoutHandler,
  profile: profileHandler
})
```

## 기타 유틸리티

다양한 편의 함수들을 제공합니다.