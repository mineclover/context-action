/**
 * @fileoverview React Element Management Hooks and Components
 * Context-Action 프레임워크를 활용한 React DOM element 관리 시스템
 */

import React, { 
  useRef, 
  useEffect, 
  useCallback, 
  useMemo,
  createContext,
  useContext,
  ReactNode,
  RefCallback,
  MutableRefObject
} from 'react';
import { createActionContext, useStoreValue } from '@context-action/react';
import { createDeclarativeStorePattern } from '@context-action/react';
import { ElementManager, ElementInfo, ElementActions } from './core-element-registry';

// Store 정의 - HTML elements 저장하지 않고 메타데이터만 저장
interface ElementMetadata {
  id: string;
  type: ElementInfo['type'];
  metadata?: Record<string, any>;
  createdAt: string;
  lastAccessed?: string;
}

const {
  Provider: ElementStoreProvider,
  useStore: useElementStore,
  useStoreManager: useElementStoreManager
} = createDeclarativeStorePattern('ElementManagement', {
  elementMetadata: { 
    initialValue: new Map<string, ElementMetadata>() as Map<string, ElementMetadata>
  },
  focusedElement: { 
    initialValue: null as string | null 
  },
  selectedElements: { 
    initialValue: [] as string[] 
  }
});

// Action Context 정의
const {
  Provider: ElementActionProvider,
  useActionDispatch: useElementAction,
  useActionHandler: useElementActionHandler
} = createActionContext<ElementActions>('ElementActions');

// Combined Provider Component
interface ElementManagementProviderProps {
  children: ReactNode;
  enablePeriodicCleanup?: boolean;
}

export function ElementManagementProvider({ 
  children, 
  enablePeriodicCleanup = true 
}: ElementManagementProviderProps) {
  return (
    <ElementStoreProvider>
      <ElementActionProvider>
        <ElementManagerInitializer enablePeriodicCleanup={enablePeriodicCleanup}>
          {children}
        </ElementManagerInitializer>
      </ElementActionProvider>
    </ElementStoreProvider>
  );
}

// ElementManager 초기화 컴포넌트
function ElementManagerInitializer({ 
  children, 
  enablePeriodicCleanup 
}: { 
  children: ReactNode;
  enablePeriodicCleanup: boolean;
}) {
  const elementMetadataStore = useElementStore('elementMetadata');
  const focusedElementStore = useElementStore('focusedElement');
  const selectedElementsStore = useElementStore('selectedElements');
  
  const dispatch = useElementAction();
  const managerRef = useRef<ElementManager | null>(null);

  // ElementManager 초기화
  useEffect(() => {
    const manager = new ElementManager();
    managerRef.current = manager;

    return () => {
      manager.dispose();
      managerRef.current = null;
    };
  }, []);

  // Action handlers 등록
  useElementActionHandler('registerElement', useCallback(async (payload) => {
    const manager = managerRef.current;
    if (!manager) return;

    await manager.registerElement(payload.id, payload.element, payload.type, payload.metadata);
    
    // Store에는 메타데이터만 저장 (HTML elements 제외)
    const registry = manager.getRegistry();
    const metadataMap = new Map<string, ElementMetadata>();
    
    for (const [id, elementInfo] of registry.elements.entries()) {
      metadataMap.set(id, {
        id: elementInfo.id,
        type: elementInfo.type,
        metadata: elementInfo.metadata,
        createdAt: elementInfo.createdAt.toISOString(),
        lastAccessed: elementInfo.lastAccessed?.toISOString()
      });
    }
    
    elementMetadataStore.setValue(metadataMap);
    focusedElementStore.setValue(registry.focusedElement || null);
    selectedElementsStore.setValue(registry.selectedElements);
  }, [elementMetadataStore, focusedElementStore, selectedElementsStore]));

  useElementActionHandler('unregisterElement', useCallback(async (payload) => {
    const manager = managerRef.current;
    if (!manager) return;

    await manager.unregisterElement(payload.id);
    
    // Store에는 메타데이터만 저장 (HTML elements 제외)
    const registry = manager.getRegistry();
    const metadataMap = new Map<string, ElementMetadata>();
    
    for (const [id, elementInfo] of registry.elements.entries()) {
      metadataMap.set(id, {
        id: elementInfo.id,
        type: elementInfo.type,
        metadata: elementInfo.metadata,
        createdAt: elementInfo.createdAt.toISOString(),
        lastAccessed: elementInfo.lastAccessed?.toISOString()
      });
    }
    
    elementMetadataStore.setValue(metadataMap);
    focusedElementStore.setValue(registry.focusedElement || null);
    selectedElementsStore.setValue(registry.selectedElements);
  }, [elementMetadataStore, focusedElementStore, selectedElementsStore]));

  useElementActionHandler('focusElement', useCallback(async (payload) => {
    const manager = managerRef.current;
    if (!manager) return;

    await manager.focusElement(payload.id);
    
    // Store 업데이트
    const registry = manager.getRegistry();
    focusedElementStore.setValue(registry.focusedElement || null);
  }, [focusedElementStore]));

  useElementActionHandler('selectElements', useCallback(async (payload) => {
    const manager = managerRef.current;
    if (!manager) return;

    await manager.selectElements(payload.ids);
    
    // Store 업데이트
    const registry = manager.getRegistry();
    selectedElementsStore.setValue(registry.selectedElements);
  }, [selectedElementsStore]));

  useElementActionHandler('clearSelection', useCallback(async () => {
    const manager = managerRef.current;
    if (!manager) return;

    // Registry에서 선택 해제
    const registry = manager.getRegistry();
    registry.selectedElements.length = 0;
    selectedElementsStore.setValue([]);
  }, [selectedElementsStore]));

  return <>{children}</>;
}

