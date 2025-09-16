# Priority Performance - Context-Driven Architecture Implementation

이 디렉토리는 Context-Action 프레임워크의 **Context-Driven Architecture**를 구현한 우선순위 성능 테스트 페이지입니다.

## 🏗️ Architecture Overview

Context-Driven Architecture의 4-Layer Structure를 따라 구현되었습니다:

```
📁 priority-refactored/
├── 📁 contexts/           # 🗄️ Context Definitions
│   └── PriorityContexts.ts      # 타입 정의와 컨텍스트 생성
├── 📁 handlers/           # ⚙️ Handler Logic
│   ├── PerformanceManagementHandlers.tsx  # 성능 관리 비즈니스 로직
│   └── PriorityTestHandlers.tsx           # 우선순위 테스트 로직
├── 📁 actions/            # 🚀 Action Dispatch
│   ├── usePerformanceManagementActions.ts # 성능 관리 액션
│   └── usePriorityTestActions.ts          # 테스트 실행 액션
├── 📁 hooks/              # 🔗 Store Subscriptions
│   ├── usePerformanceState.ts             # 성능 상태 구독
│   └── usePriorityTestState.ts            # 테스트 상태 구독
├── 📁 views/              # 🖼️ Pure UI Components
│   ├── PriorityGrid.tsx                   # 우선순위 그리드 UI
│   ├── TestControlsView.tsx               # 테스트 제어 UI
│   └── TestMetricsView.tsx                # 메트릭 표시 UI
└── 📄 PriorityPage.tsx    # 🎯 Integration Point
```

## 🎯 Core Principles

### 1. Document-Centric Context Separation
각 컨텍스트는 명확한 도메인 문서와 책임을 가집니다:
- **PriorityTest**: 우선순위 테스트 실행 및 결과 관리
- **PerformanceManagement**: 인스턴스 관리 및 성능 상태
- **TestConfig**: 핸들러 설정 및 구성 관리

### 2. Props-based Dependency Injection
Handler 컴포넌트는 Props-based DI 패턴을 사용합니다:
```typescript
// Props를 통한 스토어 의존성 주입
<PerformanceManagementHandlers performanceStore={performanceStore}>
  <PriorityTestHandlers
    priorityCountsStore={priorityCountsStore}
    executionStateStore={executionStateStore}
    handlerConfigs={configsWithDelay}
  >
```

### 3. Clear Layer Separation
각 레이어는 명확한 책임과 의존성 방향을 가집니다:
- **Contexts** → **Handlers** → **Actions** → **Hooks** → **Views**
- 상위 레이어는 하위 레이어를 사용하지만, 역방향 의존성은 금지

## 🚀 Key Features

### Action Pipeline System
- **Priority-based Execution**: 핸들러를 우선순위에 따라 정렬 실행
- **Jump Logic**: 조건부 우선순위 점프 기능
- **Abort Support**: 사용자 요청에 따른 안전한 중단

### Store Integration Pattern
- **3-Step Process**: Read current state → Execute logic → Update state
- **Immutable Updates**: Immer 기반 안전한 상태 변경
- **Type Safety**: 완전한 TypeScript 타입 안전성

### Event-Based Delegation
- **Parent-Child Communication**: 이벤트 기반 컨텍스트 간 통신
- **State Isolation**: 각 컨텍스트의 독립적인 상태 관리
- **Cross-Context Coordination**: 제어된 컨텍스트 간 협력

## 📊 Implementation Details

### Context Layer
```typescript
// 타입 정의 및 컨텍스트 생성
export const {
  Provider: PriorityTestActionProvider,
  useActionDispatch: usePriorityTestAction,
  useActionHandler: usePriorityTestActionHandler,
} = createActionContext<PriorityTestActions>('PriorityTest');
```

### Handler Layer (Props-based DI)
```typescript
interface PerformanceManagementHandlersProps {
  performanceStore: Store<PerformanceStateData>;
}

export function PerformanceManagementHandlers({
  performanceStore,
  children,
}: PerformanceManagementHandlersProps & { children: ReactNode }) {
  // 비즈니스 로직 구현
}
```

### Action Layer
```typescript
export function usePerformanceManagementActions() {
  const dispatch = usePerformanceManagementAction();

  const addInstance = useCallback(async () => {
    const result = await dispatch('addInstance');
    return result;
  }, [dispatch]);
}
```

### Hook Layer
```typescript
export function usePerformanceState() {
  const performanceStore = usePerformanceManagementStore('performanceState');
  const performanceState = useStoreValue(performanceStore);

  // 계산된 값들 제공
  return { performanceState, performanceStore, ...computedValues };
}
```

### View Layer
```typescript
export const PriorityGrid = memo<PriorityGridProps>(
  ({ configs, allowManualClick = false }) => {
    // 순수 UI 렌더링 로직
    return <div>{/* UI Components */}</div>;
  }
);
```

## 🔄 Data Flow

1. **User Interaction** → View Layer
2. **Event Dispatch** → Action Layer
3. **Business Logic** → Handler Layer
4. **State Update** → Store (Context Layer)
5. **UI Update** → Hook Layer → View Layer

## 🎨 Visual Features

### Priority Grid
- **Color-coded Priority**: 우선순위에 따른 색상 구분
- **Opacity-based Count**: 실행 횟수에 따른 투명도 변화
- **Interactive Manual Control**: 좌클릭(+1), 우클릭(-1) 기능
- **Jump Indicators**: 점프 대상이 있는 핸들러 표시

### Real-time Metrics
- **Execution Statistics**: 총 실행, 성공률, 평균 시간
- **Performance Monitoring**: 실시간 성능 지표 추적
- **Instance Management**: 다중 인스턴스 상태 관리

## 🏃‍♂️ Usage

### Basic Usage
```typescript
import PriorityPage from './priority-refactored';

// 단순히 컴포넌트를 렌더링
<PriorityPage />
```

### Advanced Integration
```typescript
// 개별 레이어 사용
import {
  usePerformanceManagementActions,
  usePriorityTestState,
  PriorityGrid
} from './priority-refactored';

function CustomImplementation() {
  const actions = usePerformanceManagementActions();
  const { isRunning } = usePriorityTestState();

  return (
    <div>
      <PriorityGrid configs={configs} allowManualClick={true} />
      <button onClick={actions.addInstance}>Add Instance</button>
    </div>
  );
}
```

## 🎯 Benefits

### 1. Maintainability
- **Clear Separation**: 각 레이어의 명확한 책임
- **Type Safety**: 컴파일 타임 에러 방지
- **Testability**: 독립적인 유닛 테스트 가능

### 2. Scalability
- **Context Isolation**: 독립적인 기능 추가 가능
- **Incremental Development**: 점진적 개발 및 마이그레이션
- **Team Collaboration**: 레이어별 병렬 개발 가능

### 3. Performance
- **Optimized Updates**: 정확한 변경 감지
- **Memory Management**: 자동 cleanup 및 dispose
- **Bundle Optimization**: Tree-shaking 친화적 구조

## 📚 References

- [Context-Driven Architecture Guide](../../../docs/en/architecture/context-driven-architecture.md)
- [Context-Action Framework Documentation](../../../docs/en/concept/pattern-guide.md)
- [Props-based Handler Patterns](../../../docs/en/context-layered/patterns/props-based-handlers.md)