# Conditional Await Pattern

Core behavior of useWaitForRefs that conditionally waits or returns immediately.

## Prerequisites

Before implementing conditional await patterns, ensure you have proper Context-Action framework setup:

### Required Setup Guides
- [Basic Action Setup](../setup/basic-action-setup.md) - For action dispatching and handler registration
- [Basic Store Setup](../setup/basic-store-setup.md) - For state management with store patterns

### Import
```typescript
import { createRefContext } from '@context-action/react';
import { createActionContext, ActionPayloadMap } from '@context-action/react';
import { createStoreContext, useStoreValue } from '@context-action/react';
```

### RefContext Setup
```typescript
// Define UI element references
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

### Action Context Setup
```typescript
// Actions for conditional await operations
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

### Store Setup
```typescript
// State stores for conditional logic
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

### Provider Setup
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

## Basic Pattern

```typescript
function ConditionalAwaitComponent() {
  const waitForRefs = useWaitForRefs();

  const performAction = useCallback(async () => {
    // Will either wait or return immediately
    await waitForRefs('targetElement');

    // Expected behavior:
    // - Unmounted: waits until element is mounted
    // - Mounted: returns immediately
    
    console.log('Element is now guaranteed to be available');
  }, [waitForRefs]);

  return (
    <div>
      <button onClick={performAction}>Perform Action</button>
      <div ref={useUIRef('targetElement')}>Target Element</div>
    </div>
  );
}
```

## Use Cases

### Simple Wait with Action Handler
```typescript
function SimpleWaitComponent() {
  const waitForRefs = useWaitForRefs();
  
  useConditionalHandler('handleClick', useCallback(async () => {
    await waitForRefs('targetElement');
    console.log('Element is now available');
  }, [waitForRefs]));

  const dispatch = useConditionalDispatch();
  
  return (
    <div>
      <button onClick={() => dispatch('handleClick')}>Simple Wait</button>
      <div ref={useUIRef('targetElement')}>Target Element</div>
    </div>
  );
}
```

### Conditional Logic with Store Access
```typescript
function ConditionalLogicComponent() {
  const waitForRefs = useWaitForRefs();
  const appStateStore = useAppStateStore('isReady');
  
  useConditionalHandler('handleAction', useCallback(async () => {
    const currentState = appStateStore.getValue();
    
    if (!currentState) {
      await waitForRefs('targetElement');
    }
    
    // Proceed with action
    console.log('Action completed');
  }, [waitForRefs, appStateStore]));

  const dispatch = useConditionalDispatch();
  
  return (
    <div>
      <button onClick={() => dispatch('handleAction')}>Conditional Action</button>
      <div ref={useUIRef('targetElement')}>Target Element</div>
    </div>
  );
}
```

## Advanced Conditional Patterns

### State-Based Conditional Waiting

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
    
    // Only wait if conditions require it
    if (appNeedsSetup && !userLoggedIn) {
      await waitForRefs('setupModal');
    }
    
    if (userLoggedIn && !dataLoaded) {
      await waitForRefs('dataContainer');
    }
    
    // Proceed with operation
    console.log('Smart wait operation completed');
  }, [waitForRefs, appStateStore, userStateStore, dataLoadedStore]));

  const dispatch = useConditionalDispatch();
  
  return (
    <div>
      <button onClick={() => dispatch('smartWaitHandler')}>Smart Wait</button>
      <div ref={useUIRef('setupModal')}>Setup Modal</div>
      <div ref={useUIRef('dataContainer')}>Data Container</div>
    </div>
  );
}
```

### Feature Flag Conditional Waiting

```typescript
function FeatureFlagComponent() {
  const waitForRefs = useWaitForRefs();
  const featureStore = useFeatureStore('betaUI');
  
  useConditionalHandler('featureBasedWait', useCallback(async () => {
    const betaUIEnabled = featureStore.getValue();
    
    if (betaUIEnabled) {
      // Wait for beta UI elements
      await waitForRefs('betaPanel');
    } else {
      // Wait for standard UI elements
      await waitForRefs('standardPanel');
    }
    
    // Common logic after conditional wait
    console.log('Interface initialized');
  }, [waitForRefs, featureStore]));

  const dispatch = useConditionalDispatch();
  const betaUI = useStoreValue(featureStore);
  
  return (
    <div>
      <button onClick={() => dispatch('featureBasedWait')}>Initialize Interface</button>
      {betaUI ? (
        <div ref={useUIRef('betaPanel')}>Beta Panel</div>
      ) : (
        <div ref={useUIRef('standardPanel')}>Standard Panel</div>
      )}
    </div>
  );
}
```

