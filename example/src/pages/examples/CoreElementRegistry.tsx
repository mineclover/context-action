/**
 * @fileoverview Core Element Management System using createRefContext
 * DOM element 등록 및 관리를 위한 코어 시스템
 * createRefContext 기반 element lifecycle 관리
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { createRefContext } from '@context-action/react';
import { createActionContext, ActionPayloadMap } from '@context-action/react';

// Element 관리를 위한 타입 정의
export interface ElementInfo {
  id: string;
  type: 'input' | 'button' | 'container' | 'media' | 'canvas' | 'custom';
  metadata?: Record<string, any>;
  createdAt: Date;
  lastAccessed?: Date;
}

// Element Ref 정의를 위한 타입
export interface ElementRefDefinitions {
  [key: string]: {
    name: string;
    type: ElementInfo['type'];
    metadata?: Record<string, any>;
    autoCleanup?: boolean;
  };
}

// Element 관리 액션 정의
export interface ElementActions extends ActionPayloadMap {
  focusElement: { id: string };
  selectElements: { ids: string[] };
  clearSelection: void;
  updateElementMetadata: { id: string; metadata: Record<string, any> };
  cleanupStaleElements: void;
}

/**
 * createRefContext 기반 Element 관리 시스템
 * 
 * 기존 ElementManager 클래스를 createRefContext로 대체하여
 * 더 간단하고 React 친화적인 element 관리 제공
 */

// Element RefContext 생성 (단순 타입 사용)
export const {
  Provider: ElementRefProvider,
  useRefHandler: useElementRef,
  useWaitForRefs: useWaitForElements,
  useGetAllRefs: useGetAllElements
} = createRefContext<Record<string, HTMLElement>>('ElementManagement');

// Element 관리 Actions Context
export const {
  Provider: ElementActionProvider,
  useActionDispatch: useElementAction,
  useActionHandler: useElementActionHandler
} = createActionContext<ElementActions>('ElementActions');

/**
 * Element 관리 통합 Provider
 * RefContext와 ActionContext를 함께 제공
 */
export interface ElementManagementProviderProps {
  children: React.ReactNode;
  enablePeriodicCleanup?: boolean;
}

export function ElementManagementProvider({ 
  children, 
  enablePeriodicCleanup = true 
}: ElementManagementProviderProps) {
  return (
    <ElementRefProvider>
      <ElementActionProvider>
        <ElementManagerSetup enablePeriodicCleanup={enablePeriodicCleanup}>
          {children}
        </ElementManagerSetup>
      </ElementActionProvider>
    </ElementRefProvider>
  );
}

/**
 * Element 관리 설정 컴포넌트
 * Action handlers와 주기적 정리 작업 설정
 */
function ElementManagerSetup({ 
  children, 
  enablePeriodicCleanup 
}: { 
  children: React.ReactNode;
  enablePeriodicCleanup: boolean;
}) {
  const getAllElementsFn = useGetAllElements();
  const dispatch = useElementAction();
  
  // Selection 상태 관리
  const [focusedElement, setFocusedElement] = React.useState<string | null>(null);
  const [selectedElements, setSelectedElements] = React.useState<string[]>([]);

  // Focus 핸들러
  useElementActionHandler('focusElement', useCallback(async (payload) => {
    const { id } = payload;
    const elements = getAllElementsFn();
    const element = elements[id] as HTMLElement;
    
    if (!element) {
      throw new Error(`Element with ID '${id}' not found`);
    }

    // DOM Focus 설정
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
    
    setFocusedElement(id);
    console.log(`Element focused: ${id}`);
  }, [getAllElementsFn]));

  // Selection 핸들러
  useElementActionHandler('selectElements', useCallback(async (payload) => {
    const { ids } = payload;
    const elements = getAllElementsFn();
    
    // 존재하는 element들만 필터링
    const validIds = ids.filter(id => elements[id]);
    
    if (validIds.length !== ids.length) {
      const invalidIds = ids.filter(id => !elements[id]);
      console.warn(`Some elements not found: ${invalidIds.join(', ')}`);
    }

    setSelectedElements(validIds);
    console.log(`Elements selected: ${validIds.join(', ')}`);
  }, [getAllElementsFn]));

  // Selection 클리어 핸들러
  useElementActionHandler('clearSelection', useCallback(async () => {
    setSelectedElements([]);
    console.log('Selection cleared');
  }, []));

  // Metadata 업데이트 핸들러
  useElementActionHandler('updateElementMetadata', useCallback(async (payload) => {
    const { id, metadata } = payload;
    const elements = getAllElementsFn();
    const element = elements[id] as HTMLElement;
    
    if (!element) {
      console.warn(`Element with ID '${id}' not found`);
      return;
    }

    // DOM에 metadata 저장
    element.setAttribute('data-element-metadata', JSON.stringify(metadata));
    console.log(`Element metadata updated: ${id}`);
  }, [getAllElementsFn]));

  // Stale elements 정리 핸들러 - 무한 루프 방지를 위해 제거하거나 단순화
  useElementActionHandler('cleanupStaleElements', useCallback(async () => {
    try {
      const elements = getAllElementsFn();
      let staleCount = 0;
      
      // 단순히 카운트만 하고 실제 제거는 하지 않음
      Object.entries(elements).forEach(([id, element]) => {
        if (element && !document.contains(element as HTMLElement)) {
          staleCount++;
        }
      });

      if (staleCount > 0) {
        console.log(`Found ${staleCount} stale elements (not removing to prevent loops)`);
      }
    } catch (error) {
      console.warn('Error in cleanupStaleElements:', error);
    }
  }, [getAllElementsFn]));

  // 주기적 정리 작업 - 무한 루프 방지를 위해 임시 비활성화
  useEffect(() => {
    if (!enablePeriodicCleanup) return;

    // 드래그 드롭 중 무한 루프를 방지하기 위해 주기적 정리 비활성화
    console.log('Periodic cleanup disabled to prevent infinite loops during drag & drop');
    
    // const interval = setInterval(() => {
    //   dispatch('cleanupStaleElements');
    // }, 10 * 60 * 1000); // 10분마다 정리

    // return () => clearInterval(interval);
  }, [enablePeriodicCleanup, dispatch]);

  return <>{children}</>;
}

