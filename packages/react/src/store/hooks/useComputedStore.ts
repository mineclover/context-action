import { useRef, useMemo } from 'react';
import { Store } from '../Store';
import { useStoreSync } from '../store-sync';
import { createComputedStore } from '../utils';
import type { IStore } from '../types';

/**
 * Computed Store Hook
 * 핵심 기능: 여러 Store의 값을 조합하여 파생된 값을 계산하는 반응형 Store 생성
 * 
 * 핵심 로직:
 * 1. 컴포넌트 마운트 시 Computed Store 생성 (한 번만)
 * 2. compute 함수 변경 시 Store 재생성 및 이전 Store 정리
 * 3. 의존성 Store 변경 시 자동 재계산
 * 4. React 컴포넌트와 반응형 동기화
 * 
 * @implements computed-store
 * @memberof api-terms
 * 
 * @example
 * ```typescript
 * const totalPriceStore = useComputedStore(
 *   [cartStore, taxStore],
 *   (cart, tax) => cart.total * (1 + tax.rate)
 * );
 * ```
 */
export function useComputedStore<T, D extends readonly IStore[]>(
  dependencies: D,
  compute: (...values: { [K in keyof D]: D[K] extends IStore<infer V> ? V : never }) => T,
  name?: string
): Store<T> {
  const storeRef = useRef<Store<T>>();
  
  // 생성 옵티마이제이션 - 컴포넌트 마운트 시 한 번만 생성
  if (!storeRef.current) {
    storeRef.current = createComputedStore(dependencies, compute, name);
  }
  
  // compute 함수 변경 감지 및 Store 재생성
  useMemo(() => {
    if (storeRef.current) {
      // 새로운 compute 함수로 Computed Store 재생성
      const newStore = createComputedStore(dependencies, compute, name);
      // 이전 Store 정리 - 메모리 누수 방지
      if ((storeRef.current as any)._cleanup) {
        (storeRef.current as any)._cleanup();
      }
      storeRef.current = newStore;
    }
  }, [compute, name, ...dependencies]);
  
  // 반응형 구독 - Store 변경 시 React 컴포넌트 재렌더링 유지
  useStoreSync(storeRef.current);
  
  return storeRef.current;
}

/**
 * Computed Value Hook (편의 래퍼)
 * 핵심 기능: Computed Store의 값만 직접 반환 (저장소 인스턴스 없이)
 * 
 * @template T - 계산된 Store 값의 타입
 * @template D - 의존성 Store 배열 타입
 * @param dependencies - 의존할 Store 배열
 * @param compute - 파생 값을 계산할 함수
 * @param name - Store 이름 (선택적)
 * @returns 현재 계산된 값
 * 
 * 사용 시나리오: Store 인스턴스가 필요 없고 계산된 값만 사용하는 경우
 * 
 * @example
 * ```typescript
 * const totalPrice = useComputedValue(
 *   [cartStore, taxStore],
 *   (cart, tax) => cart.total * (1 + tax.rate)
 * );
 * ```
 */
export function useComputedValue<T, D extends readonly IStore[]>(
  dependencies: D,
  compute: (...values: { [K in keyof D]: D[K] extends IStore<infer V> ? V : never }) => T,
  name?: string
): T | undefined {
  // Computed Store 생성 및 관리
  const store = useComputedStore(dependencies, compute, name);
  // 스냅샷에서 값만 추출
  const snapshot = useStoreSync(store);
  return snapshot.value;
}