# Wait-Then-Execute Pattern

Pattern for safely executing DOM operations after ensuring element availability.

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

## With Action Handlers

```typescript
useActionHandler('performAction', useCallback(async (payload) => {
  await waitForRefs('workArea');
  
  const workArea = workAreaRef.target;
  if (workArea) {
    // Safe to manipulate DOM
    workArea.innerHTML = payload.content;
    workArea.scrollIntoView();
  }
}, [waitForRefs, workAreaRef]));
```

## Multi-Element Coordination

```typescript
const coordinateElements = useCallback(async () => {
  // Wait for multiple elements
  await Promise.all([
    waitForRefs('sourceElement'),
    waitForRefs('targetElement')
  ]);
  
  const source = sourceElementRef.target;
  const target = targetElementRef.target;
  
  if (source && target) {
    // Safe to coordinate between elements
    const sourceData = source.dataset.value;
    target.textContent = `Received: ${sourceData}`;
  }
}, [waitForRefs, sourceElementRef, targetElementRef]);
```

## Sequential Operations

```typescript
const sequentialOperations = useCallback(async () => {
  // Step 1: Wait and setup
  await waitForRefs('setupElement');
  const setupEl = setupElementRef.target;
  if (setupEl) {
    setupEl.classList.add('preparing');
  }
  
  // Step 2: Wait for next element
  await waitForRefs('processElement');
  const processEl = processElementRef.target;
  if (processEl) {
    processEl.classList.add('active');
  }
  
  // Step 3: Final element
  await waitForRefs('completeElement');
  const completeEl = completeElementRef.target;
  if (completeEl) {
    completeEl.classList.add('done');
  }
}, [waitForRefs, setupElementRef, processElementRef, completeElementRef]);
```

## Best Practices

1. **Always Check Element**: Verify element exists after waiting
2. **Graceful Degradation**: Handle cases where elements don't mount
3. **Cleanup**: Remove event listeners and clear timeouts
4. **Performance**: Use hardware-accelerated properties when possible

## Common Use Cases

- **Form Validation**: Wait for form elements before validation
- **Animation Sequences**: Coordinate animations across multiple elements
- **Data Visualization**: Wait for canvas/SVG elements before rendering
- **Modal Operations**: Ensure modal is mounted before focusing inputs
- **Drag & Drop**: Wait for drop zones before enabling drag operations