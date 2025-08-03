import { useMemo } from 'react';
import type { Store } from '../core/Store';

/**
 * Store 액션 핸들러들을 메모이제이션하여 반환
 * 핵심 기능: Store의 메서드들을 안전하게 바인딩하고 메모이제이션으로 성능 최적화
 * 
 * @implements store-hooks
 * @implements performance-optimization
 * @memberof api-terms
 * @since 1.0.0
 * @param store - Store 인스턴스 (null/undefined 허용)
 * @returns Store 액션 메서드들 (setValue, update, getValue)
 * 
 * Provides memoized access to store methods, preventing unnecessary re-renders
 * when store instance remains the same. Safely handles null/undefined stores.
 * 
 * @example
 * ```typescript
 * const userStore = createStore({ name: 'John', age: 30 });
 * const { setValue, update, getValue } = useStoreActions(userStore);
 * 
 * // 전체 값 교체
 * setValue({ name: 'Jane', age: 25 });
 * 
 * // 부분 업데이트
 * update(user => ({ ...user, age: user.age + 1 }));
 * 
 * // 현재 값 읽기 (액션 핸들러에서 유용)
 * const currentUser = getValue();
 * ```
 */
export function useStoreActions<T>(store: Store<T> | null | undefined) {
  return useMemo(() => {
    if (!store) {
      // Store가 없을 때 안전한 no-op 함수들 반환
      return {
        setValue: () => {},
        update: () => {},
        getValue: () => undefined as T | undefined,
      };
    }

    return {
      setValue: store.setValue.bind(store),
      update: store.update.bind(store),
      getValue: store.getValue.bind(store),
    };
  }, [store]);
}