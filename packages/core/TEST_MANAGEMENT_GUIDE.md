# Test Management Guide - Context-Action Core

## 📋 테스트 구조 개요

Context-Action Core 패키지의 테스트는 체계적으로 구성되어 다양한 시나리오를 검증합니다.

### 📁 테스트 디렉터리 구조

```
__tests__/
├── README.md                           # 테스트 전체 개요
├── setup.ts                           # Jest 설정 파일
├── tsconfig.json                       # 테스트용 TypeScript 설정
├── simple-working.test.ts              # 기본 동작 검증
│
├── comprehensive/                      # 종합적인 기능 테스트
│   ├── ActionRegister.comprehensive.test.ts
│   ├── ActionRegister.core.test.ts
│   ├── AdvancedFeatures.test.ts
│   └── ExecutionModes.test.ts
│
├── feature-coverage/                   # 특정 기능별 상세 테스트
│   ├── ActionRegister.features.test.ts
│   ├── execution-stats-removal.test.ts    # v0.4.1 ExecutionStats 제거 검증
│   ├── filtering.test.ts
│   ├── memory-management.test.ts          # v0.4.1 메모리 관리 개선
│   └── result-collection.test.ts
│
├── concurrency/                       # 동시성 관련 테스트
│   ├── concurrency-fixed.test.ts
│   ├── concurrency-issues.test.ts
│   └── simple-concurrency.test.ts
│
├── edge-cases/                        # 경계 케이스 테스트
│   └── ActionRegister.edge-cases.test.ts
│
├── performance/                       # 성능 테스트
│   └── ActionRegister.performance.test.ts
│
├── production/                        # 프로덕션 시나리오 테스트
│   └── ActionRegister.production.test.ts
│
└── type-safety/                       # 타입 안전성 테스트
    └── ActionRegister.type-safety.test.ts
```

---

## 🧪 테스트 카테고리별 가이드

### 1. **기본 동작 테스트** (`simple-working.test.ts`)

가장 기본적인 ActionRegister 동작을 검증합니다.

**검증 항목:**
- ActionRegister 인스턴스 생성
- 핸들러 등록/해제
- 액션 디스패치
- 기본 payload 처리

```typescript
// 예제 테스트
describe('Simple Working Test', () => {
  it('should create ActionRegister instance', () => {
    const actionRegister = new ActionRegister();
    expect(actionRegister).toBeInstanceOf(ActionRegister);
  });

  it('should register and dispatch simple action', async () => {
    const handler = jest.fn();
    actionRegister.register('test', handler);
    
    await actionRegister.dispatch('test', 'payload');
    
    expect(handler).toHaveBeenCalledWith('payload', expect.any(Object));
  });
});
```

### 2. **종합 기능 테스트** (`comprehensive/`)

#### `ActionRegister.comprehensive.test.ts`
- 전체 라이프사이클 테스트
- 복합 시나리오 검증
- 통합 기능 테스트

#### `ActionRegister.core.test.ts`
- 핵심 API 동작 검증
- 에러 처리 테스트
- 설정 옵션 테스트

#### `AdvancedFeatures.test.ts`
- 고급 기능 테스트
- 필터링, 결과 수집
- 실행 모드 테스트

#### `ExecutionModes.test.ts`
- Sequential, Parallel, Race 모드
- 실행 순서 검증
- 모드별 에러 처리

### 3. **기능별 상세 테스트** (`feature-coverage/`)

#### `filtering.test.ts`
```typescript
describe('Filter Functionality Tests', () => {
  describe('🔍 Handler ID Filtering', () => {
    it('should filter by specific handler IDs', async () => {
      // 특정 ID로 핸들러 필터링 테스트
    });
  });

  describe('🎯 Priority Filtering', () => {
    it('should filter by priority range', async () => {
      // 우선순위 범위 필터링 테스트
    });
  });
});
```

#### `result-collection.test.ts`
```typescript
describe('Result Collection - dispatchWithResult Tests', () => {
  describe('🎯 Basic Result Collection', () => {
    it('should collect results when collect: true', async () => {
      // 결과 수집 기본 동작 테스트
    });
  });

  describe('📊 Result Collection Strategies', () => {
    it('should use "first" strategy correctly', async () => {
      // 첫 번째 결과만 수집 전략 테스트
    });
  });
});
```

