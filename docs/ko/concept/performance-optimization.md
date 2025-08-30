# 성능 최적화 가이드

## 필터 캐싱 시스템

ActionRegister는 디스패치 작업 중 핸들러 선택 성능을 최적화하기 위한 지능형 필터 캐싱 시스템을 구현합니다.

### 개요

**목적**: 핸들러 선택 결과를 캐시하여 중복된 필터링 작업을 방지
**범위**: ActionRegister 인스턴스별 (동일한 Provider 하의 모든 컴포넌트에서 공유)
**안전성**: 자동 캐시 무효화로 데이터 일관성 보장

### 캐시 아키텍처

#### 캐시 소유권 구조
```
createActionContext() 
  → Provider Component
    → useRef(ActionRegister)
      → filterCache (Map<string, HandlerRegistration[]>)
```

#### 캐시 생명주기
1. **생성**: ActionRegister 인스턴스가 생성될 때
2. **채우기**: 각 고유 필터 조합에 대한 첫 번째 필터 작업 중
3. **무효화**: 핸들러가 등록/제거될 때 자동
4. **정리**: Provider가 언마운트되거나 ActionRegister.destroy()가 호출될 때

### 캐시되는 내용

#### ✅ 캐시 가능한 작업
- **핸들러 ID**: `{ handlerIds: ['auth', 'validation'] }` (정확한 문자열 매칭)
- **제외 ID**: `{ excludeHandlerIds: ['analytics'] }` (정확한 문자열 매칭)
- **우선순위 범위**: `{ priority: { min: 5, max: 10 } }`
- **결합된 조건**: `{ handlerIds: ['user'], priority: { min: 3 } }`

#### ❌ 캐시 불가능한 작업
- **커스텀 필터 함수**: `{ custom: (config) => config.tags?.includes('prod') }`
- **이유**: 호출 간 함수 참조 동등성을 보장할 수 없음

#### 캐시 콘텐츠
```typescript
// 캐시됨: 핸들러 메타데이터 (참조), 실행 결과 아님
Map<string, HandlerRegistration[]>

// 캐시 엔트리 예시:
"auth,validation|none|5|10|none" → [
  { handler: authHandler, config: { id: 'auth', priority: 8 } },
  { handler: validationHandler, config: { id: 'validation', priority: 6 } }
]
```

### 캐시 키 생성

#### 결정론적 키 알고리즘
```typescript
const cacheKey = [
  filterOptions.handlerIds?.sort().join(',') || 'none',
  filterOptions.excludeHandlerIds?.sort().join(',') || 'none', 
  filterOptions.priority?.min?.toString() || 'none',
  filterOptions.priority?.max?.toString() || 'none',
  filterOptions.custom ? 'custom' : 'none'
].join('|');

// 예시:
// { handlerIds: ['auth', 'user'] } → "auth,user|none|none|none|none"
// { priority: { min: 5, max: 10 } } → "none|none|5|10|none"
// { custom: (config) => true } → "none|none|none|none|custom"
```

#### 키 속성
- **결정론적**: 동일한 필터 옵션은 항상 동일한 키를 생성
- **순서 독립적**: `handlerIds`는 일관성을 위해 정렬됨
- **충돌 저항성**: 서로 다른 필터 조합은 서로 다른 키를 생성

### 동적 캐시 크기 조정

#### 크기 계산
```typescript
// 캐시 크기 = 총 등록된 핸들러 × 10
private get filterCacheMaxSize(): number {
  const totalHandlers = Array.from(this.pipelines.values())
    .reduce((sum, pipeline) => sum + pipeline.length, 0);
  
  return totalHandlers * 10 || 100; // 핸들러가 없으면 100으로 폴백
}
```

#### 예시
- **5개 핸들러** → 캐시 크기: 50
- **10개 핸들러** → 캐시 크기: 100  
- **50개 핸들러** → 캐시 크기: 500
- **핸들러 없음** → 캐시 크기: 100 (최소 폴백)

#### LRU 제거 전략
```typescript
// 캐시가 현재 한계를 초과할 때
if (this.filterCache.size >= currentMaxSize) {
  // 가장 오래된 엔트리 제거 (LRU)
  const oldestKey = this.filterCache.keys().next().value;
  if (oldestKey !== undefined) {
    this.filterCache.delete(oldestKey);
  }
}
```

### 캐시 무효화

#### 자동 무효화 트리거
1. **핸들러 등록**: 새 핸들러 추가 → 전체 캐시 클리어
2. **핸들러 교체**: 기존 핸들러 교체 → 전체 캐시 클리어
3. **핸들러 제거**: 핸들러 등록 해제 → 전체 캐시 클리어
4. **액션 정리**: 특정 액션 클리어 → 전체 캐시 클리어
5. **완전 리셋**: 모든 액션 클리어 → 전체 캐시 클리어

