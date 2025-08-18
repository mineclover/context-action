# DOM Element 관리

Context-Action 프레임워크를 사용한 포괄적인 DOM element 관리 고급 예제입니다.

## 개요

이 예제는 Context-Action의 **Action Pipeline**과 **Store Pattern**을 활용하여 React와 Core 패키지에서 DOM element를 효과적으로 관리하는 방법을 보여줍니다:

- **중앙화된 Element Registry**: 모든 DOM element를 중앙에서 관리
- **Type-safe Element Management**: TypeScript를 활용한 타입 안전성
- **Reactive State Management**: Element 상태 변경에 대한 실시간 반응
- **Lifecycle Management**: Element 등록/해제의 자동화
- **Focus & Selection Management**: 포커스와 선택 상태 관리

## 주요 기능

### Core 패키지 기능
- **ElementManager 클래스**: 중앙화된 DOM element 생명주기 관리
- **Action 기반 API**: 모든 element 작업이 action pipeline을 통해 수행
- **자동 정리**: DOM에서 제거된 element들의 주기적 정리
- **Type-safe 관리**: TypeScript를 활용한 완전한 타입 안전성

### React 패키지 기능
- **useElementRef Hook**: Element 자동 등록을 위한 hook
- **Focus 관리**: `useFocusedElement` hook으로 포커스 상태 관리
- **Selection 관리**: `useElementSelection` hook으로 다중 선택 지원
- **Type별 조회**: `useElementsByType`으로 타입별 element 조회
- **Managed Components**: 자동으로 등록되는 `ManagedInput`, `ManagedButton` 컴포넌트

## 기본 사용법

### 1. 설정

```tsx
import React from 'react';
import { ElementManagementProvider } from './react-element-hooks';

function App() {
  return (
    <ElementManagementProvider>
      <YourAppContent />
    </ElementManagementProvider>
  );
}
```

### 2. Element 등록 및 관리

```tsx
import { useElementRef, useElementManager } from './react-element-hooks';

function MyComponent() {
  // 자동으로 element를 등록하는 ref 생성
  const inputRef = useElementRef('user-input', 'input', {
    required: true,
    label: 'Username'
  });

  // Element 관리 API 사용
  const { registerElement, getElement } = useElementManager();

  return (
    <input 
      ref={inputRef}
      type="text" 
      placeholder="사용자명을 입력하세요"
    />
  );
}
```

### 3. Focus 관리

```tsx
import { useFocusedElement } from './react-element-hooks';

function FocusController() {
  const { focusedElementId, focusElement, clearFocus } = useFocusedElement();

  return (
    <div>
      <p>현재 포커스: {focusedElementId || '없음'}</p>
      <button onClick={() => focusElement('user-input')}>
        Input에 포커스
      </button>
      <button onClick={clearFocus}>
        포커스 해제
      </button>
    </div>
  );
}
```

### 4. Selection 관리

```tsx
import { useElementSelection } from './react-element-hooks';

function SelectionController() {
  const { 
    selectedElements, 
    selectElement, 
    selectElements,
    toggleElement,
    clearSelection,
    isSelected 
  } = useElementSelection();

  return (
    <div>
      <p>선택된 요소: {selectedElements.join(', ')}</p>
      
      <button onClick={() => selectElement('input1')}>
        Input1 선택
      </button>
      
      <button onClick={() => selectElements(['input1', 'button1'])}>
        다중 선택
      </button>
      
      <button onClick={() => toggleElement('input2')}>
        Input2 토글
      </button>
      
      <button onClick={clearSelection}>
        선택 해제
      </button>
    </div>
  );
}
```

## 실제 사용 시나리오

### Form Builder 애플리케이션

Element 관리를 포함한 동적 폼 빌더:

```tsx
function FormBuilderExample() {
  return (
    <ElementManagementProvider>
      <FormBuilderApp />
      <ElementDebugPanel /> {/* 개발용 디버그 패널 */}
    </ElementManagementProvider>
  );
}
```