// Custom Hooks

/**
 * Element 등록을 위한 ref hook
 */
export function useElementRef(
  id: string,
  type: ElementInfo['type'],
  metadata?: Record<string, any>
): RefCallback<HTMLElement> {
  const dispatch = useElementAction();
  const elementStore = useElementStore('elementMetadata');

  const refCallback = useCallback<RefCallback<HTMLElement>>((element) => {
    if (element) {
      // Element 등록
      dispatch('registerElement', { id, element, type, metadata });
    } else {
      // Element 해제 - 항상 dispatch하여 관리자가 처리하도록
      dispatch('unregisterElement', { id });
    }
  }, [dispatch, id, type, metadata]);

  return refCallback;
}

/**
 * Element 정보 조회 hook
 */
export function useElementInfo(id: string): ElementMetadata | null {
  const elementMetadataStore = useElementStore('elementMetadata');
  const elementsRaw = useStoreValue(elementMetadataStore);
  
  return useMemo(() => {
    // Handle case where Map was converted to object during JSON cloning
    if (elementsRaw instanceof Map) {
      return elementsRaw.get(id) || null;
    } else {
      return (elementsRaw as Record<string, ElementMetadata>)[id] || null;
    }
  }, [elementsRaw, id]);
}

/**
 * 모든 등록된 elements 조회 hook
 */
export function useElements(): Map<string, ElementMetadata> {
  const elementMetadataStore = useElementStore('elementMetadata');
  const elementsRaw = useStoreValue(elementMetadataStore);
  
  // Handle case where Map was converted to object during JSON cloning
  if (elementsRaw instanceof Map) {
    return elementsRaw;
  } else {
    // Convert object back to Map
    return new Map(Object.entries(elementsRaw as Record<string, ElementMetadata>));
  }
}

/**
 * 특정 타입의 elements 조회 hook
 */
export function useElementsByType(type: ElementInfo['type']): ElementMetadata[] {
  const elementMetadataStore = useElementStore('elementMetadata');
  const elementsRaw = useStoreValue(elementMetadataStore);
  
  return useMemo(() => {
    const result: ElementMetadata[] = [];
    
    // Handle case where Map was converted to object during JSON cloning
    if (elementsRaw instanceof Map) {
      for (const elementMetadata of elementsRaw.values()) {
        if (elementMetadata.type === type) {
          result.push(elementMetadata);
        }
      }
    } else {
      for (const elementMetadata of Object.values(elementsRaw as Record<string, ElementMetadata>)) {
        if (elementMetadata.type === type) {
          result.push(elementMetadata);
        }
      }
    }
    
    return result;
  }, [elementsRaw, type]);
}

