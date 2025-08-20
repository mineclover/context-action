# 타임아웃 보호 패턴

타임아웃 메커니즘으로 무한 대기를 방지하는 패턴입니다.

## 기본 타임아웃 패턴

```typescript
const waitWithTimeout = useCallback(async (elementKey: string, timeout = 5000) => {
  try {
    await Promise.race([
      waitForRefs(elementKey),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
    return true;
  } catch (error) {
    console.warn('요소 사용 불가, 폴백 사용');
    return false;
  }
}, [waitForRefs]);
```

## 재시도가 포함된 고급 타임아웃

```typescript
const waitWithRetry = useCallback(async (
  elementKey: string, 
  maxRetries = 3, 
  timeout = 2000
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await Promise.race([
        waitForRefs(elementKey),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`시도 ${attempt} 타임아웃`)), timeout)
        )
      ]);
      return true;
    } catch (error) {
      console.warn(`시도 ${attempt} 실패:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('모든 시도 실패, 폴백 사용');
        return false;
      }
      
      // 재시도 전 대기
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return false;
}, [waitForRefs]);
```

## 액션 핸들러에서 사용

```typescript
useActionHandler('criticalAction', useCallback(async (payload) => {
  const success = await waitWithTimeout('criticalElement', 3000);
  
  if (!success) {
    // 폴백 전략
    console.warn('중요한 액션에 폴백 사용');
    return { success: false, error: '요소 사용 불가' };
  }
  
  // 정상 작업 진행
  const element = criticalElementRef.target;
  if (element) {
    element.textContent = payload.message;
  }
  
  return { success: true };
}, [waitWithTimeout, criticalElementRef]));
```

## 에러 복구 패턴

```typescript
const robustOperation = useCallback(async () => {
  try {
    // 주 요소 시도
    const primarySuccess = await waitWithTimeout('primaryElement', 2000);
    
    if (primarySuccess) {
      return performPrimaryOperation();
    }
    
    // 보조 요소로 폴백
    const secondarySuccess = await waitWithTimeout('secondaryElement', 2000);
    
    if (secondarySuccess) {
      return performSecondaryOperation();
    }
    
    // 최종 폴백
    return performFallbackOperation();
    
  } catch (error) {
    console.error('모든 작업 실패:', error);
    return null;
  }
}, [waitWithTimeout]);
```