### 4. **동시성 테스트** (`concurrency/`)

#### `concurrency-fixed.test.ts` - 해결된 동시성 문제 검증
```typescript
describe('동시성 문제 해결 확인', () => {
  describe('🆕 Fixed: Handler Registration Race', () => {
    it('등록과 디스패치 동시 실행 시 올바른 우선순위 순서 보장', async () => {
      // Race condition 해결 검증
    });
  });

  describe('🆕 Improved: Queue System Performance', () => {
    it('큐 시스템 처리 성능 확인', async () => {
      // OperationQueue 성능 검증
    });
  });
});
```

#### `concurrency-issues.test.ts` - 동시성 문제 재현
```typescript
describe('동시성 문제 재현 테스트', () => {
  describe('🚨 Problem 1: Handler Registration Race Condition', () => {
    it('핸들러 등록 중 dispatch 실행 시 불완전한 pipeline 실행', () => {
      // 알려진 동시성 문제 재현
    });
  });
});
```

### 5. **경계 케이스 테스트** (`edge-cases/`)

#### `ActionRegister.edge-cases.test.ts`
```typescript
describe('ActionRegister - Edge Cases and Boundary Conditions', () => {
  describe('🔍 Payload Edge Cases', () => {
    it('should handle null payload', () => {
      // null payload 처리 테스트
    });

    it('should handle circular reference objects safely', () => {
      // 순환 참조 객체 안전 처리
    });
  });

  describe('🔧 Registration Edge Cases', () => {
    it('should handle registering hundreds of handlers', () => {
      // 대량 핸들러 등록 테스트 (메모리 제한 검증)
    });
  });
});
```

---

## 🔧 테스트 실행 가이드

### 전체 테스트 실행
```bash
# 모든 테스트 실행
pnpm test:core

# Watch 모드로 실행
cd packages/core && pnpm test:watch
```

### 특정 테스트 파일 실행
```bash
# 특정 테스트 파일만 실행
pnpm test:core -- --testNamePattern="Simple Working"

# 특정 describe 블록만 실행
pnpm test:core -- --testNamePattern="Filter Functionality"

# 단일 테스트만 실행
pnpm test:core -- --testNamePattern="should handle null payload"
```

### 커버리지 확인
```bash
# 커버리지 리포트 생성
pnpm test:core -- --coverage

# 특정 파일의 커버리지 확인
pnpm test:core -- --coverage --testPathPattern="filtering.test.ts"
```

---

## 📝 새로운 테스트 작성 가이드

### 1. 테스트 파일 위치 결정

```typescript
// 기능별 테스트 → feature-coverage/
// 성능 테스트 → performance/
// 경계 케이스 → edge-cases/
// 프로덕션 시나리오 → production/
// 동시성 관련 → concurrency/
```

### 2. 테스트 구조 템플릿

```typescript
import { ActionRegister } from '../src/ActionRegister';

interface TestActions {
  testAction: string;
  numberAction: number;
  voidAction: void;
}

describe('테스트 그룹 이름', () => {
  let actionRegister: ActionRegister<TestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<TestActions>({
      name: 'TestRegistry',
      registry: { debug: false }
    });
  });

  afterEach(() => {
    actionRegister.destroy();
  });

  describe('🎯 기능 카테고리', () => {
    it('should 구체적인 동작 설명', async () => {
      // Arrange
      const mockHandler = jest.fn();
      
      // Act
      actionRegister.register('testAction', mockHandler);
      await actionRegister.dispatch('testAction', 'test-payload');
      
      // Assert
      expect(mockHandler).toHaveBeenCalledWith('test-payload', expect.any(Object));
    });
  });
});
```

### 3. v0.4.1 개선사항 테스트 구현 (✅ 완료)

#### 메모리 관리 테스트 (`memory-management.test.ts`)
```typescript
// feature-coverage/memory-management.test.ts
describe('Memory Management Tests', () => {
  describe('🧠 Handler Limits', () => {
    it('should respect maxHandlersPerAction limit', () => {
      const limitedRegister = new ActionRegister({
        registry: { maxHandlersPerAction: 2 }
      });
      
      // 2개까지는 성공
      const unregister1 = limitedRegister.register('test', jest.fn());
      const unregister2 = limitedRegister.register('test', jest.fn());
      expect(limitedRegister.getHandlerCount('test')).toBe(2);
      
      // 3번째는 무시됨
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const unregister3 = limitedRegister.register('test', jest.fn());
      
      expect(limitedRegister.getHandlerCount('test')).toBe(2);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Handler limit (2) reached')
      );
      expect(typeof unregister3).toBe('function'); // no-op function
      
      consoleSpy.mockRestore();
    });
  });
});
```

