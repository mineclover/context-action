/**
 * @fileoverview Core Element Management System
 * DOM element 등록 및 관리를 위한 코어 시스템
 * Context-Action 프레임워크를 활용한 element lifecycle 관리
 */

import { ActionRegister, ActionHandler, ActionPayloadMap } from '@context-action/core';

// Element 관리를 위한 타입 정의
export interface ElementInfo {
  id: string;
  element: HTMLElement;
  type: 'input' | 'button' | 'container' | 'media' | 'canvas' | 'custom';
  metadata?: Record<string, any>;
  createdAt: Date;
  lastAccessed?: Date;
}

export interface ElementRegistry {
  elements: Map<string, ElementInfo>;
  focusedElement?: string;
  selectedElements: string[];
}

// Element 관리 액션 정의
export interface ElementActions extends ActionPayloadMap {
  registerElement: { id: string; element: HTMLElement; type: ElementInfo['type']; metadata?: Record<string, any> };
  unregisterElement: { id: string };
  updateElement: { id: string; element?: HTMLElement; metadata?: Record<string, any> };
  focusElement: { id: string };
  selectElements: { ids: string[] };
  clearSelection: void;
  getElementById: { id: string };
  getElementsByType: { type: ElementInfo['type'] };
  cleanupStaleElements: void;
}

/**
 * Core Element Manager 클래스
 * DOM element들의 생명주기를 관리하고 액션 기반으로 상호작용 제공
 */
export class ElementManager {
  private actionRegister: ActionRegister<ElementActions>;
  private registry: ElementRegistry;
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    this.registry = {
      elements: new Map(),
      selectedElements: []
    };

    this.actionRegister = new ActionRegister<ElementActions>({
      name: 'ElementManager',
      registry: {
        debug: true,
        autoCleanup: true,
        defaultExecutionMode: 'sequential'
      }
    });

