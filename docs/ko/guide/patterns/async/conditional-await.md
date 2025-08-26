# 조건부 Await 패턴

useWaitForRefs의 핵심 동작으로, 조건에 따라 대기하거나 즉시 반환하는 패턴입니다.

## 전제조건

조건부 await 패턴을 구현하기 전에 적절한 Context-Action 프레임워크 설정이 필요합니다:

### 필수 설정 가이드
- [기본 액션 설정](../setup/basic-action-setup.md) - 액션 디스패칭과 핸들러 등록을 위한 설정
- [기본 스토어 설정](../setup/basic-store-setup.md) - 스토어 패턴을 이용한 상태 관리를 위한 설정

### Import
```typescript
import { createRefContext } from '@context-action/react';
import { createActionContext, ActionPayloadMap } from '@context-action/react';
import { createStoreContext, useStoreValue } from '@context-action/react';
```

### RefContext 설정
```typescript
// UI 요소 참조 정의
interface UIRefs {
  targetElement: HTMLElement;
  setupModal: HTMLDialogElement;
  dataContainer: HTMLElement;
  betaPanel: HTMLElement;
  standardPanel: HTMLElement;
  authModal: HTMLDialogElement;
  welcomeScreen: HTMLElement;
  coreInterface: HTMLElement;
  advancedControls: HTMLElement;
  animationCanvas: HTMLCanvasElement;
  sidebar: HTMLElement;
  toolbar: HTMLElement;
  statusBar: HTMLElement;
}

const {
  Provider: UIRefProvider,
  useRefHandler: useUIRef,
  useWaitForRefs: useWaitForRefs
} = createRefContext<UIRefs>('UI');
```

### Action Context 설정
```typescript
// 조건부 await 작업을 위한 액션
interface ConditionalActions extends ActionPayloadMap {
  handleClick: void;
  handleAction: void;
  smartWaitHandler: void;
  featureBasedWait: void;
  progressiveWait: void;
}

const {
  Provider: ConditionalActionProvider,
  useActionDispatch: useConditionalDispatch,
  useActionHandler: useConditionalHandler
} = createActionContext<ConditionalActions>('Conditional');
```

### Store 설정
```typescript
// 조건부 로직을 위한 상태 스토어
const {
  Provider: AppStateProvider,
  useStore: useAppStateStore
} = createStoreContext('AppState', {
  isReady: { initialValue: false },
  needsSetup: { initialValue: true },
  dataLoaded: { initialValue: false }
});

const {
  Provider: UserStateProvider,
  useStore: useUserStateStore
} = createStoreContext('UserState', {
  isLoggedIn: { initialValue: false }
});

const {
  Provider: FeatureProvider,
  useStore: useFeatureStore
} = createStoreContext('Feature', {
  betaUI: { initialValue: false }
});

const {
  Provider: CapabilityProvider,
  useStore: useCapabilityStore
} = createStoreContext('Capability', {
  hasAdvancedFeatures: { initialValue: false },
  hasAnimations: { initialValue: true }
});

const {
  Provider: PreferencesProvider,
  useStore: usePreferencesStore
} = createStoreContext('Preferences', {
  showSidebar: { initialValue: true },
  showToolbar: { initialValue: true },
  showStatusBar: { initialValue: false }
});
```

### Provider 설정
```typescript
function App() {
  return (
    <UIRefProvider>
      <ConditionalActionProvider>
        <AppStateProvider>
          <UserStateProvider>
            <FeatureProvider>
              <CapabilityProvider>
                <PreferencesProvider>
                  <YourComponent />
                </PreferencesProvider>
              </CapabilityProvider>
            </FeatureProvider>
          </UserStateProvider>
        </AppStateProvider>
      </ConditionalActionProvider>
    </UIRefProvider>
  );
}
```

## 기본 패턴

```typescript
function ConditionalAwaitComponent() {
  const waitForRefs = useWaitForRefs();

  const performAction = useCallback(async () => {
    // 조건에 따라 대기하거나 즉시 반환
    await waitForRefs('targetElement');

    // 예상 동작:
    // - 마운트되지 않은 경우: 요소가 마운트될 때까지 대기
    // - 마운트된 경우: 즉시 반환
    
    console.log('요소를 이제 안전하게 사용할 수 있습니다');
  }, [waitForRefs]);

  return (
    <div>
      <button onClick={performAction}>액션 수행</button>
      <div ref={useUIRef('targetElement')}>타겟 요소</div>
    </div>
  );
}
```

## 사용 사례

