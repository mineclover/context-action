/**
 * @fileoverview 범용 객체 컨텍스트 관리자
 * 단일 엔드포인트를 통한 객체 생명주기 관리
 */

import { ActionRegister } from '@context-action/core';
import {
  ManagedObject,
  ObjectMetadata,
  BaseObjectActions,
  ObjectContextConfig,
  ObjectLifecycleState,
  QueryOptions,
  ValidationResult,
  ObjectManagementEvent
} from './types';

/**
 * 범용 객체 컨텍스트 관리자
 * @template T 관리할 객체 타입
 */
export class ObjectContextManager<T extends ManagedObject> {
  private actionRegister: ActionRegister<BaseObjectActions<T>>;
  private objects = new Map<string, T>();
  private metadata = new Map<string, ObjectMetadata<T>>();
  private selectedObjects = new Set<string>();
  private focusedObject: string | null = null;
  private config: ObjectContextConfig;
  private cleanupInterval?: NodeJS.Timeout;
  private eventListeners = new Map<string, ((event: ObjectManagementEvent<T>) => void)[]>();

  constructor(config: ObjectContextConfig) {
    this.config = {
      autoCleanup: { enabled: false, intervalMs: 600000, olderThanMs: 1800000 }, // 기본값: 10분마다, 30분 이상된 객체
      enableSelection: true,
      enableFocus: true,
      persistState: false,
      ...config
    };

    this.actionRegister = new ActionRegister<BaseObjectActions<T>>({
      name: `ObjectContext_${config.contextName}`,
      registry: {
        debug: true,
        autoCleanup: true,
        defaultExecutionMode: 'sequential'
      }
    });

    this.setupActionHandlers();
    this.startAutoCleanup();
  }

  /**
   * 액션 핸들러 설정
   */
  private setupActionHandlers(): void {
    // 객체 등록
    this.actionRegister.register('register', this.handleRegister.bind(this), {
      priority: 100,
      description: 'Register a new managed object'
    });

    // 객체 해제
    this.actionRegister.register('unregister', this.handleUnregister.bind(this), {
      priority: 100,
      description: 'Unregister a managed object'
    });

    // 객체 업데이트
    this.actionRegister.register('update', this.handleUpdate.bind(this), {
      priority: 90,
      description: 'Update managed object'
    });

    // 생명주기 관리
    this.actionRegister.register('activate', this.handleActivate.bind(this), {
      priority: 80,
      description: 'Activate object'
    });

    this.actionRegister.register('deactivate', this.handleDeactivate.bind(this), {
      priority: 80,
      description: 'Deactivate object'
    });

    this.actionRegister.register('archive', this.handleArchive.bind(this), {
      priority: 80,
      description: 'Archive object'
    });

    this.actionRegister.register('restore', this.handleRestore.bind(this), {
      priority: 80,
      description: 'Restore archived object'
    });

    // 선택 및 포커스 관리
    if (this.config.enableSelection) {
      this.actionRegister.register('select', this.handleSelect.bind(this), {
        priority: 70,
        description: 'Select objects'
      });

      this.actionRegister.register('clearSelection', this.handleClearSelection.bind(this), {
        priority: 70,
        description: 'Clear object selection'
      });
    }

    if (this.config.enableFocus) {
      this.actionRegister.register('focus', this.handleFocus.bind(this), {
        priority: 70,
        description: 'Focus object'
      });

      this.actionRegister.register('clearFocus', this.handleClearFocus.bind(this), {
        priority: 70,
        description: 'Clear object focus'
      });
    }

    // 정리
    this.actionRegister.register('cleanup', this.handleCleanup.bind(this), {
      priority: 30,
      description: 'Clean up objects'
    });
  }

  /**
   * 객체 등록 핸들러
   */
  private async handleRegister(payload: BaseObjectActions<T>['register']): Promise<void> {
    const { id, object, metadata = {}, contextMetadata = {} } = payload;

    // 유효성 검증
    const validation = this.validateObject(object);
    if (!validation.isValid) {
      throw new Error(`Object validation failed: ${validation.errors.join(', ')}`);
    }

    // 최대 객체 수 확인
    if (this.config.maxObjects && this.objects.size >= this.config.maxObjects) {
      throw new Error(`Maximum object limit (${this.config.maxObjects}) reached`);
    }

    // 기존 객체 확인
    if (this.objects.has(id)) {
      console.warn(`Object with ID '${id}' already exists. Updating existing object.`);
    }

    // 객체 및 메타데이터 저장
    this.objects.set(id, object);
    
    const objectMetadata: ObjectMetadata<T> = {
      id,
      type: object.type,
      createdAt: object.createdAt.toISOString(),
      lastAccessed: new Date().toISOString(),
      lifecycleState: 'created',
      metadata,
      contextMetadata
    };
    
    this.metadata.set(id, objectMetadata);

    // 이벤트 발생
    this.emitEvent({
      type: 'registered',
      objectId: id,
      object,
      metadata: objectMetadata,
      timestamp: new Date(),
      context: this.config.contextName
    });

    console.log(`Object registered in context '${this.config.contextName}': ${id}`);
  }

