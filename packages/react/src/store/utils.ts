import type { IStore, IStoreRegistry } from "./types";
import { Store } from ".";

/**
 * Create a new store with the given initial value
 * Following ARCHITECTURE.md pattern for store creation
 * 
 * @template T - Type of the store value
 * @param initialValue - Initial value for the store
 * @param name - Optional name for the store (auto-generated if not provided)
 * @returns New Store instance
 * 
 * @example
 * ```typescript
 * // Simple store creation
 * const userStore = createStore<User>({
 *   id: '', 
 *   name: '', 
 *   email: '',
 *   updatedAt: 0
 * });
 * 
 * // Store with custom name
 * const counterStore = createStore(0, 'counter');
 * ```
 */
export function createStore<T>(initialValue: T, name?: string): Store<T> {
  const storeName = name || `store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return new Store(storeName, initialValue);
}

/**
 * Computed Store 생성 함수
 * 핵심 기능: 여러 Store의 값을 조합하여 파생된 값을 가지는 반응형 Store 생성
 * 
 * @template T - 계산된 Store 값의 타입
 * @template D - 의존성 Store 배열 타입
 * @param dependencies - 의존할 Store 배열
 * @param compute - 파생 값을 계산할 함수
 * @param name - Store 이름 (선택적)
 * @returns 새로운 계산된 Store 인스턴스
 * 
 * 핵심 로직:
 * 1. 초기 계산 - 모든 의존성 Store의 현재 값으로 초기값 계산
 * 2. 구독 설정 - 각 의존성 Store 변경 시 재계산
 * 3. 정리 함수 - 메모리 누수 방지를 위한 구독 해제
 * 
 * @example
 * ```typescript
 * const cartSummaryStore = createComputedStore(
 *   [cartStore, inventoryStore, userStore],
 *   (cart, inventory, user) => ({
 *     itemCount: cart.items.length,
 *     total: cart.items.reduce((sum, item) => sum + item.price, 0),
 *     canCheckout: cart.items.every(item => inventory[item.id] > 0)
 *   })
 * );
 * ```
 */
export function createComputedStore<T, D extends readonly IStore[]>(
  dependencies: D,
  compute: (...values: { [K in keyof D]: D[K] extends IStore<infer V> ? V : never }) => T,
  name?: string
): Store<T> {
  const storeName = name || `computed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 초기 계산 - 모든 의존성의 현재 값으로 초기값 생성
  const initialValues = dependencies.map(store => store.getValue()) as any;
  const initialValue = compute(...initialValues);
  
  const computedStore = new Store(storeName, initialValue);
  
  // 의존성 구독 - 각 Store 변경 시 재계산
  const unsubscribes = dependencies.map(store => 
    store.subscribe(() => {
      const currentValues = dependencies.map(dep => dep.getValue()) as any;
      const newValue = compute(...currentValues);
      computedStore.setValue(newValue);
    })
  );
  
  // 정리 함수 저장 - 메모리 누수 방지
  (computedStore as any)._cleanup = () => {
    unsubscribes.forEach(unsub => unsub());
  };
  
  return computedStore;
}

/**
 * Store 유틸리티 클래스
 * 핵심 기능: Store 간 동기화, 복사, Registry 조작 등의 고급 작업
 * 
 * 주요 기능:
 * 1. Store 복사 및 동기화
 * 2. Registry 간 동기화 및 병합
 * 3. 양방향 동기화 및 디바운스
 * 4. Computed Store 생성 (deprecated - 함수형 API 사용 권장)
 */
export class StoreUtils {
	/**
	 * Store 값 복사
	 * 핵심 기능: 소스 Store의 현재 값을 타겟 Store에 복사
	 */
	static copyStore(sourceStore: IStore, targetStore: IStore): void {
		const { value } = sourceStore.getSnapshot();
		targetStore.setValue(value);
	}

	/**
	 * Registry 간 Store 동기화
	 * 핵심 기능: 소스 Registry의 Store들을 타겟 Registry로 동기화
	 * 
	 * @param sourceRegistry 소스 Registry
	 * @param targetRegistry 타겟 Registry  
	 * @param options 필터링 및 생성 옵션
	 */
	static syncRegistries(
		sourceRegistry: IStoreRegistry,
		targetRegistry: IStoreRegistry,
		options?: {
			filter?: (name: string, store: IStore) => boolean;
			createMissing?: boolean;
		},
	): void {
		const sourceStores = sourceRegistry.getAllStores();

		sourceStores.forEach((store, name) => {
			// Apply filter if provided
			if (options?.filter && !options.filter(name, store)) {
				return;
			}

			const targetStore = targetRegistry.getStore(name);

			if (targetStore) {
				this.copyStore(store, targetStore);
			} else if (options?.createMissing) {
				// Clone and register the store
				const clonedStore = this.cloneStore(store);
				targetRegistry.register(name, clonedStore);
			}
		});
	}