### 액션 핸들러와 함께 사용하는 간단한 대기
```typescript
function SimpleWaitComponent() {
  const waitForRefs = useWaitForRefs();
  
  useConditionalHandler('handleClick', useCallback(async () => {
    await waitForRefs('targetElement');
    console.log('요소를 이제 사용할 수 있습니다');
  }, [waitForRefs]));

  const dispatch = useConditionalDispatch();
  
  return (
    <div>
      <button onClick={() => dispatch('handleClick')}>간단한 대기</button>
      <div ref={useUIRef('targetElement')}>타겟 요소</div>
    </div>
  );
}
```

### 스토어 접근을 이용한 조건부 로직
```typescript
function ConditionalLogicComponent() {
  const waitForRefs = useWaitForRefs();
  const appStateStore = useAppStateStore('isReady');
  
  useConditionalHandler('handleAction', useCallback(async () => {
    const currentState = appStateStore.getValue();
    
    if (!currentState) {
      await waitForRefs('targetElement');
    }
    
    // 액션 진행
    console.log('액션이 완료되었습니다');
  }, [waitForRefs, appStateStore]));

  const dispatch = useConditionalDispatch();
  
  return (
    <div>
      <button onClick={() => dispatch('handleAction')}>조건부 액션</button>
      <div ref={useUIRef('targetElement')}>타겟 요소</div>
    </div>
  );
}
```

## 고급 조건부 패턴

### 상태 기반 조건부 대기

```typescript
function StateBasedComponent() {
  const waitForRefs = useWaitForRefs();
  const appStateStore = useAppStateStore('needsSetup');
  const userStateStore = useUserStateStore('isLoggedIn');
  const dataLoadedStore = useAppStateStore('dataLoaded');
  
  useConditionalHandler('smartWaitHandler', useCallback(async () => {
    const appNeedsSetup = appStateStore.getValue();
    const userLoggedIn = userStateStore.getValue();
    const dataLoaded = dataLoadedStore.getValue();
    
    // 조건이 필요한 경우에만 대기
    if (appNeedsSetup && !userLoggedIn) {
      await waitForRefs('setupModal');
    }
    
    if (userLoggedIn && !dataLoaded) {
      await waitForRefs('dataContainer');
    }
    
    // 작업 진행
    console.log('스마트 대기 작업이 완료되었습니다');
  }, [waitForRefs, appStateStore, userStateStore, dataLoadedStore]));

  const dispatch = useConditionalDispatch();
  
  return (
    <div>
      <button onClick={() => dispatch('smartWaitHandler')}>스마트 대기</button>
      <div ref={useUIRef('setupModal')}>설정 모달</div>
      <div ref={useUIRef('dataContainer')}>데이터 컨테이너</div>
    </div>
  );
}
```

### 기능 플래그 조건부 대기

```typescript
function FeatureFlagComponent() {
  const waitForRefs = useWaitForRefs();
  const featureStore = useFeatureStore('betaUI');
  
  useConditionalHandler('featureBasedWait', useCallback(async () => {
    const betaUIEnabled = featureStore.getValue();
    
    if (betaUIEnabled) {
      // 베타 UI 요소 대기
      await waitForRefs('betaPanel');
    } else {
      // 표준 UI 요소 대기
      await waitForRefs('standardPanel');
    }
    
    // 조건부 대기 후 공통 로직
    console.log('인터페이스가 초기화되었습니다');
  }, [waitForRefs, featureStore]));

  const dispatch = useConditionalDispatch();
  const betaUI = useStoreValue(featureStore);
  
  return (
    <div>
      <button onClick={() => dispatch('featureBasedWait')}>인터페이스 초기화</button>
      {betaUI ? (
        <div ref={useUIRef('betaPanel')}>베타 패널</div>
      ) : (
        <div ref={useUIRef('standardPanel')}>표준 패널</div>
      )}
    </div>
  );
}
```

### 점진적 향상 패턴

```typescript
function ProgressiveEnhancementComponent() {
  const waitForRefs = useWaitForRefs();
  const advancedFeaturesStore = useCapabilityStore('hasAdvancedFeatures');
  const animationsStore = useCapabilityStore('hasAnimations');
  
  useConditionalHandler('progressiveWait', useCallback(async () => {
    // 필수 요소는 항상 대기
    await waitForRefs('coreInterface');
    
    const hasAdvanced = advancedFeaturesStore.getValue();
    const hasAnimations = animationsStore.getValue();
    
    // 향상된 기능을 조건부로 대기
    if (hasAdvanced) {
      await waitForRefs('advancedControls');
    }
    
    if (hasAnimations) {
      await waitForRefs('animationCanvas');
    }
    
    // 사용 가능한 기능으로 초기화
    console.log('점진적 향상이 완료되었습니다', { hasAdvanced, hasAnimations });
  }, [waitForRefs, advancedFeaturesStore, animationsStore]));

  const dispatch = useConditionalDispatch();
  const hasAdvanced = useStoreValue(advancedFeaturesStore);
  const hasAnimations = useStoreValue(animationsStore);
  
  return (
    <div>
      <button onClick={() => dispatch('progressiveWait')}>점진적 초기화</button>
      <div ref={useUIRef('coreInterface')}>핵심 인터페이스</div>
      {hasAdvanced && <div ref={useUIRef('advancedControls')}>고급 컨트롤</div>}
      {hasAnimations && <canvas ref={useUIRef('animationCanvas')}>애니메이션 캔버스</canvas>}
    </div>
  );
}
```