  /**
   * 객체 해제 핸들러
   */
  private async handleUnregister(payload: BaseObjectActions<T>['unregister']): Promise<void> {
    const { id, force = false } = payload;

    const object = this.objects.get(id);
    const metadata = this.metadata.get(id);

    if (!object || !metadata) {
      if (!force) {
        console.warn(`Object with ID '${id}' not found in context '${this.config.contextName}'`);
        return;
      }
    }

    // 선택 및 포커스에서 제거
    this.selectedObjects.delete(id);
    if (this.focusedObject === id) {
      this.focusedObject = null;
    }

    // 객체 제거
    this.objects.delete(id);
    this.metadata.delete(id);

    // 이벤트 발생
    this.emitEvent({
      type: 'unregistered',
      objectId: id,
      object,
      metadata,
      timestamp: new Date(),
      context: this.config.contextName
    });

    console.log(`Object unregistered from context '${this.config.contextName}': ${id}`);
  }

  /**
   * 객체 업데이트 핸들러
   */
  private async handleUpdate(payload: BaseObjectActions<T>['update']): Promise<void> {
    const { id, object: objectUpdate, metadata: metadataUpdate, contextMetadata: contextMetadataUpdate } = payload;

    const existingObject = this.objects.get(id);
    const existingMetadata = this.metadata.get(id);

    if (!existingObject || !existingMetadata) {
      throw new Error(`Object with ID '${id}' not found in context '${this.config.contextName}'`);
    }

    // 객체 업데이트
    if (objectUpdate) {
      const updatedObject = { ...existingObject, ...objectUpdate, id, lastAccessed: new Date() } as T;
      this.objects.set(id, updatedObject);
    }

    // 메타데이터 업데이트
    const updatedMetadata: ObjectMetadata<T> = {
      ...existingMetadata,
      lastAccessed: new Date().toISOString(),
      ...(metadataUpdate && { metadata: { ...existingMetadata.metadata, ...metadataUpdate } }),
      ...(contextMetadataUpdate && { contextMetadata: { ...existingMetadata.contextMetadata, ...contextMetadataUpdate } })
    };

    this.metadata.set(id, updatedMetadata);

    // 이벤트 발생
    this.emitEvent({
      type: 'updated',
      objectId: id,
      object: this.objects.get(id),
      metadata: updatedMetadata,
      timestamp: new Date(),
      context: this.config.contextName
    });

    console.log(`Object updated in context '${this.config.contextName}': ${id}`);
  }

  /**
   * 생명주기 상태 변경 핸들러들
   */
  private async handleActivate(payload: BaseObjectActions<T>['activate']): Promise<void> {
    await this.changeLifecycleState(payload.id, 'active');
  }

  private async handleDeactivate(payload: BaseObjectActions<T>['deactivate']): Promise<void> {
    await this.changeLifecycleState(payload.id, 'inactive');
  }

  private async handleArchive(payload: BaseObjectActions<T>['archive']): Promise<void> {
    await this.changeLifecycleState(payload.id, 'archived');
  }

  private async handleRestore(payload: BaseObjectActions<T>['restore']): Promise<void> {
    await this.changeLifecycleState(payload.id, 'active');
  }

  /**
   * 생명주기 상태 변경
   */
  private async changeLifecycleState(id: string, newState: ObjectLifecycleState): Promise<void> {
    const metadata = this.metadata.get(id);
    if (!metadata) {
      throw new Error(`Object with ID '${id}' not found in context '${this.config.contextName}'`);
    }

    const updatedMetadata = {
      ...metadata,
      lifecycleState: newState,
      lastAccessed: new Date().toISOString()
    };

    this.metadata.set(id, updatedMetadata);

    // 이벤트 발생
    this.emitEvent({
      type: 'lifecycle_changed',
      objectId: id,
      object: this.objects.get(id),
      metadata: updatedMetadata,
      timestamp: new Date(),
      context: this.config.contextName
    });

    console.log(`Object lifecycle changed in context '${this.config.contextName}': ${id} -> ${newState}`);
  }

