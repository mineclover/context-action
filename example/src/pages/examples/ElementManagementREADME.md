# DOM Element Management with Context-Action

이 예제는 Context-Action 프레임워크를 사용하여 React 및 Core 패키지에서 DOM element를 효과적으로 관리하는 방법을 보여줍니다.

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [파일 구조](#파일-구조)
- [사용법](#사용법)
- [API 레퍼런스](#api-레퍼런스)
- [실제 사용 시나리오](#실제-사용-시나리오)

## 🎯 개요

DOM element 관리는 복잡한 React 애플리케이션에서 중요한 과제입니다. 이 예제는 Context-Action 프레임워크의 **Action Pipeline**과 **Store Pattern**을 활용하여 다음을 제공합니다:

- **중앙화된 Element Registry**: 모든 DOM elements를 중앙에서 관리
- **Type-safe Element Management**: TypeScript를 활용한 타입 안전성
- **Reactive State Management**: Element 상태 변경에 대한 실시간 반응
- **Lifecycle Management**: Element 등록/해제의 자동화
- **Focus & Selection Management**: 포커스와 선택 상태 관리

## ✨ 주요 기능

### Core 패키지 기능
- **ElementManager 클래스**: 중앙화된 element lifecycle 관리
- **Action-based API**: 모든 element 작업이 action을 통해 수행
- **Automatic Cleanup**: DOM에서 제거된 element들의 자동 정리
- **Metadata Support**: Element별 커스텀 메타데이터 지원

### React 패키지 기능
- **useElementRef Hook**: Element 자동 등록을 위한 ref hook
- **Focus Management**: `useFocusedElement` hook으로 포커스 상태 관리
- **Selection Management**: `useElementSelection` hook으로 다중 선택 지원
- **Type-based Queries**: `useElementsByType`으로 타입별 element 조회
- **Managed Components**: 자동으로 등록되는 `ManagedInput`, `ManagedButton` 컴포넌트

## 📁 파일 구조

```
element-management/
├── core-element-registry.ts     # Core element management system
├── react-element-hooks.tsx      # React integration hooks and components
├── integration-example.tsx      # Real-world usage examples
└── README.md                   # This documentation
```

## 🚀 사용법

### 1. 기본 설정

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
      placeholder="Enter username"
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

### 5. Managed Components 사용

```tsx
import { ManagedInput, ManagedButton } from './react-element-hooks';

function ManagedForm() {
  return (
    <form>
      <ManagedInput
        elementId="email"
        metadata={{ required: true, type: 'email' }}
        type="email"
        placeholder="Enter email"
      />
      
      <ManagedButton
        elementId="submit"
        metadata={{ formRole: 'submit' }}
        type="submit"
      >
        Submit
      </ManagedButton>
    </form>
  );
}
```

## 📖 API 레퍼런스

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

  // Multiple elements 선택
  async selectElements(ids: string[]): Promise<void>

  // Registry 상태 조회
  getRegistry(): Readonly<ElementRegistry>

  // 리소스 해제
  dispose(): void
}
```

### React Hooks

#### useElementRef
Element 자동 등록을 위한 ref hook

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

## 🎨 실제 사용 시나리오

### 1. Form Builder (integration-example.tsx)

동적 폼 빌더 애플리케이션에서의 element 관리:

```tsx
// 사용 예시
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
- 동적으로 폼 필드 추가/제거
- 클릭으로 필드 선택, Cmd/Ctrl+클릭으로 다중 선택
- 선택된 필드들 일괄 삭제
- 실시간 element 상태 모니터링
- 키보드 단축키 지원

### 2. Canvas Management

Canvas 기반 그래픽 에디터에서의 element 관리:

```tsx
function CanvasManagementExample() {
  return (
    <ElementManagementProvider>
      <CanvasApp />
    </ElementManagementProvider>
  );
}
```

**기능:**
- Canvas element 등록 및 상태 관리
- Canvas 내 그래픽 객체들과의 연동
- 선택 상태에 따른 도구 패널 표시
- Canvas 메타데이터 관리

## 💡 주요 이점

### 1. **중앙화된 관리**
- 모든 DOM element가 중앙에서 관리되어 일관성 보장
- Element 생명주기의 예측 가능한 관리

### 2. **Type Safety**
- TypeScript를 통한 완전한 타입 안전성
- Element 타입별 특화된 기능 제공

### 3. **메모리 최적화**
- 자동 cleanup으로 메모리 누수 방지
- Stale element 자동 탐지 및 제거

### 4. **React Integration**
- React의 선언적 패턴과 완벽하게 통합
- Hook 기반 API로 재사용성 극대화

### 5. **Debugging 지원**
- 개발 도구로 element 상태 실시간 모니터링
- Element 메타데이터 및 생명주기 추적

## 🔧 고급 사용법

### Custom Element Types

```typescript
// 커스텀 element 타입 정의
type CustomElementType = 'video' | 'audio' | 'chart' | 'widget';

// ElementInfo 확장
interface CustomElementInfo extends ElementInfo {
  type: ElementInfo['type'] | CustomElementType;
  customData?: {
    version: string;
    author: string;
    configuration: Record<string, any>;
  };
}
```

### Element Lifecycle Hooks

```typescript
// Element 등록/해제 시 custom 로직 실행
useEffect(() => {
  const unsubscribe = elementManager.subscribe('elementRegistered', (elementInfo) => {
    console.log('Element registered:', elementInfo);
    // Custom logic here
  });

  return unsubscribe;
}, []);
```

### Performance Optimization

```typescript
// 대량의 element 처리를 위한 배치 작업
const batchRegisterElements = useCallback(async (elements: Array<{
  id: string;
  element: HTMLElement;
  type: ElementInfo['type'];
}>) => {
  // 배치 등록 로직
  for (const { id, element, type } of elements) {
    await elementManager.registerElement(id, element, type);
  }
}, [elementManager]);
```

이 예제를 통해 Context-Action 프레임워크가 복잡한 DOM element 관리 시나리오를 어떻게 우아하게 해결하는지 확인할 수 있습니다.