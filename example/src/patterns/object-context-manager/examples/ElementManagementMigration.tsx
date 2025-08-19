/**
 * @fileoverview Element 관리 마이그레이션 예제
 * 기존 element-management를 새로운 범용 객체 컨텍스트 패턴으로 마이그레이션
 */

import React, { useCallback, useRef, RefCallback, useState } from 'react';
import { ManagedObject } from '../types';
import { createObjectContextHooks } from '../createObjectContextHooks';

// DOM Element 객체 정의 (기존 ElementInfo와 유사하지만 ManagedObject 확장)
interface DOMElementObject extends ManagedObject {
  id: string;
  type: 'input' | 'button' | 'container' | 'media' | 'canvas' | 'custom';
  element: HTMLElement; // 실제 DOM 요소
  createdAt: Date;
  lastAccessed?: Date;
  metadata?: {
    tag?: string;
    className?: string;
    dataset?: Record<string, string>;
    attributes?: Record<string, string>;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
  };
}

// Element 관리 컨텍스트 생성
const {
  ObjectContextProvider: ElementContextProvider,
  useObjectManager: useElementManager,
  useObjectContextStore: useElementStore,
  useObjectContextActions: useElementActions,
  useObjectContextEvents: useElementEvents
} = createObjectContextHooks<DOMElementObject>({
  contextName: 'DOMElementManagement',
  autoCleanup: {
    enabled: true,
    intervalMs: 600000, // 10분마다
    olderThanMs: 1800000, // 30분 이상
    lifecycleStates: ['inactive', 'archived']
  },
  maxObjects: 500,
  enableSelection: true,
  enableFocus: true
});

// DOM Element 생성 헬퍼
const createDOMElementObject = (
  id: string,
  element: HTMLElement,
  type: DOMElementObject['type']
): DOMElementObject => {
  const rect = element.getBoundingClientRect();
  
  return {
    id,
    type,
    element,
    createdAt: new Date(),
    metadata: {
      tag: element.tagName.toLowerCase(),
      className: element.className,
      dataset: { ...element.dataset },
      attributes: {},
      position: { x: rect.left, y: rect.top },
      size: { width: rect.width, height: rect.height }
    }
  };
};

/**
 * 자동 Element 등록 Hook (기존 useElementRef와 유사)
 */
const useElementRef = (
  id: string,
  type: DOMElementObject['type'],
  metadata?: Record<string, unknown>
): RefCallback<HTMLElement> => {
  const { register, unregister } = useElementActions();

  return useCallback<RefCallback<HTMLElement>>((element) => {
    if (element) {
      // Element 등록
      const elementObject = createDOMElementObject(id, element, type);
      
      // data 속성 추가
      element.setAttribute('data-element-id', id);
      element.setAttribute('data-element-type', type);
      
      register(id, elementObject, metadata, {
        source: 'auto_registration',
        timestamp: new Date().toISOString()
      });
    } else {
      // Element 해제
      unregister(id);
    }
  }, [id, type, metadata, register, unregister]);
};

/**
 * Element 포커스 관리 Hook (기존과 유사)
 */
const useElementFocus = () => {
  const { focusedObject, focus, clearFocus } = useElementManager();
  const { getObject } = useElementStore();

  const focusElement = useCallback((id: string) => {
    const elementObj = getObject(id);
    if (elementObj?.element) {
      elementObj.element.focus();
      focus(id);
    }
  }, [getObject, focus]);

  const clearElementFocus = useCallback(() => {
    const elementObj = focusedObject ? getObject(focusedObject) : null;
    if (elementObj?.element) {
      elementObj.element.blur();
    }
    clearFocus();
  }, [focusedObject, getObject, clearFocus]);

  return {
    focusedElementId: focusedObject,
    focusElement,
    clearFocus: clearElementFocus
  };
};

/**
 * Element 선택 관리 Hook
 */
const useElementSelection = () => {
  const { selectedObjects, select, clearSelection } = useElementManager();
  const { queryObjects } = useElementStore();

  const selectedElementsInfo = queryObjects().filter(meta => selectedObjects.includes(meta.id));

  return {
    selectedElements: selectedObjects,
    selectedElementsInfo,
    selectElements: select,
    clearSelection
  };
};

