import { useStores } from './useStores';
import type { IStore, IStoreRegistry } from '../core/types';

/**
 * Registry 변경사항을 구독하고 등록된 모든 Store 목록 반환
 * 핵심 기능: Registry의 Store 목록 변경을 감지하여 React 컴포넌트 업데이트
 * 
 * @deprecated Use useStores instead. This hook will be removed in v2.0.0
 * @implements store-hooks
 * @memberof api-terms
 * @param registry - 구독할 Store Registry 인스턴스
 * @returns [이름, Store] 튜플 배열
 * 
 * @example
 * ```typescript
 * // Old way (deprecated):
 * const registry = useStoreRegistry();
 * const stores = useRegistry(registry);
 * 
 * // New way (recommended):
 * const storeRegistry = useStoreRegistry();
 * const stores = useStores(storeRegistry);
 * ```
 */
export function useRegistry(registry: IStoreRegistry | undefined | null): Array<[string, IStore]> {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '⚠️ useRegistry is deprecated. Use useStores instead. ' +
      'This hook will be removed in v2.0.0. ' +
      'Migration: useRegistry(registry) → useStores(storeRegistry)'
    );
  }
  
  return useStores(registry);
}