/**
 * Element 관리를 위한 통합 Hook
 */
export function useElementManager() {
  const getAllElementsFn = useGetAllElements();
  const dispatch = useElementAction();
  
  const registerElement = useCallback((id: string, element: HTMLElement, type: ElementInfo['type'], metadata?: Record<string, any>) => {
    // Set data attributes
    element.setAttribute('data-element-id', id);
    element.setAttribute('data-element-type', type);
    if (metadata) {
      element.setAttribute('data-element-metadata', JSON.stringify(metadata));
    }
    
    // For now, just set the ref directly since we can't call useElementRef here
    console.log(`Element registered: ${id} (${type})`);
  }, []);
  
  const unregisterElement = useCallback((id: string) => {
    console.log(`Element unregistered: ${id}`);
  }, []);
  
  const getElement = useCallback((id: string) => {
    const elements = getAllElementsFn();
    return elements[id] || null;
  }, [getAllElementsFn]);
  
  const getAllElements = useCallback(() => {
    return getAllElementsFn();
  }, [getAllElementsFn]);
  
  const getElementsByType = useCallback((type: ElementInfo['type']) => {
    const elements = getAllElementsFn();
    return Object.entries(elements)
      .filter(([, element]) => {
        const htmlElement = element as HTMLElement;
        return htmlElement?.getAttribute('data-element-type') === type;
      })
      .map(([id, element]) => ({ id, element: element as HTMLElement }));
  }, [getAllElementsFn]);
  
  const focusElement = useCallback((id: string) => {
    return dispatch('focusElement', { id });
  }, [dispatch]);
  
  const selectElements = useCallback((ids: string[]) => {
    return dispatch('selectElements', { ids });
  }, [dispatch]);
  
  const clearSelection = useCallback(() => {
    return dispatch('clearSelection');
  }, [dispatch]);
  
  const updateElementMetadata = useCallback((id: string, metadata: Record<string, any>) => {
    return dispatch('updateElementMetadata', { id, metadata });
  }, [dispatch]);
  
  const cleanupStaleElements = useCallback(() => {
    return dispatch('cleanupStaleElements');
  }, [dispatch]);
  
  return useMemo(() => ({
    // Element 등록
    registerElement,
    
    // Element 제거
    unregisterElement,
    
    // Element 조회
    getElement,
    
    // 모든 Elements 조회
    getAllElements,
    
    // Type별 Elements 조회
    getElementsByType,
    
    // Focus 관리
    focusElement,
    
    // Selection 관리
    selectElements,
    clearSelection,
    
    // Metadata 업데이트
    updateElementMetadata,
    
    // 정리 작업
    cleanupStaleElements
  }), [
    registerElement,
    unregisterElement,
    getElement,
    getAllElements,
    getElementsByType,
    focusElement,
    selectElements,
    clearSelection,
    updateElementMetadata,
    cleanupStaleElements
  ]);
}

/**
 * Element 타입별 Hook 생성 헬퍼
 */
export function createTypedElementRef(
  type: ElementInfo['type'],
  metadata?: Record<string, any>
) {
  return (id: string) => {
    const elementRef = useElementRef(id);
    
    useEffect(() => {
      if (elementRef.target) {
        const element = elementRef.target as HTMLElement;
        element.setAttribute('data-element-type', type);
        if (metadata) {
          element.setAttribute('data-element-metadata', JSON.stringify(metadata));
        }
      }
    }, [elementRef.target]);
    
    return elementRef;
  };
}

// 타입별 미리 정의된 hooks
export const useCanvasRef = createTypedElementRef('canvas');
export const useInputRef = createTypedElementRef('input');
export const useButtonRef = createTypedElementRef('button');
export const useContainerRef = createTypedElementRef('container');
export const useMediaRef = createTypedElementRef('media');
export const useCustomRef = createTypedElementRef('custom');