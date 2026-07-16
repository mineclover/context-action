# 🏪 Context Store (Action-Based) Pattern

진짜 Context Store 패턴 구현 - @context-action 프레임워크의 Context Store와 Action Handler를 사용하는 패턴입니다.

## 🏪 아키텍처 특징

### 핵심 컨셉
- **단일 통합 스토어**: 모든 마우스 상태를 하나의 스토어에서 관리
- **액션 기반 상태 관리**: 타입 안전한 액션을 통한 상태 변경
- **자동 계산된 값**: 의존성 기반 자동 업데이트
- **Provider 기반 격리**: 컨텍스트 격리로 재사용성 향상

### 아키텍처 플로우
```
User Interaction → Action Dispatch → Action Handler → Store Update → UI Update
```

### 주요 구성 요소

1. **contexts/MouseActionContexts.tsx** - Context-Action 계약, Provider, 초기 상태
2. **business/mouse-rules.ts** - 순수 경로·속도·활동 계산 규칙
3. **actions/MouseActionHandlers.ts** - 액션 핸들러 구현체
4. **containers/ContextStoreMouseEventsContainer.tsx** - 컨테이너 컴포넌트
5. **components/ContextStoreMouseEventsView.tsx** - 뷰 컴포넌트
6. **ContextStoreMouseEventsWrapper.tsx** - Provider 래퍼

## Store Architecture

### Store Types
```typescript
interface MouseStores {
  position: {
    current: MousePosition;
    previous: MousePosition;
    isInsideArea: boolean;
  };
  
  movement: {
    moveCount: number;
    isMoving: boolean;
    velocity: number;
    path: MousePosition[];
  };
  
  clicks: {
    count: number;
    history: ClickEvent[];
  };
}
```

### Reactive Updates
```typescript
// Automatic UI updates when store changes
const positionStore = useStore('position');
const position = useStoreValue(positionStore); // Re-renders on change
```

## Usage Example

```typescript
import { StoreBasedMouseEventsContainer } from './containers/StoreBasedMouseEventsContainer';

function App() {
  return (
    <div>
      <StoreBasedMouseEventsContainer />
    </div>
  );
}
```

## Benefits

- ✅ **Reactive Updates**: Automatic UI updates on state changes
- ✅ **Performance**: Selective re-rendering based on store subscriptions
- ✅ **Centralized State**: Single source of truth for each store
- ✅ **Developer Experience**: Great debugging with store inspection
- ✅ **Time Travel**: Easy to implement undo/redo functionality

## Trade-offs

- ⚠️ **Learning Curve**: Requires understanding of reactive patterns
- ⚠️ **Memory Usage**: Store subscriptions and reactive chains
- ⚠️ **Debugging**: Can be complex to trace reactive updates