    this.setupActionHandlers();
    this.startPeriodicCleanup();
  }

  /**
   * 액션 핸들러들을 등록하는 메서드
   */
  private setupActionHandlers(): void {
    // Element 등록 핸들러
    this.actionRegister.register('registerElement', this.handleRegisterElement.bind(this), {
      priority: 100,
      description: 'Register a new DOM element'
    });

    // Element 제거 핸들러
    this.actionRegister.register('unregisterElement', this.handleUnregisterElement.bind(this), {
      priority: 100,
      description: 'Unregister a DOM element'
    });

    // Element 업데이트 핸들러
    this.actionRegister.register('updateElement', this.handleUpdateElement.bind(this), {
      priority: 90,
      description: 'Update element information'
    });

    // Focus 관리 핸들러
    this.actionRegister.register('focusElement', this.handleFocusElement.bind(this), {
      priority: 80,
      description: 'Set element focus'
    });

    // Selection 관리 핸들러
    this.actionRegister.register('selectElements', this.handleSelectElements.bind(this), {
      priority: 80,
      description: 'Select multiple elements'
    });

    // Selection 클리어 핸들러
    this.actionRegister.register('clearSelection', this.handleClearSelection.bind(this), {
      priority: 80,
      description: 'Clear current selection'
    });

    // Element 조회 핸들러
    this.actionRegister.register('getElementById', this.handleGetElementById.bind(this), {
      priority: 50,
      description: 'Get element by ID'
    });

    // Type별 조회 핸들러
    this.actionRegister.register('getElementsByType', this.handleGetElementsByType.bind(this), {
      priority: 50,
      description: 'Get elements by type'
    });

    // 정리 핸들러
    this.actionRegister.register('cleanupStaleElements', this.handleCleanupStaleElements.bind(this), {
      priority: 30,
      description: 'Clean up stale DOM elements'
    });
  }

  // 핸들러 구현들
  private async handleRegisterElement(payload: ElementActions['registerElement']): Promise<void> {
    const { id, element, type, metadata = {} } = payload;

    // 이미 존재하는 ID 체크
    if (this.registry.elements.has(id)) {
      console.warn(`Element with ID '${id}' already registered. Updating existing entry.`);
    }

    // DOM에서 실제로 존재하는지 확인
    if (!document.contains(element)) {
      throw new Error(`Element with ID '${id}' is not attached to the DOM`);
    }

    const elementInfo: ElementInfo = {
      id,
      element,
      type,
      metadata,
      createdAt: new Date(),
      lastAccessed: new Date()
    };

    this.registry.elements.set(id, elementInfo);
    
    // Element에 data 속성 추가로 추적 가능하게 만들기
    element.setAttribute('data-element-id', id);
    element.setAttribute('data-element-type', type);

    console.log(`Element registered: ${id} (${type})`);
  }

  private async handleUnregisterElement(payload: ElementActions['unregisterElement']): Promise<void> {
    const { id } = payload;
    const elementInfo = this.registry.elements.get(id);

    if (!elementInfo) {
      console.warn(`Element with ID '${id}' not found in registry`);
      return;
    }

    // DOM에서 data 속성 제거
    elementInfo.element.removeAttribute('data-element-id');
    elementInfo.element.removeAttribute('data-element-type');

    // Registry에서 제거
    this.registry.elements.delete(id);

    // Focus나 selection에서도 제거
    if (this.registry.focusedElement === id) {
      this.registry.focusedElement = undefined;
    }
    this.registry.selectedElements = this.registry.selectedElements.filter(selectedId => selectedId !== id);

    console.log(`Element unregistered: ${id}`);
  }

  private async handleUpdateElement(payload: ElementActions['updateElement']): Promise<void> {
    const { id, element, metadata } = payload;
    const elementInfo = this.registry.elements.get(id);

    if (!elementInfo) {
      throw new Error(`Element with ID '${id}' not found`);
    }

    // Element 교체
    if (element && element !== elementInfo.element) {
      elementInfo.element = element;
      element.setAttribute('data-element-id', id);
      element.setAttribute('data-element-type', elementInfo.type);
    }

    // Metadata 업데이트
    if (metadata) {
      elementInfo.metadata = { ...elementInfo.metadata, ...metadata };
    }

    elementInfo.lastAccessed = new Date();
    console.log(`Element updated: ${id}`);
  }

  private async handleFocusElement(payload: ElementActions['focusElement']): Promise<void> {
    const { id } = payload;
    const elementInfo = this.registry.elements.get(id);

    if (!elementInfo) {
      throw new Error(`Element with ID '${id}' not found`);
    }

    // DOM Focus 설정
    elementInfo.element.focus();
    
    // Registry에서 focused element 설정
    this.registry.focusedElement = id;
    elementInfo.lastAccessed = new Date();

    console.log(`Element focused: ${id}`);
  }

  private async handleSelectElements(payload: ElementActions['selectElements']): Promise<void> {
    const { ids } = payload;

    // 존재하는 element들만 필터링
    const validIds = ids.filter(id => this.registry.elements.has(id));
    
    if (validIds.length !== ids.length) {
      const invalidIds = ids.filter(id => !this.registry.elements.has(id));
      console.warn(`Some elements not found: ${invalidIds.join(', ')}`);
    }

    this.registry.selectedElements = validIds;

    // 선택된 elements의 lastAccessed 업데이트
    validIds.forEach(id => {
      const elementInfo = this.registry.elements.get(id);
      if (elementInfo) {
        elementInfo.lastAccessed = new Date();
      }
    });

    console.log(`Elements selected: ${validIds.join(', ')}`);
  }

  private async handleClearSelection(): Promise<void> {
    this.registry.selectedElements = [];
    console.log('Selection cleared');
  }

  private async handleGetElementById(payload: ElementActions['getElementById']): Promise<ElementInfo | null> {
    const { id } = payload;
    const elementInfo = this.registry.elements.get(id);

    if (elementInfo) {
      elementInfo.lastAccessed = new Date();
      return { ...elementInfo }; // 복사본 반환
    }

    return null;
  }

  private async handleGetElementsByType(payload: ElementActions['getElementsByType']): Promise<ElementInfo[]> {
    const { type } = payload;
    const elements: ElementInfo[] = [];

    for (const elementInfo of this.registry.elements.values()) {
      if (elementInfo.type === type) {
        elementInfo.lastAccessed = new Date();
        elements.push({ ...elementInfo }); // 복사본 반환
      }
    }

    return elements;
  }

  private async handleCleanupStaleElements(): Promise<void> {
    const staleElements: string[] = [];
    const now = new Date();

    for (const [id, elementInfo] of this.registry.elements.entries()) {
      // DOM에서 제거되었거나 30분 이상 접근되지 않은 elements 찾기
      const isStale = !document.contains(elementInfo.element) || 
                     (elementInfo.lastAccessed && 
                      now.getTime() - elementInfo.lastAccessed.getTime() > 30 * 60 * 1000);

      if (isStale) {
        staleElements.push(id);
      }
    }

    // Stale elements 제거
    for (const id of staleElements) {
      await this.actionRegister.dispatch('unregisterElement', { id });
    }

    console.log(`Cleaned up ${staleElements.length} stale elements`);
  }

  /**
   * 주기적 정리 작업 시작
   */
  private startPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.actionRegister.dispatch('cleanupStaleElements');
    }, 10 * 60 * 1000); // 10분마다 정리
  }

  // Public API 메서드들
  public async registerElement(id: string, element: HTMLElement, type: ElementInfo['type'], metadata?: Record<string, any>): Promise<void> {
    return this.actionRegister.dispatch('registerElement', { id, element, type, metadata });
  }

  public async unregisterElement(id: string): Promise<void> {
    return this.actionRegister.dispatch('unregisterElement', { id });
  }

  public async focusElement(id: string): Promise<void> {
    return this.actionRegister.dispatch('focusElement', { id });
  }

  public async selectElements(ids: string[]): Promise<void> {
    return this.actionRegister.dispatch('selectElements', { ids });
  }

  public getRegistry(): Readonly<ElementRegistry> {
    return {
      elements: new Map(this.registry.elements),
      focusedElement: this.registry.focusedElement,
      selectedElements: [...this.registry.selectedElements]
    };
  }

  public dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    // Clear all registered handlers
    this.registry.elements.clear();
  }
}

// 전역 인스턴스 생성 (옵션)
export const globalElementManager = new ElementManager();