# 멀티 컨텍스트 RefContext 아키텍처

분리된 관심사를 가진 복잡한 애플리케이션을 위한 다중 RefContext 구성입니다.

## 선행 요건

RefContext 설정 패턴과 멀티 도메인 구성은 **[RefContext 설정](../setup/ref-context-setup.md)**을 참조하세요.

프로바이더 구성 패턴은 **[프로바이더 구성 설정](../setup/provider-composition-setup.md)**을 참조하세요.

## 개요

멀티 RefContext 아키텍처를 사용하면 다양한 유형의 DOM 조작을 격리된 컨텍스트로 분리하여 복잡한 애플리케이션에서 더 나은 구성과 성능을 제공할 수 있습니다.

## 기본 멀티 컨텍스트 설정

```tsx
// 설정 가이드의 멀티 도메인 RefContext 패턴 사용
// 참조: setup/ref-context-setup.md#multi-domain-refcontext-setup
const {
  Provider: MediaRefProvider,
  useRefHandler: useMediaRef
} = createRefContext<MediaRefs>('Media');

const {
  Provider: PerformanceRefProvider,
  useRefHandler: usePerformanceRef
} = createRefContext<{
  fpsDisplay: HTMLDivElement;
  metricsPanel: HTMLDivElement;
}>('Performance');

// 프로바이더 구성 패턴 사용
// 참조: setup/provider-composition-setup.md#multi-domain-composition
const RefProviders = composeProviders([
  MediaRefProvider,
  PerformanceRefProvider
]);

function ComplexApp() {
  return (
    <RefProviders>
      <MediaComponents />
      <PerformanceMetrics />
    </RefProviders>
  );
}
```

## 도메인 분리 패턴

```tsx
// 설정 가이드의 UI 및 성능 도메인 패턴 사용
// 참조: setup/ref-context-setup.md#type-definitions
const {
  Provider: UIRefProvider,
  useRefHandler: useUIRef
} = createRefContext<UIRefs>('UI');

// 설정 가이드의 성능 도메인
const {
  Provider: PerformanceRefProvider,
  useRefHandler: usePerformanceRef
} = createRefContext<{
  fpsDisplay: HTMLDivElement;
  metricsPanel: HTMLDivElement;
}>('Performance');

// 인터랙티브 컨텍스트
const {
  Provider: InteractiveProvider,
  useRefHandler: useInteractiveRef
} = createRefContext<{
  dragHandle: HTMLDivElement;
  resizeHandle: HTMLDivElement;
  scrollArea: HTMLDivElement;
}>('Interactive');

// 애니메이션 컨텍스트
const {
  Provider: AnimationProvider,
  useRefHandler: useAnimationRef
} = createRefContext<{
  particle: HTMLDivElement;
  trail: HTMLCanvasElement;
  overlay: HTMLDivElement;
}>('Animation');

// 구조적 요소를 위한 레이아웃 컨텍스트
const {
  Provider: LayoutProvider,
  useRefHandler: useLayoutRef
} = createRefContext<{
  sidebar: HTMLDivElement;
  mainContent: HTMLDivElement;
  header: HTMLHeaderElement;
}>('Layout');
```

## 컨텍스트 간 통신

```tsx
// 컨텍스트 간 조정을 위한 커스텀 훅
function useLayoutController() {
  const sidebar = useLayoutRef('sidebar');
  const mainContent = useLayoutRef('mainContent');
  const dragHandle = useInteractiveRef('dragHandle');
  
  const toggleSidebar = useCallback(() => {
    if (!sidebar.target || !mainContent.target) return;
    
    const isCollapsed = sidebar.target.style.width === '0px';
    const newWidth = isCollapsed ? '250px' : '0px';
    const newMargin = isCollapsed ? '250px' : '0px';
    
    // 리렌더링 없이 여러 ref 조정
    sidebar.target.style.width = newWidth;
    sidebar.target.style.transform = `translateX(${isCollapsed ? '0' : '-100%'})`;
    mainContent.target.style.marginLeft = newMargin;
    
    // 드래그 핸들 위치 업데이트
    if (dragHandle.target) {
      dragHandle.target.style.left = newWidth;
    }
  }, [sidebar, mainContent, dragHandle]);
  
  return { toggleSidebar };
}
```

## 계층적 컨텍스트 패턴

```tsx
// 전역 UI 요소를 위한 부모 컨텍스트
const {
  Provider: GlobalUIProvider,
  useRefHandler: useGlobalUIRef
} = createRefContext<{
  root: HTMLDivElement;
  overlay: HTMLDivElement;
  tooltip: HTMLDivElement;
}>('GlobalUI');

// 특정 기능을 위한 자식 컨텍스트
const {
  Provider: FeatureProvider,
  useRefHandler: useFeatureRef
} = createRefContext<{
  featureContainer: HTMLDivElement;
  actionButton: HTMLButtonElement;
  statusIndicator: HTMLSpanElement;
}>('Feature');

// 중첩된 프로바이더 계층
function AppWithHierarchy() {
  return (
    <GlobalUIProvider>
      <div className="app-container">
        <FeatureProvider>
          <FeatureComponent />
        </FeatureProvider>
      </div>
    </GlobalUIProvider>
  );
}
```

## 컨텍스트 격리 이점

```tsx
// 분석 추적 컨텍스트 - 격리된 관심사
const {
  Provider: AnalyticsProvider,
  useRefHandler: useAnalyticsRef
} = createRefContext<{
  trackingPixel: HTMLImageElement;
  heatmapCanvas: HTMLCanvasElement;
}>('Analytics');

// 사용자 상호작용 컨텍스트 - 격리된 관심사  
const {
  Provider: InteractionProvider,
  useRefHandler: useInteractionRef
} = createRefContext<{
  clickTarget: HTMLDivElement;
  hoverArea: HTMLDivElement;
}>('Interaction');

// 각 컨텍스트는 자체 라이프사이클과 관심사를 처리
function AnalyticsTracker() {
  const trackingPixel = useAnalyticsRef('trackingPixel');
  const heatmapCanvas = useAnalyticsRef('heatmapCanvas');
  
  // 이 컨텍스트에서 격리된 분석 특화 로직
  useEffect(() => {
    // 다른 컨텍스트에 영향을 주지 않고 분석 설정
  }, []);
  
  return null; // 분석 컴포넌트는 UI가 필요 없음
}
```

## 모범 사례

1. **도메인 분리**: 다양한 UI 관심사를 위해 별도의 RefContext 생성
2. **컨텍스트 격리**: 각 컨텍스트를 특정 기능에 집중
3. **컨텍스트 간 통신**: 조정된 작업을 위해 커스텀 훅 사용
4. **프로바이더 계층**: 논리적 계층으로 프로바이더 구성
5. **성능 격리**: 전용 컨텍스트에서 비용이 많이 드는 작업 격리
6. **타입 안전성**: 각 컨텍스트 도메인을 위해 명확한 ref 타입 정의
7. **메모리 관리**: 각 컨텍스트가 자체 라이프사이클 및 정리 관리