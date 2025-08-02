/**
 * StoreRegistry 통합 Store 격리 패턴을 위한 React Hooks
 * 
 * 이름 기반으로 Store를 찾고, 없으면 생성하여 안정적인 Store 사용을 보장합니다.
 * 
 * @module store/isolation-hooks
 * @version 2.0.0 - StoreRegistry 통합 + 이름 기반 안정성
 */

import { useMemo, useRef, useId } from 'react';
import { createStore } from './Store';
import { IsolationStoreFactory, wrapStoreWithDebug, generateStoreName } from './isolation-utils';
import { useStoreRegistry } from './StoreContext';
import type { ComparisonOptions } from './comparison';

/**
 * React Hook: Registry 기반 Store 사용
 * 
 * StoreRegistry에서 이름으로 Store를 찾고, 없으면 생성하여 안정적인 Store 사용을 보장합니다.
 * 
 * @template T - Store 값 타입
 * @param storeName - Store 이름 (Registry 등록용)
 * @param initialValue - 초기값 (이미 있는 Store인 경우 무시됨)
 * @param options - Store 생성 옵션
 * @returns Store 인스턴스
 * 
 * @example
 * ```typescript
 * function Component() {
 *   const store = useRegistryStore(
 *     'my-store',
 *     { count: 0 },
 *     { strategy: 'shallow' }
 *   );
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export function useRegistryStore<T>(
  storeName: string,
  initialValue: T | (() => T),
  options: {
    strategy?: 'reference' | 'shallow' | 'deep';
    debug?: boolean;
    comparisonOptions?: Partial<ComparisonOptions<T>>;
  } = {}
): ReturnType<typeof createStore<T>> {
  const registry = useStoreRegistry();
  const { strategy = 'reference', debug = process.env.NODE_ENV === 'development', comparisonOptions } = options;

  // Registry 기반으로 Store 찾기 또는 생성
  const store = useMemo(() => {
    // 1. Registry에서 기존 Store 확인
    const existingStore = registry.getStore(storeName);
    
    if (existingStore) {
      if (debug) {
        console.log(`🔄 Using existing registry store: ${storeName}`);
      }
      return existingStore as ReturnType<typeof createStore<T>>;
    }

    // 2. 새 Store 생성
    const resolvedInitialValue = typeof initialValue === 'function' 
      ? (initialValue as () => T)() 
      : initialValue;

    const newStore = createStore(storeName, resolvedInitialValue);
    
    // 3. 비교 옵션 설정
    const finalComparisonOptions = {
      strategy,
      ...comparisonOptions
    };
    newStore.setComparisonOptions(finalComparisonOptions);

    // 4. Registry에 등록
    registry.register(storeName, newStore, {
      name: storeName,
      tags: ['registry', strategy],
      description: `Registry store: ${storeName} with ${strategy} comparison`
    });

    if (debug) {
      console.log(`🔧 New registry store created: ${storeName}`, {
        strategy,
        registeredStoreCount: registry.getStoreCount()
      });
    }

    return newStore;
  }, [storeName, registry]); // initialValue와 options는 의존성에서 제외

  return store;
}

/**
 * React Hook: useId 기반 컴포넌트 격리 Store
 * 
 * React useId와 도메인명을 결합하여 컴포넌트별로 고유한 Store를 생성합니다.
 * StoreRegistry가 자연스럽게 중복 생성을 방지합니다.
 * 
 * @template T - Store 값 타입
 * @param domain - Store 도메인 이름
 * @param initialValue - 초기값 (이미 있는 Store인 경우 무시됨)
 * @param options - Store 생성 옵션
 * @returns 격리된 Store 인스턴스
 * 
 * @example
 * ```typescript
 * function UserProfileComponent({ userId }: { userId: string }) {
 *   // useId + 도메인으로 컴포넌트별 고유 Store 생성
 *   const userStore = useIsolatedStore(
 *     'user-profile',
 *     { id: userId, name: '', email: '' },
 *     { strategy: 'shallow', debug: true }
 *   );
 *   
 *   const userValue = useStoreValue(userStore);
 *   return <div>User: {userValue.name}</div>;
 * }
 * ```
 */
