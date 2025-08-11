import { useStoreSelector } from '../utils/store-selector';
import type { IStore, IStoreRegistry } from '../core/types';

/**
 * Registry 변경사항을 구독하고 등록된 모든 Store 목록 반환
 * 핵심 기능: Registry의 Store 목록 변경을 감지하여 React 컴포넌트 업데이트
 * 
 * @implements store-hooks
 * @memberof api-terms
 * @param storeRegistry - 구독할 Store Registry 인스턴스
 * @returns [이름, Store] 튜플 배열
 * 
 * @example
 * ```typescript
 * function StoreList() {
 *   const storeRegistry = useStoreRegistry();
 *   const stores = useStores(storeRegistry);
 *   
 *   return (
 *     <ul>
 *       {stores.map(([name, store]) => (
 *         <li key={name}>{name}: {store.getListenerCount()} 구독자</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useStores(storeRegistry: IStoreRegistry | undefined | null): Array<[string, IStore]> {
  // Registry를 Store처럼 취급하여 useStoreSelector 사용
  // Registry도 subscribe/getSnapshot 인터페이스를 구현하므로 가능
  return useStoreSelector(storeRegistry as any, {
    selector: () => storeRegistry?.getSnapshot() ?? [],
    defaultValue: [] as Array<[string, IStore]>
  });
}