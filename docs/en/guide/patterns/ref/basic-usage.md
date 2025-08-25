# Ref Basic Usage

Fundamental RefContext pattern with type-safe ref management and zero re-renders.

## Import
```typescript
import { createRefContext } from '@context-action/react';
```

## Features
- ✅ Zero React re-renders for DOM manipulation
- ✅ Hardware-accelerated transforms
- ✅ Type-safe ref management
- ✅ Automatic lifecycle management
- ✅ Perfect separation of concerns
- ✅ Memory efficient with automatic cleanup

## Prerequisites

**Required Reading**: **[RefContext Setup Guide](../setup/ref-context-setup.md)**

This document demonstrates usage patterns using standardized setup patterns:
- **Type definitions** → [DOM Element Refs](../setup/ref-context-setup.md#dom-element-refs)
- **Context creation** → [Basic RefContext Setup](../setup/ref-context-setup.md#basic-refcontext-setup)
- **Provider setup** → [Single RefContext Provider](../setup/ref-context-setup.md#single-refcontext-provider)
- **Initialization patterns** → [Lazy Initialization](../setup/ref-context-setup.md#lazy-initialization)

## Setup Pattern

### Basic Setup

```typescript
import { createRefContext } from '@context-action/react';

// Using the UIRefs pattern from setup guide
const {
  Provider: UIRefProvider,
  useRefHandler: useUIRef,
  useWaitForRefs
} = createRefContext<UIRefs>('UI');
```

### Provider Integration

```typescript
function App() {
  return (
    <UIRefProvider>
      <YourComponents />
    </UIRefProvider>
  );
}
```

### Ref Registration

```typescript
function MyComponent() {
  const modalRef = useUIRef('modal');
  const dropdownRef = useUIRef('dropdown');
  
  return <div ref={modalRef.setRef}>Modal Element</div>;
}
```

## Basic Usage Example

```tsx
// 1. Import UIRefs from setup guide
import { createRefContext } from '@context-action/react';

// UIRefs from setup specification
interface UIRefs {
  modal: HTMLDialogElement;
  dropdown: HTMLDivElement;
  tooltip: HTMLSpanElement;
  sidebar: HTMLElement;
}

// 2. Create RefContext with renaming pattern
const {
  Provider: UIRefProvider,
  useRefHandler: useUIRef
} = createRefContext<UIRefs>('UI');

// 3. Provider setup
function App() {
  return (
    <UIRefProvider>
      <InteractiveUI />
    </UIRefProvider>
  );
}

// 4. Component with direct DOM manipulation
function InteractiveUI() {
  const modal = useUIRef('modal');
  const dropdown = useUIRef('dropdown');
  const tooltip = useUIRef('tooltip');
  
  // Direct DOM manipulation - zero React re-renders!
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!tooltip.target) return;
    
    const x = e.clientX;
    const y = e.clientY;
    
    // Hardware accelerated transforms
    tooltip.target.style.transform = `translate3d(${x + 10}px, ${y - 10}px, 0)`;
    tooltip.target.style.opacity = '1';
  }, [tooltip]);
  
  const handleMouseLeave = useCallback(() => {
    if (!tooltip.target) return;
    tooltip.target.style.opacity = '0';
  }, [tooltip]);
  
  const toggleDropdown = useCallback(() => {
    if (!dropdown.target) return;
    
    // Direct DOM manipulation without re-renders
    const isOpen = dropdown.target.classList.contains('open');
    if (isOpen) {
      dropdown.target.style.transform = 'translateY(-10px)';
      dropdown.target.style.opacity = '0';
      setTimeout(() => dropdown.target?.classList.remove('open'), 150);
    } else {
      dropdown.target.classList.add('open');
      dropdown.target.style.transform = 'translateY(0)';
      dropdown.target.style.opacity = '1';
    }
  }, [dropdown]);
  
  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-96 bg-gray-100 p-4"
    >
      <button
        onClick={toggleDropdown}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Toggle Dropdown
      </button>
      
      <div
        ref={dropdown.setRef}
        className="absolute top-12 left-0 bg-white shadow-lg rounded-md p-4 opacity-0 transform -translate-y-2 transition-all duration-150"
        style={{ transform: 'translateY(-10px)', opacity: 0 }}
      >
        <div className="space-y-2">
          <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer">Option 1</div>
          <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer">Option 2</div>
          <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer">Option 3</div>
        </div>
      </div>
      
      <span
        ref={tooltip.setRef}
        className="fixed bg-black text-white px-2 py-1 rounded text-sm pointer-events-none opacity-0 transition-opacity z-50"
        style={{ transform: 'translate3d(0, 0, 0)' }}
      >
        Interactive Tooltip
      </span>
    </div>
  );
}
```

## Custom Hooks Pattern

```tsx
// Custom hook for UI interaction business logic
function useUIInteractionManager() {
  const modal = useUIRef('modal');
  const tooltip = useUIRef('tooltip');
  const sidebar = useUIRef('sidebar');
  const interactionHistory = useRef<Array<{type: string, timestamp: number}>>([]);
  
  const showModal = useCallback((content: string) => {
    if (!modal.target) return;
    
    // Direct DOM manipulation without re-renders
    modal.target.innerHTML = content;
    modal.target.style.transform = 'scale(0.9)';
    modal.target.style.opacity = '0';
    modal.target.showModal();
    
    // Animate in
    setTimeout(() => {
      if (modal.target) {
        modal.target.style.transform = 'scale(1)';
        modal.target.style.opacity = '1';
        modal.target.style.transition = 'all 0.3s ease-out';
      }
    }, 10);
    
    // Track interaction
    interactionHistory.current.push({ type: 'modal_opened', timestamp: Date.now() });
  }, [modal]);
  
  const hideModal = useCallback(() => {
    if (!modal.target) return;
    
    modal.target.style.transform = 'scale(0.9)';
    modal.target.style.opacity = '0';
    
    setTimeout(() => {
      modal.target?.close();
    }, 300);
    
    interactionHistory.current.push({ type: 'modal_closed', timestamp: Date.now() });
  }, [modal]);
  
  const updateTooltip = useCallback((text: string, x: number, y: number) => {
    if (!tooltip.target) return;
    
    tooltip.target.textContent = text;
    tooltip.target.style.transform = `translate3d(${x + 10}px, ${y - 10}px, 0)`;
    tooltip.target.style.opacity = '1';
  }, [tooltip]);
  
  const toggleSidebar = useCallback((isOpen: boolean) => {
    if (!sidebar.target) return;
    
    sidebar.target.style.transform = isOpen 
      ? 'translateX(0)' 
      : 'translateX(-100%)';
    sidebar.target.style.transition = 'transform 0.3s ease-in-out';
    
    interactionHistory.current.push({ 
      type: isOpen ? 'sidebar_opened' : 'sidebar_closed', 
      timestamp: Date.now() 
    });
  }, [sidebar]);
  
  const getInteractionStats = useCallback(() => {
    const recent = interactionHistory.current.filter(
      interaction => Date.now() - interaction.timestamp < 60000 // Last minute
    );
    return {
      total: interactionHistory.current.length,
      recent: recent.length,
      types: [...new Set(recent.map(i => i.type))]
    };
  }, []);
  
  return { 
    showModal, 
    hideModal, 
    updateTooltip, 
    toggleSidebar, 
    getInteractionStats 
  };
}

// Usage in component
function AdvancedUIManager() {
  const { showModal, hideModal, updateTooltip, toggleSidebar, getInteractionStats } = useUIInteractionManager();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const handleShowModal = useCallback(() => {
    showModal('<h2>Dynamic Content</h2><p>This modal was populated without React re-renders!</p>');
  }, [showModal]);
  
  const handleToggleSidebar = useCallback(() => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    toggleSidebar(newState);
  }, [sidebarOpen, toggleSidebar]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    updateTooltip('Hover tooltip updated via direct DOM manipulation', e.clientX, e.clientY);
  }, [updateTooltip]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const stats = getInteractionStats();
      console.log('UI Interaction Stats:', stats);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [getInteractionStats]);
  
  return (
    <div 
      onMouseMove={handleMouseMove}
      className="w-full h-96 bg-gradient-to-br from-blue-50 to-purple-50 p-4"
    >
      <div className="space-x-4">
        <button 
          onClick={handleShowModal}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Show Modal
        </button>
        <button 
          onClick={handleToggleSidebar}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Toggle Sidebar
        </button>
      </div>
    </div>
  );
}
```

## Available Hooks
- `useRefHandler(name)` - Get typed ref handler by name
- `useWaitForRefs()` - Wait for multiple refs to mount
- `useGetAllRefs()` - Access all mounted refs
- `refHandler.setRef` - Set ref callback
- `refHandler.target` - Access current ref value
- `refHandler.isMounted` - Check mount status
- `refHandler.waitForMount()` - Async ref waiting
- `refHandler.withTarget()` - Safe operations

## Real-World Examples

### Live Examples in Codebase
- **[RefContext Mouse Events Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/mouse-events/ref-context/RefContextMouseEventsPage.tsx)** - Complete mouse tracking with RefContext
- **[Canvas Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/refs/CanvasRefDemoPage.tsx)** - Canvas drawing with direct DOM manipulation
- **[Form Builder Demo](https://github.com/mineclover/context-action/blob/main/example/src/pages/refs/FormBuilderRefDemoPage.tsx)** - Dynamic form builder with refs
- **[Element Management Page](https://github.com/mineclover/context-action/blob/main/example/src/pages/examples/ElementManagementPage.tsx)** - Complex element management
- **[Visual Effects Context](https://github.com/mineclover/context-action/blob/main/example/src/pages/mouse-events/ref-context/contexts/VisualEffectsRefContext.tsx)** - Visual effects with RefContext
- **[Performance Context](https://github.com/mineclover/context-action/blob/main/example/src/pages/mouse-events/ref-context/contexts/PerformanceRefContext.tsx)** - Performance monitoring with refs

## Best Practices

1. **Hardware Acceleration**: Use `translate3d()` for GPU-accelerated animations
2. **Avoid React Re-renders**: Keep DOM manipulation outside React's render cycle
3. **Separation of Concerns**: Use custom hooks for business logic
4. **Type Safety**: Define clear ref type interfaces with proper HTML element types
5. **Performance First**: Prioritize 60fps performance over convenience