/**
 * 관리되는 Input 컴포넌트 (기존 ManagedInput과 유사)
 */
const ManagedInput = React.forwardRef<HTMLInputElement, 
  React.InputHTMLAttributes<HTMLInputElement> & {
    elementId: string;
    elementMetadata?: Record<string, unknown>;
  }
>(({ elementId, elementMetadata, ...props }, forwardedRef) => {
  const elementRef = useElementRef(elementId, 'input', elementMetadata);
  
  const combinedRef = useCallback((element: HTMLInputElement | null) => {
    elementRef(element);
    if (typeof forwardedRef === 'function') {
      forwardedRef(element);
    } else if (forwardedRef) {
      forwardedRef.current = element;
    }
  }, [elementRef, forwardedRef]);

  return <input {...props} ref={combinedRef} />;
});

/**
 * 관리되는 Button 컴포넌트
 */
const ManagedButton = React.forwardRef<HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    elementId: string;
    elementMetadata?: Record<string, unknown>;
  }
>(({ elementId, elementMetadata, children, ...props }, forwardedRef) => {
  const elementRef = useElementRef(elementId, 'button', elementMetadata);
  
  const combinedRef = useCallback((element: HTMLButtonElement | null) => {
    elementRef(element);
    if (typeof forwardedRef === 'function') {
      forwardedRef(element);
    } else if (forwardedRef) {
      forwardedRef.current = element;
    }
  }, [elementRef, forwardedRef]);

  return <button {...props} ref={combinedRef}>{children}</button>;
});

/**
 * Element 인스펙터 컴포넌트
 */
