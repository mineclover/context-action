# 조건부 대기 패턴

useWaitForRefs의 핵심 동작으로 조건부로 대기하거나 즉시 반환하는 패턴입니다.

## 기본 패턴

```typescript
const waitForRefs = useWaitForRefs();

// 대기하거나 즉시 반환
await waitForRefs('targetElement');

// 예상 동작:
// - 언마운트: 요소가 마운트될 때까지 대기
// - 마운트: 즉시 반환
```

## 사용 사례

### 단순 대기
```typescript
const handleClick = useCallback(async () => {
  await waitForRefs('targetElement');
  console.log('요소를 이제 사용할 수 있습니다');
}, [waitForRefs]);
```

### 조건부 로직
```typescript
const handleAction = useCallback(async () => {
  const currentState = stateStore.getValue();
  
  if (!currentState.isReady) {
    await waitForRefs('readyElement');
  }
  
  // 액션 진행
}, [waitForRefs, stateStore]);
```

## 주요 이점

- **자동 감지**: 수동 확인 불필요
- **성능**: 요소가 이미 마운트된 경우 지연 없음
- **안정성**: await 후 요소 가용성 보장