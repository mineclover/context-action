# 로깅 & 토스트 통합 컨벤션

## 개요

Context-Action 프로젝트에서는 **로깅과 토스트 알림을 하나의 진입점에서 통합 관리**하는 컨벤션을 사용합니다. 이를 통해 개발 과정에서 액션의 실행 상태를 실시간으로 추적하고 시각화할 수 있습니다.

## 핵심 원칙

### 1. 단일 진입점 (Single Entry Point)
모든 로깅은 `useActionLoggerWithToast` 훅을 통해서만 수행합니다.

```tsx
// ✅ 올바른 사용법 - 통합된 진입점
const { logAction, logSystem, logError } = useActionLoggerWithToast();

// ❌ 잘못된 사용법 - 개별 시스템 사용
const logger = useLogger();
const { showToast } = useActionToast();
```

### 2. 자동 동기화 (Auto Synchronization)
하나의 로깅 호출로 다음이 동시에 실행됩니다:
- 📊 **LogMonitor**에 로그 기록
- 🍞 **Toast**로 시각적 알림 표시

### 3. 전역 적용 (Global Application)
모든 예제와 데모 컴포넌트에서 동일한 방식을 사용합니다.

## 기본 사용법

### 1. 컴포넌트에서 훅 사용

```tsx
import { useActionLoggerWithToast } from '../../components/LogMonitor/';

export function YourComponent() {
  const { logAction, logSystem, logError } = useActionLoggerWithToast();
  
  const handleAction = () => {
    // 액션 실행 로깅 (로그 + 토스트 동시 표시)
    logAction('updateData', { userId: 123, data: newData });
  };
  
  const handleError = (error: Error) => {
    // 에러 로깅 (에러 로그 + 에러 토스트 동시 표시)
    logError('Data update failed', error);
  };
  
  return (
    // 컴포넌트 JSX
  );
}
```

### 2. 페이지 레벨 설정

```tsx
import { PageWithLogMonitor } from '../../components/LogMonitor/';

// 페이지에 LogMonitor 자동 포함
export default function YourPage() {
  return (
    <PageWithLogMonitor pageId="your-page" title="Your Page">
      <YourComponent />
    </PageWithLogMonitor>
  );
}
```

### 3. 앱 레벨 설정

```tsx
// App.tsx - 전역 토스트 시스템 설정
function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* 라우트들 */}
        </Routes>
      </Layout>
      
      {/* 전역 토스트 시스템 */}
      <ToastContainer />
      <ToastControlPanel />
    </Router>
  );
}
```

## 로깅 타입별 사용법

### 액션 로깅
```tsx
// 액션 실행 시 사용
logAction('actionType', payload, options);
```

### 시스템 로깅
```tsx
// 시스템 이벤트나 상태 변화 시 사용
logSystem('Component initialized');
logSystem('Store updated', { context: { storeId: 'user' } });
```

### 에러 로깅
```tsx
// 에러 발생 시 사용
logError('Operation failed', error);
logError('Validation failed', new Error('Invalid input'));
```

## 시각화 컴포넌트

### LogMonitor
- 실시간 로그 표시
- 로그 레벨 제어
- 로그 상세 정보 확인

### ToastControlPanel
- 토스트 테스트 및 설정
- 토스트 위치, 지속시간 조절
- 스트레스 테스트 기능

## 컨벤션 준수 사항

### ✅ 해야 할 것

1. **항상 `useActionLoggerWithToast` 사용**
   ```tsx
   const { logAction, logSystem, logError } = useActionLoggerWithToast();
   ```

2. **의미있는 액션 타입 명시**
   ```tsx
   logAction('updateUserProfile', userData);
   logAction('addToCart', { productId, quantity });
   ```

3. **페이지별 LogMonitor 포함**
   ```tsx
   <PageWithLogMonitor pageId="unique-page-id">
   ```

### ❌ 하지 말아야 할 것

1. **개별 로깅 시스템 직접 사용 금지**
   ```tsx
   // ❌ 금지
   console.log('action executed');
   showToast('success', 'Done');
   ```

2. **로깅 없이 중요한 액션 실행 금지**
   ```tsx
   // ❌ 금지 - 로깅 없는 중요한 액션
   const saveData = () => {
     api.save(data); // 로깅 없음
   };
   ```

3. **페이지 ID 중복 금지**
   ```tsx
   // ❌ 금지 - 같은 pageId 재사용
   <PageWithLogMonitor pageId="demo"> // 다른 페이지에서도 "demo" 사용
   ```

## 장점

### 개발 효율성
- 🎯 **일관된 디버깅 경험**: 모든 컴포넌트에서 동일한 로깅 방식
- 📊 **실시간 모니터링**: 액션 실행 상태를 즉시 확인
- 🔍 **통합된 추적**: 로그와 토스트로 완전한 액션 플로우 파악

### 사용자 경험
- 🍞 **즉각적인 피드백**: 액션 실행 시 바로 토스트 알림
- 🎨 **시각적 구분**: 액션 타입별 색상 코딩
- ⚙️ **개발 도구**: ToastControlPanel로 테스트 및 설정 조절

### 유지보수성
- 🏗️ **중앙집중식 관리**: 로깅 로직을 한 곳에서 관리
- 🔧 **쉬운 설정 변경**: 전역 설정으로 모든 페이지에 적용
- 📝 **표준화된 로그**: 일관된 로그 포맷으로 분석 용이

## 예시 코드

완전한 구현 예시는 다음 파일들을 참고하세요:

- `example/src/pages/core/CoreBasicsPage.tsx`
- `example/src/demos/store-scenarios/components/UserProfileDemo.tsx`
- `example/src/components/LogMonitor/hooks.tsx`
- `example/src/components/ToastSystem/useActionToast.ts`

## 결론

이 컨벤션을 통해 모든 Context-Action 예제에서 **일관되고 효과적인 로깅 및 시각화 경험**을 제공할 수 있습니다. 새로운 컴포넌트나 페이지를 만들 때는 반드시 이 컨벤션을 따라 구현해주세요.