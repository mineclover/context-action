# 타입 정의

Context Action 라이브러리의 핵심 타입들을 설명합니다.

## Action

액션의 기본 인터페이스입니다.

```typescript
interface Action<T = any> {
  type: string
  payload?: T
}
```

## Handler

액션 핸들러 함수의 타입입니다.