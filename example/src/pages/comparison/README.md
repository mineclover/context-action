# ⚡ Store Comparison Logic Demo

## 개요
Context-Action Store의 개선된 비교 로직을 다양한 데이터 패턴으로 테스트할 수 있는 전용 데모 페이지입니다. Reference, Shallow, Deep 세 가지 비교 전략의 성능과 안전성을 실시간으로 비교할 수 있습니다.

## 접속 방법
- **URL**: `/comparison/demo`
- **네비게이션**: 사이드바의 "⚡ Store Comparison Demo" 클릭

## 주요 기능

### 🎛️ 다양한 데이터 패턴 테스트
1. **원시 값** (`primitive`) - String, Number 등 단순 값
2. **단순 객체** (`simple-object`) - 1레벨 프로퍼티만 있는 객체
3. **중첩 객체** (`nested-object`) - 깊은 중첩 구조 (User > Profile > Settings)
4. **단순 배열** (`array-simple`) - 원시 값들의 배열
5. **복잡 배열** (`array-complex`) - 객체들의 배열
6. **혼합 복잡** (`mixed-complex`) - 다양한 타입이 혼합된 구조
7. **변화하는 구조** (`changing-shape`) - 매번 다른 프로퍼티 구조
8. **큰 객체** (`large-object`) - 50개 프로퍼티 (성능 테스트용)

### 🚨 안전 장치 시스템
- **렌더링 카운터**: 각 컴포넌트의 렌더링 횟수 실시간 모니터링
- **임계치 경고**: 15회 초과 시 경고, 20회 초과 시 자동 중단
- **상태 표시**: Safe(✅) → Watch(⚠️) → High(🔄) → Danger(🚨)
- **Emergency Stop**: 무한 루프 발생 시 컴포넌트 자동 중단

### 📊 실시간 성능 분석
- **렌더링 효율성**: 매우 효율적 / 보통 / 비효율적 / 위험
- **전략별 비교**: 3가지 비교 전략의 성능 동시 비교
- **권장 전략**: 각 데이터 패턴에 최적화된 전략 제안

## 비교 전략 상세

### 🟠 Reference Strategy
- **동작**: `Object.is()` 기반 참조 비교
- **성능**: ⚡⚡⚡ 가장 빠름
- **특징**: 새로운 객체는 무조건 "다름"으로 판단
- **적합한 데이터**: 원시 값, 안정적인 참조

### 🔵 Shallow Strategy (권장)
- **동작**: 1레벨 프로퍼티 값 비교
- **성능**: ⚡⚡ 빠름
- **특징**: 동일한 내용의 객체는 "같음"으로 판단
- **적합한 데이터**: 대부분의 객체, 배열

### 🟣 Deep Strategy
- **동작**: 모든 중첩 프로퍼티까지 재귀적 비교
- **성능**: ⚡ 보통
- **특징**: 가장 정확한 변경 감지
- **적합한 데이터**: 복잡한 중첩 객체, 정확성이 중요한 데이터

## 테스트 시나리오

### 📋 기본 테스트
1. **단순 객체 패턴** 선택
2. 각 전략별 렌더링 카운트 관찰
3. "Update Data" 버튼으로 데이터 변경 테스트
4. "Set Store" 버튼으로 Store 직접 업데이트 테스트

### 🔬 고급 테스트
1. **중첩 객체 패턴** 선택 → Deep 전략의 우수성 확인
2. **변화하는 구조 패턴** 선택 → 각 전략의 대응 방식 비교
3. **큰 객체 패턴** 선택 → 성능 차이 관찰

### ⚠️ 무한 루프 테스트
1. **Reference 전략 + 복잡한 데이터 패턴** 조합
2. 렌더링 카운트 급증 관찰
3. 자동 안전 장치 동작 확인

## 실제 적용 가이드라인

### ✅ 권장 사용법
```typescript
// 전역 설정 (앱 시작 시)
setGlobalComparisonOptions({ strategy: 'shallow' });

// 특정 Store만 다른 전략 사용
const complexStore = createStore('complex-data', initialData);
complexStore.setComparisonOptions({ strategy: 'deep' });
```

### 📈 성능 최적화 팁
1. **데이터 구조 단순화**: 불필요한 중첩 최소화
2. **적절한 전략 선택**: 데이터 특성에 맞는 전략 사용
3. **안정적인 참조**: 가능한 한 `useMemo` 사용
4. **모니터링**: 렌더링 카운트 주기적 확인

## 문제 해결

### 🚨 렌더링이 너무 많이 발생하는 경우
1. **전략 변경**: Reference → Shallow 또는 Deep으로 변경
2. **데이터 구조 검토**: 매번 새로운 객체 생성하는지 확인
3. **의존성 배열 검토**: `useEffect`, `useMemo` 의존성 최적화

### 🐌 성능이 느린 경우
1. **전략 변경**: Deep → Shallow 또는 Reference로 변경
2. **데이터 크기 최적화**: 불필요한 프로퍼티 제거
3. **비교 옵션 조정**: `maxDepth` 설정으로 깊이 제한

## 확장 활용

### 📊 성능 벤치마크
- 다양한 데이터 크기로 테스트
- 전략별 메모리 사용량 비교
- 실제 애플리케이션 시나리오 테스트

### 🔧 커스텀 비교 함수
```typescript
// 특별한 비교 로직이 필요한 경우
store.setCustomComparator((oldValue, newValue) => {
  // 사용자 정의 비교 로직
  return oldValue.id === newValue.id && oldValue.version === newValue.version;
});
```

이 데모 페이지를 통해 Context-Action Store의 강력한 비교 로직을 이해하고, 실제 프로젝트에서 최적의 성능을 얻을 수 있습니다!