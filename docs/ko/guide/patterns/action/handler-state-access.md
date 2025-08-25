# 액션 핸들러 상태 접근 패턴

일반적인 함정을 피하기 위한 중요한 모범 사례를 포함한 액션 핸들러 내에서 상태에 접근하고 관리하는 고급 패턴입니다.

## Import

```typescript
// 프레임워크 import
import { useActionHandler } from '@context-action/react';
// 설정 import (가상의 setup 참조)
import { useUserAction, useUserActionHandler, UserActionProvider } from '../setup/actions';
```

## 필수 조건

🎯 **스펙 재사용**: 완전한 액션 핸들러 설정 패턴은 **[기본 액션 설정](../setup/basic-action-setup.md)**을 참조하세요.

📖 **이 문서의 모든 예제**는 아래 설정 스펙을 재사용합니다:
- 🎯 액션 타입 → [EventActions, UserActions](../setup/basic-action-setup.md#type-definitions)
- 🎯 훅 명명 → [useEventAction 패턴](../setup/basic-action-setup.md#context-creation)
- 🎯 핸들러 패턴 → [액션 핸들러 설정](../setup/basic-action-setup.md#action-handler-patterns)

💡 **일관된 학습**: 설정 가이드를 먼저 읽으면 이 문서의 모든 예제를 **즉시 이해**할 수 있습니다.

## 📋 목차

1. [중요: 클로저 함정 피하기](#critical-avoid-closure-traps)
2. [실시간 상태 접근 패턴](#real-time-state-access-patterns)
3. [useEffect 의존성 모범 사례](#useeffect-dependencies-best-practices)

---

## 중요: 클로저 함정 피하기

### ⚠️ 클로저 함정 문제

액션 핸들러 내에서 스토어 값에 접근할 때, **컴포넌트 스코프의 값을 사용하지 마세요** - 오래된 데이터가 있는 클로저 함정을 만듭니다.

```tsx
// ❌ 잘못된 방법: 컴포넌트 스코프 값을 핸들러에서 사용
function UserComponent() {
  const userStore = useUserStore('profile');
  const user = useStoreValue(userStore); // 이 값이 클로저에 갇힘!
  
  useUserActionHandler('updateProfile', async (payload) => {
    // 🚨 버그: 이 'user'는 핸들러 등록 시점의 값이지, 현재 시점이 아님!
    if (user.name) {  // 오래된 값!
      await updateUserAPI(payload);
    }
  });
}

// ✅ 올바른 방법: 핸들러 내부에서 스토어 값에 직접 접근
function UserComponent() {
  const userStore = useUserStore('profile');
  const user = useStoreValue(userStore); // 컴포넌트 렌더링용으로만
  
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    // ✅ 항상 스토어에서 신선한 상태를 가져오기
    const currentUser = userStore.getValue(); // 실시간 값!
    
    if (currentUser.name) {
      await updateUserAPI(payload);
    }
  }, [userStore])); // 의존성에는 스토어 참조만
}
```

### 🔍 왜 클로저 함정이 발생하는가

1. **핸들러 등록 시점**: 핸들러가 등록 시점에 렉시컬 스코프에서 변수를 캡처
2. **오래된 참조**: 컴포넌트 상태 값이 핸들러 클로저 내부에서 업데이트되지 않음
3. **재등록 문제**: `useCallback` 없이는 모든 렌더링에서 핸들러 재등록

---

## 실시간 상태 접근 패턴

### 패턴 1: 직접 스토어 getValue()

**간단한 상태 확인과 단일 스토어 접근에 사용:**

```tsx
useUserActionHandler('updateProfile', async (payload) => {
  const currentProfile = profileStore.getValue();
  
  if (currentProfile.email) {
    // 현재 상태를 사용한 액션 진행
    await updateUserProfile(payload, currentProfile);
  }
});
```

### 패턴 2: 여러 스토어 조정

**여러 스토어 상태가 필요한 복잡한 로직에 사용:**

```tsx
useUserActionHandler('login', async (payload) => {
  const profileState = profileStore.getValue();
  const preferencesState = preferencesStore.getValue();
  
  // 의사결정을 위해 모든 현재 상태 사용
  if (profileState.email && preferencesState.theme) {
    await executeLoginLogic(payload, { profileState, preferencesState });
  }
});
```

### 패턴 3: 상태 검증 및 업데이트

**업데이트 전 현재 상태 검증에 사용:**

```tsx
useUserActionHandler('changePassword', async (payload) => {
  const current = profileStore.getValue();
  
  // 현재 상태 검증
  if (!current.email || current.role === 'guest') {
    throw new Error('권한이 부족합니다');
  }
  
  // 현재 상태를 기반으로 업데이트
  profileStore.setValue({
    ...current,
    lastPasswordChange: Date.now()
  });
});
```

---

## useEffect 의존성 모범 사례

### 스토어와 디스패치 참조는 안정적입니다

Context-Action 프레임워크는 스토어 인스턴스와 디스패치 함수가 안정적인 참조를 갖도록 보장합니다:

```tsx
// ✅ useEffect 의존성에서 생략해도 안전합니다
function MyComponent() {
  const profileStore = useUserStore('profile');  // 안정적인 참조
  const dispatch = useUserAction();              // 안정적인 참조
  const profile = useStoreValue(profileStore);
  
  useEffect(() => {
    if (profile.email && !profile.name) {
      dispatch('updateProfile', { name: 'Default Name', email: profile.email });
      profileStore.setValue({ ...profile, lastSyncAttempt: Date.now() });
    }
  }, [profile.email, profile.name]); // profileStore나 dispatch 포함하지 않음
  
  // 대안: 명시성을 선호하는 경우 포함해도 무해
  useEffect(() => {
    if (profile.email && !profile.name) {
      dispatch('updateProfile', { name: 'Default Name', email: profile.email });
    }
  }, [profile.email, profile.name, dispatch, profileStore]); // 이것도 괜찮음
}
```

### 의존성 배열 가이드라인

```tsx
// ✅ 포함: 실제로 변경되고 행동에 영향을 주는 값들
useEffect(() => {
  if (profile.role === 'admin') {
    startPolling();
  }
}, [profile.role]); // 파생된 값 포함

// ✅ 생략: 안정적인 참조 (하지만 포함해도 무해)
const stableRef = profileStore;
const stableDispatch = dispatch;

useEffect(() => {
  // 이것들은 deps에 필요하지 않지만, 포함해도 됨
  stableRef.setValue(newValue);
  stableDispatch('updateProfile', payload);
}, []); // 빈 deps도 괜찮음

// ❌ 피하기: 특정 속성만 중요할 때 전체 객체 포함
useEffect(() => {
  updateUI();
}, [profile]); // 모든 프로필 변경에서 재실행

// ✅ 더 나은 방법: 관련 속성만 포함
useEffect(() => {
  updateUI();
}, [preferences.theme, preferences.language]); // 이것들이 변경될 때만 재실행
```

---

## 🔧 핸들러 등록 모범 사례

### 올바른 핸들러 등록 패턴

```tsx
function UserComponent() {
  const profileStore = useUserStore('profile');
  const dispatch = useUserAction();
  
  // ✅ 올바른 방법: 적절한 의존성을 갖춘 핸들러
  const updateProfileHandler = useCallback(async (payload) => {
    // 항상 신선한 상태 가져오기
    const currentProfile = profileStore.getValue();
    
    try {
      // 현재 상태로 비즈니스 로직 실행
      const updatedProfile = await updateUserProfile({
        ...currentProfile,
        ...payload
      });
      
      // 신선한 데이터로 스토어 업데이트
      profileStore.setValue(updatedProfile);
      
      // 성공 알림 (설정의 EventActions 패턴 사용)
      dispatch('updateProfile', {
        name: updatedProfile.name,
        email: updatedProfile.email
      });
    } catch (error) {
      // 적절한 에러 처리
      console.error('프로필 업데이트 실패:', error);
    }
  }, [profileStore, dispatch]);
  
  useUserActionHandler('updateProfile', updateProfileHandler);
}
```

### 피해야 할 일반적인 실수

```tsx
// ❌ 잘못된 방법: 컴포넌트 스코프 값 사용
function BadComponent({ userId }: { userId: string }) {
  useUserActionHandler('updateProfile', async (payload) => {
    // userId는 등록 시점의 props에서 캡처됨 - 오래됨!
    await updateUserProfile(userId, payload);
  }); // useCallback 누락과 deps의 userId
}

// ✅ 올바른 방법: 스토어 사용 또는 페이로드를 통해 전달
function GoodComponent({ userId }: { userId: string }) {
  const profileStore = useUserStore('profile');
  
  useUserActionHandler('updateProfile', useCallback(async (payload) => {
    // 스토어에서 가져오거나 페이로드를 통해 전달
    const currentProfile = profileStore.getValue();
    await updateUserProfile(currentProfile.id || payload.id, payload);
  }, [profileStore]));
}
```

---

## 📚 관련 패턴

- **[기본 액션 설정](../setup/basic-action-setup.md)** - 완전한 액션 컨텍스트 설정 패턴
- **[액션 기본 사용법](./basic-usage.md)** - 기본 액션 디스패칭 패턴
- **[디스패치 접근 패턴](./dispatch-access.md)** - 고급 디스패치 사용 패턴

---

## 💡 핵심 요점

1. **핸들러에서 컴포넌트 스코프 값을 사용하지 마세요** - 클로저 함정을 만듭니다
2. **현재 상태는 항상 `store.getValue()`를 사용하세요** - 핸들러에서
3. **스토어와 디스패치 참조는 안정적입니다** - deps에서 생략해도 안전
4. **핸들러 안정성을 위해 `useCallback`을 사용하세요** 그리고 적절한 의존성 관리
5. **의존성 배열에는 변경되는 값만 포함하세요** 최적 성능을 위해