/**
 * Focus 관리 hook
 */
export function useFocusedElement(): {
  focusedElementId: string | null;
  focusElement: (id: string) => void;
  clearFocus: () => void;
} {
  const focusedElementStore = useElementStore('focusedElement');
  const dispatch = useElementAction();

  const focusedElementId = useStoreValue(focusedElementStore);

  const focusElement = useCallback((id: string) => {
    dispatch('focusElement', { id });
  }, [dispatch]);

  const clearFocus = useCallback(() => {
    if (focusedElementId) {
      // DOM에서 직접 element를 찾아 blur 처리
      const element = document.querySelector(`[data-element-id="${focusedElementId}"]`) as HTMLElement;
      if (element) {
        element.blur();
      }
    }
    focusedElementStore.setValue(null);
  }, [focusedElementId, focusedElementStore]);

  return { focusedElementId, focusElement, clearFocus };
}

/**
 * Selection 관리 hook
 */
export function useElementSelection(): {
  selectedElements: string[];
  selectElements: (ids: string[]) => void;
  selectElement: (id: string) => void;
  toggleElement: (id: string) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
} {
  const selectedElementsStore = useElementStore('selectedElements');
  const dispatch = useElementAction();

  const selectedElements = useStoreValue(selectedElementsStore);

  const selectElements = useCallback((ids: string[]) => {
    dispatch('selectElements', { ids });
  }, [dispatch]);

  const selectElement = useCallback((id: string) => {
    dispatch('selectElements', { ids: [id] });
  }, [dispatch]);

  const toggleElement = useCallback((id: string) => {
    const newSelection = selectedElements.includes(id) 
      ? selectedElements.filter(selectedId => selectedId !== id)
      : [...selectedElements, id];
    dispatch('selectElements', { ids: newSelection });
  }, [selectedElements, dispatch]);

  const clearSelection = useCallback(() => {
    dispatch('clearSelection');
  }, [dispatch]);

  const isSelected = useCallback((id: string) => {
    return selectedElements.includes(id);
  }, [selectedElements]);

  return {
    selectedElements,
    selectElements,
    selectElement,
    toggleElement,
    clearSelection,
    isSelected
  };
}

/**
 * Element 관리를 위한 종합 hook
 */
export function useElementManager(): {
  registerElement: (id: string, element: HTMLElement, type: ElementInfo['type'], metadata?: Record<string, any>) => void;
  unregisterElement: (id: string) => void;
  getElement: (id: string) => ElementMetadata | null;
  getAllElements: () => Map<string, ElementMetadata>;
  getElementsByType: (type: ElementInfo['type']) => ElementMetadata[];
} {
  const dispatch = useElementAction();
  const elementMetadataStore = useElementStore('elementMetadata');

  const registerElement = useCallback((
    id: string, 
    element: HTMLElement, 
    type: ElementInfo['type'], 
    metadata?: Record<string, any>
  ) => {
    dispatch('registerElement', { id, element, type, metadata });
  }, [dispatch]);

  const unregisterElement = useCallback((id: string) => {
    dispatch('unregisterElement', { id });
  }, [dispatch]);

  const elementsRaw = useStoreValue(elementMetadataStore);

  const getElement = useCallback((id: string): ElementMetadata | null => {
    // Handle case where Map was converted to object during JSON cloning
    if (elementsRaw instanceof Map) {
      return elementsRaw.get(id) || null;
    } else {
      return (elementsRaw as Record<string, ElementMetadata>)[id] || null;
    }
  }, [elementsRaw]);

  const getAllElements = useCallback((): Map<string, ElementMetadata> => {
    // Handle case where Map was converted to object during JSON cloning
    if (elementsRaw instanceof Map) {
      return elementsRaw;
    } else {
      return new Map(Object.entries(elementsRaw as Record<string, ElementMetadata>));
    }
  }, [elementsRaw]);

  const getElementsByType = useCallback((type: ElementInfo['type']): ElementMetadata[] => {
    const result: ElementMetadata[] = [];
    
    // Handle case where Map was converted to object during JSON cloning
    if (elementsRaw instanceof Map) {
      for (const elementMetadata of elementsRaw.values()) {
        if (elementMetadata.type === type) {
          result.push(elementMetadata);
        }
      }
    } else {
      for (const elementMetadata of Object.values(elementsRaw as Record<string, ElementMetadata>)) {
        if (elementMetadata.type === type) {
          result.push(elementMetadata);
        }
      }
    }
    
    return result;
  }, [elementsRaw]);

  return {
    registerElement,
    unregisterElement,
    getElement,
    getAllElements,
    getElementsByType
  };
}