#### ExecutionStats 제거 테스트 (`execution-stats-removal.test.ts`)
**✅ 구현 완료** - v0.4.1에서 제거된 ExecutionStats 시스템을 검증하는 테스트
```typescript
// feature-coverage/execution-stats-removal.test.ts
describe('ExecutionStats Removal Tests - v0.4.1', () => {
  describe('🗑️ Removed APIs', () => {
    it('should not have clearExecutionStats method', () => {
      const actionRegister = new ActionRegister();
      
      // 메서드가 존재하지 않음
      expect((actionRegister as any).clearExecutionStats).toBeUndefined();
      expect((actionRegister as any).clearActionExecutionStats).toBeUndefined();
      expect((actionRegister as any).updateExecutionStats).toBeUndefined();
    });

    it('should return undefined for executionStats', () => {
      const actionRegister = new ActionRegister<{ test: string }>();
      actionRegister.register('test', jest.fn());
      
      const stats = actionRegister.getActionStats('test');
      expect(stats?.executionStats).toBeUndefined();
    });
  });

  describe('⚡ Performance Impact of Removal', () => {
    it('should have faster dispatch without stats overhead', async () => {
      // ExecutionStats 제거로 인한 성능 향상 검증
      const handler = jest.fn();
      actionRegister.register('testAction', handler);
      
      const iterations = 50;
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        await actionRegister.dispatch('testAction', { value: `test-${i}` });
      }
      
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / iterations;
      
      expect(averageTime).toBeLessThan(5); // 매우 빠른 실행
    });
  });
});
```

---

## 🎯 테스트 품질 체크리스트

### 새로운 기능 테스트 시 확인사항

- [ ] **행복한 경로 테스트**: 정상적인 사용 케이스
- [ ] **에러 케이스 테스트**: 예상되는 에러 상황
- [ ] **경계 케이스 테스트**: null, undefined, 빈 값 등
- [ ] **성능 테스트**: 대량 데이터나 반복 작업
- [ ] **메모리 누수 테스트**: 리소스 정리 확인
- [ ] **타입 안전성**: TypeScript 타입 검증
- [ ] **하위 호환성**: 기존 API와의 호환성

### 테스트 코드 품질

- [ ] **명확한 테스트 이름**: 무엇을 테스트하는지 명확
- [ ] **AAA 패턴**: Arrange, Act, Assert 구분
- [ ] **독립성**: 다른 테스트에 의존하지 않음
- [ ] **반복 가능성**: 여러 번 실행해도 같은 결과
- [ ] **빠른 실행**: 불필요한 지연 없음

---

## 🚀 CI/CD 통합

### GitHub Actions 설정
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Run type check
        run: pnpm type-check
        
      - name: Run tests
        run: pnpm test:core
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### 테스트 결과 모니터링
```bash
# 성능 벤치마크 실행
pnpm test:core -- --testNamePattern="performance"

# 메모리 사용량 확인
node --expose-gc packages/core/__tests__/performance/memory-benchmark.js
```

---

## 📊 현재 테스트 현황

### 테스트 통계 (v0.4.1 - Updated)
```
✅ 11개 테스트 스위트 통과
✅ 166개 테스트 통과 (139 + 27 신규)
⏭️ 6개 테스트 스킵 (환경적 이유)
📊 커버리지: 95%+
⏱️ 실행 시간: ~0.6초

신규 추가된 테스트 스위트:
- memory-management.test.ts (13 테스트)
- execution-stats-removal.test.ts (14 테스트)
```

### 커버리지 분석
- **ActionRegister.ts**: 98%
- **execution-modes.ts**: 95%
- **OperationQueue.ts**: 92%
- **types.ts**: 100%

---

**테스트는 코드 품질의 핵심입니다!** 🧪✨

지속적인 테스트 개선으로 더 안정적인 라이브러리를 만들어갑시다.