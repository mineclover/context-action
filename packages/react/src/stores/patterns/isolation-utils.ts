/**
 * Store 격리 패턴을 위한 유틸리티 함수들
 * 
 * Context-Action 프레임워크에서 StoreRegistry를 활용한 안전하고 효율적인 Store 격리를 지원합니다.
 * StoreRegistry는 Store 격리와 관리를 위해 설계된 핵심 컴포넌트입니다.
 * 
 * @module store/isolation-utils
 * @version 2.0.0 - StoreRegistry 통합
 */

import { createStore } from '../core/Store';
import { StoreRegistry } from '../core/StoreRegistry';
import type { ComparisonOptions } from '../utils/comparison';
import type { IStore } from '../core/types';

/**
 * 도메인 기반 Store 이름 생성기
 * 간단하고 자연스러운 이름 생성
 * 
 * @param domain - Store 도메인 이름
 * @param componentId - 컴포넌트 식별자 (useId 사용 권장)
 * @returns Store 이름
 * 
 * @example
 * ```typescript
 * const storeName = generateStoreName('user', componentId);
 * // 결과: "user-:r1:" (useId 사용 시)
 * ```
 */
export function generateStoreName(
  domain: string,
  componentId: string
): string {
  return `${domain}-${componentId}`;
}

/**
 * Registry 기반 Store 생성 옵션
 */
export interface RegistryStoreOptions<T> {
  /** Store 이름 (도메인-componentId 형식) */
  storeName: string;
  /** 초기값 */
  initialValue: T;
  /** 비교 전략 */
  strategy?: 'reference' | 'shallow' | 'deep';
  /** 개발 모드 디버깅 활성화 */
  debug?: boolean;
  /** 추가 비교 옵션 */
  comparisonOptions?: Partial<ComparisonOptions<T>>;
}

/**
 * StoreRegistry를 활용한 격리 Store 생성기
 * 
 * @template T - Store 값 타입
 * @param options - 격리 Store 생성 옵션
 * @param registry - 사용할 StoreRegistry 인스턴스 (선택사항)
 * @returns 격리된 Store 인스턴스와 Registry 정보
 * 
 * @example
 * ```typescript
 * const { store, registry, storeName } = createIsolatedStore({
 *   componentId: 'userProfile',
 *   strategy: 'shallow',
 *   initialValue: { name: '', email: '' },
 *   debug: true
 * });
 * ```
 */
export function getOrCreateRegistryStore<T>({
  storeName,
  initialValue,
  strategy = 'reference',
  debug = false,
  comparisonOptions
}: RegistryStoreOptions<T>, registry: StoreRegistry): {
  store: ReturnType<typeof createStore<T>>;
  wasCreated: boolean;
} {
  // Registry에서 기존 Store 확인
  const existingStore = registry.getStore(storeName);
  
  if (existingStore) {
    if (debug && process.env.NODE_ENV === 'development') {
      console.log(`🔄 Using existing store: ${storeName}`);
    }
    
    return {
      store: existingStore as ReturnType<typeof createStore<T>>,
      wasCreated: false
    };
  }
  
  // 새 Store 생성
  const store = createStore(storeName, initialValue);
  
  // 비교 옵션 설정
  const finalComparisonOptions = {
    strategy,
    ...comparisonOptions
  };
  
  store.setComparisonOptions(finalComparisonOptions);
  
  // Store를 Registry에 등록
  registry.register(storeName, store, {
    name: storeName,
    tags: [strategy],
    description: `Registry store: ${storeName} with ${strategy} comparison`
  });
  
  if (debug && process.env.NODE_ENV === 'development') {
    console.log(`🔧 New store created: ${storeName}`, {
      strategy,
      registryName: registry.name,
      registeredStoreCount: registry.getStoreCount()
    });
  }
  
  return {
    store,
    wasCreated: true
  };
}

/**
 * StoreRegistry 기반 격리 Store 팩토리 클래스
 * StoreRegistry를 활용하여 여러 개의 격리된 Store를 관리하고 일괄 정리를 지원합니다.
 * 
 * @example
 * ```typescript
 * const factory = new IsolationStoreFactory('testComponent');
 * 
 * const store1 = factory.createStore('user', { name: 'John' }, 'shallow');
 * const store2 = factory.createStore('settings', { theme: 'dark' }, 'deep');
 * 
 * // Registry를 통한 Store 조회
 * const userStore = factory.getRegisteredStore('user');
 * 
 * // 컴포넌트 정리 시
 * factory.cleanup();
 * ```
 */
export class IsolationStoreFactory {
  private registry: StoreRegistry;
  private componentId: string;
  private debug: boolean;
  private storeNames: Set<string> = new Set();

  constructor(componentId: string, debug = false) {
    this.componentId = componentId;
    this.debug = debug;
    this.registry = new StoreRegistry(`factory-${componentId}`);
    
    if (debug && process.env.NODE_ENV === 'development') {
      console.log(`🏭 IsolationStoreFactory created for: ${componentId}`, {
        registryName: this.registry.name
      });
    }
  }