## 조건부 Await를 이용한 에러 처리

```typescript
function ErrorHandlingComponent() {
  const waitForRefs = useWaitForRefs();
  const authModalRef = useUIRef('authModal');
  
  // 설정 스토어 설정 (예시를 위한 단순화)
  const [config] = useState({
    requiresAuth: true,
    showWelcome: true
  });
  
  const safeConditionalWait = useCallback(async () => {
    try {
      if (config.requiresAuth) {
        await waitForRefs('authModal');
        const authElement = authModalRef.target;
        
        if (!authElement) {
          throw new Error('인증 모달을 사용할 수 없습니다');
        }
      }
      
      if (config.showWelcome) {
        await waitForRefs('welcomeScreen');
      }
      
      // 메인 로직 계속
      console.log('안전한 조건부 대기가 완료되었습니다');
      
    } catch (error) {
      console.warn('조건부 대기 실패, 대안 사용:', error);
      // 대기 없이 대안 로직
      console.log('대안 모드가 초기화되었습니다');
    }
  }, [waitForRefs, config, authModalRef]);
  
  return (
    <div>
      <button onClick={safeConditionalWait}>안전한 대기</button>
      {config.requiresAuth && <dialog ref={authModalRef}>인증 모달</dialog>}
      {config.showWelcome && <div ref={useUIRef('welcomeScreen')}>환영 화면</div>}
    </div>
  );
}
```

## 성능 최적화

### 배치 조건부 대기

```typescript
function BatchConditionalComponent() {
  const waitForRefs = useWaitForRefs();
  const sidebarStore = usePreferencesStore('showSidebar');
  const toolbarStore = usePreferencesStore('showToolbar');
  const statusBarStore = usePreferencesStore('showStatusBar');
  
  const batchConditionalWait = useCallback(async () => {
    const showSidebar = sidebarStore.getValue();
    const showToolbar = toolbarStore.getValue();
    const showStatusBar = statusBarStore.getValue();
    
    const waitPromises: Promise<void>[] = [];
    
    // 조건부 대기 배열 구성
    if (showSidebar) {
      waitPromises.push(waitForRefs('sidebar'));
    }
    
    if (showToolbar) {
      waitPromises.push(waitForRefs('toolbar'));
    }
    
    if (showStatusBar) {
      waitPromises.push(waitForRefs('statusBar'));
    }
    
    // 모든 필요 요소를 병렬로 대기
    if (waitPromises.length > 0) {
      await Promise.all(waitPromises);
    }
    
    // 레이아웃 초기화
    console.log('선호도와 함께 레이아웃이 초기화되었습니다', {
      showSidebar,
      showToolbar,
      showStatusBar
    });
  }, [waitForRefs, sidebarStore, toolbarStore, statusBarStore]);
  
  const showSidebar = useStoreValue(sidebarStore);
  const showToolbar = useStoreValue(toolbarStore);
  const showStatusBar = useStoreValue(statusBarStore);
  
  return (
    <div>
      <button onClick={batchConditionalWait}>레이아웃 초기화</button>
      {showSidebar && <div ref={useUIRef('sidebar')}>사이드바</div>}
      {showToolbar && <div ref={useUIRef('toolbar')}>툴바</div>}
      {showStatusBar && <div ref={useUIRef('statusBar')}>상태바</div>}
    </div>
  );
}
```

## 주요 이점

- **자동 감지**: 수동 검사가 필요하지 않음
- **성능**: 요소가 이미 마운트된 경우 지연 없음
- **신뢰성**: await 후 요소 사용 가능성 보장
- **유연성**: 모든 조건부 로직과 결합 가능
- **효율성**: 필요할 때만 대기

## 일반적인 패턴

1. **기능 토글**: 활성화된 기능에 따라 대기
2. **사용자 권한**: 사용자 기능에 따라 대기
3. **디바이스 기능**: 디바이스 특징에 따라 대기
4. **네트워크 상태**: 연결 상태에 따라 대기
5. **점진적 로딩**: 필요에 따라 컴포넌트 대기