export function useIsolatedStore<T>(
  domain: string,
  initialValue: T | (() => T),
  options: {
    strategy?: 'reference' | 'shallow' | 'deep';
    debug?: boolean;
    comparisonOptions?: Partial<ComparisonOptions<T>>;
  } = {}
): ReturnType<typeof createStore<T>> {
  const componentId = useId();
  const storeName = generateStoreName(domain, componentId);
  
  return useRegistryStore(storeName, initialValue, options);
}

/**
 * React Hook: useId 기반 지연 초기화 Store
 * 
 * Store가 없을 때만 무거운 초기화 작업을 수행하여 성능을 최적화합니다.
 * useId와 도메인을 결합하여 컴포넌트별로 고유한 Store를 생성합니다.
 * 
 * @template T - Store 값 타입
 * @param domain - Store 도메인 이름
 * @param initializer - 지연 초기화 함수 (이미 Store가 있으면 호출되지 않음)
 * @param options - Store 생성 옵션
 * @returns Store 인스턴스
 * 
 * @example
 * ```typescript
 * function HeavyDataComponent({ dataId }: { dataId: string }) {
 *   const dataStore = useLazyIsolatedStore(
 *     'heavy-data',
 *     () => {
 *       // 무거운 초기화 작업 (이미 Store가 있으면 실행되지 않음)
 *       console.log('Loading heavy data...');
 *       return processLargeDataSet(dataId);
 *     },
 *     { strategy: 'deep' }
 *   );
 *   
 *   const data = useStoreValue(dataStore);
 *   return <div>Data loaded: {data.items?.length} items</div>;
 * }
 * ```
 */
export function useLazyIsolatedStore<T>(
  domain: string,
  initializer: () => T,
  options: {
    strategy?: 'reference' | 'shallow' | 'deep';
    debug?: boolean;
    comparisonOptions?: Partial<ComparisonOptions<T>>;
  } = {}
): ReturnType<typeof createStore<T>> {
  const componentId = useId();
  const storeName = generateStoreName(domain, componentId);
  const registry = useStoreRegistry();
  const { strategy = 'reference', debug = process.env.NODE_ENV === 'development', comparisonOptions } = options;
  const initializerRef = useRef(initializer);
  initializerRef.current = initializer;

  // useId 기반 이름으로 Store 찾기 또는 지연 생성
  const store = useMemo(() => {
    // 1. Registry에서 기존 Store 확인
    const existingStore = registry.getStore(storeName);
    
    if (existingStore) {
      if (debug) {
        console.log(`🔄 Using existing lazy store: ${storeName}`);
      }
      return existingStore as ReturnType<typeof createStore<T>>;
    }

    // 2. 지연 초기화 실행 (이미 Store가 있으면 실행되지 않음)
    const initialValue = initializerRef.current();
    
    // 3. 새 Store 생성
    const newStore = createStore(storeName, initialValue);
    
    // 4. 비교 옵션 설정
    const finalComparisonOptions = {
      strategy,
      ...comparisonOptions
    };
    newStore.setComparisonOptions(finalComparisonOptions);

    // 5. Registry에 등록
    registry.register(storeName, newStore, {
      name: storeName,
      tags: ['isolated', 'lazy', strategy],
      description: `Lazy isolated store: ${storeName} with ${strategy} comparison`
    });

    if (debug) {
      console.log(`⏳ Lazy store created and registered: ${storeName}`, {
        strategy,
        registeredStoreCount: registry.getStoreCount()
      });
    }

    return newStore;
  }, [storeName, registry]); // initializer는 의존성에서 제외 (기존 Store 사용 시 호출되지 않음)

  return store;
}

