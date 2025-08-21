# 대기 후 실행 패턴

요소 가용성을 보장한 후 안전하게 DOM 조작을 실행하는 패턴입니다.

## 기본 패턴

```typescript
const actionHandler = useCallback(async () => {
  await waitForRefs('targetElement');
  
  const element = elementRef.target;
  if (element) {
    // 안전한 DOM 조작
    element.style.transform = 'scale(1.1)';
    element.focus();
  }
}, [waitForRefs, elementRef]);
```

## 고급 예제

```typescript
const animateElement = useCallback(async () => {
  // 요소가 사용 가능할 때까지 대기
  await waitForRefs('animationTarget');
  
  const element = animationTargetRef.target;
  if (!element) return;
  
  // 애니메이션 시퀀스 적용
  element.style.transition = 'all 0.3s ease';
  element.style.transform = 'scale(1.2)';
  
  // 애니메이션 후 리셋
  setTimeout(() => {
    element.style.transform = 'scale(1)';
  }, 300);
}, [waitForRefs, animationTargetRef]);
```

## 액션 핸들러와 함께

```typescript
useActionHandler('performAction', useCallback(async (payload) => {
  await waitForRefs('workArea');
  
  const workArea = workAreaRef.target;
  if (workArea) {
    // 안전한 DOM 조작
    workArea.innerHTML = payload.content;
    workArea.scrollIntoView();
  }
}, [waitForRefs, workAreaRef]));
```