# 중단 메커니즘

중요한 조건이 충족되지 않거나 오류가 발생할 때 파이프라인 실행을 중지합니다.

## 기본 중단

### controller.abort()

선택적 이유와 함께 파이프라인 실행을 즉시 중지:

```typescript
actionRegister.register('authenticate', (payload, controller) => {
  if (!payload.username) {
    controller.abort('사용자명 필수');
    return; // 핸들러 종료, 후속 핸들러는 실행되지 않음
  }
  
  if (!payload.password) {
    controller.abort('비밀번호 필수');
    return;
  }
  
  // 인증 로직 계속
  return { step: 'validation', success: true };
});
```

### 컨텍스트와 함께 중단

상세한 중단 정보를 제공:

```typescript
actionRegister.register('processPayment', async (payload, controller) => {
  const user = await getUserById(payload.userId);
  
  if (!user) {
    controller.abort('사용자를 찾을 수 없음', {
      userId: payload.userId,
      timestamp: Date.now(),
      action: 'processPayment'
    });
    return;
  }
  
  if (user.status === 'suspended') {
    controller.abort('사용자 계정 정지됨', {
      userId: payload.userId,
      suspensionReason: user.suspensionReason,
      suspendedAt: user.suspendedAt
    });
    return;
  }
  
  // 결제 처리
  return { step: 'payment', success: true };
});
```

## 중단 시나리오

### 입력 검증 중단

```typescript
interface DataActions extends ActionPayloadMap {
  processData: { 
    data: any; 
    schema: string;
    options?: ProcessingOptions;
  };
}

actionRegister.register('processData', (payload, controller) => {
  // 필수 필드 검증
  if (!payload.data) {
    controller.abort('데이터 필수');
    return;
  }
  
  if (!payload.schema) {
    controller.abort('스키마 필수');
    return;
  }
  
  // 스키마에 대해 데이터 검증
  const validation = validateSchema(payload.data, payload.schema);
  
  if (!validation.valid) {
    controller.abort('스키마 검증 실패', {
      schema: payload.schema,
      errors: validation.errors,
      data: payload.data
    });
    return;
  }
  
  return { step: 'validation', success: true };
}, { priority: 100, id: 'validator' });
```

### 보안 중단

```typescript
actionRegister.register('sensitiveOperation', async (payload, controller) => {
  // 사용자 권한 확인
  const user = await getCurrentUser();
  
  if (!user) {
    controller.abort('인증 필요');
    return;
  }
  
  if (!user.permissions.includes('sensitive_operations')) {
    controller.abort('권한 부족', {
      userId: user.id,
      requiredPermission: 'sensitive_operations',
      userPermissions: user.permissions
    });
    return;
  }
  
  // 속도 제한 확인
  const rateLimiter = getRateLimiter(user.id);
  
  if (!rateLimiter.isAllowed()) {
    controller.abort('속도 제한 초과', {
      userId: user.id,
      limit: rateLimiter.getLimit(),
      resetTime: rateLimiter.getResetTime()
    });
    return;
  }
  
  // 민감한 작업 진행
  return { step: 'security-cleared', userId: user.id };
}, { priority: 100, id: 'security-guard' });
```

### 비즈니스 로직 중단

```typescript
actionRegister.register('placeOrder', async (payload, controller) => {
  const { items, userId } = payload;
  
  // 재고 가용성 확인
  for (const item of items) {
    const inventory = await getInventory(item.productId);
    
    if (inventory.quantity < item.quantity) {
      controller.abort('재고 부족', {
        productId: item.productId,
        requested: item.quantity,
        available: inventory.quantity
      });
      return;
    }
  }
  
  // 사용자 신용 한도 확인
  const user = await getUser(userId);
  const orderTotal = calculateTotal(items);
  
  if (orderTotal > user.creditLimit) {
    controller.abort('신용 한도 초과', {
      userId,
      orderTotal,
      creditLimit: user.creditLimit,
      deficit: orderTotal - user.creditLimit
    });
    return;
  }
  
  return { step: 'business-validation', orderTotal, approved: true };
}, { priority: 90, id: 'business-validator' });
```

## 중단 결과 처리

### 중단된 디스패치 처리

```typescript
const result = await actionRegister.dispatchWithResult('processData', 
  { data: 'invalid-data' },
  { result: { collect: true } }
);

if (result.aborted) {
  console.log('파이프라인이 중단되었습니다');
  console.log('이유:', result.abortReason);
  console.log('중단한 핸들러:', result.abortedBy);
  console.log('중단 전 결과:', result.results);
  
  // 다양한 중단 시나리오 처리
  switch (result.abortReason) {
    case '사용자명 필수':
      showValidationError('사용자명을 입력하세요');
      break;
      
    case '속도 제한 초과':
      showRateLimitError('요청이 너무 많습니다. 나중에 다시 시도하세요');
      break;
      
    case '권한 부족':
      redirectToLogin();
      break;
      
    default:
      showGenericError('작업 실패');
  }
}
```

### 중단과 함께하는 React 오류 경계

