# 문서 수정 지시문

## 📋 작업 개요
- **문서 ID**: guide-action-handlers
- **문서 제목**: 액션 핸들러
- **목표 글자수**: 100자
- **핵심 초점**: 핸들러 기본 개념

## 🎯 핵심 포인트


## 📖 원본 내용

```
# 액션 핸들러

액션 핸들러는 애플리케이션의 비즈니스 로직을 포함합니다. 확장 가능하고 유지보수가 가능한 애플리케이션을 위해 핸들러를 효과적으로 구현, 등록, 관리하는 방법을 알아보세요.

## 핸들러 구현 패턴

### 모범 사례: useActionHandler 패턴

핸들러 등록에 권장되는 패턴은 최적의 성능과 적절한 정리를 위해 `useActionHandler` + `useEffect`를 사용하는 것입니다:

```typescript
import React, { useEffect, useCallback } from 'react';
import { useUserActionHandler, useUserStores } from '@/stores/user.store';

function useUserHandlers() {
  const addHandler = useUserActionHandler();
  const stores = useUserStores();
  
  // 재등록을 방지하기 위해 핸들러를 useCallback으로 감싸기
  const updateProfileHandler = useCallback(async (payload, controller) => {
    // 현재 상태를 위한 stores 지연 평가
    const profileStore = stores.getStore('profile');
    const currentProfile = profileStore.getValue();
    
    // 검증
    if (payload.validate && !isValidEmail(payload.data.email)) {
      controller.abort('유효하지 않은 이메일 형식');
      return;
    }
    
    // 비즈니스 로직
    const updatedProfile = {
      ...currentProfile,
      ...payload.data,
      updatedAt: Date.now()
    };
    
    // 스토어 업데이트
    profileStore.setValue(updatedProfile);
    
    // 수집을 위한 결과 반환
    return { success: true, profile: updatedProfile };
  }, [stores]);
  
  // 정리와 함께 핸들러 등록
  useEffect(() => {
    if (!addHandler) return;
    
    // 등록은 등록 해제 함수를 반환
    const unregister = addHandler('updateProfile', updateProfileHandler, {
      priority: 100,      // 높은 우선순위가 먼저 실행
      blocking: true,     // 순차 모드에서 비동기 완료 대기
      tags: ['business'], // 필터링용
      id: 'profile-updater' // 디버깅을 위한 명시적 ID
    });
    
    // 중요: 언마운트 시 메모리 정리를 위한 unregister 반환
    return unregister;
  }, [addHandler, updateProfileHandler]);
}
```

## 핸들러 설정 옵션

```typescript
interface HandlerConfig {
  priority?: number;        // 실행 순서 (높을수록 먼저)
  blocking?: boolean;       // 비동기 완료 대기
  tags?: string[];         // 필터링과 분류를 위함
  id?: string;            // 명시적 핸들러 ID
  category?: string;      // 핸들러 카테고리
  returnType?: 'value';   // 반환 값 수집 활성화
}
```

## 핸들러 실행 흐름

1. **순차 모드** (기본값): 핸들러가 우선순위 순서로 실행
2. **병렬 모드**: 모든 핸들러가 동시에 실행
3. **경쟁 모드**: 첫 번째로 완료되는 핸들러가 승리

```typescript
// 블로킹과 함께 순차 실행
addHandler('processOrder', handler1, { priority: 100, blocking: true });
addHandler('processOrder', handler2, { priority: 90, blocking: true });
addHandler('processOrder', handler3, { priority: 80, blocking: true });
// 실행: handler1 → 대기 → handler2 → 대기 → handler3

// 병렬 실행
dispatch('processOrder', payload, { executionMode: 'parallel' });
```

## 컨트롤러 메서드

컨트롤러는 핸들러 실행 흐름을 관리하는 메서드를 제공합니다:

```typescript
const handler = async (payload, controller) => {
  // 파이프라인 중단
  if (error) controller.abort('에러 메시지');
  
  // 특정 우선순위로 점프
  if (urgent) controller.jumpToPriority(90);
  
  // 수집을 위한 결과 설정
  controller.setResult(computedValue);
  
  // 결과와 함께 파이프라인 종료
  if (canFinishEarly) controller.return(finalResult);
};
```

## 고급 핸들러 패턴

### 에러 핸들링

```typescript
const robustHandler = useCallback(async (payload, controller) => {
  const store = stores.getStore('data');
  
  try {
    // 위험한 작업
    const result = await performRiskyOperation(payload);
    store.setValue(result);
    
    return { success: true, data: result };
  } catch (error) {
    // 컨텍스트와 함께 적절한 에러 핸들링
    controller...
```


## 📝 현재 요약

**현재 작성된 내용** ({{currentSummary.length}}자):
```
# 액션 핸들러

[100자 요약 - 우선순위: 90/essential]

이 문서는 guide 카테고리의 액션 핸들러에 대한 내용입니다.

추출 전략: concept-fir...
```


## ✅ 작업 지침
1. **글자수 준수**: 정확히 100자 이내로 작성
2. **핵심 포인트 포함**: 위의 핵심 포인트를 우선순위에 따라 포함
3. **명확성**: 이해하기 쉽고 정확한 표현 사용
4. **완성도**: 독립적으로 읽어도 이해 가능한 내용

## 🔍 품질 검증
- [ ] 글자수가 100자 이내인가?
- [ ] 핵심 포인트가 모두 포함되었는가?
- [ ] 내용이 명확하고 정확한가?
- [ ] 원본 문서의 의도가 잘 전달되는가?