**기능:**
- 동적 폼 필드 추가/제거
- 클릭으로 필드 선택, Cmd/Ctrl+클릭으로 다중 선택
- 선택된 필드들 일괄 삭제
- 실시간 element 상태 모니터링
- 키보드 단축키 지원

### Canvas 관리

Canvas 기반 그래픽 에디터의 element 관리:

```tsx
function CanvasManagementExample() {
  const canvasRef = useElementRef('main-canvas', 'canvas', { 
    interactive: true, 
    drawingMode: true 
  });

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      style={{ border: '2px solid #ddd' }}
    />
  );
}
```

**기능:**
- Canvas element 등록 및 상태 관리
- Canvas 내 그래픽 객체들과의 연동
- 선택 상태에 따른 도구 패널 표시
- Canvas 메타데이터 관리

## API 참조

### Core API

#### ElementManager

```typescript
class ElementManager {
  // Element 등록
  async registerElement(
    id: string, 
    element: HTMLElement, 
    type: ElementInfo['type'], 
    metadata?: Record<string, any>
  ): Promise<void>

  // Element 해제
  async unregisterElement(id: string): Promise<void>

  // Element에 포커스
  async focusElement(id: string): Promise<void>

  // 다중 elements 선택
  async selectElements(ids: string[]): Promise<void>

  // Registry 상태 조회
  getRegistry(): Readonly<ElementRegistry>

  // 리소스 해제
  dispose(): void
}
```

### React Hooks

#### useElementRef
Element 자동 등록을 위한 hook

```typescript
function useElementRef(
  id: string,
  type: ElementInfo['type'],
  metadata?: Record<string, any>
): RefCallback<HTMLElement>
```

#### useElementManager
Element 관리를 위한 종합 hook

```typescript
function useElementManager(): {
  registerElement: (id: string, element: HTMLElement, type: ElementInfo['type'], metadata?: Record<string, any>) => void;
  unregisterElement: (id: string) => void;
  getElement: (id: string) => ElementInfo | null;
  getAllElements: () => Map<string, ElementInfo>;
  getElementsByType: (type: ElementInfo['type']) => ElementInfo[];
}
```

#### useFocusedElement
포커스 관리 hook

```typescript
function useFocusedElement(): {
  focusedElementId: string | null;
  focusElement: (id: string) => void;
  clearFocus: () => void;
}
```

#### useElementSelection
선택 관리 hook

```typescript
function useElementSelection(): {
  selectedElements: string[];
  selectElements: (ids: string[]) => void;
  selectElement: (id: string) => void;
  toggleElement: (id: string) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}
```

## 주요 이점

### 1. **중앙화된 관리**
- 모든 DOM element가 중앙에서 관리되어 일관성 보장
- Element 생명주기의 예측 가능한 관리

### 2. **타입 안전성**
- TypeScript를 통한 완전한 타입 안전성
- Element 타입별 특화된 기능 제공

### 3. **메모리 최적화**
- 자동 정리로 메모리 누수 방지
- Stale element 자동 탐지 및 제거

### 4. **React 통합**
- React의 선언적 패턴과 완벽한 통합
- Hook 기반 API로 재사용성 극대화

### 5. **디버깅 지원**
- 개발 도구로 element 상태 실시간 모니터링
- Element 메타데이터 및 생명주기 추적

## 소스 코드

이 예제의 완전한 소스 코드는 `/examples/element-management/` 디렉터리에서 확인할 수 있습니다:

- `core-element-registry.ts` - Core element 관리 시스템
- `react-element-hooks.tsx` - React 통합 hooks 및 컴포넌트
- `integration-example.tsx` - 실제 사용 예제
- `README.md` - 종합적인 문서화

이 예제는 Context-Action 프레임워크가 복잡한 DOM element 관리 시나리오를 어떻게 우아하게 해결하는지 보여주며, Form builder, Canvas editor, 복잡한 UI 등 다양한 실제 사용 사례에 적용할 수 있습니다.