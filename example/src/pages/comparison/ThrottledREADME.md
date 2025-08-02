# ⏱️ Throttled Infinite Loop Control

## 개요
무한 루프를 완전히 차단하지 않고, **메모리 효율적으로 제어**하면서 **적절한 갱신 주기**로 렌더링을 관리하는 시스템입니다. 실제 프로덕션 환경에서 무한 루프가 발생했을 때 시스템이 완전히 다운되지 않도록 하는 방어 메커니즘을 제공합니다.

## 접속 방법
- **URL**: `/comparison/throttled`
- **네비게이션**: 사이드바의 "⏱️ Throttled Loop Control" 클릭

## 핵심 기능

### 🎛️ Throttling System (100ms 간격)
- **실제 렌더링**: 계속 발생하지만 내부적으로 처리
- **UI 갱신**: 100ms마다 제한하여 브라우저 부하 감소
- **배치 처리**: requestAnimationFrame으로 성능 최적화
- **시각적 표시**: Throttled 상태를 노란색 링으로 표시

### 💾 Memory Management
```typescript
// 순환 값 사용으로 메모리 절약
iteration % 100  // 0-99 순환
iteration % 1000 // 0-999 순환

// 히스토리 크기 제한
const MAX_HISTORY_SIZE = 50;
const MEMORY_CLEANUP_INTERVAL = 1000; // 1초마다 정리
```

### 📊 Real-time Monitoring
- **실제 렌더링 수**: 백그라운드에서 발생한 총 렌더링
- **표시 렌더링 수**: UI에 실제로 반영된 렌더링
- **렌더링 속도**: 초당 렌더링 수 (renders/second)
- **메모리 사용량**: JavaScript 힙 메모리 실시간 모니터링
- **Throttled 상태**: 현재 throttling 적용 여부

### 🔄 Auto Mode (무한 루프 시뮬레이션)
- **개별 Auto**: 각 컴포넌트별로 무한 루프 시작/중지
- **전체 Auto**: 모든 컴포넌트 동시 무한 루프 시작
- **빠른 업데이트**: 50ms 간격으로 상태 변경하여 무한 루프 재현
- **안전한 중지**: 언제든지 Stop 버튼으로 중지 가능

## 메모리 최적화 전략

### 1. 순환 데이터 패턴
```typescript
// Before: 무제한 메모리 사용
`test-value-${iteration}`  // iteration이 무한 증가

// After: 메모리 효율적
`test-value-${iteration % 100}`  // 0-99만 사용, 메모리 고정
```

### 2. 크기 제한된 객체
```typescript
// Before: 무제한 크기
for (let i = 0; i < 50; i++) { ... }

// After: 제한된 크기
for (let i = 0; i < 20; i++) { ... }  // 최대 20개 프로퍼티
```

### 3. 시간 기반 변경
```typescript
// Before: 매번 변경
timestamp: Date.now()

// After: 초 단위 변경
timestamp: Math.floor(Date.now() / 1000)  // 초 단위로 변경
```

### 4. 자동 메모리 정리
```typescript
// 1초마다 오래된 히스토리 정리
const cleanup = setInterval(() => {
  renderHistory.current = renderHistory.current.filter(time => now - time < 5000);
}, MEMORY_CLEANUP_INTERVAL);
```

## 실제 사용 시나리오

### 🚨 프로덕션 무한 루프 대응
1. **감지**: 렌더링 속도가 비정상적으로 높아짐 (>20/s)
2. **제어**: Throttling으로 UI 반응성 유지
3. **모니터링**: 실시간 메모리 사용량 추적
4. **복구**: 수동 GC 또는 컴포넌트 리셋

### 🔬 개발 중 디버깅
1. **Auto 모드 활성화**: 무한 루프 상황 재현
2. **전략별 비교**: Reference/Shallow/Deep 성능 비교
3. **메모리 추적**: 메모리 누수 패턴 확인
4. **최적화 검증**: Throttling 효과 측정

### ⚡ 성능 테스트
1. **부하 테스트**: 모든 컴포넌트 Auto 모드 동시 실행
2. **메모리 테스트**: 장시간 실행 후 메모리 사용량 확인
3. **복구 테스트**: 수동 GC로 메모리 회수 효과 확인

## 컨트롤 가이드

### 🎛️ 기본 컨트롤
- **Update**: 수동으로 데이터 한 번 업데이트
- **Set Store**: Store에 직접 새로운 값 설정
- **▶️ Auto**: 개별 컴포넌트 무한 루프 시작
- **⏹️ Stop**: 개별 컴포넌트 무한 루프 중지

### 🌐 전역 컨트롤
- **🔄 Reset All**: 모든 컴포넌트 상태 리셋 및 메모리 정리
- **🗑️ Force GC**: 수동 가비지 컬렉션 트리거
- **▶️ Start All Auto**: 모든 컴포넌트 무한 루프 동시 시작
- **⏹️ Stop All Auto**: 모든 컴포넌트 무한 루프 동시 중지

## 성능 지표 해석

### 렌더링 효율성
- **실제 > 표시**: Throttling이 정상 작동 중
- **높은 렌더링 속도**: 무한 루프 상황 감지
- **메모리 증가**: 메모리 누수 가능성 (GC 필요)

### 전략별 특성
- **Reference**: 가장 높은 렌더링 속도 (새 객체 = 항상 변경)
- **Shallow**: 균형잡힌 성능 (내용 비교로 불필요한 렌더링 방지)
- **Deep**: 정확한 변경 감지 (복잡한 구조에서 효과적)

## 실제 적용 팁

### 1. 프로덕션 환경
```typescript
// 렌더링 속도 모니터링
if (renderRate > 20) {
  console.warn('High render rate detected:', renderRate);
  // 적절한 대응 조치
}
```

### 2. 메모리 관리
```typescript
// 정기적인 메모리 정리
setInterval(() => {
  if (memoryUsage > 100) { // 100MB 초과 시
    forceGarbageCollection();
  }
}, 5000);
```

### 3. 자동 복구
```typescript
// 무한 루프 자동 감지 및 복구
if (renderCount > threshold) {
  enableThrottling();
  scheduleReset();
}
```

이 시스템을 통해 **무한 루프가 발생해도 시스템이 다운되지 않고**, **메모리를 효율적으로 관리**하면서 **적절한 성능을 유지**할 수 있습니다!