  /**
   * 격리된 Store 생성 (StoreRegistry를 통한 관리)
   * 
   * @template T - Store 값 타입
   * @param name - Store 식별 이름
   * @param initialValue - 초기값
   * @param strategy - 비교 전략
   * @param comparisonOptions - 추가 비교 옵션
   * @returns 격리된 Store 인스턴스
   */
  createStore<T>(
    domain: string,
    initialValue: T,
    strategy: 'reference' | 'shallow' | 'deep' = 'reference',
    comparisonOptions?: Partial<ComparisonOptions<T>>
  ): ReturnType<typeof createStore<T>> {
    const storeName = generateStoreName(domain, this.componentId);
    
    const { store, wasCreated } = getOrCreateRegistryStore({
      storeName,
      initialValue,
      strategy,
      debug: this.debug,
      comparisonOptions
    }, this.registry);

    if (wasCreated) {
      this.storeNames.add(storeName);
    }
    
    return store;
  }

  /**
   * 특정 Store 제거 (StoreRegistry에서 해제)
   * 
   * @param name - 제거할 Store 이름 (생성 시 사용한 name)
   * @returns 제거 성공 여부
   */
  removeStore(domain: string): boolean {
    const storeName = generateStoreName(domain, this.componentId);
    const removed = this.registry.unregister(storeName);
    
    if (removed) {
      this.storeNames.delete(storeName);
      
      if (this.debug && process.env.NODE_ENV === 'development') {
        console.log(`🗑️ Store removed: ${domain}`, {
          storeName,
          remainingStores: this.registry.getStoreCount()
        });
      }
    }
    
    return removed;
  }

  /**
   * Registry에 등록된 Store 직접 조회
   * 
   * @param storeName - Registry에 등록된 전체 Store 이름
   * @returns Store 인스턴스 또는 undefined
   */
  getRegisteredStore(storeName: string): IStore | undefined {
    return this.registry.getStore(storeName);
  }

  /**
   * 팩토리의 StoreRegistry 인스턴스 반환
   * 
   * @returns StoreRegistry 인스턴스
   */
  getRegistry(): StoreRegistry {
    return this.registry;
  }

  /**
   * Registry에 등록된 Store 목록 조회
   * 
   * @returns Store 정보 배열
   */
  getStores(): Array<{ name: string; metadata?: any; listenerCount: number }> {
    const stores: Array<{ name: string; metadata?: any; listenerCount: number }> = [];
    
    this.registry.forEach((store, name) => {
      const metadata = this.registry.getStoreMetadata(name);
      stores.push({
        name,
        metadata,
        listenerCount: store.getListenerCount?.() ?? 0
      });
    });
    
    return stores;
  }

  /**
   * Registry에 등록된 Store 개수 조회
   * 
   * @returns Store 개수
   */
  getStoreCount(): number {
    return this.registry.getStoreCount();
  }

  /**
   * Registry에 등록된 모든 Store 이름 조회
   * 
   * @returns Store 이름 배열
   */
  getStoreNames(): string[] {
    return this.registry.getStoreNames();
  }

  /**
   * 모든 Store 정리 (StoreRegistry 전체 클리어)
   * 컴포넌트 언마운트 시 호출하여 메모리 누수 방지
   */
  cleanup(): void {
    const cleanupCount = this.registry.getStoreCount();
    
    try {
      // StoreRegistry의 clear 메서드가 각 Store의 destroy 메서드를 호출함
      this.registry.clear();
      this.storeNames.clear();
      
      if (this.debug && process.env.NODE_ENV === 'development') {
        console.log(`🧹 IsolationStoreFactory cleanup: ${cleanupCount} stores cleaned`, {
          registryName: this.registry.name
        });
      }
    } catch (error) {
      console.warn(`⚠️ Error during factory cleanup:`, error);
    }
  }
}

/**
 * React Hook: 격리된 Store 생성 및 관리
 * 
 * @template T - Store 값 타입
 * @param componentId - 컴포넌트 식별자
 * @param strategy - 비교 전략
 * @param initialValue - 초기값
 * @param comparisonOptions - 추가 비교 옵션
 * @returns 격리된 Store 인스턴스
 * 
 * @example
 * ```typescript
 * function MyComponent({ userId }: { userId: string }) {
 *   const userStore = useIsolatedStore(
 *     `user-${userId}`,
 *     'shallow',
 *     { id: userId, name: '', email: '' }
 *   );
 *   
 *   const userValue = useStoreValue(userStore);
 *   
 *   return <div>User: {userValue.name}</div>;
 * }
 * ```
 */
export function useIsolatedStore<T>(
  _componentId: string,
  _strategy: 'reference' | 'shallow' | 'deep',
  _initialValue: T,
  _comparisonOptions?: Partial<ComparisonOptions<T>>
): ReturnType<typeof createStore<T>> {
  // React Hook이므로 별도 파일에서 구현 필요
  // 여기서는 타입 정의만 제공
  throw new Error('useIsolatedStore must be implemented in a React Hook file');
}

