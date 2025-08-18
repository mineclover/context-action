# DOM Element Management

Advanced example demonstrating comprehensive DOM element management using the Context-Action framework.

## Overview

This example showcases how to effectively manage DOM elements in both React and Core packages using Context-Action's **Action Pipeline** and **Store Pattern**. It provides:

- **Centralized Element Registry**: All DOM elements managed from a central location
- **Type-safe Element Management**: Full TypeScript support for element operations
- **Reactive State Management**: Real-time reactions to element state changes
- **Lifecycle Management**: Automated element registration/cleanup
- **Focus & Selection Management**: Built-in focus and selection state management

## Key Features

### Core Package Features
- **ElementManager Class**: Centralized DOM element lifecycle management
- **Action-based API**: All element operations performed through action pipeline
- **Automatic Cleanup**: Periodic cleanup of removed DOM elements
- **Type-safe Management**: Complete type safety using TypeScript

### React Package Features
- **useElementRef Hook**: Hook for automatic element registration
- **Focus Management**: `useFocusedElement` hook for focus state management
- **Selection Management**: `useElementSelection` hook for multi-selection support
- **Type-based Queries**: `useElementsByType` for type-specific element queries
- **Managed Components**: Auto-registering `ManagedInput`, `ManagedButton` components

## Basic Usage

### 1. Setup

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

### 2. Element Registration & Management

```tsx
import { useElementRef, useElementManager } from './react-element-hooks';

function MyComponent() {
  // Create ref that automatically registers element
  const inputRef = useElementRef('user-input', 'input', {
    required: true,
    label: 'Username'
  });

  // Use element management API
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

### 3. Focus Management

```tsx
import { useFocusedElement } from './react-element-hooks';

function FocusController() {
  const { focusedElementId, focusElement, clearFocus } = useFocusedElement();

  return (
    <div>
      <p>Currently focused: {focusedElementId || 'None'}</p>
      <button onClick={() => focusElement('user-input')}>
        Focus Input
      </button>
      <button onClick={clearFocus}>
        Clear Focus
      </button>
    </div>
  );
}
```

### 4. Selection Management

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
      <p>Selected elements: {selectedElements.join(', ')}</p>
      
      <button onClick={() => selectElement('input1')}>
        Select Input1
      </button>
      
      <button onClick={() => selectElements(['input1', 'button1'])}>
        Multi Select
      </button>
      
      <button onClick={() => toggleElement('input2')}>
        Toggle Input2
      </button>
      
      <button onClick={clearSelection}>
        Clear Selection
      </button>
    </div>
  );
}
```

## Real-world Scenarios

### Form Builder Application

Dynamic form builder with element management:

```tsx
function FormBuilderExample() {
  return (
    <ElementManagementProvider>
      <FormBuilderApp />
      <ElementDebugPanel /> {/* Development debug panel */}
    </ElementManagementProvider>
  );
}
```

**Features:**
- Dynamic form field addition/removal
- Click to select fields, Cmd/Ctrl+Click for multi-selection
- Bulk deletion of selected fields
- Real-time element state monitoring
- Keyboard shortcut support

### Canvas Management

Canvas-based graphic editor with element management:

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

**Features:**
- Canvas element registration and state management
- Integration with graphic objects within canvas
- Tool panel display based on selection state
- Canvas metadata management

## API Reference

### Core API

#### ElementManager

```typescript
class ElementManager {
  // Register element
  async registerElement(
    id: string, 
    element: HTMLElement, 
    type: ElementInfo['type'], 
    metadata?: Record<string, any>
  ): Promise<void>

  // Unregister element
  async unregisterElement(id: string): Promise<void>

  // Focus element
  async focusElement(id: string): Promise<void>

  // Select multiple elements
  async selectElements(ids: string[]): Promise<void>

  // Get registry state
  getRegistry(): Readonly<ElementRegistry>

  // Dispose resources
  dispose(): void
}
```

### React Hooks

#### useElementRef
Hook for automatic element registration

```typescript
function useElementRef(
  id: string,
  type: ElementInfo['type'],
  metadata?: Record<string, any>
): RefCallback<HTMLElement>
```

#### useElementManager
Comprehensive element management hook

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
Focus management hook

```typescript
function useFocusedElement(): {
  focusedElementId: string | null;
  focusElement: (id: string) => void;
  clearFocus: () => void;
}
```

#### useElementSelection
Selection management hook

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

## Key Benefits

### 1. **Centralized Management**
- All DOM elements managed from a central location for consistency
- Predictable element lifecycle management

### 2. **Type Safety**
- Complete type safety through TypeScript
- Type-specific specialized features for each element type

### 3. **Memory Optimization**
- Automatic cleanup prevents memory leaks
- Automatic detection and removal of stale elements

### 4. **React Integration**
- Perfect integration with React's declarative patterns
- Hook-based API maximizes reusability

### 5. **Debugging Support**
- Real-time element state monitoring with development tools
- Element metadata and lifecycle tracking

## Source Code

The complete source code for this example is available in the `/examples/element-management/` directory:

- `core-element-registry.ts` - Core element management system
- `react-element-hooks.tsx` - React integration hooks and components
- `integration-example.tsx` - Real-world usage examples
- `README.md` - Comprehensive documentation

This example demonstrates how the Context-Action framework elegantly solves complex DOM element management scenarios, applicable to various real-world use cases like form builders, canvas editors, and complex UIs.