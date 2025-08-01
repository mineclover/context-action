import { useStoreSync } from './store-sync';
import type { IStoreRegistry, IStore } from './types';

/**
 * Factory for creating registry sync hooks
 * 핵심 기능: Registry에서 동적으로 store에 접근하는 표준화된 인터페이스 제공
 * 
 * @template T - Store value type
 * @returns Registry sync methods
 * 
 * @example
 * ```typescript
 * const sync = createRegistrySync<UserData>();
 * const userData = sync.useDynamicStore(registry, 'user');
 * ```
 */
export function createRegistrySync<T = any>() {
  return {
    /**
     * Registry에서 이름으로 store 값을 동적으로 가져오기
     * 핵심 로직: registry.getStore() → useStoreSync() → value 추출
     */
    useDynamicStore(
      registry: IStoreRegistry | undefined | null,
      storeName: string
    ): T | undefined {
      const store = registry?.getStore(storeName);
      return useStoreSync(store, {
        selector: snapshot => snapshot.value as T
      });
    }
  };
}

/**
 * Registry 유틸리티 클래스
 * 핵심 기능: Registry 상태 조회 및 검색을 위한 정적 메서드 제공
 */
export class RegistryUtils {
  /**
   * Registry에서 타입 안전한 store 가져오기
   * 핵심 로직: 타입 캐스팅을 통한 타입 안전성 보장
   */
  static getTypedStore<T>(
    registry: IStoreRegistry | undefined | null,
    name: string
  ): IStore<T> | undefined {
    return registry?.getStore(name) as IStore<T> | undefined;
  }

  /**
   * Registry에 store가 존재하는지 확인
   * 핵심 로직: null-safe 체이닝으로 안전한 존재 여부 확인
   */
  static hasStore(
    registry: IStoreRegistry | undefined | null,
    name: string
  ): boolean {
    return registry?.hasStore(name) ?? false;
  }
}