const ElementInspector: React.FC = () => {
  const { selectedElementsInfo } = useElementSelection();

  if (selectedElementsInfo.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-center text-gray-500">
          Element를 선택하여 정보를 확인하세요
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3">Element Inspector</h3>
      
      <div className="space-y-3">
        {selectedElementsInfo.map((elementMetadata) => (
          <div key={elementMetadata.id} className="bg-gray-50 p-3 rounded">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>ID:</strong> {elementMetadata.id}</div>
              <div><strong>Type:</strong> {elementMetadata.type}</div>
              <div><strong>Tag:</strong> {elementMetadata.metadata?.tag}</div>
              <div><strong>State:</strong> {elementMetadata.lifecycleState}</div>
              <div className="col-span-2">
                <strong>Created:</strong> {new Date(elementMetadata.createdAt).toLocaleTimeString()}
              </div>
              {elementMetadata.lastAccessed && (
                <div className="col-span-2">
                  <strong>Last Accessed:</strong> {new Date(elementMetadata.lastAccessed).toLocaleTimeString()}
                </div>
              )}
              {elementMetadata.metadata?.position && (
                <div className="col-span-2">
                  <strong>Position:</strong> x: {elementMetadata.metadata.position.x}, y: {elementMetadata.metadata.position.y}
                </div>
              )}
              {elementMetadata.metadata?.size && (
                <div className="col-span-2">
                  <strong>Size:</strong> {elementMetadata.metadata.size.width}x{elementMetadata.metadata.size.height}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Element 목록 컴포넌트
 */
const ElementList: React.FC = () => {
  const { queryObjects } = useElementStore();
  const { select } = useElementActions();
  const { selectedObjects } = useElementSelection();
  const { focusedElementId, focusElement } = useElementFocus();

  const elements = queryObjects({
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3">등록된 Elements ({elements.length})</h3>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {elements.map((elementMetadata) => {
          const isSelected = selectedObjects.includes(elementMetadata.id);
          const isFocused = focusedElementId === elementMetadata.id;
          
          return (
            <div
              key={elementMetadata.id}
              className={`p-3 border rounded cursor-pointer transition-colors ${
                isSelected 
                  ? 'bg-blue-50 border-blue-300' 
                  : isFocused
                  ? 'bg-yellow-50 border-yellow-300'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1" onClick={() => select([elementMetadata.id], 'toggle')}>
                  <div className="font-medium">{elementMetadata.id}</div>
                  <div className="text-sm text-gray-600">
                    {elementMetadata.type} • {elementMetadata.metadata?.tag} • {elementMetadata.lifecycleState}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(elementMetadata.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      focusElement(elementMetadata.id);
                    }}
                    className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Focus
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {elements.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          등록된 Element가 없습니다
        </div>
      )}
    </div>
  );
};

/**
 * Element 액션 패널
 */
const ElementActionPanel: React.FC = () => {
  const { activate, deactivate, archive, unregister } = useElementActions();
  const { selectedObjects, clearSelection } = useElementSelection();
  const { clearFocus } = useElementFocus();

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'archive' | 'delete') => {
    if (selectedObjects.length === 0) {
      alert('선택된 Element가 없습니다');
      return;
    }

    if (!confirm(`선택된 ${selectedObjects.length}개의 Element에 대해 ${action} 작업을 수행하시겠습니까?`)) {
      return;
    }

    selectedObjects.forEach(id => {
      switch (action) {
        case 'activate':
          activate(id);
          break;
        case 'deactivate':
          deactivate(id);
          break;
        case 'archive':
          archive(id);
          break;
        case 'delete':
          unregister(id, true);
          break;
      }
    });

    clearSelection();
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3">Element 액션</h3>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => handleBulkAction('activate')}
          disabled={selectedObjects.length === 0}
          className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-300"
        >
          활성화 ({selectedObjects.length})
        </button>
        <button
          onClick={() => handleBulkAction('deactivate')}
          disabled={selectedObjects.length === 0}
          className="px-3 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:bg-gray-300"
        >
          비활성화
        </button>
        <button
          onClick={() => handleBulkAction('archive')}
          disabled={selectedObjects.length === 0}
          className="px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:bg-gray-300"
        >
          보관
        </button>
        <button
          onClick={() => handleBulkAction('delete')}
          disabled={selectedObjects.length === 0}
          className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-300"
        >
          삭제
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={clearSelection}
          className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
        >
          선택 해제
        </button>
        <button
          onClick={clearFocus}
          className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
        >
          포커스 해제
        </button>
      </div>
    </div>
  );
};

/**
 * 테스트용 폼 컴포넌트
 */
const TestForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3">테스트 폼 (관리되는 Elements)</h3>
      
      <form className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">이름</label>
          <ManagedInput
            elementId="test-name-input"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="이름을 입력하세요"
            elementMetadata={{
              formField: 'name',
              required: true
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">이메일</label>
          <ManagedInput
            elementId="test-email-input"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="이메일을 입력하세요"
            elementMetadata={{
              formField: 'email',
              required: true,
              validation: 'email'
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">메시지</label>
          <textarea
            ref={useElementRef('test-message-textarea', 'input', {
              formField: 'message',
              multiline: true
            })}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="메시지를 입력하세요"
          />
        </div>

        <div className="flex gap-2">
          <ManagedButton
            elementId="test-submit-button"
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            elementMetadata={{
              action: 'submit',
              formAction: true
            }}
          >
            제출
          </ManagedButton>
          
          <ManagedButton
            elementId="test-reset-button"
            type="button"
            onClick={() => setFormData({ name: '', email: '', message: '' })}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            elementMetadata={{
              action: 'reset',
              formAction: true
            }}
          >
            초기화
          </ManagedButton>
        </div>
      </form>
    </div>
  );
};

/**
 * 메인 Element 관리 마이그레이션 예제 컴포넌트
 */
const ElementManagementMigration: React.FC = () => {
  return (
    <ElementContextProvider>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Element 관리 마이그레이션 예제
            </h1>
            <p className="text-gray-600">
              기존 element-management를 새로운 범용 객체 컨텍스트 패턴으로 마이그레이션
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* 테스트 폼 */}
            <div className="lg:col-span-1">
              <TestForm />
            </div>

            {/* Element 목록 */}
            <div className="lg:col-span-1">
              <ElementList />
            </div>

            {/* Element 액션 */}
            <div className="lg:col-span-2 xl:col-span-1">
              <ElementActionPanel />
            </div>

            {/* Element 인스펙터 */}
            <div className="lg:col-span-2 xl:col-span-3">
              <ElementInspector />
            </div>
          </div>
        </div>
      </div>
    </ElementContextProvider>
  );
};

export default ElementManagementMigration;