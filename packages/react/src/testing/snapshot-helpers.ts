/**
 * Store 상태 스냅샷 관리 유틸리티
 * 테스트 시작/종료 시점에서 상태를 저장하고 복원하는 기능
 */

import { Store } from '../stores/core/Store';
import { MockStore } from './mock-store';
import { StoreRegistry } from '../stores/core/StoreRegistry';
import type { IStore } from '../stores/core/types';

export interface StoreSnapshot<T = any> {
  /** 스냅샷 생성 시간 */
  timestamp: number;
  /** Store 이름 */
  storeName: string;
  /** 저장된 값 */
  value: T;
  /** 추가 메타데이터 */
  metadata?: Record<string, any>;
}

export interface RegistrySnapshot {
  /** 스냅샷 생성 시간 */
  timestamp: number;
  /** 레지스트리 이름 */
  registryName: string;
  /** 모든 Store 스냅샷들 */
  stores: Record<string, StoreSnapshot>;
}

/**
 * 단일 Store 스냅샷 생성
 */
export function createStoreSnapshot<T>(
  store: Store<T> | MockStore<T> | IStore<T>,
  storeName?: string,
  metadata?: Record<string, any>
): StoreSnapshot<T> {
  return {
    timestamp: Date.now(),
    storeName: storeName || store.name,
    value: store.getValue(),
    metadata
  };
}

/**
 * Store 스냅샷으로부터 상태 복원
 */
export function restoreStoreSnapshot<T>(
  store: Store<T> | MockStore<T> | IStore<T>,
  snapshot: StoreSnapshot<T>
): void {
  // MockStore인 경우 silent 방식 사용 가능
  if ('setValueSilent' in store) {
    store.setValueSilent(snapshot.value);
  } else {
    store.setValue(snapshot.value);
  }
}

/**
 * 여러 Store들의 스냅샷 생성
 */
export function createStoresSnapshot(
  stores: Record<string, Store<any> | MockStore<any>>,
  metadata?: Record<string, any>
): Record<string, StoreSnapshot> {
  const snapshots: Record<string, StoreSnapshot> = {};
  
  for (const [name, store] of Object.entries(stores)) {
    snapshots[name] = createStoreSnapshot(store, name, metadata);
  }
  
  return snapshots;
}

/**
 * 여러 Store들을 스냅샷으로부터 복원
 */
export function restoreStoresSnapshot(
  stores: Record<string, Store<any> | MockStore<any>>,
  snapshots: Record<string, StoreSnapshot>
): void {
  for (const [name, snapshot] of Object.entries(snapshots)) {
    const store = stores[name];
    if (store) {
      restoreStoreSnapshot(store, snapshot);
    }
  }
}

/**
 * StoreRegistry 전체 스냅샷 생성
 */
export function createRegistrySnapshot(
  registry: StoreRegistry,
  metadata?: Record<string, any>
): RegistrySnapshot {
  const allStores = registry.getAllStores();
  const storeSnapshots: Record<string, StoreSnapshot> = {};
  
  for (const [name, store] of allStores.entries()) {
    storeSnapshots[name] = createStoreSnapshot(store, name, metadata);
  }
  
  return {
    timestamp: Date.now(),
    registryName: registry.name,
    stores: storeSnapshots
  };
}

/**
 * StoreRegistry를 스냅샷으로부터 복원
 */
export function restoreRegistrySnapshot(
  registry: StoreRegistry,
  snapshot: RegistrySnapshot
): void {
  for (const [name, storeSnapshot] of Object.entries(snapshot.stores)) {
    const store = registry.getStore(name);
    if (store) {
      restoreStoreSnapshot(store, storeSnapshot);
    }
  }
}

/**
 * 스냅샷 관리 클래스
 * 테스트 lifecycle에 맞춰 자동으로 스냅샷을 관리
 */
export class SnapshotManager {
  private snapshots = new Map<string, StoreSnapshot>();
  private registrySnapshots = new Map<string, RegistrySnapshot>();

  /**
   * Store 스냅샷 저장
   */
  saveStore<T>(
    key: string,
    store: Store<T> | MockStore<T>,
    metadata?: Record<string, any>
  ): void {
    const snapshot = createStoreSnapshot(store, store.name, metadata);
    this.snapshots.set(key, snapshot);
  }