#### 무효화 구현
```typescript
// 모든 무효화 트리거가 이 메서드를 호출
private invalidateFilterCache(): void {
  this.filterCache.clear(); // 완전한 캐시 리셋
}

// 다음 중에 트리거됨:
pipeline.push(registration);     // 새 핸들러
pipeline[index] = registration;  // 핸들러 교체  
pipeline.splice(index, 1);      // 핸들러 제거
this.pipelines.clear();          // 완전 리셋
```

#### 전체 무효화를 하는 이유?
- **안전 우선**: 성능보다 일관성을 보장
- **핸들러 의존성**: 변경사항이 여러 필터 조합에 영향을 줄 수 있음
- **구현 단순성**: 복잡한 부분 무효화 로직을 피함

### 성능 특성

#### 캐시 적중 이점
- **시간 절약**: 필터 처리 시간의 ~60-80% 감소
- **메모리 영향**: 최소 (기존 객체에 대한 참조만 저장)
- **CPU 절약**: 배열 필터링 및 정렬 작업 방지

#### 캐시 미스 시나리오
1. **첫 번째 필터**: 이전에 본 적 없는 새 필터 조합
2. **무효화 후**: 핸들러가 수정된 후
3. **커스텀 필터**: 항상 미스 (의도적으로 캐시되지 않음)
4. **캐시 오버플로**: LRU 제거 후

#### 성능 메트릭
```typescript
// 일반적인 성능 영향:
// - 캐시 적중: ~0.01ms (참조 조회)
// - 캐시 미스: ~0.1-1ms (배열 필터링 + 정렬)
// - 메모리 사용량: 캐시된 엔트리 100개당 ~1KB
// - 캐시 키 생성: ~0.001ms
```

### 핸들러 ID 매칭 동작

#### 정확한 문자열 매칭
핸들러 ID는 **정확한 문자열 매칭**을 사용 - 부분 매칭, 와일드카드 또는 정규식 패턴 없음.

```typescript
// 핸들러 등록
register('action', handler1, { id: 'user-authentication' });
register('action', handler2, { id: 'user-validation' });
register('action', handler3, { id: 'authentication' });

// 정확한 매칭 예시
dispatch('action', payload, {
  filter: { handlerIds: ['user-authentication'] }
});
// ✅ 매칭: 'user-authentication'만
// ❌ 매칭되지 않음: 'user-validation', 'authentication'

dispatch('action', payload, {
  filter: { handlerIds: ['user'] }
});
// ❌ 어떤 핸들러와도 매칭되지 않음 (정확한 id 'user'인 핸들러 없음)

dispatch('action', payload, {
  filter: { excludeHandlerIds: ['authentication'] }
});
// ✅ 제외: 'authentication'만
// ✅ 실행: 'user-authentication', 'user-validation'
```

#### 부분 매칭 대안
유연한 매칭 패턴을 위해서는 커스텀 필터 사용 (캐시되지 않음):

```typescript
// 패턴 기반 매칭
dispatch('action', payload, {
  filter: {
    custom: (config) => config.id.startsWith('user-') // 접두사 매칭
  }
});
// 매칭: 'user-authentication', 'user-validation'

dispatch('action', payload, {
  filter: {
    custom: (config) => config.id.includes('auth') // 부분 문자열 매칭
  }
});
// 매칭: 'user-authentication', 'authentication'

dispatch('action', payload, {
  filter: {
    custom: (config) => /^user-.+$/.test(config.id) // 정규식 매칭
  }
});
// 매칭: 'user-authentication', 'user-validation'
```

#### 성능 트레이드오프
```typescript
// ✅ 빠름: 정확한 매칭 (캐시됨)
{ handlerIds: ['user-authentication', 'user-validation'] }

// ❌ 느림: 패턴 매칭 (캐시되지 않음, 매번 실행)  
{ custom: (config) => config.id.startsWith('user-') }

// 💡 하이브리드 접근법: 가능하면 정확한 매칭 사용
const userHandlerIds = ['user-authentication', 'user-validation', 'user-profile'];
{ handlerIds: userHandlerIds } // 캐시되고 빠름
```

### 사용 패턴

#### 권장 패턴
```typescript
// ✅ 좋음: 정확한 ID를 가진 정적 필터 (캐시 가능)
const staticFilter = { handlerIds: ['auth', 'validation'] };
dispatch('action', payload, { filter: staticFilter });

// ✅ 좋음: 재사용 가능한 필터 객체
const productionFilter = { priority: { min: 8 } };
dispatch('action1', payload1, { filter: productionFilter });
dispatch('action2', payload2, { filter: productionFilter }); // 캐시 적중!

// ✅ 좋음: 사전 정의된 핸들러 ID 목록
const criticalHandlers = ['security-check', 'audit-log', 'error-handler'];
const filter = { handlerIds: criticalHandlers }; // 캐시됨

// ✅ 좋음: 복잡한 패턴용 메모화된 커스텀 필터
const customFilter = useMemo(() => ({
  custom: (config) => config.environment === 'production'
}), []); // 메모화되었지만 여전히 캐시되지 않음 (의도적)
```

