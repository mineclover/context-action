# Wait-Then-Execute Pattern

Pattern for safely executing DOM operations after ensuring element availability.

## Prerequisites

**Required Setup**: For complete RefContext setup instructions including type definitions, DOM element refs, and provider configuration, see **[RefContext Setup](../setup/ref-context-setup.md)**.

This pattern demonstrates DOM waiting strategies using the setup patterns:
- **Type definitions** → [DOM Element Refs](../setup/ref-context-setup.md#dom-element-refs)
- **Context creation** → [Basic RefContext Setup](../setup/ref-context-setup.md#basic-refcontext-setup)
- **Provider setup** → [Provider Setup Patterns](../setup/ref-context-setup.md#provider-setup-patterns)
- **Advanced usage** → [Waiting for Multiple Refs](../setup/ref-context-setup.md#waiting-for-multiple-refs)

For Store and Action integration, see:
- **[Basic Store Setup](../setup/basic-store-setup.md)** - Store context for state management
- **[Basic Action Setup](../setup/basic-action-setup.md)** - Action context for business logic

## Basic Pattern

```typescript
const actionHandler = useCallback(async () => {
  await waitForRefs('targetElement');
  
  const element = elementRef.target;
  if (element) {
    // Safe DOM manipulation
    element.style.transform = 'scale(1.1)';
    element.focus();
  }
}, [waitForRefs, elementRef]);
```

## Advanced Example

```typescript
const animateElement = useCallback(async () => {
  // Wait for element to be available
  await waitForRefs('animationTarget');
  
  const element = animationTargetRef.target;
  if (!element) return;
  
  // Apply animation sequence
  element.style.transition = 'all 0.3s ease';
  element.style.transform = 'scale(1.2)';
  
  // Reset after animation
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 300);
}, [waitForRefs, animationTargetRef]);
```

## Store Integration Pattern

```typescript
// Store update after DOM operation
const updateContentAction = useCallback(async (payload: { content: string }) => {
  // 1. Wait for DOM element
  await waitForRefs('contentArea');
  
  const element = contentAreaRef.target;
  if (element) {
    // 2. Perform DOM operation
    element.innerHTML = payload.content;
    element.scrollIntoView({ behavior: 'smooth' });
    
    // 3. Update store with operation result
    const contentStore = stores.getStore('content');
    contentStore.setValue({
      content: payload.content,
      lastUpdated: new Date().toISOString(),
      isVisible: true
    });
  }
}, [waitForRefs, contentAreaRef, stores]);
```

## Action Handler Integration

```typescript
// Complete Action + Store + Ref integration
useActionHandler('performAction', useCallback(async (payload: { content: string }) => {
  // Wait for required DOM elements
  await waitForRefs('workArea');
  
  const workArea = workAreaRef.target;
  if (workArea) {
    // Safe DOM manipulation
    workArea.innerHTML = payload.content;
    workArea.scrollIntoView();
    
    // Update related stores
    const statusStore = stores.getStore('status');
    statusStore.setValue('content-updated');
  }
}, [waitForRefs, workAreaRef, stores]));
```

## Multi-Element Coordination

```typescript
const coordinateElements = useCallback(async () => {
  // Wait for multiple elements using setup pattern
  const elements = await waitForRefs('sourceElement', 'targetElement', 'statusElement');
  
  const { sourceElement, targetElement, statusElement } = elements;
  
  if (sourceElement && targetElement && statusElement) {
    // Safe to coordinate between elements
    const sourceData = sourceElement.dataset.value;
    targetElement.textContent = `Received: ${sourceData}`;
    statusElement.classList.add('success');
    
    // Update coordination state
    const coordinationStore = stores.getStore('coordination');
    coordinationStore.setValue({
      sourceValue: sourceData,
      targetUpdated: true,
      timestamp: Date.now()
    });
  }
}, [waitForRefs, stores]);
```

## Sequential Operations

```typescript
const sequentialOperations = useCallback(async () => {
  const progressStore = stores.getStore('progress');
  
  try {
    // Step 1: Wait and setup
    await waitForRefs('setupElement');
    const setupEl = setupElementRef.target;
    if (setupEl) {
      setupEl.classList.add('preparing');
      progressStore.setValue({ step: 1, status: 'preparing' });
    }
    
    // Step 2: Wait for next element
    await waitForRefs('processElement');
    const processEl = processElementRef.target;
    if (processEl) {
      processEl.classList.add('active');
      progressStore.setValue({ step: 2, status: 'processing' });
    }
    
    // Step 3: Final element
    await waitForRefs('completeElement');
    const completeEl = completeElementRef.target;
    if (completeEl) {
      completeEl.classList.add('done');
      progressStore.setValue({ step: 3, status: 'completed' });
    }
  } catch (error) {
    progressStore.setValue({ step: -1, status: 'error', error: error.message });
    console.error('Sequential operations failed:', error);
  }
}, [waitForRefs, stores]);
```

## Best Practices

1. **Always Check Element**: Verify element exists after waiting (follows RefContext setup patterns)
2. **Store Integration**: Update stores to reflect DOM operation results
3. **Error Handling**: Implement try-catch blocks and store error states
4. **Performance**: Use hardware-accelerated properties and batch store updates
5. **Cleanup**: Proper cleanup handled by RefContext lifecycle management
6. **Type Safety**: Use setup guide type definitions for all refs

## Setup Integration Examples

### Form Validation with Store Updates
```typescript
const validateForm = useCallback(async () => {
  await waitForRefs('formElement');
  const form = formElementRef.target;
  
  if (form) {
    const isValid = validateFormData(form);
    const validationStore = stores.getStore('validation');
    validationStore.setValue({ isValid, errors: getErrors(form) });
  }
}, [waitForRefs, stores]);
```

### Canvas Rendering with Progress Tracking
```typescript
const renderChart = useCallback(async (data: ChartData) => {
  await waitForRefs('chartCanvas');
  const canvas = chartCanvasRef.target;
  
  if (canvas) {
    const ctx = canvas.getContext('2d')!;
    // Render chart
    drawChart(ctx, data);
    
    // Update render status
    const chartStore = stores.getStore('chart');
    chartStore.setValue({ rendered: true, data, timestamp: Date.now() });
  }
}, [waitForRefs, stores]);
```

## Common Use Cases

- **Form Validation**: Wait for form elements + store validation state
- **Animation Sequences**: Coordinate animations + track animation progress in stores  
- **Data Visualization**: Wait for canvas/SVG + store render status and data
- **Modal Operations**: Ensure modal is mounted + manage modal state in stores
- **Drag & Drop**: Wait for drop zones + track drag operation state

## Related Patterns

- **[RefContext Setup](../setup/ref-context-setup.md#waiting-for-multiple-refs)** - Complete waiting patterns
- **[Canvas Optimization](../ref/canvas-optimization.md)** - High-performance canvas operations
- **[Store Integration Patterns](../store/basic-usage.md)** - Store updates after DOM operations