```typescript
function SafeActionComponent() {
  const { dispatchWithResult } = useActionDispatchWithResult();
  const [error, setError] = useState<string | null>(null);
  
  const handleSafeAction = async () => {
    setError(null);
    
    try {
      const result = await dispatchWithResult('sensitiveAction', 
        { data: 'user-input' },
        { result: { collect: true } }
      );
      
      if (result.aborted) {
        setError(result.abortReason);
        return;
      }
      
      if (result.success) {
        setError(null);
        // 성공 처리
      }
      
    } catch (error) {
      setError('예상치 못한 오류 발생');
      console.error(error);
    }
  };
  
  return (
    <div>
      <button onClick={handleSafeAction}>안전한 액션</button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

## 중단 vs 오류 던지기

### 중단 사용

- ✅ 비즈니스 로직 위반
- ✅ 검증 실패
- ✅ 권한 거부
- ✅ 속도 제한
- ✅ 우아한 작업 종료

### 오류 던지기 사용

- ❌ 예상치 못한 시스템 오류
- ❌ 네트워크 실패
- ❌ 프로그래밍 오류
- ❌ 인프라 문제

```typescript
// ✅ 좋음 - 비즈니스 로직을 위한 중단
actionRegister.register('transfer', (payload, controller) => {
  if (payload.amount > user.balance) {
    controller.abort('잔액 부족'); // 비즈니스 규칙 위반
    return;
  }
});

// ❌ 피해야 할 것 - 비즈니스 로직을 위한 던지기
actionRegister.register('transfer', (payload) => {
  if (payload.amount > user.balance) {
    throw new Error('잔액 부족'); // 대신 abort를 사용해야 함
  }
});

// ✅ 좋음 - 시스템 오류를 위한 던지기
actionRegister.register('transfer', async (payload) => {
  try {
    await processTransfer(payload);
  } catch (error) {
    // 네트워크 또는 시스템 오류 - 던지기
    throw error;
  }
});
```

## 조기 중단 패턴

### 가드 핸들러

```typescript
// 조기 중단하는 높은 우선순위 가드
actionRegister.register('secureOperation', (payload, controller) => {
  const user = getCurrentUser();
  
  // 사용자가 없으면 조기 중단
  if (!user) {
    controller.abort('인증 필요');
    return;
  }
  
  // 권한이 부족하면 조기 중단
  if (!hasPermission(user, 'secure_operations')) {
    controller.abort('접근 거부');
    return;
  }
  
  // 후속 핸들러를 위한 사용자 컨텍스트 설정
  controller.modifyPayload(current => ({
    ...current,
    user: { id: user.id, permissions: user.permissions }
  }));
  
  return { step: 'authorization', authorized: true };
}, { priority: 100, id: 'auth-guard' });

// 이 핸들러는 가드가 통과할 때만 실행됨
actionRegister.register('secureOperation', async (payload) => {
  // payload.user가 존재함이 보장됨
  const result = await performSecureOperation(payload.data, payload.user);
  return { step: 'operation', result };
}, { priority: 80, id: 'operator' });
```

### 검증 체인

```typescript
// 어느 단계에서든 중단할 수 있는 검증 핸들러 체인
actionRegister.register('submitForm', (payload, controller) => {
  if (!payload.formData) {
    controller.abort('양식 데이터 필수');
    return;
  }
  return { step: 'presence-validation', success: true };
}, { priority: 100, id: 'presence-validator' });

actionRegister.register('submitForm', (payload, controller) => {
  const validation = validateFormSchema(payload.formData);
  if (!validation.valid) {
    controller.abort('유효하지 않은 양식 데이터', validation.errors);
    return;
  }
  return { step: 'schema-validation', success: true };
}, { priority: 90, id: 'schema-validator' });

actionRegister.register('submitForm', async (payload, controller) => {
  const businessValidation = await validateBusinessRules(payload.formData);
  if (!businessValidation.valid) {
    controller.abort('비즈니스 규칙 위반', businessValidation.violations);
    return;
  }
  return { step: 'business-validation', success: true };
}, { priority: 80, id: 'business-validator' });

// 모든 검증이 통과한 경우에만 실행
actionRegister.register('submitForm', async (payload) => {
  const result = await saveFormData(payload.formData);
  return { step: 'save', success: true, id: result.id };
}, { priority: 70, id: 'saver' });
```

## 실제 예제: 중단 가능한 검색

[향상된 중단 가능한 검색 데모](https://mineclover.github.io/context-action/example/examples/enhanced-search)에서 포괄적인 중단 구현을 확인하세요:

```typescript
// 새 쿼리에서 자동 중단이 있는 검색 핸들러
const handleSearch = async (searchQuery: string) => {
  // 이전 검색을 취소하기 위해 중단 범위 재설정
  resetAbortScope();
  
  try {
    const result = await dispatchWithResult('search', { query: searchQuery });
    
    if (result.aborted) {
      console.log('검색 취소됨:', searchQuery);
    } else {
      setResults(result.result || []);
    }
  } catch (err) {
    setError(err.message);
  }
};
```

이 예제는 실제 검색 시나리오에서 자동 검색 취소, 컴포넌트 언마운트 정리, 우아한 중단 처리를 보여줍니다.

## 관련 문서

- **[우선순위 시스템](./priority.md)** - 우선순위 기반 실행 순서  
- **[차단 작업](./blocking.md)** - 실행 플로우 제어
- **[결과 처리](./result-handling.md)** - 중단 정보 수집과 사용
- **[디스패치 메서드](./dispatch.md)** - 중단된 디스패치 처리