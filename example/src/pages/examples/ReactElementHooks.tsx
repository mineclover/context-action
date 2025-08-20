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
import { createActionContext, useStoreValue, createStore } from '@context-action/react';
import { ElementManager, ElementInfo, ElementActions } from './CoreElementRegistry';

// Store 정의 - HTML elements 저장하지 않고 메타데이터만 저장
interface ElementMetadata {
  id: string;
  type: ElementInfo['type'];
  metadata?: Record<string, any>;
  createdAt: string;
  lastAccessed?: string;
}

// Store 생성 - 개별 store 사용
const elementMetadataStore = createStore<Map<string, ElementMetadata>>('elementMetadata', new Map());
const focusedElementStore = createStore<string | null>('focusedElement', null);
const selectedElementsStore = createStore<string[]>('selectedElements', []);

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
    <ElementActionProvider>
      <ElementManagerInitializer enablePeriodicCleanup={enablePeriodicCleanup}>
        {children}
      </ElementManagerInitializer>
    </ElementActionProvider>
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
  
  const dispatch = useElementAction();
  const managerRef = useRef<ElementManager | null>(null);

  // ElementManager 초기화
  useEffect(() => {
    const manager = new ElementManager();
    managerRef.current = manager;

    // 전역 객체에 manager 참조 저장 (React hooks에서 접근 가능하도록)
    (window as any).__elementManager = manager;

    return () => {
      manager.dispose();
      managerRef.current = null;
      delete (window as any).__elementManager;
    };
  }, []);

  // Action handlers 등록
  useElementActionHandler('registerElement', useCallback(async (payload) => {
    console.log('[ElementManagerInitializer] registerElement handler called', payload);
    const manager = managerRef.current;
    if (!manager) {
      console.error('[ElementManagerInitializer] Manager not initialized');
      return;
    }

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
    
    console.log('[ElementManagerInitializer] Updating stores', { 
      metadataCount: metadataMap.size, 
      focusedElement: registry.focusedElement, 
      selectedElements: registry.selectedElements 
    });
    elementMetadataStore.setValue(metadataMap);
    focusedElementStore.setValue(registry.focusedElement || null);
    selectedElementsStore.setValue(registry.selectedElements);
  }, []));

  useElementActionHandler('unregisterElement', useCallback(async (payload) => {
    console.log('[ElementManagerInitializer] unregisterElement handler called', payload);
    
    // Store에서 메타데이터 제거
    const currentMetadata = elementMetadataStore.getValue();
    const newMetadata = new Map(currentMetadata);
    
    if (newMetadata.has(payload.id)) {
      newMetadata.delete(payload.id);
      console.log('[ElementManagerInitializer] Removing element from metadata store', { 
        elementId: payload.id,
        totalElements: newMetadata.size
      });
      elementMetadataStore.setValue(newMetadata);
    }
    
    // Focus 및 selection에서도 제거
    const currentFocused = focusedElementStore.getValue();
    if (currentFocused === payload.id) {
      focusedElementStore.setValue(null);
    }
    
    const currentSelected = selectedElementsStore.getValue();
    if (currentSelected.includes(payload.id)) {
      selectedElementsStore.setValue(currentSelected.filter(id => id !== payload.id));
    }
  }, []));

  useElementActionHandler('focusElement', useCallback(async (payload) => {
    const manager = managerRef.current;
    if (!manager) return;

    await manager.focusElement(payload.id);
    
    // Store 업데이트
    const registry = manager.getRegistry();
    focusedElementStore.setValue(registry.focusedElement || null);
  }, []));

  useElementActionHandler('selectElements', useCallback(async (payload) => {
    const manager = managerRef.current;
    if (!manager) return;

    await manager.selectElements(payload.ids);
    
    // Store 업데이트
    const registry = manager.getRegistry();
    selectedElementsStore.setValue(registry.selectedElements);
  }, []));

  useElementActionHandler('clearSelection', useCallback(async () => {
    const manager = managerRef.current;
    if (!manager) return;

    // Registry에서 선택 해제
    const registry = manager.getRegistry();
    registry.selectedElements.length = 0;
    selectedElementsStore.setValue([]);
  }, []));

  // Store 업데이트를 위한 액션 핸들러 (HTMLElement 없이)
  useElementActionHandler('updateElementStores', useCallback(async (payload) => {
    const manager = managerRef.current;
    if (!manager) return;

    console.log('[ElementManagerInitializer] updateElementStores handler called', payload);
    
    // ElementManager에서 현재 registry 상태를 가져와 store 업데이트
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
    
    console.log('[ElementManagerInitializer] Updating stores after direct manager call', { 
      metadataCount: metadataMap.size, 
      focusedElement: registry.focusedElement, 
      selectedElements: registry.selectedElements 
    });
    elementMetadataStore.setValue(metadataMap);
    focusedElementStore.setValue(registry.focusedElement || null);
    selectedElementsStore.setValue(registry.selectedElements);
  }, []));

  // 메타데이터만 등록하는 액션 핸들러 (HTMLElement 제외)
  useElementActionHandler('registerElementMetadata', useCallback(async (payload) => {
    console.log('[ElementManagerInitializer] registerElementMetadata handler called', payload);
    
    // DOM에서 실제 element 찾기
    const element = document.querySelector(`[data-element-id="${payload.id}"]`) as HTMLElement;
    if (!element) {
      console.error(`[ElementManagerInitializer] Element with id "${payload.id}" not found in DOM`);
      return;
    }

    // Store에만 메타데이터 저장
    const currentMetadata = elementMetadataStore.getValue();
    const newMetadata = new Map(currentMetadata);
    
    newMetadata.set(payload.id, {
      id: payload.id,
      type: payload.type,
      metadata: payload.metadata,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    });
    
    console.log('[ElementManagerInitializer] Updating metadata store', { 
      elementId: payload.id,
      type: payload.type,
      totalElements: newMetadata.size
    });
    elementMetadataStore.setValue(newMetadata);
  }, []));

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

  const refCallback = useCallback<RefCallback<HTMLElement>>((element) => {
    if (element) {
      // Element 등록 - ActionRegister 완전 우회
      console.log(`[useElementRef] Registering element: ${id}`, { element, type, metadata });
      
      // DOM에 직접 data 속성 추가
      element.setAttribute('data-element-id', id);
      element.setAttribute('data-element-type', type);
      if (metadata) {
        element.setAttribute('data-element-metadata', JSON.stringify(metadata));
      }
      
      // Store에 메타데이터만 추가 (HTMLElement 없이)
      dispatch('registerElementMetadata', { id, type, metadata });
    } else {
      // Element 해제
      console.log(`[useElementRef] Unregistering element: ${id}`);
      dispatch('unregisterElement', { id });
    }
  }, [dispatch, id, type, metadata]);

  return refCallback;
}

/**
 * Element 정보 조회 hook
 */
export function useElementInfo(id: string): ElementMetadata | null {
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
  }, [focusedElementId]);

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

  const registerElement = useCallback((
    id: string, 
    element: HTMLElement, 
    type: ElementInfo['type'], 
    metadata?: Record<string, any>
  ) => {
    // DOM에 직접 data 속성 추가
    element.setAttribute('data-element-id', id);
    element.setAttribute('data-element-type', type);
    if (metadata) {
      element.setAttribute('data-element-metadata', JSON.stringify(metadata));
    }
    
    // Store에 메타데이터만 추가 (HTMLElement 없이)
    dispatch('registerElementMetadata', { id, type, metadata });
  }, [dispatch]);

  const unregisterElement = useCallback((id: string) => {
    // DOM에서 element를 찾아 data 속성 제거
    const element = document.querySelector(`[data-element-id="${id}"]`) as HTMLElement;
    if (element) {
      element.removeAttribute('data-element-id');
      element.removeAttribute('data-element-type');
      element.removeAttribute('data-element-metadata');
    }
    
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