/**
 * React Hook: 조건부 격리 Store
 * 조건에 따라 격리된 Store 또는 공유 Store를 사용합니다.
 * 
 * @template T - Store 값 타입
 * @param storeName - Store 이름 (격리 모드일 때 사용)
 * @param isolationMode - 격리 모드 ('isolated' | 'shared')
 * @param initialValue - 초기값 (격리 모드일 때 사용)
 * @param sharedStore - 공유 Store (공유 모드일 때 사용)
 * @param options - Store 생성 옵션
 * @returns Store 인스턴스
 * 
 * @example
 * ```typescript
 * function ConditionalComponent({ 
 *   shouldIsolate, 
 *   globalStore,
 *   userId 
 * }: { 
 *   shouldIsolate: boolean; 
 *   globalStore: Store<UserData>;
 *   userId: string;
 * }) {
 *   const store = useConditionalIsolatedStore(
 *     `user-${userId}`,
 *     shouldIsolate ? 'isolated' : 'shared',
 *     { name: '', email: '' },
 *     shouldIsolate ? undefined : globalStore,
 *     { strategy: 'shallow' }
 *   );
 *   
 *   const value = useStoreValue(store);
 *   return <div>{shouldIsolate ? '🔒 Isolated' : '🤝 Shared'}: {value.name}</div>;
 * }
 * ```
 */
export function useConditionalIsolatedStore<T>(
  storeName: string,
  isolationMode: 'isolated' | 'shared',
  initialValue: T,
  sharedStore?: ReturnType<typeof createStore<T>>,
  options: {
    strategy?: 'reference' | 'shallow' | 'deep';
    debug?: boolean;
    comparisonOptions?: Partial<ComparisonOptions<T>>;
  } = {}
): ReturnType<typeof createStore<T>> {
  const { strategy = 'reference', debug = process.env.NODE_ENV === 'development', comparisonOptions } = options;

  const store = useMemo(() => {
    if (isolationMode === 'shared') {
      if (!sharedStore) {
        throw new Error(`Shared store is required when isolationMode is 'shared'`);
      }

      if (debug) {
        console.log(`🤝 Conditional: SHARED mode for ${storeName}`);
      }
      return sharedStore;
    }

    // isolated 모드: Registry에서 찾거나 생성
    if (debug) {
      console.log(`🔒 Conditional: ISOLATED mode for ${storeName}`);
    }
    
    return useRegistryStore(storeName, initialValue, {
      strategy,
      debug,
      comparisonOptions
    });
  }, [storeName, isolationMode, initialValue, sharedStore, strategy, debug, comparisonOptions]);

  return store;
}

