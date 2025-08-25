# 액션 타입 시스템

ActionPayloadMap, 타입 안전성, TypeScript 통합을 포함한 Context-Action 프레임워크의 액션 타입 시스템에 대한 완전한 가이드입니다.

## 필수 조건

액션 타입 정의와 컨텍스트 설정에 대해서는 **[기본 액션 설정](../setup/basic-action-setup.md)**을 참조하세요.

이 문서는 액션 설정을 사용한 타입 시스템 패턴을 보여줍니다:
- 타입 정의 → [확장 액션 인터페이스](../setup/basic-action-setup.md#extended-action-interface)
- 공통 패턴 → [공통 액션 패턴](../setup/basic-action-setup.md#common-action-patterns)

## ActionPayloadMap 인터페이스

Context-Action 프레임워크에서 타입 안전 액션 처리의 기반입니다.

### 기본 액션 매핑

```typescript
// 설정 가이드의 AppActions 패턴 사용
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email: string };
  deleteUser: { id: string };
  saveUser: { name: string; email: string };
  refreshData: void;
}
```

### ActionRegister와 함께 사용

```typescript
const register = new ActionRegister<AppActions>()

// 설정 패턴을 사용한 타입 안전 핸들러 등록
register.register('updateUser', async (payload, controller) => {
  // payload는 자동으로 { id: string; name: string; email: string }로 타입화됨
  await userService.update(payload.id, payload)
})

// 타입 안전 디스패치
await register.dispatch('updateUser', {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com'
})
```

## 파이프라인 컨트롤러 타입

액션 핸들러를 위한 타입 안전 파이프라인 제어입니다.

### 기본 파이프라인 제어

```typescript
// 파이프라인 제어가 있는 핸들러
register.register('validateAndSave', async (payload, controller) => {
  // 다른 핸들러 전에 페이로드 수정
  controller.modifyPayload(p => ({ ...p, validated: true }))
  
  // 현재 페이로드 상태 가져오기
  const currentPayload = controller.getPayload()
  
  // 필요한 경우 실행을 조기 중단
  if (!currentPayload.id) {
    controller.abort('필수 ID가 누락되었습니다')
    return
  }
  
  // 검증 계속
  const result = await validateUser(currentPayload)
  controller.setResult(result)
})
```

### 결과와 함께 조기 반환

```typescript
register.register('quickCheck', async (payload, controller) => {
  const cached = await getCachedResult(payload.id)
  
  if (cached) {
    // 캐시된 결과로 조기 반환, 나머지 핸들러 건너뛰기
    controller.return(cached)
    return
  }
  
  // 비용이 많이 드는 작업 계속
  const result = await expensiveOperation(payload)
  controller.setResult(result)
})
```

### 우선순위 점프

```typescript
register.register('conditionalHandler', async (payload, controller) => {
  if (payload.urgent) {
    // 높은 우선순위 핸들러로 건너뛰기
    controller.jumpToPriority(100)
    return
  }
  
  // 일반 처리
  const result = await normalProcessing(payload)
  controller.setResult(result)
}, { priority: 50 })
```

## 액션 핸들러 타입

완전한 TypeScript 지원을 갖춘 타입 안전 액션 핸들러 정의입니다.

### 스토어 통합 패턴

```typescript
// 스토어 통합이 있는 액션 핸들러
register.register('updateUserProfile', async (payload, controller) => {
  // 스토어에서 현재 상태 가져오기
  const currentUser = userStore.getValue()
  const currentSettings = settingsStore.getValue()
  
  try {
    // 타입 안전성을 갖춘 비즈니스 로직
    const updatedUser = { ...currentUser, ...payload }
    const result = await userService.update(updatedUser)
    
    // 새 상태로 스토어 업데이트
    userStore.setValue(result.user)
    settingsStore.update(settings => ({
      ...settings,
      lastUpdated: result.timestamp
    }))
    
    // 핸들러 결과 설정
    controller.setResult({ success: true, user: result.user })
  } catch (error) {
    controller.abort(`업데이트 실패: ${error.message}`)
  }
})
```

### 에러 처리가 있는 비동기 핸들러

```typescript
register.register('syncData', async (payload, controller) => {
  try {
    // 비동기 작업 시작
    const syncResult = await dataSync.start(payload.endpoint)
    
    // 진행 상황 업데이트
    controller.setResult({ phase: 'syncing', progress: 0 })
    
    // 진행 상황 모니터링
    for await (const progress of syncResult.progressStream) {
      controller.setResult({ phase: 'syncing', progress: progress.percent })
    }
    
    // 최종 결과로 완료
    controller.setResult({ 
      phase: 'complete', 
      progress: 100, 
      data: syncResult.data 
    })
  } catch (error) {
    controller.abort(`동기화 실패: ${error.message}`)
  }
}, { 
  timeout: 30000,
  tags: ['data', 'async'] 
})
```

## 핸들러 구성

포괄적인 옵션을 갖춘 타입 안전 핸들러 구성입니다.

### 기본 핸들러 구성

```typescript
register.register('processPayment', paymentHandler, {
  priority: 100,           // 높은 숫자 = 높은 우선순위
  tags: ['payment', 'critical'],
  category: 'business-logic',
  once: false,            // 여러 번 실행 가능
  timeout: 5000           // 5초 타임아웃
})
```

### 고급 구성

```typescript
register.register('analyticsTracker', trackingHandler, {
  priority: 10,
  tags: ['analytics', 'tracking'],
  category: 'monitoring',
  once: false,
  timeout: 2000,
  debounce: 100,         // 빠른 호출 디바운스
  throttle: 500,         // 실행 빈도 스로틀
  environment: 'production',  // 프로덕션에서만
  feature: 'analytics'   // 기능 플래그
})
```

### 조건부 핸들러

```typescript
register.register('featureHandler', handler, {
  priority: 50,
  condition: (payload, context) => {
    // 사용자가 프리미엄인 경우에만 실행
    return context.user?.isPremium === true
  },
  tags: ['premium', 'feature']
})
```

## 실제 예제

- [TodoListDemo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/TodoListDemo.tsx) - 액션 타입이 있는 완전한 할 일 목록
- [ChatDemo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/ChatDemo.tsx) - 메시지 액션이 있는 채팅 시스템
- [UserProfileDemo](https://github.com/mineclover/context-action/blob/main/example/src/pages/demos/store-scenarios/components/UserProfileDemo.tsx) - 사용자 프로필 관리

## 관련 패턴

- [액션 기본 사용법](./basic-usage.md) - 기본 액션 패턴
- [등록 위임](./register-delegation.md) - 고급 등록 패턴
- [스토어 통합](../store/basic-usage.md) - 스토어와 통합