/**
 * React Hook: 격리 Store 팩토리 생성 및 관리
 * 
 * @param componentId - 컴포넌트 식별자
 * @param debug - 디버깅 모드
 * @returns IsolationStoreFactory 인스턴스
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const factory = useIsolationStoreFactory('myComponent', true);
 *   
 *   const userStore = factory.createStore('user', { name: '' }, 'shallow');
 *   const settingsStore = factory.createStore('settings', { theme: 'light' }, 'deep');
 *   
 *   return <div>Component with isolated stores</div>;
 * }
 * ```
 */
export function useIsolationStoreFactory(
  componentId: string,
  _debug = false
): IsolationStoreFactory {
  // React Hook이므로 별도 파일에서 구현 필요
  // 여기서는 타입 정의만 제공
  throw new Error('useIsolationStoreFactory must be implemented in a React Hook file');
}

/**
 * 개발 모드용 Store 디버깅 래퍼
 * Store의 생성, 업데이트, 정리 과정을 로깅합니다.
 * 
 * @template T - Store 값 타입
 * @param store - 디버깅할 Store
 * @param name - 디버깅용 이름
 * @param options - 디버깅 옵션
 * @returns 디버깅이 활성화된 Store
 */
export function wrapStoreWithDebug<T>(
  store: ReturnType<typeof createStore<T>>,
  name: string,
  options: {
    logUpdates?: boolean;
    logCleanup?: boolean;
    trackPerformance?: boolean;
  } = {}
): ReturnType<typeof createStore<T>> {
  if (process.env.NODE_ENV !== 'development') {
    return store;
  }

  const { logUpdates = true, logCleanup = true, trackPerformance = false } = options;

  if (logUpdates) {
    const originalSetValue = store.setValue.bind(store);
    store.setValue = (value: T) => {
      console.log(`📝 [DEBUG] Store updated: ${name}`, {
        old: store.getValue(),
        new: value
      });

      if (trackPerformance) {
        const start = performance.now();
        originalSetValue(value);
        const duration = performance.now() - start;
        console.log(`⚡ [DEBUG] Update performance: ${duration.toFixed(2)}ms`);
      } else {
        originalSetValue(value);
      }
    };
  }

  if (logCleanup) {
    const originalClearListeners = store.clearListeners.bind(store);
    store.clearListeners = () => {
      console.log(`🧹 [DEBUG] Store cleanup: ${name}`);
      originalClearListeners();
    };
  }

  return store;
}

/**
 * StoreRegistry 기반 테스트 Store 격리 유틸리티
 * 테스트 환경에서 StoreRegistry를 활용하여 격리된 Store들을 안전하게 관리합니다.
 */
export class TestStoreIsolationManager {
  private testRegistry: StoreRegistry;
  private testSuiteId: string;
  private storeNames: Set<string> = new Set();

  constructor(testSuiteName: string) {
    this.testSuiteId = `test-${testSuiteName}-${Date.now()}`;
    this.testRegistry = new StoreRegistry(this.testSuiteId);
  }

  /**
   * 테스트용 격리 Store 생성 (StoreRegistry에 등록)
   */
  createTestStore<T>(
    domain: string,
    initialValue: T,
    strategy: 'reference' | 'shallow' | 'deep' = 'reference'
  ): ReturnType<typeof createStore<T>> {
    const storeName = generateStoreName(domain, this.testSuiteId);
    
    const { store, wasCreated } = getOrCreateRegistryStore({
      storeName,
      initialValue,
      strategy,
      debug: false
    }, this.testRegistry);

    if (wasCreated) {
      this.storeNames.add(storeName);
    }
    return store;
  }

  /**
   * 특정 테스트 Store 조회 (Registry를 통해)
   */
  getTestStore(domain: string): ReturnType<typeof createStore> | undefined {
    const storeName = generateStoreName(domain, this.testSuiteId);
    return this.testRegistry.getStore(storeName) as ReturnType<typeof createStore> | undefined;
  }

  /**
   * 테스트 Registry 인스턴스 반환
   */
  getTestRegistry(): StoreRegistry {
    return this.testRegistry;
  }

  /**
   * 모든 테스트 Store 정리 (Registry 클리어)
   */
  cleanupTestStores(): void {
    this.testRegistry.clear();
    this.storeNames.clear();
  }

  /**
   * 테스트 Store 개수 조회
   */
  getTestStoreCount(): number {
    return this.testRegistry.getStoreCount();
  }

  /**
   * 모든 테스트 Store 이름 조회
   */
  getTestStoreNames(): string[] {
    return this.testRegistry.getStoreNames();
  }

  /**
   * 테스트 Store 메타데이터 조회
   */
  getTestStoreMetadata(storeName: string) {
    return this.testRegistry.getStoreMetadata(storeName);
  }
}