# 파이프라인 플로우 제어

동적 파이프라인 관리와 조건부 실행 경로를 가능하게 하는 Context-Action 파이프라인 실행을 위한 고급 플로우 제어 메커니즘.

## 개요

파이프라인 플로우 제어는 핸들러의 정상적인 순차 실행을 변경하는 정교한 메커니즘을 제공합니다. 이러한 기능은 복잡한 비즈니스 로직 패턴, 조건부 처리 및 조기 종료 시나리오를 가능하게 합니다.

## 🔀 우선순위 점프

런타임 조건에 따라 파이프라인 실행을 특정 우선순위 레벨로 동적으로 리디렉션합니다.

### 기본 우선순위 점프

```typescript
interface SecurityActions extends ActionPayloadMap {
  processRequest: { 
    userId: string; 
    action: string; 
    requiresElevation?: boolean;
  };
}

const securityRegister = new ActionRegister<SecurityActions>();

// 일반 처리 핸들러 (우선순위 50)
securityRegister.register('processRequest', async (payload, controller) => {
  console.log('🔍 초기 보안 검사...');
  
  if (payload.requiresElevation) {
    // 높은 우선순위 보안 핸들러로 점프
    controller.jumpToPriority(1000);
    console.log('⚡ 상승된 보안 파이프라인으로 점프');
    return;
  }
  
  // 일반 처리 계속
  return { level: 'standard', processed: true };
}, { priority: 50, id: 'standard-security' });

// 상승된 보안 핸들러 (우선순위 1000)
securityRegister.register('processRequest', async (payload, controller) => {
  console.log('🛡️ 상승된 보안 처리...');
  
  // 추가 보안 검사 수행
  const securityResult = await performElevatedSecurityCheck(payload.userId);
  
  if (!securityResult.authorized) {
    controller.abort('상승된 보안 검사 실패');
    return;
  }
  
  return { level: 'elevated', authorized: true, securityToken: securityResult.token };
}, { priority: 1000, id: 'elevated-security' });
```

### 우선순위 점프 사용 사례

**보안 에스컬레이션**
- 표준 인증 → 상승된 보안 검사
- 기본 검증 → 포괄적 검증
- 일반 처리 → 관리자 승인

**오류 처리**
- 일반 플로우 → 오류 복구 핸들러
- 재시도 로직 → 폴백 메커니즘
- 데이터 검증 → 오류 보고

**비즈니스 로직 분기**
- 표준 워크플로우 → 프리미엄 사용자 플로우
- 기본 기능 → 고급 기능
- 기본 처리 → 사용자 정의 처리

## 🚪 결과와 함께 조기 반환

결과를 후속 프로세스에 제공하면서 파이프라인 실행을 조기에 종료합니다.

### 캐시 우선 패턴

```typescript
interface CacheActions extends ActionPayloadMap {
  fetchData: { key: string; fallbackUrl?: string };
}

const cacheRegister = new ActionRegister<CacheActions>();

// 캐시 확인 핸들러 (우선순위 100)
cacheRegister.register('fetchData', async (payload, controller) => {
  console.log(`🔍 키에 대한 캐시 확인: ${payload.key}`);
  
  const cached = await checkCache(payload.key);
  
  if (cached) {
    console.log('✅ 캐시 히트! 조기 반환.');
    // 조기 반환하고 남은 핸들러 건너뛰기
    controller.return({ 
      source: 'cache', 
      data: cached, 
      timestamp: Date.now() 
    });
    return;
  }
  
  console.log('❌ 캐시 미스, 페치 계속...');
}, { priority: 100, id: 'cache-checker' });

// API 페치 핸들러 (우선순위 80) - 캐시 미스시에만 실행
cacheRegister.register('fetchData', async (payload, controller) => {
  console.log(`🌐 API에서 페치: ${payload.fallbackUrl}`);
  
  const apiData = await fetchFromAPI(payload.fallbackUrl || `/api/data/${payload.key}`);
  
  // 향후 요청을 위해 결과 캐시
  await setCache(payload.key, apiData, { ttl: 3600 });
  
  return { 
    source: 'api', 
    data: apiData, 
    timestamp: Date.now() 
  };
}, { priority: 80, id: 'api-fetcher' });
```

### 조기 반환 패턴

**성능 최적화**
- 캐시 히트는 비용이 많이 드는 작업을 우회
- 빠른 검증 실패는 불필요한 처리를 방지
- 불린 연산을 위한 단축 평가

**보안 게이팅**
- 인증 실패는 추가 처리를 중지
- 권한 검사는 무단 액세스를 방지
- 속도 제한은 과도한 요청을 차단

**비즈니스 규칙**
- 기능 플래그는 기능을 비활성화
- 사용자 선호도는 기본값을 재정의
- 구성 설정이 동작을 제어

