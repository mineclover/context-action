# Multi-Context RefContext Architecture

Multiple RefContext composition for complex applications with separated concerns.

## Overview

Multi-RefContext architecture allows you to separate different types of DOM manipulations into isolated contexts, providing better organization and performance for complex applications.

## Basic Multi-Context Setup

```tsx
// Separate concerns with multiple RefContexts
const {
  Provider: VisualEffectsProvider,
  useRefHandler: useVisualEffectsRef
} = createRefContext<{
  clickEffects: HTMLDivElement;
  pathSvg: SVGSVGElement;
}>('VisualEffects');

const {
  Provider: PerformanceProvider,
  useRefHandler: usePerformanceRef
} = createRefContext<{
  fpsDisplay: HTMLDivElement;
  metricsPanel: HTMLDivElement;
}>('Performance');

// Compose multiple RefContexts
function ComplexMouseApp() {
  return (
    <MouseProvider>
      <VisualEffectsProvider>
        <PerformanceProvider>
          <MouseTracker />
          <VisualEffects />
          <PerformanceMetrics />
        </PerformanceProvider>
      </VisualEffectsProvider>
    </MouseProvider>
  );
}
```

## Domain Separation Pattern

```tsx
// UI Layout Context
const {
  Provider: LayoutProvider,
  useRefHandler: useLayoutRef
} = createRefContext<{
  header: HTMLHeaderElement;
  sidebar: HTMLAsideElement;
  mainContent: HTMLMainElement;
  footer: HTMLFooterElement;
}>('Layout');

// Interactive Elements Context
const {
  Provider: InteractiveProvider,
  useRefHandler: useInteractiveRef
} = createRefContext<{
  dragHandle: HTMLDivElement;
  resizeHandle: HTMLDivElement;
  scrollArea: HTMLDivElement;
}>('Interactive');

// Animation Context
const {
  Provider: AnimationProvider,
  useRefHandler: useAnimationRef
} = createRefContext<{
  particle: HTMLDivElement;
  trail: HTMLCanvasElement;
  overlay: HTMLDivElement;
}>('Animation');
```

## Cross-Context Communication

```tsx
// Custom hook for coordinating between contexts
function useLayoutController() {
  const sidebar = useLayoutRef('sidebar');
  const mainContent = useLayoutRef('mainContent');
  const dragHandle = useInteractiveRef('dragHandle');
  
  const toggleSidebar = useCallback(() => {
    if (!sidebar.target || !mainContent.target) return;
    
    const isCollapsed = sidebar.target.style.width === '0px';
    const newWidth = isCollapsed ? '250px' : '0px';
    const newMargin = isCollapsed ? '250px' : '0px';
    
    // Coordinate multiple refs without re-renders
    sidebar.target.style.width = newWidth;
    sidebar.target.style.transform = `translateX(${isCollapsed ? '0' : '-100%'})`;
    mainContent.target.style.marginLeft = newMargin;
    
    // Update drag handle position
    if (dragHandle.target) {
      dragHandle.target.style.left = newWidth;
    }
  }, [sidebar, mainContent, dragHandle]);
  
  return { toggleSidebar };
}
```

## Hierarchical Context Pattern

```tsx
// Parent context for global UI elements
const {
  Provider: GlobalUIProvider,
  useRefHandler: useGlobalUIRef
} = createRefContext<{
  root: HTMLDivElement;
  overlay: HTMLDivElement;
  tooltip: HTMLDivElement;
}>('GlobalUI');

// Child context for specific features
const {
  Provider: FeatureProvider,
  useRefHandler: useFeatureRef
} = createRefContext<{
  featureContainer: HTMLDivElement;
  actionButton: HTMLButtonElement;
  statusIndicator: HTMLSpanElement;
}>('Feature');

// Nested Provider hierarchy
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

## Context Isolation Benefits

```tsx
// Analytics tracking context - isolated concern
const {
  Provider: AnalyticsProvider,
  useRefHandler: useAnalyticsRef
} = createRefContext<{
  trackingPixel: HTMLImageElement;
  heatmapCanvas: HTMLCanvasElement;
}>('Analytics');

// User interaction context - isolated concern  
const {
  Provider: InteractionProvider,
  useRefHandler: useInteractionRef
} = createRefContext<{
  clickTarget: HTMLDivElement;
  hoverArea: HTMLDivElement;
}>('Interaction');

// Each context handles its own lifecycle and concerns
function AnalyticsTracker() {
  const trackingPixel = useAnalyticsRef('trackingPixel');
  const heatmapCanvas = useAnalyticsRef('heatmapCanvas');
  
  // Analytics-specific logic isolated in this context
  useEffect(() => {
    // Setup analytics without affecting other contexts
  }, []);
  
  return null; // Analytics components don't need UI
}
```

## Best Practices

1. **Domain Separation**: Create separate RefContexts for different UI concerns
2. **Context Isolation**: Keep each context focused on specific functionality
3. **Cross-Context Communication**: Use custom hooks for coordinated operations
4. **Provider Hierarchy**: Organize providers in logical hierarchy
5. **Performance Isolation**: Isolate expensive operations in dedicated contexts
6. **Type Safety**: Define clear ref types for each context domain
7. **Memory Management**: Each context manages its own lifecycle and cleanup