// Higher-Order Component for automatic element registration
export function withElementRegistration<P extends {}>(
  WrappedComponent: React.ComponentType<P & { ref?: React.Ref<HTMLElement> }>,
  elementId: string,
  elementType: ElementInfo['type'],
  metadata?: Record<string, any>
) {
  return React.forwardRef<HTMLElement, P>((props, forwardedRef) => {
    const elementRef = useElementRef(elementId, elementType, metadata);
    
    const combinedRef = useCallback((element: HTMLElement | null) => {
      elementRef(element);
      if (typeof forwardedRef === 'function') {
        forwardedRef(element);
      } else if (forwardedRef) {
        forwardedRef.current = element;
      }
    }, [elementRef, forwardedRef]);

    return <WrappedComponent {...props as P & { ref?: React.Ref<HTMLElement> }} ref={combinedRef} />;
  });
}

// Example Components

/**
 * 자동으로 element가 등록되는 Input 컴포넌트
 */
export const ManagedInput = React.forwardRef<HTMLInputElement, 
  React.InputHTMLAttributes<HTMLInputElement> & { 
    elementId: string; 
    metadata?: Record<string, any> 
  }
>(({ elementId, metadata, ...inputProps }, forwardedRef) => {
  const elementRef = useElementRef(elementId, 'input', metadata);
  
  const combinedRef = useCallback((element: HTMLInputElement | null) => {
    elementRef(element);
    if (typeof forwardedRef === 'function') {
      forwardedRef(element);
    } else if (forwardedRef) {
      forwardedRef.current = element;
    }
  }, [elementRef, forwardedRef]);

  return <input {...inputProps} ref={combinedRef} />;
});

/**
 * 자동으로 element가 등록되는 Button 컴포넌트
 */
export const ManagedButton = React.forwardRef<HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { 
    elementId: string; 
    metadata?: Record<string, any> 
  }
>(({ elementId, metadata, children, ...buttonProps }, forwardedRef) => {
  const elementRef = useElementRef(elementId, 'button', metadata);
  
  const combinedRef = useCallback((element: HTMLButtonElement | null) => {
    elementRef(element);
    if (typeof forwardedRef === 'function') {
      forwardedRef(element);
    } else if (forwardedRef) {
      forwardedRef.current = element;
    }
  }, [elementRef, forwardedRef]);

  return (
    <button {...buttonProps} ref={combinedRef}>
      {children}
    </button>
  );
});

/**
 * Element 관리 상태를 보여주는 Debug 컴포넌트
 */
export function ElementDebugPanel(): JSX.Element {
  const elementsMetadata = useElements();
  const { focusedElementId } = useFocusedElement();
  const { selectedElements } = useElementSelection();

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 p-4 rounded-lg shadow-lg text-sm max-h-96 overflow-auto z-50">
      <h3 className="font-bold text-lg mb-2">Element Management Debug</h3>
      
      <div className="mb-2">
        <strong>Total Elements:</strong> {elementsMetadata.size}
      </div>
      
      <div className="mb-2">
        <strong>Focused:</strong> {focusedElementId || 'None'}
      </div>
      
      <div className="mb-2">
        <strong>Selected:</strong> {selectedElements.length > 0 ? selectedElements.join(', ') : 'None'}
      </div>
      
      <div>
        <strong>Elements:</strong>
        <ul className="mt-1 pl-4">
          {Array.from(elementsMetadata.values()).map(elementMetadata => (
            <li key={elementMetadata.id} className="text-xs">
              {elementMetadata.id} ({elementMetadata.type})
              {elementMetadata.metadata && Object.keys(elementMetadata.metadata).length > 0 && (
                <span className="text-gray-500">
                  {' '}- {JSON.stringify(elementMetadata.metadata)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}