## 🔄 파이프라인 제어 메서드

### 사용 가능한 컨트롤러 메서드

```typescript
interface PipelineController<TPayload, TResult> {
  // 플로우 제어
  jumpToPriority(priority: number): void;
  return(result: TResult): void;
  abort(reason?: string): void;
  
  // 페이로드 관리
  modifyPayload(modifier: (payload: TPayload) => TPayload): void;
  getPayload(): TPayload;
  
  // 결과 관리
  setResult(result: TResult): void;
  getResults(): TResult[];
  mergeResult(merger: (previousResults: TResult[], currentResult: TResult) => TResult): void;
}
```

### 메서드 조합

**조건부 처리**
```typescript
register('processOrder', async (payload, controller) => {
  if (payload.priority === 'urgent') {
    controller.jumpToPriority(1000); // 긴급 핸들러로 건너뛰기
    return;
  }
  
  if (payload.amount > 10000) {
    controller.return({ requiresApproval: true }); // 승인을 위한 조기 반환
    return;
  }
  
  // 일반 처리 계속
  return processStandardOrder(payload);
});
```

**오류 복구**
```typescript
register('apiCall', async (payload, controller) => {
  try {
    const result = await makeApiCall(payload);
    controller.setResult(result);
  } catch (error) {
    if (error.code === 'RATE_LIMIT') {
      controller.jumpToPriority(10); // 재시도 핸들러로 점프
    } else {
      controller.abort(`API 호출 실패: ${error.message}`);
    }
  }
});
```

## 🧪 실제 예제

### 우선순위 성능 데모

포괄적인 우선순위 점프 구현을 실제로 확인하세요:

