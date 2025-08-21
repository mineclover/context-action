# Conditional Await Pattern

Core behavior of useWaitForRefs that conditionally waits or returns immediately.

## Basic Pattern

```typescript
const waitForRefs = useWaitForRefs();

// Will either wait or return immediately
await waitForRefs('targetElement');

// Expected behavior:
// - Unmounted: waits until element is mounted
// - Mounted: returns immediately
```

## Use Cases

### Simple Wait
```typescript
const handleClick = useCallback(async () => {
  await waitForRefs('targetElement');
  console.log('Element is now available');
}, [waitForRefs]);
```

### Conditional Logic
```typescript
const handleAction = useCallback(async () => {
  const currentState = stateStore.getValue();
  
  if (!currentState.isReady) {
    await waitForRefs('readyElement');
  }
  
  // Proceed with action
}, [waitForRefs, stateStore]);
```

## Advanced Conditional Patterns

### State-Based Conditional Waiting

```typescript
const smartWaitHandler = useCallback(async () => {
  const appState = appStateStore.getValue();
  const userState = userStateStore.getValue();
  
  // Only wait if conditions require it
  if (appState.needsSetup && !userState.isLoggedIn) {
    await waitForRefs('setupModal');
  }
  
  if (userState.isLoggedIn && !appState.dataLoaded) {
    await waitForRefs('dataContainer');
  }
  
  // Proceed with operation
  performOperation();
}, [waitForRefs, appStateStore, userStateStore]);
```

### Feature Flag Conditional Waiting

```typescript
const featureBasedWait = useCallback(async () => {
  const features = featureStore.getValue();
  
  if (features.betaUI) {
    // Wait for beta UI elements
    await waitForRefs('betaPanel');
  } else {
    // Wait for standard UI elements
    await waitForRefs('standardPanel');
  }
  
  // Common logic after conditional wait
  initializeInterface();
}, [waitForRefs, featureStore]);
```

### Progressive Enhancement Pattern

```typescript
const progressiveWait = useCallback(async () => {
  // Always wait for essential elements
  await waitForRefs('coreInterface');
  
  const capabilities = capabilityStore.getValue();
  
  // Conditionally wait for enhanced features
  if (capabilities.hasAdvancedFeatures) {
    await waitForRefs('advancedControls');
  }
  
  if (capabilities.hasAnimations) {
    await waitForRefs('animationCanvas');
  }
  
  // Initialize with available features
  initializeWithCapabilities(capabilities);
}, [waitForRefs, capabilityStore]);
```

## Error Handling with Conditional Await

```typescript
const safeConditionalWait = useCallback(async () => {
  const config = configStore.getValue();
  
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
    
  } catch (error) {
    console.warn('Conditional wait failed, using fallback:', error);
    // Fallback logic without waiting
    initializeFallbackMode();
  }
}, [waitForRefs, configStore, authModalRef]);
```

## Performance Optimization

### Batch Conditional Waits

```typescript
const batchConditionalWait = useCallback(async () => {
  const preferences = preferencesStore.getValue();
  const waitPromises: Promise<void>[] = [];
  
  // Build array of conditional waits
  if (preferences.showSidebar) {
    waitPromises.push(waitForRefs('sidebar'));
  }
  
  if (preferences.showToolbar) {
    waitPromises.push(waitForRefs('toolbar'));
  }
  
  if (preferences.showStatusBar) {
    waitPromises.push(waitForRefs('statusBar'));
  }
  
  // Wait for all required elements in parallel
  if (waitPromises.length > 0) {
    await Promise.all(waitPromises);
  }
  
  // Initialize layout
  initializeLayout(preferences);
}, [waitForRefs, preferencesStore]);
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