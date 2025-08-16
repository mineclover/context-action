# API 사용 가이드

## 개요
Context-Action 프레임워크의 API를 사용하는 방법을 설명합니다.

## 시작하기
1. 패키지 설치
2. 기본 설정
3. 첫 번째 액션 생성

## 기본 사용법
```typescript
import { createActionContext } from '@context-action/react';

const { Provider, useActionDispatch } = createActionContext();
```

## 고급 기능
- 액션 파이프라인
- 스토어 통합
- 타입 안전성