  /**
   * 선택 관리 핸들러
   */
  private async handleSelect(payload: BaseObjectActions<T>['select']): Promise<void> {
    const { ids, mode = 'replace' } = payload;

    // 존재하는 객체들만 필터링
    const validIds = ids.filter(id => this.objects.has(id));
    
    if (validIds.length !== ids.length) {
      const invalidIds = ids.filter(id => !this.objects.has(id));
      console.warn(`Some objects not found in context '${this.config.contextName}': ${invalidIds.join(', ')}`);
    }

    // 선택 모드에 따른 처리
    switch (mode) {
      case 'replace':
        this.selectedObjects.clear();
        validIds.forEach(id => this.selectedObjects.add(id));
        break;
      case 'add':
        validIds.forEach(id => this.selectedObjects.add(id));
        break;
      case 'toggle':
        validIds.forEach(id => {
          if (this.selectedObjects.has(id)) {
            this.selectedObjects.delete(id);
          } else {
            this.selectedObjects.add(id);
          }
        });
        break;
    }

    // 선택된 객체들의 lastAccessed 업데이트
    validIds.forEach(id => {
      const metadata = this.metadata.get(id);
      if (metadata) {
        this.metadata.set(id, {
          ...metadata,
          lastAccessed: new Date().toISOString()
        });
      }
    });

    // 이벤트 발생
    this.emitEvent({
      type: 'selected',
      objectId: validIds.join(','),
      timestamp: new Date(),
      context: this.config.contextName
    });

    console.log(`Objects selected in context '${this.config.contextName}': ${Array.from(this.selectedObjects).join(', ')}`);
  }

  private async handleClearSelection(): Promise<void> {
    this.selectedObjects.clear();
    console.log(`Selection cleared in context '${this.config.contextName}'`);
  }

  /**
   * 포커스 관리 핸들러
   */
  private async handleFocus(payload: BaseObjectActions<T>['focus']): Promise<void> {
    const { id } = payload;

    if (!this.objects.has(id)) {
      throw new Error(`Object with ID '${id}' not found in context '${this.config.contextName}'`);
    }

    this.focusedObject = id;

    // lastAccessed 업데이트
    const metadata = this.metadata.get(id);
    if (metadata) {
      this.metadata.set(id, {
        ...metadata,
        lastAccessed: new Date().toISOString()
      });
    }

    // 이벤트 발생
    this.emitEvent({
      type: 'focused',
      objectId: id,
      object: this.objects.get(id),
      timestamp: new Date(),
      context: this.config.contextName
    });

    console.log(`Object focused in context '${this.config.contextName}': ${id}`);
  }

  private async handleClearFocus(): Promise<void> {
    this.focusedObject = null;
    console.log(`Focus cleared in context '${this.config.contextName}'`);
  }

  /**
   * 정리 핸들러
   */
  private async handleCleanup(payload: BaseObjectActions<T>['cleanup']): Promise<void> {
    const {
      olderThan = this.config.autoCleanup?.olderThanMs || 1800000,
      lifecycleStates = ['inactive', 'archived'],
      force = false
    } = payload;

    const now = new Date();
    const cutoffTime = new Date(now.getTime() - olderThan);
    const objectsToCleanup: string[] = [];

    for (const [id, metadata] of this.metadata.entries()) {
      const shouldCleanup = (
        lifecycleStates.includes(metadata.lifecycleState) &&
        (metadata.lastAccessed ? new Date(metadata.lastAccessed) < cutoffTime : new Date(metadata.createdAt) < cutoffTime)
      ) || force;

      if (shouldCleanup) {
        objectsToCleanup.push(id);
      }
    }

    // 정리 실행
    for (const id of objectsToCleanup) {
      await this.actionRegister.dispatch('unregister', { id, force: true });
    }

    console.log(`Cleaned up ${objectsToCleanup.length} objects in context '${this.config.contextName}'`);
  }

  /**
   * 자동 정리 시작
   */
  private startAutoCleanup(): void {
    if (!this.config.autoCleanup?.enabled) return;

    this.cleanupInterval = setInterval(() => {
      this.actionRegister.dispatch('cleanup', {
        olderThan: this.config.autoCleanup!.olderThanMs,
        lifecycleStates: this.config.autoCleanup!.lifecycleStates
      });
    }, this.config.autoCleanup.intervalMs);
  }