**[→ 우선순위 성능 데모](https://mineclover.github.io/context-action/example/actionguard/priority-performance)**

이 데모는 다음을 보여줍니다:
- 여러 테스트 인스턴스를 사용한 우선순위 기반 핸들러 실행
- 우선순위 변경의 실시간 성능 모니터링
- 시스템 조건에 따른 동적 우선순위 조정
- 우선순위 중단이 있는 복잡한 파이프라인 시나리오

### 고급 핵심 기능

오류 처리 및 파이프라인 중단을 탐색하세요:

**[→ 핵심 고급 데모](https://mineclover.github.io/context-action/example/core/advanced)**

보여주는 기능:
- 조기 종료를 위한 `controller.abort()` 사용법
- 오류 처리 패턴
- 파이프라인 중단 시나리오

### 대화형 플로우 제어 플레이그라운드

실시간 시각화로 고급 플로우 제어 패턴을 경험하세요:

**[→ 플로우 제어 플레이그라운드](https://mineclover.github.io/context-action/example/pipeline/flow-control)**

이 포괄적인 플레이그라운드는 다음을 보여줍니다:

#### 🔒 보안 에스컬레이션 시나리오
- 자동 에스컬레이션 탐지가 있는 표준 보안 검사
- 표준(우선순위 50)에서 상승된(우선순위 1000) 보안으로 우선순위 점프
- 파이프라인 중단 메커니즘이 있는 인증 실패
- 실시간 보안 토큰 생성 및 검증

#### 🗄️ 캐시 최적화 패턴  
- 다중 계층 캐싱 시스템 (메모리 → Redis → 데이터베이스)
- 캐시 히트 발생시 조기 반환 최적화
- 데이터베이스 폴백을 테스트하기 위한 캐시 무효화 시나리오
- 캐시 히트율의 성능 모니터링

#### 🏢 업무 시간 라우팅 로직
- 업무 시간에 따른 동적 우선순위 조정
- 고객 등급 처리 (표준 → 프리미엄 → 엔터프라이즈)
- 고가치 처리 경로를 트리거하는 주문 가치 임계값
- 국제 대 국내 주문 라우팅

#### 🔄 오류 복구 메커니즘
- 자동 재시도 로직이 있는 API 실패 시뮬레이션
- 우선순위 점프가 있는 점진적 백오프 전략
- 폴백 활성화가 있는 최대 재시도 한도 처리
- 실시간 실행 경로 시각화

#### 🎛️ 대화형 제어
- 핸들러 성능에 영향을 주는 시스템 로드 시뮬레이션
- 시간에 민감한 라우팅을 테스트하기 위한 업무 시간 토글
- 콜드 스타트 시나리오를 테스트하기 위한 캐시 정리
- 핸들러 실행 횟수에 대한 실시간 메트릭 표시

#### 📊 실행 시각화
- 핸들러 시퀀스를 보여주는 실시간 실행 경로 추적
- 실행 타이밍이 포함된 성능 메트릭
- 여러 파이프라인 단계에서의 결과 집계
- 오류 상태 및 복구 경로 시각화

플레이그라운드는 다음과 같은 모듈형 아키텍처를 특징으로 합니다:
- **시나리오 기반 테스트** - 각 패턴을 위한 미리 구성된 테스트 케이스
- **핸들러 격리** - 다른 비즈니스 도메인을 위한 별도 모듈  
- **실시간 피드백** - 파이프라인 플로우를 보여주는 실시간 업데이트
- **대화형 디버깅** - 단계별 실행 분석

## 🧪 플로우 제어 테스트

### 우선순위 점프 테스트

```typescript
async function testPriorityJumping() {
  console.log('=== 우선순위 점프 테스트 ===');
  
  // 표준 요청 (점프 없음)
  const standardResult = await securityRegister.dispatchWithResult('processRequest', {
    userId: 'user-123',
    action: 'read-profile'
  });
  console.log('표준 결과:', standardResult);
  
  // 상승된 요청 (우선순위 점프 트리거)
  const elevatedResult = await securityRegister.dispatchWithResult('processRequest', {
    userId: 'admin-456',
    action: 'delete-user',
    requiresElevation: true
  });
  console.log('상승된 결과:', elevatedResult);
}
```

### 조기 반환 테스트

```typescript
async function testEarlyReturn() {
  console.log('=== 조기 반환 테스트 ===');
  
  // 첫 번째 호출 (캐시 미스, 전체 파이프라인)
  console.log('--- 첫 번째 호출 (API에서 페치해야 함) ---');
  const firstResult = await cacheRegister.dispatchWithResult('fetchData', {
    key: 'user-profile-123',
    fallbackUrl: '/api/users/123'
  });
  console.log('첫 번째 결과:', firstResult);
  
  // 두 번째 호출 (캐시 히트, 조기 반환)
  console.log('--- 두 번째 호출 (캐시에서 반환해야 함) ---');
  const secondResult = await cacheRegister.dispatchWithResult('fetchData', {
    key: 'user-profile-123'
  });
  console.log('두 번째 결과:', secondResult);
}
```

완전한 테스트 스위트와 고급 패턴은 [플로우 제어 플레이그라운드](https://mineclover.github.io/context-action/example/pipeline/flow-control)에서 사용할 수 있습니다.

## 📚 모범 사례

### 우선순위 점프를 사용해야 하는 경우

✅ **좋은 사용 사례**
- 보안 에스컬레이션 워크플로우
- 오류 복구 메커니즘
- 비즈니스 규칙 분기
- 기능 플래그 구현

❌ **피해야 하는 경우**
- 간단한 조건부 로직 (일반 우선순위 사용)
- 일회성 예외 (조기 반환 사용)
- 복잡한 상태 관리 (별도 액션 사용)

### 조기 반환을 사용해야 하는 경우

✅ **좋은 사용 사례**
- 성능 최적화 (캐싱)
- 검증 실패
- 보안 게이트
- 구성 기반 건너뛰기

❌ **피해야 하는 경우**
- 여러 핸들러의 결과를 집계해야 하는 경우
- 디버깅하고 전체 파이프라인 실행이 필요한 경우
- 오류 복구가 필요한 경우

### 성능 고려사항

- **우선순위 점프**는 중간 핸들러를 건너뛰지만 대상 우선순위부터 처리
- **조기 반환**은 모든 남은 실행을 즉시 중지
- 일관된 핸들러 선택을 위해 **핸들러 필터링** 사용
- 다른 성능 특성을 위해 **실행 모드** 고려

## 🚧 향후 구현 계획

Context-Action 프레임워크는 정교한 플로우 제어 기능으로 계속 발전합니다:

### 계획된 기능

#### 🎯 동적 우선순위 조정
시스템 조건 및 비즈니스 규칙에 따른 런타임 우선순위 수정

#### 🔀 핸들러 카테고리 관리  
핸들러를 카테고리별로 그룹화하고 카테고리 수준에서 실행 제어

#### 🚏 파이프라인 라우팅
복잡한 비즈니스 워크플로우를 위한 고급 라우팅 기능

#### 🔄 조건부 루프 제어
파이프라인 내에서 고급 루핑 및 반복 제어

실험적 구현과 프로토타입 테스트를 위해서는 [플로우 제어 플레이그라운드](https://mineclover.github.io/context-action/example/pipeline/flow-control)를 참조하세요.

## 관련 문서

- **[기본 파이프라인 기능](./index.md)** - 기본 파이프라인 개념
- **[우선순위 시스템](./priority.md)** - 핸들러 실행 순서
- **[결과 처리](./result-handling.md)** - 결과 수집 패턴
- **[액션 패턴](../patterns/action/)** - 액션 구현 패턴