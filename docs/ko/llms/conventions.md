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

### AI Runner 및 자격 증명 경계

뷰가 LLM provider, 전송 방식, 자격 증명에 의존하지 않도록
`ToolTextGenerator` 같은 작은 runner 계약에만 의존시킵니다. runner가
provider 설정과 인증을 소유하고, 뷰는 선택 모델, 메시지 이력, ToolContext
실행 브리지만 전달합니다.

```typescript
interface ToolTextGenerator {
  generate(request: ToolTextGenerationRequest): Promise<ToolTextGenerationResult>;
}
```

- 브라우저 runner는 사용자가 소유하고 세션 동안만 쓰는 키에 한해 허용합니다.
  UI에 provider로 직접 전송됨을 표시하고, 애플리케이션 소유 비밀값은 절대
  전달하지 않습니다.
- 프로덕션 애플리케이션 비밀값은 서버 프록시 runner가 소유합니다. 프록시는
  인증/인가, rate limit, 감사 로그, provider 자격 증명을 담당합니다.
- OAuth runner는 토큰 획득과 갱신을 소유합니다. bearer token을 뷰 수준의
  생성 요청에 넣거나 예제 기본값으로 영속화하지 않습니다.
- Tool schema는 `ToolContext`를 단일 진실 공급원으로 유지합니다. 다음 단계의
  모델이 결과를 필요로 하면 tool handler가 구조화된 값을 반환하고
  `dispatchWithResult`로 실행합니다.
- 자동 tool loop에는 단계 상한을 두고, tool 실행이 거부되거나 중단되면
  사용자에게 명확한 실패를 반환합니다.

브라우저 OpenRouter 예제는 의도적으로 데모 runner입니다. 뷰의 생성 호출을
바꾸지 않고 서버 또는 OAuth 구현체로 교체할 수 있습니다.

### 문서화 표준

- 공개 API에 대한 포괄적인 JSDoc 포함
- 문서에 사용 예제 제공
- 예제는 간단하고 집중적으로 유지
