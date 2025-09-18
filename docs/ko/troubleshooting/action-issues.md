# 액션 시스템 문제

## 개요

액션 디스패치, 핸들러 등록 및 액션 파이프라인 관련 문제 해결 방법을 설명합니다.

## 일반적인 액션 문제

### 1. 핸들러가 등록되지 않음

**문제**: 액션 디스패치 시 핸들러가 실행되지 않음

**해결책**:
```tsx
// 컴포넌트 마운트 전에 핸들러 등록
function ActionSetup({ children }) {
  useActionHandler('myAction', useCallback(async (payload) => {
    // 핸들러 로직
  }, []));

  return children;
}

// 사용
<ActionProvider>
  <ActionSetup>
    <MyComponent />
  </ActionSetup>
</ActionProvider>
```

### 2. 타입 안전성 오류

**문제**: 액션 페이로드 타입 불일치

**해결책**:
```tsx
// ActionPayloadMap 확장 필수
interface MyActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  deleteUser: { id: string };
  resetData: void; // 페이로드 없는 액션
}
```

### 3. 핸들러 우선순위 문제

**문제**: 핸들러 실행 순서가 예상과 다름

**해결책**: 우선순위 명시적 설정
```tsx
useActionHandler('myAction', handler, { priority: 100 });
```

## 디버깅 팁

1. **콘솔 로그 활용**: 핸들러 등록 및 실행 확인
2. **React DevTools**: 컨텍스트 상태 확인
3. **타입 체크**: TypeScript strict 모드 활성화

## 에러 처리

핸들러에서 에러 발생 시 적절한 에러 처리 구현:

```tsx
useActionHandler('riskyAction', useCallback(async (payload, controller) => {
  try {
    // 비즈니스 로직
  } catch (error) {
    controller.abort('작업 실패', error);
  }
}, []));
```