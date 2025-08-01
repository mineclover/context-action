import { useSyncExternalStore } from 'react';
import type { IStore, Snapshot, StoreSyncConfig } from './types';

/**
 * Store sync 상수 정의
 * 핵심 기능: 안전한 기본값과 에러 처리를 위한 상수 제공
 */
const CONSTANTS = {
  // store가 없을 때 사용하는 빈 구독 함수
  EMPTY_SUBSCRIBE: () => () => {},
  // store가 없을 때 사용하는 빈 스냅샷 생성
  EMPTY_SNAPSHOT: <T>(): Snapshot<T> => ({
    value: undefined as T,
    name: 'empty',
    lastUpdate: 0
  })
} as const;

/**
 * Store Selector Hook - 선택적 데이터 구독
 * 핵심 기능: selector를 사용하여 Store의 특정 부분만 구독하고 반환
 * 
 * @template T - Store 값 타입
 * @template R - 반환 타입 (기본값: Snapshot<T>)
 * @param store - 구독할 Store 인스턴스
 * @param config - 선택적 설정 (selector, defaultValue)
 * @returns 선택된 값 또는 스냅샷
 * 
 * 핵심 로직 흐름:
 * 1. store.getSnapshot() - 현재 상태 가져오기
 * 2. selector 적용 (있을 경우) - 필요한 부분만 추출
 * 3. useSyncExternalStore() - React와 동기화
 * 
 * @example
 * ```typescript
 * // 사용자 이름만 구독
 * const userName = useStoreSelector(userStore, { 
 *   selector: snapshot => snapshot.value.name 
 * });
 * 
 * // 계산된 값 구독
 * const totalPrice = useStoreSelector(cartStore, {
 *   selector: snapshot => snapshot.value.items.reduce((sum, item) => sum + item.price, 0)
 * });
 * ```
 */
export function useStoreSelector<T, R = Snapshot<T>>(
  store: IStore<T> | undefined | null,
  config?: StoreSyncConfig<T, R>
): R {
  const { defaultValue, selector } = config ?? {};

  // Store 스냅샷 가져오기 함수 (fallback 포함)
  const getSnapshot = store?.getSnapshot ?? (() => ({
    ...CONSTANTS.EMPTY_SNAPSHOT<T>(),
    ...(defaultValue !== undefined && { value: defaultValue })
  }));

  // Selector 적용하여 필요한 데이터만 추출
  const selectedGetSnapshot = selector
    ? () => selector(getSnapshot())
    : getSnapshot;

  // React의 useSyncExternalStore로 동기화
  return useSyncExternalStore(
    store?.subscribe ?? CONSTANTS.EMPTY_SUBSCRIBE,
    selectedGetSnapshot as () => R
  );
}

/**
 * Store Hook - 스냅샷 구독
 * 핵심 기능: Store 변경사항을 구독하고 현재 스냅샷 반환
 * 
 * @template T - Store 값 타입
 * @param store - 구독할 Store 인스턴스  
 * @returns Store의 현재 스냅샷 (value, name, lastUpdate 포함)
 * 
 * @example
 * ```typescript
 * const counterStore = new Store('counter', 0);
 * const snapshot = useStore(counterStore); // { value: 0, name: 'counter', lastUpdate: timestamp }
 * ```
 */
export function useStore<T>(store: IStore<T> | undefined | null): Snapshot<T> {
  return useStoreSelector(store);
}

/**
 * 타입 안전한 Store Hook 팩토리
 * 핵심 기능: 특정 타입에 대한 타입 안전한 훅 생성
 */
export function createTypedStoreHooks<T>() {
  return {
    /**
     * 타입 안전한 Store 값 가져오기
     */
    useStoreValue(store: IStore<T> | undefined | null): T | undefined {
      return useStoreSelector(store, {
        selector: snapshot => snapshot.value
      });
    },
    
    /**
     * 타입 안전한 Store 스냅샷 가져오기
     */
    useStoreSnapshot(store: IStore<T> | undefined | null): Snapshot<T> {
      return useStoreSelector(store);
    }
  };
}