  /**
   * 객체 유효성 검증
   */
  private validateObject(object: T): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!object.id || typeof object.id !== 'string') {
      errors.push('Object must have a valid string ID');
    }

    if (!object.type || typeof object.type !== 'string') {
      errors.push('Object must have a valid string type');
    }

    if (!object.createdAt || !(object.createdAt instanceof Date)) {
      errors.push('Object must have a valid createdAt Date');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 이벤트 발생
   */
  private emitEvent(event: ObjectManagementEvent<T>): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in event listener for ${event.type}:`, error);
      }
    });
  }

  // Public API Methods

  /**
   * 객체 등록
   */
  public async register(id: string, object: T, metadata?: Record<string, unknown>, contextMetadata?: Record<string, unknown>): Promise<void> {
    return this.actionRegister.dispatch('register', { id, object, metadata, contextMetadata });
  }

  /**
   * 객체 해제
   */
  public async unregister(id: string, force = false): Promise<void> {
    return this.actionRegister.dispatch('unregister', { id, force });
  }

  /**
   * 객체 업데이트
   */
  public async update(id: string, object?: Partial<T>, metadata?: Record<string, unknown>, contextMetadata?: Record<string, unknown>): Promise<void> {
    return this.actionRegister.dispatch('update', { id, object, metadata, contextMetadata });
  }

  /**
   * 객체 조회
   */
  public getObject(id: string): T | null {
    return this.objects.get(id) || null;
  }

  /**
   * 객체 메타데이터 조회
   */
  public getMetadata(id: string): ObjectMetadata<T> | null {
    return this.metadata.get(id) || null;
  }

  /**
   * 모든 객체 조회
   */
  public getAllObjects(): Map<string, T> {
    return new Map(this.objects);
  }

  /**
   * 쿼리를 통한 객체 검색
   */
  public queryObjects(options: QueryOptions = {}): T[] {
    const objects: T[] = [];
    
    for (const [id, object] of this.objects.entries()) {
      const metadata = this.metadata.get(id);
      if (!metadata) continue;

      // 타입 필터
      if (options.type) {
        const types = Array.isArray(options.type) ? options.type : [options.type];
        if (!types.includes(object.type)) continue;
      }

      // 생명주기 상태 필터
      if (options.lifecycleState) {
        const states = Array.isArray(options.lifecycleState) ? options.lifecycleState : [options.lifecycleState];
        if (!states.includes(metadata.lifecycleState)) continue;
      }

      // 메타데이터 필터 (단순 매칭)
      if (options.metadata) {
        let matchesMetadata = true;
        for (const [key, value] of Object.entries(options.metadata)) {
          if (metadata.metadata?.[key] !== value) {
            matchesMetadata = false;
            break;
          }
        }
        if (!matchesMetadata) continue;
      }

      objects.push(object);
    }

    // 정렬
    if (options.sortBy) {
      objects.sort((a, b) => {
        const aMetadata = this.metadata.get(a.id)!;
        const bMetadata = this.metadata.get(b.id)!;
        
        let aValue: any, bValue: any;
        switch (options.sortBy) {
          case 'createdAt':
            aValue = new Date(aMetadata.createdAt);
            bValue = new Date(bMetadata.createdAt);
            break;
          case 'lastAccessed':
            aValue = aMetadata.lastAccessed ? new Date(aMetadata.lastAccessed) : new Date(0);
            bValue = bMetadata.lastAccessed ? new Date(bMetadata.lastAccessed) : new Date(0);
            break;
          case 'id':
            aValue = a.id;
            bValue = b.id;
            break;
          case 'type':
            aValue = a.type;
            bValue = b.type;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return options.sortOrder === 'desc' ? 1 : -1;
        if (aValue > bValue) return options.sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
    }

    // 페이징
    const start = options.offset || 0;
    const end = options.limit ? start + options.limit : undefined;
    return objects.slice(start, end);
  }

  /**
   * 선택된 객체들 조회
   */
  public getSelectedObjects(): string[] {
    return Array.from(this.selectedObjects);
  }

  /**
   * 포커스된 객체 조회
   */
  public getFocusedObject(): string | null {
    return this.focusedObject;
  }

  /**
   * 이벤트 리스너 등록
   */
  public addEventListener(eventType: ObjectManagementEvent<T>['type'], listener: (event: ObjectManagementEvent<T>) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * 이벤트 리스너 제거
   */
  public removeEventListener(eventType: ObjectManagementEvent<T>['type'], listener: (event: ObjectManagementEvent<T>) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 컨텍스트 정리 및 해제
   */
  public dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.objects.clear();
    this.metadata.clear();
    this.selectedObjects.clear();
    this.focusedObject = null;
    this.eventListeners.clear();
    console.log(`Object context '${this.config.contextName}' disposed`);
  }

  /**
   * 컨텍스트 상태 조회
   */
  public getState(): {
    objectCount: number;
    selectedCount: number;
    focusedObjectId: string | null;
    lifecycleStats: Record<ObjectLifecycleState, number>;
    typeStats: Record<string, number>;
  } {
    const lifecycleStats: Record<ObjectLifecycleState, number> = {
      created: 0,
      active: 0,
      inactive: 0,
      archived: 0,
      deleted: 0
    };

    const typeStats: Record<string, number> = {};

    for (const metadata of this.metadata.values()) {
      lifecycleStats[metadata.lifecycleState]++;
      typeStats[metadata.type] = (typeStats[metadata.type] || 0) + 1;
    }

    return {
      objectCount: this.objects.size,
      selectedCount: this.selectedObjects.size,
      focusedObjectId: this.focusedObject,
      lifecycleStats,
      typeStats
    };
  }
}