/**
 * React Hook: 격리 Store 팩토리 생성 및 관리
 * 여러 개의 격리된 Store를 효율적으로 관리합니다.
 * 
 * @param componentId - 컴포넌트 식별자
 * @param debug - 디버깅 모드
 * @returns IsolationStoreFactory 인스턴스와 정리 함수
 * 
 * @example
 * ```typescript
 * function MultiStoreComponent() {
 *   const [factory, cleanup] = useIsolationStoreFactory('multiStore', true);
 *   
 *   const userStore = useMemo(() => 
 *     factory.createStore('user', { name: '' }, 'shallow'), [factory]
 *   );
 *   
 *   const settingsStore = useMemo(() => 
 *     factory.createStore('settings', { theme: 'light' }, 'deep'), [factory]
 *   );
 *   
 *   return (
 *     <div>
 *       <div>Stores created: {factory.getStoreCount()}</div>
 *       <button onClick={cleanup}>Cleanup All</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsolationStoreFactory(
  componentId: string,
  debug = false
): [IsolationStoreFactory, () => void] {
  const factoryRef = useRef<IsolationStoreFactory>();

  const factory = useMemo(() => {
    if (!factoryRef.current) {
      // IsolationStoreFactory는 내부에서 StoreRegistry를 생성함
      factoryRef.current = new IsolationStoreFactory(componentId, debug);
    }
    return factoryRef.current;
  }, [componentId, debug]);

  const cleanup = useMemo(() => {
    return () => {
      if (factoryRef.current) {
        factoryRef.current.cleanup();
      }
    };
  }, []);

  return [factory, cleanup];
}

/**
 * React Hook: Store 격리 상태 모니터링
 * 격리된 Store들의 상태를 실시간으로 모니터링합니다.
 * 
 * @param stores - 모니터링할 Store 배열
 * @param options - 모니터링 옵션
 * @returns 모니터링 결과
 * 
 * @example
 * ```typescript
 * function MonitoringComponent() {
 *   const userStore = useIsolatedStore('user-123', { name: '' });
 *   const settingsStore = useIsolatedStore('settings-123', { theme: 'light' });
 *   
 *   const monitoring = useStoreIsolationMonitoring([userStore, settingsStore], {
 *     trackPerformance: true,
 *     logUpdates: true
 *   });
 *   
 *   return (
 *     <div>
 *       <div>Active Stores: {monitoring.storeCount}</div>
 *       <div>Total Listeners: {monitoring.totalListeners}</div>
 *       <div>Average Update Time: {monitoring.averageUpdateTime}ms</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useStoreIsolationMonitoring(
  stores: Array<ReturnType<typeof createStore>>,
  options: {
    trackPerformance?: boolean;
    logUpdates?: boolean;
    updateInterval?: number;
  } = {}
): {
  storeCount: number;
  totalListeners: number;
  averageUpdateTime: number;
  lastUpdateTimes: number[];
} {
  const { trackPerformance = false, logUpdates = false } = options;
  const updateTimesRef = useRef<number[]>([]);

  const monitoring = useMemo(() => {
    const storeCount = stores.length;
    const totalListeners = stores.reduce((total, store) => total + store.getListenerCount(), 0);
    
    const averageUpdateTime = updateTimesRef.current.length > 0
      ? updateTimesRef.current.reduce((sum, time) => sum + time, 0) / updateTimesRef.current.length
      : 0;

    return {
      storeCount,
      totalListeners,
      averageUpdateTime,
      lastUpdateTimes: [...updateTimesRef.current]
    };
  }, [stores]);

  // 성능 추적은 기존 로직 유지 (옵션 활성화 시에만)
  if (trackPerformance && stores.length > 0) {
    // 성능 추적 로직은 복잡하므로 여기서는 기본 구조만 제공
    if (logUpdates) {
      console.log(`📊 Store monitoring: ${monitoring.storeCount} stores, ${monitoring.totalListeners} listeners`);
    }
  }

  return monitoring;
}

/**
 * React Hook: 격리 Store 메모리 사용량 추적
 * 격리된 Store들의 메모리 사용량을 추적합니다.
 * 
 * @param stores - 추적할 Store 배열
 * @returns 메모리 사용량 정보
 * 
 * @example
 * ```typescript
 * function MemoryTrackingComponent() {
 *   const stores = [
 *     useIsolatedStore('store1', largeData1),
 *     useIsolatedStore('store2', largeData2)
 *   ];
 *   
 *   const memoryInfo = useStoreMemoryTracking(stores);
 *   
 *   return (
 *     <div>
 *       <div>Estimated Memory: {memoryInfo.estimatedMemoryUsage}KB</div>
 *       <div>Store Sizes: {memoryInfo.storeSizes.join(', ')}KB</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useStoreMemoryTracking(
  stores: Array<ReturnType<typeof createStore>>
): {
  estimatedMemoryUsage: number;
  storeSizes: number[];
  totalStores: number;
} {
  const memoryInfo = useMemo(() => {
    const storeSizes = stores.map(store => {
      try {
        const value = store.getValue();
        const jsonString = JSON.stringify(value);
        // 대략적인 메모리 사용량 계산 (문자열 길이 기반)
        return Math.ceil(jsonString.length / 1024); // KB 단위
      } catch {
        return 0;
      }
    });

    const estimatedMemoryUsage = storeSizes.reduce((total, size) => total + size, 0);

    return {
      estimatedMemoryUsage,
      storeSizes,
      totalStores: stores.length
    };
  }, [stores]);

  return memoryInfo;
}