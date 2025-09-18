# 컨벤션

## LLM 통합을 위한 코딩 컨벤션

이 문서는 LLM과 Context-Action 프레임워크를 사용할 때의 코딩 컨벤션과 모범 사례를 설명합니다.

### 액션 명명 규칙

- 설명적인 액션 이름 사용: `update` 대신 `updateUserProfile`
- 액션 이름에 camelCase 컨벤션 따르기
- 명확성을 위해 동사-명사 패턴 사용

### 타입 안전성

```typescript
// 항상 ActionPayloadMap 확장
interface UserActions extends ActionPayloadMap {
  updateProfile: { id: string; data: UserData };
  deleteUser: { id: string };
  refreshData: void;
}
```

### 핸들러 구현

```typescript
// 적절한 에러 처리 사용
useActionHandler('updateProfile', useCallback(async (payload, controller) => {
  try {
    // 비즈니스 로직
    const result = await userService.update(payload.id, payload.data);
    userStore.setValue(result);
  } catch (error) {
    controller.abort('업데이트 실패', error);
  }
}, [userStore]));
```

### 스토어 패턴

- 타입 안전성을 위해 선언적 스토어 패턴 사용
- 특정 필드 접근 시 `useStoreSelector` 선호
- 항상 의미 있는 초기값 제공

### 문서화 표준

- 공개 API에 대한 포괄적인 JSDoc 포함
- 문서에 사용 예제 제공
- 예제는 간단하고 집중적으로 유지