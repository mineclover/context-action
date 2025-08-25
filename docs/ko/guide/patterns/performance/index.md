# 성능 패턴

Context-Action 프레임워크 애플리케이션을 위한 성능 최적화 패턴과 기법들입니다.

## 🚀 성능 최적화

### 핵심 최적화 기법
- **[최적화 기법](./optimization-techniques.md)** - 포괄적인 성능 최적화 가이드
  - Store 최적화 전략
  - Action handler 최적화
  - Memoization 패턴
  - RefContext 성능 기법

## 🎯 빠른 참조

### 성능 전략

| 영역 | 기법 | 모범 사례 |
|------|-----------|---------------|
| **Store** | Comparison Strategy | 데이터 특성에 따라 선택 |
| **Actions** | Handler Memoization | 안정적인 deps와 함께 useCallback 사용 |
| **RefContext** | Direct DOM | 하드웨어 가속화로 제로 리렌더링 |
| **Components** | Memoization | 비용이 많이 드는 계산을 메모화 |

### Comparison Strategy 가이드

```tsx
// 원시값: reference (기본값)
counter: 0

// 객체 프로퍼티: shallow
userProfile: { initialValue: {...}, strategy: 'shallow' }

// 깊게 중첩된 경우: deep
complexData: { initialValue: {...}, strategy: 'deep' }

// 대용량 데이터셋: reference
largeArray: { initialValue: [...], strategy: 'reference' }

// 커스텀 로직: 커스텀 comparator
versionData: { 
  comparisonOptions: { 
    strategy: 'custom',
    customComparator: (old, new) => old.version === new.version 
  }
}
```

### 성능 안티패턴

❌ **이런 패턴은 피하세요:**
- 부분 데이터만 필요할 때 전체 객체 구독
- 고빈도 이벤트에 대한 상태 기반 업데이트
- handler에 대한 useCallback 누락
- 불필요한 deep comparison 전략
- 애니메이션 및 이벤트 리스너 정리하지 않기

## 📚 관련 문서

- [RefContext 성능](../ref/performance.md)
- [하드웨어 가속화](../ref/hardware-acceleration.md)
- [메모리 최적화](../ref/memory-optimization.md)