### Progressive Enhancement Pattern

```typescript
function ProgressiveEnhancementComponent() {
  const waitForRefs = useWaitForRefs();
  const advancedFeaturesStore = useCapabilityStore('hasAdvancedFeatures');
  const animationsStore = useCapabilityStore('hasAnimations');
  
  useConditionalHandler('progressiveWait', useCallback(async () => {
    // Always wait for essential elements
    await waitForRefs('coreInterface');
    
    const hasAdvanced = advancedFeaturesStore.getValue();
    const hasAnimations = animationsStore.getValue();
    
    // Conditionally wait for enhanced features
    if (hasAdvanced) {
      await waitForRefs('advancedControls');
    }
    
    if (hasAnimations) {
      await waitForRefs('animationCanvas');
    }
    
    // Initialize with available features
    console.log('Progressive enhancement completed', { hasAdvanced, hasAnimations });
  }, [waitForRefs, advancedFeaturesStore, animationsStore]));

  const dispatch = useConditionalDispatch();
  const hasAdvanced = useStoreValue(advancedFeaturesStore);
  const hasAnimations = useStoreValue(animationsStore);
  
  return (
    <div>
      <button onClick={() => dispatch('progressiveWait')}>Initialize Progressive</button>
      <div ref={useUIRef('coreInterface')}>Core Interface</div>
      {hasAdvanced && <div ref={useUIRef('advancedControls')}>Advanced Controls</div>}
      {hasAnimations && <canvas ref={useUIRef('animationCanvas')}>Animation Canvas</canvas>}
    </div>
  );
}
```

## Error Handling with Conditional Await

```typescript
function ErrorHandlingComponent() {
  const waitForRefs = useWaitForRefs();
  const authModalRef = useUIRef('authModal');
  
  // Setup config store (simplified for example)
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
          throw new Error('Auth modal not available');
        }
      }
      
      if (config.showWelcome) {
        await waitForRefs('welcomeScreen');
      }
      
      // Continue with main logic
      console.log('Safe conditional wait completed');
      
    } catch (error) {
      console.warn('Conditional wait failed, using fallback:', error);
      // Fallback logic without waiting
      console.log('Fallback mode initialized');
    }
  }, [waitForRefs, config, authModalRef]);
  
  return (
    <div>
      <button onClick={safeConditionalWait}>Safe Wait</button>
      {config.requiresAuth && <dialog ref={authModalRef}>Auth Modal</dialog>}
      {config.showWelcome && <div ref={useUIRef('welcomeScreen')}>Welcome Screen</div>}
    </div>
  );
}
```

## Performance Optimization

### Batch Conditional Waits

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
    
    // Build array of conditional waits
    if (showSidebar) {
      waitPromises.push(waitForRefs('sidebar'));
    }
    
    if (showToolbar) {
      waitPromises.push(waitForRefs('toolbar'));
    }
    
    if (showStatusBar) {
      waitPromises.push(waitForRefs('statusBar'));
    }
    
    // Wait for all required elements in parallel
    if (waitPromises.length > 0) {
      await Promise.all(waitPromises);
    }
    
    // Initialize layout
    console.log('Layout initialized with preferences', {
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
      <button onClick={batchConditionalWait}>Initialize Layout</button>
      {showSidebar && <div ref={useUIRef('sidebar')}>Sidebar</div>}
      {showToolbar && <div ref={useUIRef('toolbar')}>Toolbar</div>}
      {showStatusBar && <div ref={useUIRef('statusBar')}>Status Bar</div>}
    </div>
  );
}
```

## Key Benefits

- **Automatic Detection**: No manual checking required
- **Performance**: Zero delay when element is already mounted
- **Reliability**: Guaranteed element availability after await
- **Flexibility**: Combine with any conditional logic
- **Efficiency**: Only wait when necessary

## Common Patterns

1. **Feature Toggles**: Wait based on enabled features
2. **User Permissions**: Wait based on user capabilities
3. **Device Capabilities**: Wait based on device features
4. **Network State**: Wait based on connectivity
5. **Progressive Loading**: Wait for components as needed