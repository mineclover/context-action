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