  /**
   * Store 복원
   */
  restoreStore<T>(
    key: string,
    store: Store<T> | MockStore<T>
  ): boolean {
    const snapshot = this.snapshots.get(key);
    if (snapshot) {
      restoreStoreSnapshot(store, snapshot);
      return true;
    }
    return false;
  }

  /**
   * Registry 스냅샷 저장
   */
  saveRegistry(
    key: string,
    registry: StoreRegistry,
    metadata?: Record<string, any>
  ): void {
    const snapshot = createRegistrySnapshot(registry, metadata);
    this.registrySnapshots.set(key, snapshot);
  }

  /**
   * Registry 복원
   */
  restoreRegistry(
    key: string,
    registry: StoreRegistry
  ): boolean {
    const snapshot = this.registrySnapshots.get(key);
    if (snapshot) {
      restoreRegistrySnapshot(registry, snapshot);
      return true;
    }
    return false;
  }

  /**
   * 모든 스냅샷 삭제
   */
  clear(): void {
    this.snapshots.clear();
    this.registrySnapshots.clear();
  }

  /**
   * 저장된 스냅샷 목록 조회
   */
  getSnapshotKeys(): {
    stores: string[];
    registries: string[];
  } {
    return {
      stores: Array.from(this.snapshots.keys()),
      registries: Array.from(this.registrySnapshots.keys())
    };
  }

  /**
   * 특정 스냅샷 삭제
   */
  deleteSnapshot(key: string): boolean {
    const storeDeleted = this.snapshots.delete(key);
    const registryDeleted = this.registrySnapshots.delete(key);
    return storeDeleted || registryDeleted;
  }
}

/**
 * 전역 스냅샷 매니저 인스턴스
 */
export const globalSnapshotManager = new SnapshotManager();

/**
 * 테스트 setup/teardown을 위한 헬퍼들
 */
export const SnapshotTestHelpers = {
  /**
   * 테스트 시작 전 Store들 스냅샷 저장
   */
  beforeEach: (
    stores: Record<string, Store<any> | MockStore<any>>,
    key: string = 'beforeEach'
  ) => {
    for (const [name, store] of Object.entries(stores)) {
      globalSnapshotManager.saveStore(`${key}-${name}`, store);
    }
  },

  /**
   * 테스트 종료 후 Store들 복원
   */
  afterEach: (
    stores: Record<string, Store<any> | MockStore<any>>,
    key: string = 'beforeEach'
  ) => {
    for (const [name, store] of Object.entries(stores)) {
      globalSnapshotManager.restoreStore(`${key}-${name}`, store);
    }
  },

  /**
   * Registry 자동 스냅샷 관리
   */
  beforeEachRegistry: (
    registry: StoreRegistry,
    key: string = 'beforeEach'
  ) => {
    globalSnapshotManager.saveRegistry(key, registry);
  },

  /**
   * Registry 자동 복원
   */
  afterEachRegistry: (
    registry: StoreRegistry,
    key: string = 'beforeEach'
  ) => {
    globalSnapshotManager.restoreRegistry(key, registry);
  }
};

/**
 * Jest describe 블록용 스냅샷 설정 헬퍼
 */
export function setupSnapshotTests(
  stores: Record<string, Store<any> | MockStore<any>>,
  options: {
    beforeEachKey?: string;
    afterEachKey?: string;
    clearOnStart?: boolean;
  } = {}
): void {
  const {
    beforeEachKey = 'test-setup',
    afterEachKey = beforeEachKey,
    clearOnStart = true
  } = options;

  if (clearOnStart) {
    globalSnapshotManager.clear();
  }

  beforeEach(() => {
    SnapshotTestHelpers.beforeEach(stores, beforeEachKey);
  });

  afterEach(() => {
    SnapshotTestHelpers.afterEach(stores, afterEachKey);
  });
}

/**
 * Registry용 스냅샷 테스트 설정
 */
export function setupRegistrySnapshotTests(
  registry: StoreRegistry,
  options: {
    beforeEachKey?: string;
    afterEachKey?: string;
    clearOnStart?: boolean;
  } = {}
): void {
  const {
    beforeEachKey = 'registry-setup',
    afterEachKey = beforeEachKey,
    clearOnStart = true
  } = options;

  if (clearOnStart) {
    globalSnapshotManager.clear();
  }

  beforeEach(() => {
    SnapshotTestHelpers.beforeEachRegistry(registry, beforeEachKey);
  });

  afterEach(() => {
    SnapshotTestHelpers.afterEachRegistry(registry, afterEachKey);
  });
}