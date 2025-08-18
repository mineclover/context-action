/**
 * @fileoverview React Hooks 팩토리 - 범용 객체 컨텍스트 관리
 * 단일 엔드포인트 패턴의 React 통합
 */

import React, { 
  createContext, 
  useContext, 
  useCallback, 
  useMemo, 
  useEffect,
  useState,
  ReactNode,
  useRef
} from 'react';
import { createActionContext, useStoreValue } from '@context-action/react';
import { createDeclarativeStorePattern } from '@context-action/react';
import {
  ManagedObject,
  ObjectMetadata,
  BaseObjectActions,
  ObjectContextConfig,
  ObjectContextState,
  ObjectLifecycleState,
  QueryOptions,
  ObjectManagementEvent
} from './types';
import { ObjectContextManager } from './ObjectContextManager';

/**
 * 객체 컨텍스트 관리를 위한 React Hooks 팩토리
 * @template T 관리할 객체 타입
 * @param config 컨텍스트 설정
 * @returns 객체 관리를 위한 React 훅들과 컴포넌트들
 */
export function createObjectContextHooks<T extends ManagedObject>(config: ObjectContextConfig) {
  // Store Pattern 생성
  const {
    Provider: ObjectStoreProvider,
    useStore: useObjectStore,
    useStoreManager: useObjectStoreManager
  } = createDeclarativeStorePattern(`ObjectContext_${config.contextName}`, {
    objects: { 
      initialValue: new Map<string, ObjectMetadata<T>>()
    },
    selectedObjects: { 
      initialValue: [] as string[] 
    },
    focusedObject: { 
      initialValue: null as string | null 
    },
    lastCleanup: { 
      initialValue: null as string | null 
    }
  });

  // Action Context 생성
  const {
    Provider: ObjectActionProvider,
    useActionDispatch: useObjectAction,
    useActionHandler: useObjectActionHandler
  } = createActionContext<BaseObjectActions<T>>(`ObjectContext_${config.contextName}_Actions`);

  // Manager Context 생성 (Core ObjectContextManager 인스턴스 공유)
  const ObjectManagerContext = createContext<ObjectContextManager<T> | null>(null);

  /**
   * Core Store Hook - 순수 상태 조회
   */
  const useObjectContextStore = () => {
    const objectsStore = useObjectStore('objects');
    const selectedObjectsStore = useObjectStore('selectedObjects');
    const focusedObjectStore = useObjectStore('focusedObject');
    const lastCleanupStore = useObjectStore('lastCleanup');

    const objects = useStoreValue(objectsStore);
    const selectedObjects = useStoreValue(selectedObjectsStore);
    const focusedObject = useStoreValue(focusedObjectStore);
    const lastCleanup = useStoreValue(lastCleanupStore);

    // Computed values
    const objectsMap = useMemo(() => {
      return objects instanceof Map ? objects : new Map(Object.entries(objects as any));
    }, [objects]);

    const selectedObjectsInfo = useMemo(() => {
      return selectedObjects.map(id => objectsMap.get(id)).filter(Boolean) as ObjectMetadata<T>[];
    }, [selectedObjects, objectsMap]);

    const focusedObjectInfo = useMemo(() => {
      return focusedObject ? objectsMap.get(focusedObject) || null : null;
    }, [focusedObject, objectsMap]);

    // Query function
    const queryObjects = useCallback((options: QueryOptions = {}): ObjectMetadata<T>[] => {
      const results: ObjectMetadata<T>[] = [];
      
      for (const metadata of objectsMap.values()) {
        // 타입 필터
        if (options.type) {
          const types = Array.isArray(options.type) ? options.type : [options.type];
          if (!types.includes(metadata.type)) continue;
        }

        // 생명주기 상태 필터
        if (options.lifecycleState) {
          const states = Array.isArray(options.lifecycleState) ? options.lifecycleState : [options.lifecycleState];
          if (!states.includes(metadata.lifecycleState)) continue;
        }

        // 메타데이터 필터
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

        results.push(metadata);
      }

      // 정렬
      if (options.sortBy) {
        results.sort((a, b) => {
          let aValue: any, bValue: any;
          switch (options.sortBy) {
            case 'createdAt':
              aValue = new Date(a.createdAt);
              bValue = new Date(b.createdAt);
              break;
            case 'lastAccessed':
              aValue = a.lastAccessed ? new Date(a.lastAccessed) : new Date(0);
              bValue = b.lastAccessed ? new Date(b.lastAccessed) : new Date(0);
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
      return results.slice(start, end);
    }, [objectsMap]);

    return {
      // Raw state
      objects: objectsMap,
      selectedObjects,
      focusedObject,
      lastCleanup,
      
      // Computed values
      selectedObjectsInfo,
      focusedObjectInfo,
      
      // Query function
      queryObjects,
      
      // Getters
      getObject: useCallback((id: string) => objectsMap.get(id) || null, [objectsMap]),
      getAllObjects: useCallback(() => objectsMap, [objectsMap]),
      
      // Statistics
      getStats: useCallback(() => {
        const lifecycleStats: Record<ObjectLifecycleState, number> = {
          created: 0,
          active: 0,
          inactive: 0,
          archived: 0,
          deleted: 0
        };

        const typeStats: Record<string, number> = {};

        for (const metadata of objectsMap.values()) {
          lifecycleStats[metadata.lifecycleState]++;
          typeStats[metadata.type] = (typeStats[metadata.type] || 0) + 1;
        }

        return {
          objectCount: objectsMap.size,
          selectedCount: selectedObjects.length,
          focusedObjectId: focusedObject,
          lifecycleStats,
          typeStats
        };
      }, [objectsMap, selectedObjects.length, focusedObject])
    };
  };

  /**
   * Core Action Hook - 순수 액션 디스패치
   */
  const useObjectContextActions = () => {
    const dispatch = useObjectAction();

    return {
      register: useCallback((
        id: string, 
        object: T, 
        metadata?: Record<string, unknown>, 
        contextMetadata?: Record<string, unknown>
      ) => {
        dispatch('register', { id, object, metadata, contextMetadata });
      }, [dispatch]),

      unregister: useCallback((id: string, force = false) => {
        dispatch('unregister', { id, force });
      }, [dispatch]),

      update: useCallback((
        id: string, 
        object?: Partial<T>, 
        metadata?: Record<string, unknown>,
        contextMetadata?: Record<string, unknown>
      ) => {
        dispatch('update', { id, object, metadata, contextMetadata });
      }, [dispatch]),

      // 생명주기 관리
      activate: useCallback((id: string) => {
        dispatch('activate', { id });
      }, [dispatch]),

      deactivate: useCallback((id: string) => {
        dispatch('deactivate', { id });
      }, [dispatch]),

      archive: useCallback((id: string) => {
        dispatch('archive', { id });
      }, [dispatch]),

      restore: useCallback((id: string) => {
        dispatch('restore', { id });
      }, [dispatch]),

      // 선택 및 포커스 관리 (설정에 따라)
      ...(config.enableSelection && {
        select: useCallback((ids: string[], mode: 'replace' | 'add' | 'toggle' = 'replace') => {
          dispatch('select', { ids, mode });
        }, [dispatch]),

        clearSelection: useCallback(() => {
          dispatch('clearSelection');
        }, [dispatch])
      }),

      ...(config.enableFocus && {
        focus: useCallback((id: string) => {
          dispatch('focus', { id });
        }, [dispatch]),

        clearFocus: useCallback(() => {
          dispatch('clearFocus');
        }, [dispatch])
      }),

      // 정리
      cleanup: useCallback((
        olderThan?: number, 
        lifecycleStates?: ObjectLifecycleState[], 
        force = false
      ) => {
        dispatch('cleanup', { olderThan, lifecycleStates, force });
      }, [dispatch])
    };
  };

  /**
   * Manager Hook - ObjectContextManager 인스턴스 접근
   */
  const useObjectContextManager = () => {
    const manager = useContext(ObjectManagerContext);
    if (!manager) {
      throw new Error(`useObjectContextManager must be used within ObjectContextProvider for context '${config.contextName}'`);
    }
    return manager;
  };

  /**
   * 통합 Manager Hook - Facade Pattern
   * 기존 인터페이스 호환성 유지
   */
  const useObjectManager = () => {
    const store = useObjectContextStore();
    const actions = useObjectContextActions();
    const manager = useObjectContextManager();

    return {
      // Store methods (읽기 전용)
      getObject: store.getObject,
      getAllObjects: store.getAllObjects,
      queryObjects: store.queryObjects,
      getStats: store.getStats,
      
      // State values
      objects: store.objects,
      selectedObjects: store.selectedObjects,
      focusedObject: store.focusedObject,
      selectedObjectsInfo: store.selectedObjectsInfo,
      focusedObjectInfo: store.focusedObjectInfo,
      
      // Action methods (상태 변경)
      register: actions.register,
      unregister: actions.unregister,
      update: actions.update,
      activate: actions.activate,
      deactivate: actions.deactivate,
      archive: actions.archive,
      restore: actions.restore,
      ...(actions.select && { select: actions.select }),
      ...(actions.clearSelection && { clearSelection: actions.clearSelection }),
      ...(actions.focus && { focus: actions.focus }),
      ...(actions.clearFocus && { clearFocus: actions.clearFocus }),
      cleanup: actions.cleanup,
      
      // Manager methods
      addEventListener: manager.addEventListener.bind(manager),
      removeEventListener: manager.removeEventListener.bind(manager)
    };
  };

  /**
   * 이벤트 리스너 Hook
   */
  const useObjectContextEvents = (
    eventType: ObjectManagementEvent<T>['type'],
    listener: (event: ObjectManagementEvent<T>) => void,
    dependencies: React.DependencyList = []
  ) => {
    const manager = useObjectContextManager();

    useEffect(() => {
      manager.addEventListener(eventType, listener);
      return () => {
        manager.removeEventListener(eventType, listener);
      };
    }, [manager, eventType, listener, ...dependencies]);
  };

  /**
   * 실시간 동기화를 위한 Action Handler Hook
   */
  const useObjectContextSync = () => {
    const storeManager = useObjectStoreManager();
    const manager = useObjectContextManager();

    // Action handlers for store synchronization
    useObjectActionHandler('register', useCallback(async (payload) => {
      // Manager를 통해 실제 등록 처리
      const { id, object, metadata, contextMetadata } = payload;
      await manager.register(id, object, metadata, contextMetadata);
      
      // Store 동기화
      const objectMetadata = manager.getMetadata(id);
      if (objectMetadata) {
        const objectsStore = storeManager.getStore('objects');
        const currentObjects = objectsStore.getValue() as Map<string, ObjectMetadata<T>>;
        const updatedObjects = new Map(currentObjects);
        updatedObjects.set(id, objectMetadata);
        objectsStore.setValue(updatedObjects);
      }
    }, [manager, storeManager]));

    useObjectActionHandler('unregister', useCallback(async (payload) => {
      const { id, force } = payload;
      await manager.unregister(id, force);
      
      // Store 동기화
      const objectsStore = storeManager.getStore('objects');
      const currentObjects = objectsStore.getValue() as Map<string, ObjectMetadata<T>>;
      const updatedObjects = new Map(currentObjects);
      updatedObjects.delete(id);
      objectsStore.setValue(updatedObjects);
      
      // 선택 및 포커스에서 제거
      const selectedObjectsStore = storeManager.getStore('selectedObjects');
      const currentSelected = selectedObjectsStore.getValue() as string[];
      if (currentSelected.includes(id)) {
        selectedObjectsStore.setValue(currentSelected.filter(selectedId => selectedId !== id));
      }
      
      const focusedObjectStore = storeManager.getStore('focusedObject');
      if (focusedObjectStore.getValue() === id) {
        focusedObjectStore.setValue(null);
      }
    }, [manager, storeManager]));

    useObjectActionHandler('update', useCallback(async (payload) => {
      const { id, object, metadata, contextMetadata } = payload;
      await manager.update(id, object, metadata, contextMetadata);
      
      // Store 동기화
      const objectMetadata = manager.getMetadata(id);
      if (objectMetadata) {
        const objectsStore = storeManager.getStore('objects');
        const currentObjects = objectsStore.getValue() as Map<string, ObjectMetadata<T>>;
        const updatedObjects = new Map(currentObjects);
        updatedObjects.set(id, objectMetadata);
        objectsStore.setValue(updatedObjects);
      }
    }, [manager, storeManager]));

    // 생명주기 상태 변경 핸들러들
    const handleLifecycleChange = useCallback(async (actionType: string, payload: any) => {
      // @ts-ignore - 동적 액션 호출
      await manager.actionRegister.dispatch(actionType, payload);
      
      // Store 동기화
      const objectMetadata = manager.getMetadata(payload.id);
      if (objectMetadata) {
        const objectsStore = storeManager.getStore('objects');
        const currentObjects = objectsStore.getValue() as Map<string, ObjectMetadata<T>>;
        const updatedObjects = new Map(currentObjects);
        updatedObjects.set(payload.id, objectMetadata);
        objectsStore.setValue(updatedObjects);
      }
    }, [manager, storeManager]);

    useObjectActionHandler('activate', useCallback(async (payload) => {
      await handleLifecycleChange('activate', payload);
    }, [handleLifecycleChange]));

    useObjectActionHandler('deactivate', useCallback(async (payload) => {
      await handleLifecycleChange('deactivate', payload);
    }, [handleLifecycleChange]));

    useObjectActionHandler('archive', useCallback(async (payload) => {
      await handleLifecycleChange('archive', payload);
    }, [handleLifecycleChange]));

    useObjectActionHandler('restore', useCallback(async (payload) => {
      await handleLifecycleChange('restore', payload);
    }, [handleLifecycleChange]));

    // 선택 관리 핸들러
    if (config.enableSelection) {
      useObjectActionHandler('select', useCallback(async (payload) => {
        // @ts-ignore
        await manager.actionRegister.dispatch('select', payload);
        
        // Store 동기화
        const selectedObjects = manager.getSelectedObjects();
        const selectedObjectsStore = storeManager.getStore('selectedObjects');
        selectedObjectsStore.setValue(selectedObjects);
      }, [manager, storeManager]));

      useObjectActionHandler('clearSelection', useCallback(async () => {
        // @ts-ignore
        await manager.actionRegister.dispatch('clearSelection');
        
        // Store 동기화
        const selectedObjectsStore = storeManager.getStore('selectedObjects');
        selectedObjectsStore.setValue([]);
      }, [manager, storeManager]));
    }

    // 포커스 관리 핸들러
    if (config.enableFocus) {
      useObjectActionHandler('focus', useCallback(async (payload) => {
        // @ts-ignore
        await manager.actionRegister.dispatch('focus', payload);
        
        // Store 동기화
        const focusedObject = manager.getFocusedObject();
        const focusedObjectStore = storeManager.getStore('focusedObject');
        focusedObjectStore.setValue(focusedObject);
      }, [manager, storeManager]));

      useObjectActionHandler('clearFocus', useCallback(async () => {
        // @ts-ignore
        await manager.actionRegister.dispatch('clearFocus');
        
        // Store 동기화
        const focusedObjectStore = storeManager.getStore('focusedObject');
        focusedObjectStore.setValue(null);
      }, [manager, storeManager]));
    }

    useObjectActionHandler('cleanup', useCallback(async (payload) => {
      // @ts-ignore
      await manager.actionRegister.dispatch('cleanup', payload);
      
      // Store 전체 동기화
      const allObjects = manager.getAllObjects();
      const objectsStore = storeManager.getStore('objects');
      const objectsMetadata = new Map<string, ObjectMetadata<T>>();
      
      for (const [id, _] of allObjects) {
        const metadata = manager.getMetadata(id);
        if (metadata) {
          objectsMetadata.set(id, metadata);
        }
      }
      
      objectsStore.setValue(objectsMetadata);
      
      // 정리 시간 업데이트
      const lastCleanupStore = storeManager.getStore('lastCleanup');
      lastCleanupStore.setValue(new Date().toISOString());
    }, [manager, storeManager]));
  };

  /**
   * Provider 컴포넌트
   */
  const ObjectContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const managerRef = useRef<ObjectContextManager<T>>();
    
    if (!managerRef.current) {
      managerRef.current = new ObjectContextManager<T>(config);
    }

    useEffect(() => {
      return () => {
        // Cleanup on unmount
        if (managerRef.current) {
          managerRef.current.dispose();
        }
      };
    }, []);

    return (
      <ObjectManagerContext.Provider value={managerRef.current}>
        <ObjectStoreProvider>
          <ObjectActionProvider>
            <ObjectContextSyncProvider>
              {children}
            </ObjectContextSyncProvider>
          </ObjectActionProvider>
        </ObjectStoreProvider>
      </ObjectManagerContext.Provider>
    );
  };

  /**
   * 동기화 Provider 컴포넌트
   */
  const ObjectContextSyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    useObjectContextSync();
    return <>{children}</>;
  };

  return {
    // Provider Components
    ObjectContextProvider,
    
    // Core Hooks
    useObjectContextStore,
    useObjectContextActions,
    useObjectContextManager,
    useObjectManager, // Facade Hook
    useObjectContextEvents,
    
    // Context Objects (for advanced usage)
    ObjectManagerContext,
    
    // Store and Action Providers (for selective usage)
    ObjectStoreProvider,
    ObjectActionProvider,
    useObjectStore,
    useObjectAction,
    useObjectActionHandler,
    
    // Configuration
    config
  };
}