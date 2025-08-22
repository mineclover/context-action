/**
 * @fileoverview React Element Management Hooks and Components
 * Re-exports from CoreElementRegistry for backward compatibility
 */

import React, { RefCallback } from 'react';
import { 
  ElementManagementProvider as CoreElementManagementProvider,
  useElementManager as CoreUseElementManager,
  useElementRef as CoreUseElementRef,
  useCanvasRef,
  useInputRef,
  useButtonRef,
  useContainerRef,
  useMediaRef,
  useCustomRef,
  ElementInfo,
  ElementActions
} from './CoreElementRegistry';

// Re-export types for compatibility
export type { ElementInfo, ElementActions };

// Element metadata type for legacy compatibility
interface ElementMetadata {
  id: string;
  type: ElementInfo['type'];
  metadata?: Record<string, any>;
  createdAt: string;
  lastAccessed?: string;
}

// Re-export the new ElementManagementProvider
export const ElementManagementProvider = CoreElementManagementProvider;

// Legacy compatible hooks that wrap the new implementation
export function useElementRef(
  id: string,
  type: ElementInfo['type'],
  metadata?: Record<string, any>
): RefCallback<HTMLElement> {
  const refHandler = CoreUseElementRef(id);
  
  return React.useCallback<RefCallback<HTMLElement>>((element) => {
    if (element) {
      // Set metadata attributes for compatibility
      element.setAttribute('data-element-id', id);
      element.setAttribute('data-element-type', type);
      if (metadata) {
        element.setAttribute('data-element-metadata', JSON.stringify(metadata));
      }
    }
    refHandler.setRef(element);
  }, [refHandler, id, type, metadata]);
}

export function useElementManager() {
  return CoreUseElementManager();
}

// Legacy compatible metadata hooks (limited functionality)
export function useElementInfo(id: string): ElementMetadata | null {
  const manager = CoreUseElementManager();
  const element = manager.getElement(id) as HTMLElement;
  
  if (!element) return null;
  
  return {
    id,
    type: (element.getAttribute('data-element-type') as ElementInfo['type']) || 'custom',
    metadata: element.getAttribute('data-element-metadata') 
      ? JSON.parse(element.getAttribute('data-element-metadata')!) 
      : undefined,
    createdAt: new Date().toISOString(),
    lastAccessed: new Date().toISOString()
  };
}

export function useElements(): Map<string, ElementMetadata> {
  const manager = CoreUseElementManager();
  
  return React.useMemo(() => {
    const allElements = manager.getAllElements();
    const result = new Map<string, ElementMetadata>();
    
    Object.entries(allElements).forEach(([id, element]) => {
      const htmlElement = element as HTMLElement;
      result.set(id, {
        id,
        type: (htmlElement.getAttribute('data-element-type') as ElementInfo['type']) || 'custom',
        metadata: htmlElement.getAttribute('data-element-metadata') 
          ? JSON.parse(htmlElement.getAttribute('data-element-metadata')!) 
          : undefined,
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      });
    });
    
    return result;
  }, [manager]);
}

export function useElementsByType(type: ElementInfo['type']): ElementMetadata[] {
  const manager = CoreUseElementManager();
  
  return React.useMemo(() => {
    const elementsByType = manager.getElementsByType(type);
    
    return elementsByType.map(({ id, element }) => ({
      id,
      type,
      metadata: (element as HTMLElement).getAttribute('data-element-metadata') 
        ? JSON.parse((element as HTMLElement).getAttribute('data-element-metadata')!) 
        : undefined,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    }));
  }, [manager, type]);
}

// Simple stubs for focus and selection (limited functionality)
export function useFocusedElement() {
  const manager = CoreUseElementManager();
  
  return {
    focusedElementId: null as string | null,
    focusElement: (id: string) => manager.focusElement(id),
    clearFocus: () => {}
  };
}

export function useElementSelection() {
  const manager = CoreUseElementManager();
  
  return {
    selectedElements: [] as string[],
    selectElements: (ids: string[]) => manager.selectElements(ids),
    selectElement: (id: string) => manager.selectElements([id]),
    toggleElement: (id: string) => manager.selectElements([id]),
    clearSelection: () => manager.clearSelection(),
    isSelected: (id: string) => false
  };
}

// Re-export predefined typed refs
export { useCanvasRef, useInputRef, useButtonRef, useContainerRef, useMediaRef, useCustomRef };

// Legacy component stubs
export const ManagedInput = React.forwardRef<HTMLInputElement, 
  React.InputHTMLAttributes<HTMLInputElement> & { 
    elementId: string; 
    metadata?: Record<string, any> 
  }
>(({ elementId, metadata, ...inputProps }, forwardedRef) => {
  const elementRef = useElementRef(elementId, 'input', metadata);
  
  const combinedRef = React.useCallback((element: HTMLInputElement | null) => {
    elementRef(element);
    if (typeof forwardedRef === 'function') {
      forwardedRef(element);
    } else if (forwardedRef) {
      forwardedRef.current = element;
    }
  }, [elementRef, forwardedRef]);

  return <input {...inputProps} ref={combinedRef} />;
});

export const ManagedButton = React.forwardRef<HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { 
    elementId: string; 
    metadata?: Record<string, any> 
  }
>(({ elementId, metadata, children, ...buttonProps }, forwardedRef) => {
  const elementRef = useElementRef(elementId, 'button', metadata);
  
  const combinedRef = React.useCallback((element: HTMLButtonElement | null) => {
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

export function ElementDebugPanel(): JSX.Element {
  const elements = useElements();
  const { focusedElementId } = useFocusedElement();
  const { selectedElements } = useElementSelection();

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 p-4 rounded-lg shadow-lg text-sm max-h-96 overflow-auto z-50">
      <h3 className="font-bold text-lg mb-2">Element Management Debug</h3>
      
      <div className="mb-2">
        <strong>Total Elements:</strong> {elements.size}
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
          {Array.from(elements.values()).map(elementMetadata => (
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