#### 안티패턴
```typescript
// ❌ 피하기: 인라인 필터 객체 (캐시 적중 방지)
dispatch('action', payload, { 
  filter: { handlerIds: ['auth'] } // 매번 새 객체
});

// ❌ 피하기: 정확한 필터로 부분 매칭 기대
dispatch('action', payload, {
  filter: { handlerIds: ['user'] } // 'user-auth'와 매칭되지 않음
});

// ❌ 피하기: 메모화 없는 동적 필터 생성
dispatch('action', payload, {
  filter: { 
    custom: (config) => config.priority > Math.random() * 10 
  }
});

// ❌ 피하기: 간단한 경우에 커스텀 필터에 과도하게 의존
// 이것 대신:
{ custom: (config) => ['auth', 'validation'].includes(config.id) }
// 이것 사용 (캐시됨):
{ handlerIds: ['auth', 'validation'] }
```

### 캐시 안전성 보장

#### 데이터 일관성
- **핸들러 변경**: 즉시 캐시 무효화로 최신 결과 보장
- **동시 접근**: 단일 스레드 JavaScript로 경합 상태 방지
- **메모리 누수**: ActionRegister 소멸 시 자동 정리

#### 스레드 안전성
```typescript
// 안전한 실행 순서 (동기):
1. 핸들러 등록/제거
2. 캐시 무효화 (즉시)
3. 다음 필터 작업은 최신 데이터 사용
```

#### 오류 복구
- **캐시 손상**: 불가능 (기존 객체에 대한 참조)
- **메모리 압박**: LRU 제거로 무한 증가 방지
- **잘못된 상태**: 캐시 무효화로 알려진 좋은 상태로 리셋

### 모니터링 및 디버깅

#### 캐시 통계
```typescript
// 디버깅을 위한 캐시 정보 접근:
const cacheSize = (register as any).filterCache.size;
const maxSize = (register as any).filterCacheMaxSize;
const handlerCount = register.getHandlerCount('action');

console.log(`Cache: ${cacheSize}/${maxSize}, Handlers: ${handlerCount}`);
```

#### 디버그 로깅
```typescript
// 캐시 작업용 디버그 모드 활성화:
const register = new ActionRegister({
  name: 'MyRegister',
  registry: { debug: true }
});

// 캐시 적중/미스 및 무효화 이벤트를 로그
```

### 모범 사례

#### 최적화 가이드라인
1. **필터 객체 재사용**: 상수나 useMemo에 필터 저장
2. **정적보다 동적**: 가능하면 커스텀 함수보다 정적 필터 선호
3. **합리적인 캐시 크기**: 현재 비율 (핸들러 × 10)은 메모리와 성능의 균형
4. **캐시 효율성 모니터링**: 개발 중 적중/미스 비율 추적

#### 메모리 관리
- **캐시 성장**: 동적 크기 조정을 통해 모니터링
- **LRU 제거**: 사용하지 않는 엔트리의 자동 정리
- **Provider 범위**: Provider 인스턴스별로 캐시 격리
- **정리**: ActionRegister 소멸 시 자동

### 구성 옵션

#### 현재 설정
```typescript
// 동적 캐시 크기 조정
cacheSize = totalHandlers * 10 || 100;

// LRU 제거 전략
// 크기 초과 시 가장 오래된 엔트리 제거
```

#### 잠재적 커스터마이제이션
```typescript
// 향후 개선 가능성:
interface CacheConfig {
  multiplier?: number;        // 기본값: 10
  minimumSize?: number;       // 기본값: 100
  evictionStrategy?: 'lru' | 'random' | 'priority-based';
  enableMetrics?: boolean;    // 캐시 적중/미스 추적
}
```

### 문제 해결

#### 일반적인 문제
1. **캐시가 작동하지 않음**: 커스텀 필터 사용 중인지 확인 (의도적으로 캐시되지 않음)
2. **메모리 증가**: 핸들러 수와 캐시 크기 비율 모니터링
3. **성능 회귀**: 캐시 무효화가 너무 빈번하지 않은지 확인
4. **일관성 없는 결과**: 핸들러 등록 타이밍 확인

#### 디버그 체크리스트
- [ ] 필터 객체가 재사용되고 있는가?
- [ ] 디버그 로깅이 활성화되어 있는가?
- [ ] 렌더링 중에 핸들러가 동적으로 등록되고 있는가?
- [ ] 캐시 크기가 핸들러 수에 적절한가?

### 관련 문서
- [액션 핸들러 등록](./action-handler-guide.md)
- [성능 모범 사례](./performance-guide.md)
- [ActionRegister 디버깅](./debugging-guide.md)