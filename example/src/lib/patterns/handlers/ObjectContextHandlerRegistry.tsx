/**
 * @fileoverview 범용 객체 컨텍스트의 Action → Manager → Store 동기화 레지스트리
 */

import type { DispatchArgs } from '@context-action/core';
import type { ActionContextReturn, StoreManager } from '@context-action/react';
import { ObjectContextManager } from '../ObjectContextManager';
import type {
  BaseObjectActions,
  ManagedObject,
  ObjectContextConfig,
  ObjectMetadata,
} from '../types';

interface ObjectStoreValues {
  objects: Map<string, ObjectMetadata>;
  selectedObjects: string[];
  focusedObject: string | null;
  lastCleanup: string | null;
}

export interface ObjectContextHandlerRegistryDependencies<
  T extends ManagedObject,
> {
  config: ObjectContextConfig;
  useObjectActionHandler: ActionContextReturn<
    BaseObjectActions<T>
  >['useActionHandler'];
  useObjectStoreManager: () => StoreManager<ObjectStoreValues>;
  useObjectContextManager: () => ObjectContextManager<T>;
}

/**
 * 범용 객체 컨텍스트의 모든 상태 변경 핸들러를 등록합니다.
 *
 * Factory는 Context/Provider 계약만 만들고, 실제 Action 등록과
 * Manager→Store 동기화는 이 Registry가 소유합니다.
 */
export function useObjectContextHandlerRegistry<T extends ManagedObject>({
  config,
  useObjectActionHandler,
  useObjectStoreManager,
  useObjectContextManager,
}: ObjectContextHandlerRegistryDependencies<T>) {
  const storeManager = useObjectStoreManager();
  const manager = useObjectContextManager();

  useObjectActionHandler('register', async (payload) => {
    const { id, object, metadata, contextMetadata } = payload;
    await manager.register(id, object, metadata, contextMetadata);

    const objectMetadata = manager.getMetadata(id);
    if (objectMetadata) {
      const objectsStore = storeManager.getStore('objects');
      const currentObjects = objectsStore.getValue();
      const updatedObjects = new Map(currentObjects);
      updatedObjects.set(id, objectMetadata);
      objectsStore.setValue(updatedObjects);
    }
  });

  useObjectActionHandler('unregister', async (payload) => {
    const { id, force } = payload;
    await manager.unregister(id, force);

    const objectsStore = storeManager.getStore('objects');
    const currentObjects = objectsStore.getValue();
    const updatedObjects = new Map(currentObjects);
    updatedObjects.delete(id);
    objectsStore.setValue(updatedObjects);

    const selectedObjectsStore = storeManager.getStore('selectedObjects');
    const currentSelected = selectedObjectsStore.getValue();
    if (currentSelected.includes(id)) {
      selectedObjectsStore.setValue(
        currentSelected.filter((selectedId) => selectedId !== id)
      );
    }

    const focusedObjectStore = storeManager.getStore('focusedObject');
    if (focusedObjectStore.getValue() === id) {
      focusedObjectStore.setValue(null);
    }
  });

  useObjectActionHandler('update', async (payload) => {
    const { id, object, metadata, contextMetadata } = payload;
    await manager.update(id, object, metadata, contextMetadata);

    const objectMetadata = manager.getMetadata(id);
    if (objectMetadata) {
      const objectsStore = storeManager.getStore('objects');
      const currentObjects = objectsStore.getValue();
      const updatedObjects = new Map(currentObjects);
      updatedObjects.set(id, objectMetadata);
      objectsStore.setValue(updatedObjects);
    }
  });

  const handleLifecycleChange = async <
    K extends 'activate' | 'deactivate' | 'archive' | 'restore',
  >(
    actionType: K,
    payload: BaseObjectActions<T>[K]
  ) => {
    await manager.dispatch(
      actionType,
      ...([payload] as unknown as DispatchArgs<BaseObjectActions<T>[K]>)
    );

    const objectMetadata = manager.getMetadata(payload.id);
    if (objectMetadata) {
      const objectsStore = storeManager.getStore('objects');
      const currentObjects = objectsStore.getValue();
      const updatedObjects = new Map(currentObjects);
      updatedObjects.set(payload.id, objectMetadata);
      objectsStore.setValue(updatedObjects);
    }
  };

  useObjectActionHandler('activate', async (payload) => {
    await handleLifecycleChange('activate', payload);
  });

  useObjectActionHandler('deactivate', async (payload) => {
    await handleLifecycleChange('deactivate', payload);
  });

  useObjectActionHandler('archive', async (payload) => {
    await handleLifecycleChange('archive', payload);
  });

  useObjectActionHandler('restore', async (payload) => {
    await handleLifecycleChange('restore', payload);
  });

  const selectHandler = async (payload: BaseObjectActions<T>['select']) => {
    if (!config.enableSelection) return;

    await manager.dispatch('select', payload);

    const selectedObjects = manager.getSelectedObjects();
    const selectedObjectsStore = storeManager.getStore('selectedObjects');
    selectedObjectsStore.setValue(selectedObjects);
  };

  const clearSelectionHandler = async () => {
    if (!config.enableSelection) return;

    await manager.dispatch('clearSelection');

    const selectedObjectsStore = storeManager.getStore('selectedObjects');
    selectedObjectsStore.setValue([]);
  };

  useObjectActionHandler('select', selectHandler);
  useObjectActionHandler('clearSelection', clearSelectionHandler);

  const focusHandler = async (payload: BaseObjectActions<T>['focus']) => {
    if (!config.enableFocus) return;

    await manager.dispatch('focus', payload);

    const focusedObject = manager.getFocusedObject();
    const focusedObjectStore = storeManager.getStore('focusedObject');
    focusedObjectStore.setValue(focusedObject);
  };

  const clearFocusHandler = async () => {
    if (!config.enableFocus) return;

    await manager.dispatch('clearFocus');

    const focusedObjectStore = storeManager.getStore('focusedObject');
    focusedObjectStore.setValue(null);
  };

  useObjectActionHandler('focus', focusHandler);
  useObjectActionHandler('clearFocus', clearFocusHandler);

  useObjectActionHandler('cleanup', async (payload) => {
    await manager.dispatch('cleanup', payload);

    const allObjects = manager.getAllObjects();
    const objectsStore = storeManager.getStore('objects');
    const objectsMetadata = new Map<string, ObjectMetadata>();

    for (const [id] of allObjects) {
      const metadata = manager.getMetadata(id);
      if (metadata) {
        objectsMetadata.set(id, metadata);
      }
    }

    objectsStore.setValue(objectsMetadata);

    const lastCleanupStore = storeManager.getStore('lastCleanup');
    lastCleanupStore.setValue(new Date().toISOString());
  });
}