	/**
	 * Store 복제
	 * 핵심 기능: 기존 Store와 동일한 값과 이름을 가진 새로운 Store 생성
	 */
	static cloneStore<T = any>(store: IStore<T>): Store<T> {
		const { value, name } = store.getSnapshot();
		return new Store(name, value);
	}

	/**
	 * 자동 동기화 설정
	 * 핵심 기능: 소스 Store 변경 시 자동으로 타겟 Store 업데이트
	 * 
	 * @param sourceStore 소스 Store
	 * @param targetStore 타겟 Store
	 * @param options 즉시 동기화 및 변환 함수 옵션
	 * @returns 동기화 해제 함수
	 */
	static createAutoSync(
		sourceStore: IStore,
		targetStore: IStore,
		options?: {
			immediate?: boolean;
			transform?: (value: any) => any;
		},
	): () => void {
		// Sync immediately if requested
		if (options?.immediate) {
			const { value } = sourceStore.getSnapshot();
			const transformedValue = options.transform
				? options.transform(value)
				: value;
			targetStore.setValue(transformedValue);
		}

		// Set up continuous sync
		const unsubscribe = sourceStore.subscribe(() => {
			const { value } = sourceStore.getSnapshot();
			const transformedValue = options?.transform
				? options.transform(value)
				: value;
			targetStore.setValue(transformedValue);
		});

		return unsubscribe;
	}

	/**
	 * Create bidirectional sync between stores
	 */
	static createBidirectionalSync(
		storeA: IStore,
		storeB: IStore,
		options?: {
			immediate?: boolean;
			transformAtoB?: (value: any) => any;
			transformBtoA?: (value: any) => any;
		},
	): () => void {
		let syncing = false;

		const syncAtoB = () => {
			if (syncing) return;
			syncing = true;

			const { value } = storeA.getSnapshot();
			const transformedValue = options?.transformAtoB
				? options.transformAtoB(value)
				: value;
			storeB.setValue(transformedValue);

			syncing = false;
		};

		const syncBtoA = () => {
			if (syncing) return;
			syncing = true;

			const { value } = storeB.getSnapshot();
			const transformedValue = options?.transformBtoA
				? options.transformBtoA(value)
				: value;
			storeA.setValue(transformedValue);

			syncing = false;
		};

		// Initial sync if requested
		if (options?.immediate) {
			syncAtoB();
		}

		const unsubscribeA = storeA.subscribe(syncAtoB);
		const unsubscribeB = storeB.subscribe(syncBtoA);

		return () => {
			unsubscribeA();
			unsubscribeB();
		};
	}

	/**
	 * Merge multiple registries into one
	 */
	static mergeRegistries(
		targetRegistry: IStoreRegistry,
		...sourceRegistries: IStoreRegistry[]
	): void {
		sourceRegistries.forEach((sourceRegistry) => {
			sourceRegistry.getAllStores().forEach((store, name) => {
				if (!targetRegistry.hasStore(name)) {
					targetRegistry.register(name, this.cloneStore(store));
				}
			});
		});
	}

	// createComputedStore 메서드 제거됨 - 대신 utils/createComputedStore() 함수 사용

	/**
	 * 디바운스 Store 생성
	 * 핵심 기능: 소스 Store 변경을 지연시켜 과도한 업데이트 방지
	 * 
	 * @param name Store 이름
	 * @param sourceStore 소스 Store
	 * @param delay 지연 시간 (밀리초)
	 * @returns 디바운스된 Store
	 */
	static createDebouncedStore<T>(
		name: string,
		sourceStore: IStore<T>,
		delay: number,
	): Store<T> {
		const debouncedStore = new Store(name, sourceStore.getSnapshot().value);
		let timeoutId: any;

		// 디바운스 로직 - 마지막 변경 후 delay 시간 대기
		sourceStore.subscribe(() => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				const { value } = sourceStore.getSnapshot();
				debouncedStore.setValue(value);
			}, delay);
		});

		return debouncedStore;
	}
}
