# Jotai 아톰들

Context Action에서 제공하는 다양한 Jotai 아톰들입니다.

## statusAtom

액션의 실행 상태를 관리하는 아톰입니다.

```typescript
import { statusAtom } from '@context-action/jotai'

const status = statusAtom('user/login')
```

## resultAtom

액션의 실행 결과를 저장하는 아톰입니다.

## errorAtom

액션 실행 중 발생한 에러를 관리하는 아톰입니다.