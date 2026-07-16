/**
 * @fileoverview React Hooks 팩토리 - 범용 객체 컨텍스트 관리
 * 단일 엔드포인트 패턴의 React 통합
 */

import {
  createActionContext,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';
import React, { ReactNode, useEffect, useRef } from 'react';
import { useObjectContextHandlerRegistry } from './handlers/ObjectContextHandlerRegistry';
import { ObjectContextManager } from './ObjectContextManager';
import {
  BaseObjectActions,
  ManagedObject,
  ObjectContextConfig,
  ObjectLifecycleState,
  ObjectManagementEvent,
  ObjectMetadata,
  QueryOptions,
} from './types';

/**
 * 객체 컨텍스트 관리를 위한 React Hooks 팩토리
 * @template T 관리할 객체 타입
 * @param config 컨텍스트 설정
 * @returns 객체 관리를 위한 React 훅들과 컴포넌트들
 */
export function createObjectContextHooks<T extends ManagedObject>(
  config: ObjectContextConfig
) {
  // Store Pattern 생성
  const {
    Provider: ObjectStoreProvider,
    useStore: useObjectStore,
    useStoreManager: useObjectStoreManager,
  } = createStoreContext(`ObjectContext_${config.contextName}`, {
    objects: {
      initialValue: new Map<string, ObjectMetadata>(),
    },
    selectedObjects: {
      initialValue: [] as string[],
    },
    focusedObject: {
      initialValue: null as string | null,
    },
    lastCleanup: {
      initialValue: null as string | null,
    },
  });

  // Action Context 생성
  const {
    Provider: ObjectActionProvider,
    useActionDispatch: useObjectAction,
    useActionHandler: useObjectActionHandler,
  } = createActionContext<BaseObjectActions<T>>(
    `ObjectContext_${config.contextName}_Actions`
  );

  // Manager Store 생성 (Core ObjectContextManager 인스턴스 공유를 위한 Store)
  const { Provider: ObjectManagerProvider, useStore: useObjectManagerStore } =
    createStoreContext(`ObjectManager_${config.contextName}`, {
      manager: {
        initialValue: null as ObjectContextManager<T> | null,
      },
    });

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
    const manager = useObjectContextManager();

    // Computed values (React 컴파일러가 자동으로 메모이제이션)
    const objectsMap =
      objects instanceof Map
        ? (objects as Map<string, ObjectMetadata>)
        : new Map(Object.entries(objects as Record<string, ObjectMetadata>));

    const selectedObjectsInfo = selectedObjects
      .map((id) => objectsMap.get(id))
      .filter(Boolean) as ObjectMetadata[];

    const focusedObjectInfo = focusedObject
      ? objectsMap.get(focusedObject) || null
      : null;

    // Query function
    const queryObjects = (options: QueryOptions = {}): ObjectMetadata[] => {
      const results: ObjectMetadata[] = [];

      for (const metadata of objectsMap.values()) {
        // 타입 필터
        if (options.type) {
          const types = Array.isArray(options.type)
            ? options.type
            : [options.type];
          if (!types.includes(metadata.type)) continue;
        }

        // 생명주기 상태 필터
        if (options.lifecycleState) {
          const states = Array.isArray(options.lifecycleState)
            ? options.lifecycleState
            : [options.lifecycleState];
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
    };

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

      // Getters (Metadata)
      getObject: (id: string) => objectsMap.get(id) || null,
      getAllObjects: () => objectsMap,

      // Getters (Actual Objects)
      getActualObject: (id: string) => manager.getObject(id),

      // Statistics
      getStats: () => {
        const lifecycleStats: Record<ObjectLifecycleState, number> = {
          created: 0,
          active: 0,
          inactive: 0,
          archived: 0,
          deleted: 0,
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
          typeStats,
        };
      },
    };
  };

  /**
   * Core Action Hook - 순수 액션 디스패치
   */
  const useObjectContextActions = () => {
    const dispatch = useObjectAction();

    return {
      register: (
        id: string,
        object: T,
        metadata?: Record<string, unknown>,
        contextMetadata?: Record<string, unknown>
      ) => {
        dispatch('register', {
          id,
          object,
          ...(metadata !== undefined && { metadata }),
          ...(contextMetadata !== undefined && { contextMetadata }),
        });
      },

      unregister: (id: string, force = false) => {
        dispatch('unregister', { id, force });
      },

      update: (
        id: string,
        object?: Partial<T>,
        metadata?: Record<string, unknown>,
        contextMetadata?: Record<string, unknown>
      ) => {
        dispatch('update', {
          id,
          ...(object !== undefined && { object }),
          ...(metadata !== undefined && { metadata }),
          ...(contextMetadata !== undefined && { contextMetadata }),
        });
      },

      // 생명주기 관리
      activate: (id: string) => {
        dispatch('activate', { id });
      },

      deactivate: (id: string) => {
        dispatch('deactivate', { id });
      },

      archive: (id: string) => {
        dispatch('archive', { id });
      },

      restore: (id: string) => {
        dispatch('restore', { id });
      },

      // 선택 관리 (조건부 처리)
      select: (
        ids: string[],
        mode: 'replace' | 'add' | 'toggle' = 'replace'
      ) => {
        if (!config.enableSelection) return;
        dispatch('select', { ids, mode });
      },

      clearSelection: () => {
        if (!config.enableSelection) return;
        dispatch('clearSelection');
      },

      // 포커스 관리 (조건부 처리)
      focus: (id: string) => {
        if (!config.enableFocus) return;
        dispatch('focus', { id });
      },

      clearFocus: () => {
        if (!config.enableFocus) return;
        dispatch('clearFocus');
      },

      // 정리
      cleanup: (
        olderThan?: number,
        lifecycleStates?: ObjectLifecycleState[],
        force = false
      ) => {
        dispatch('cleanup', {
          ...(olderThan !== undefined && { olderThan }),
          ...(lifecycleStates !== undefined && { lifecycleStates }),
          force,
        });
      },
    };
  };

  /**
   * Manager Hook - ObjectContextManager 인스턴스 접근
   */
  const useObjectContextManager = () => {
    const managerStore = useObjectManagerStore('manager');
    const manager = useStoreValue(managerStore);
    if (!manager) {
      throw new Error(
        `useObjectContextManager must be used within ObjectContextProvider for context '${config.contextName}'`
      );
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
      removeEventListener: manager.removeEventListener.bind(manager),
    };
  };

  /**
   * 이벤트 리스너 Hook
   */
  const useObjectContextEvents = (
    eventType: ObjectManagementEvent<T>['type'],
    listener: (event: ObjectManagementEvent<T>) => void
  ) => {
    const manager = useObjectContextManager();

    useEffect(() => {
      manager.addEventListener(eventType, listener);
      return () => {
        manager.removeEventListener(eventType, listener);
      };
    }, []);
  };

  /**
   * 실시간 동기화를 위한 Action Handler Hook
   */
  const useObjectContextSync = () => {
    useObjectContextHandlerRegistry({
      config,
      useObjectActionHandler,
      useObjectStoreManager,
      useObjectContextManager,
    });
  };

  /**
   * Provider 컴포넌트 (Manager 초기화)
   */
  const ObjectManagerInitializer: React.FC<{ children: ReactNode }> = ({
    children,
  }) => {
    const managerStore = useObjectManagerStore('manager');
    const managerRef = useRef<ObjectContextManager<T> | null>(null);

    if (!managerRef.current) {
      managerRef.current = new ObjectContextManager<T>(config);
      managerStore.setValue(managerRef.current);
    }

    useEffect(() => {
      return () => {
        // Cleanup on unmount
        if (managerRef.current) {
          managerRef.current.dispose();
          managerStore.setValue(null);
        }
      };
    }, []);

    return <>{children}</>;
  };

  /**
   * Provider 컴포넌트
   */
  const ObjectContextProvider: React.FC<{ children: ReactNode }> = ({
    children,
  }) => {
    return (
      <ObjectManagerProvider>
        <ObjectStoreProvider>
          <ObjectActionProvider>
            <ObjectManagerInitializer>
              <ObjectContextSyncProvider>{children}</ObjectContextSyncProvider>
            </ObjectManagerInitializer>
          </ObjectActionProvider>
        </ObjectStoreProvider>
      </ObjectManagerProvider>
    );
  };

  /**
   * 동기화 Provider 컴포넌트
   */
  const ObjectContextSyncProvider: React.FC<{ children: ReactNode }> = ({
    children,
  }) => {
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

    // Store and Action Providers (for selective usage)
    ObjectStoreProvider,
    ObjectActionProvider,
    ObjectManagerProvider,
    useObjectStore,
    useObjectAction,
    useObjectActionHandler,
    useObjectManagerStore,

    // Configuration
    config,
  };
}
