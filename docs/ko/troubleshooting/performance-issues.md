# 성능 및 무한 루프 문제

## 개요

Context-Action 프레임워크에서 발생할 수 있는 성능 문제와 무한 루프 해결 방법을 설명합니다.

## 일반적인 성능 문제

### 1. 과도한 리렌더링

**문제**: 스토어 업데이트로 인한 불필요한 컴포넌트 리렌더링

**해결책**:
```tsx
// 잘못된 방법 - 전체 객체 구독
const user = useStoreValue(userStore);

// 올바른 방법 - 필요한 필드만 선택
const userName = useStoreSelector(userStore, user => user.name);
```

### 2. 핸들러 재등록

**문제**: useCallback 누락으로 인한 핸들러 재등록

**해결책**:
```tsx
// 올바른 방법
const handleUserUpdate = useCallback(async (payload) => {
  // 핸들러 로직
}, []);

useActionHandler('updateUser', handleUserUpdate);
```

## 무한 루프 방지

### 1. 의존성 배열 관리

**문제**: 잘못된 의존성으로 인한 무한 루프

**해결책**:
```tsx
// 의존성 배열에 스토어 참조만 포함
useActionHandler('action', useCallback(async () => {
  const currentValue = store.getValue(); // 핸들러 내부에서 호출
  // 로직 수행
}, [store])); // store 참조만 의존성에 포함
```

### 2. 상태 업데이트 체인

**문제**: 핸들러가 다른 핸들러를 트리거하는 순환 참조

**해결책**: 상태 플래그나 조건부 업데이트 사용

## 성능 모니터링

성능 문제 디버깅을 위해 React DevTools와 Context-Action 디버그 유틸리티를 활용하세요.