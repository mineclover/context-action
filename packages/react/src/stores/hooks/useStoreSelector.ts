/**
 * Store Selector Hook - Performance optimization through selective subscription
 * 
 * Advanced store subscription hooks that prevent unnecessary re-renders by subscribing
 * to specific parts of store data using selector functions and intelligent equality comparison.
 * Essential for building high-performance React applications with complex state management.
 * 
 * @module stores/hooks/useStoreSelector
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import type { Store } from '../core/Store';

/**
 * 기본 동등성 비교 함수
 */
function defaultEqualityFn<T>(a: T, b: T): boolean {
  return Object.is(a, b);
}

/**
 * 얕은 동등성 비교 함수
 */
export function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }
  
  const keysA = Object.keys(a) as Array<keyof T>;
  const keysB = Object.keys(b) as Array<keyof T>;
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key) || !Object.is(a[key], b[key])) {
      return false;
    }
  }
  
  return true;
}

/**
 * 깊은 동등성 비교 함수 (주의: 성능 비용이 있으므로 필요시에만 사용)
 */
export function deepEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  const keysA = Object.keys(a) as Array<keyof T>;
  const keysB = Object.keys(b) as Array<keyof T>;
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

/**
 * Hook for selective store subscription with performance optimization
 * 
 * Subscribes to specific parts of store data using a selector function,
 * triggering re-renders only when the selected value actually changes.
 * Essential for preventing unnecessary re-renders in complex applications.
 * 
 * @template T - Type of the store value
 * @template R - Type of the value returned by the selector
 * 
 * @param store - Store instance to subscribe to
 * @param selector - Function to extract needed data from store value
 * @param equalityFn - Function to compare previous and new values (default: Object.is)
 * 
 * @returns The value returned by the selector function
 * 
 * 
 * @example Basic Selective Subscription
 * ```typescript
 * interface User {
 *   id: string
 *   profile: { name: string; email: string; avatar?: string }
 *   preferences: { theme: 'light' | 'dark'; language: string }
 *   metadata: { lastLogin: Date; createdAt: Date }
 * }
 * 
 * const userStore = createStore<User>('user', initialUser)
 * 
 * // Subscribe only to profile.name - ignores other user changes
 * const userName = useStoreSelector(
 *   userStore, 
 *   user => user.profile.name
 * )
 * 
 * // Component re-renders only when name changes
 * ```
 * 
 * @example Object Subscription with Shallow Comparison
 * ```typescript
 * // Subscribe to entire profile object with shallow equality
 * const userProfile = useStoreSelector(
 *   userStore, 
 *   user => user.profile,
 *   shallowEqual
 * )
 * 
 * // Re-renders only when profile properties change
 * // (name, email, avatar), not when preferences or metadata change
 * ```
 * 
 * @example Computed Values with Performance Optimization
 * ```typescript
 * const userDisplayInfo = useStoreSelector(
 *   userStore,
 *   user => ({
 *     displayName: user.profile.name || 'Anonymous',
 *     isNewUser: Date.now() - user.metadata.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000,
 *     avatarUrl: user.profile.avatar || '/default-avatar.png'
 *   }),
 *   shallowEqual
 * )
 * ```
 * 
 * @example Conditional Computation
 * ```typescript
 * const expensiveComputation = useStoreSelector(
 *   userStore,
 *   user => {
 *     if (!user.profile.name) return null
 *     
 *     // Expensive calculation only when name exists
 *     return processUserData(user)
 *   }
 * )
 * ```
 * 
 * @public
 */
export function useStoreSelector<T, R>(
  store: Store<T>,
  selector: (value: T) => R,
  equalityFn: (a: R, b: R) => boolean = defaultEqualityFn
): R {
  // Selector와 equalityFn을 참조로 안정화
  const selectorRef = useRef(selector);
  const equalityFnRef = useRef(equalityFn);
  
  // 개발 모드에서 selector 변경 감지
  if (process.env.NODE_ENV === 'development') {
    if (selectorRef.current !== selector) {
      console.warn(
        'useStoreSelector: selector function changed. ' +
        'Consider wrapping it with useCallback to avoid unnecessary recalculations.'
      );
    }
    if (equalityFnRef.current !== equalityFn) {
      console.warn(
        'useStoreSelector: equalityFn changed. ' +
        'Consider using a stable reference or defining it outside the component.'
      );
    }
  }
  
  selectorRef.current = selector;
  equalityFnRef.current = equalityFn;
  
  // 초기 selected 값 계산
  const initialSelectedValue = useMemo(() => {
    try {
      return selector(store.getValue());
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('useStoreSelector: Error in selector function:', error);
      }
      throw error;
    }
  }, [store, selector]);
  
  const [selectedValue, setSelectedValue] = useState<R>(initialSelectedValue);
  const selectedValueRef = useRef<R>(initialSelectedValue);
  selectedValueRef.current = selectedValue;
  
  // Store 변경 구독
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const newStoreValue = store.getValue();
      try {
        const newSelectedValue = selectorRef.current(newStoreValue);
        
        // 동등성 검사로 불필요한 업데이트 방지
        if (!equalityFnRef.current(selectedValueRef.current, newSelectedValue)) {
          setSelectedValue(newSelectedValue);
          selectedValueRef.current = newSelectedValue;
          
          if (process.env.NODE_ENV === 'development') {
            console.debug('useStoreSelector: Value updated', {
              storeName: store.name,
              previousValue: selectedValueRef.current,
              newValue: newSelectedValue
            });
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('useStoreSelector: Error in selector during subscription:', error);
        }
        throw error;
      }
    });
    
    // Store 값이 변경되었을 수도 있으므로 즉시 체크
    try {
      const currentStoreValue = store.getValue();
      const currentSelectedValue = selectorRef.current(currentStoreValue);
      
      if (!equalityFnRef.current(selectedValueRef.current, currentSelectedValue)) {
        setSelectedValue(currentSelectedValue);
        selectedValueRef.current = currentSelectedValue;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('useStoreSelector: Error checking current value:', error);
      }
    }
    
    return unsubscribe;
  }, [store]);
  
  return selectedValue;
}

/**
 * 여러 Store를 조합하여 선택적 구독하는 Hook
 * 
 * @template T1, T2, T3, R Store 타입들과 결과 타입
 * @param stores 구독할 Store들의 배열
 * @param selector 여러 Store 값들을 조합하는 함수
 * @param equalityFn 이전 값과 새 값을 비교하는 함수
 * @returns selector가 반환하는 값
 * 
 * @example
 * ```typescript
 * const userStore = createStore('user', { name: '', email: '' });
 * const settingsStore = createStore('settings', { theme: 'light' });
 * const uiStore = createStore('ui', { isLoading: false });
 * 
 * const dashboardData = useMultiStoreSelector(
 *   [userStore, settingsStore, uiStore],
 *   ([user, settings, ui]) => ({
 *     greeting: `Hello, ${user.name}!`,
 *     isDarkMode: settings.theme === 'dark',
 *     showLoader: ui.isLoading
 *   }),
 *   shallowEqual
 * );
 * ```
 */
export function useMultiStoreSelector<R>(
  stores: Store<any>[],
  selector: (values: any[]) => R,
  equalityFn?: (a: R, b: R) => boolean
): R {
  const finalEqualityFn = equalityFn || defaultEqualityFn;
  const selectorRef = useRef(selector);
  const equalityFnRef = useRef(finalEqualityFn);
  
  selectorRef.current = selector;
  equalityFnRef.current = finalEqualityFn;
  
  // 초기 값 계산
  const initialSelectedValue = useMemo(() => {
    const storeValues = stores.map(store => store.getValue());
    return selector(storeValues);
  }, [stores, selector]);
  
  const [selectedValue, setSelectedValue] = useState<R>(initialSelectedValue);
  const selectedValueRef = useRef<R>(initialSelectedValue);
  selectedValueRef.current = selectedValue;
  
  // 모든 Store 구독
  useEffect(() => {
    const unsubscribes = stores.map((store) => 
      store.subscribe(() => {
        try {
          const storeValues = stores.map(s => s.getValue());
          const newSelectedValue = selectorRef.current(storeValues);
          
          if (!equalityFnRef.current(selectedValueRef.current, newSelectedValue)) {
            setSelectedValue(newSelectedValue);
            selectedValueRef.current = newSelectedValue;
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('useMultiStoreSelector: Error in selector:', error);
          }
          throw error;
        }
      })
    );
    
    // 현재 값 체크
    try {
      const currentStoreValues = stores.map(store => store.getValue());
      const currentSelectedValue = selectorRef.current(currentStoreValues);
      
      if (!equalityFnRef.current(selectedValueRef.current, currentSelectedValue)) {
        setSelectedValue(currentSelectedValue);
        selectedValueRef.current = currentSelectedValue;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('useMultiStoreSelector: Error checking current values:', error);
      }
    }
    
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [stores]);
  
  return selectedValue;
}

/**
 * Store의 깊은 경로에 있는 값을 선택적으로 구독하는 유틸리티 Hook
 * 
 * @template T Store의 값 타입
 * @param store 구독할 Store
 * @param path 객체 경로 (예: ['user', 'profile', 'name'])
 * @param equalityFn 동등성 비교 함수
 * @returns 경로에 있는 값
 * 
 * @example
 * ```typescript
 * const appStore = createStore('app', {
 *   user: {
 *     profile: { name: 'John', email: 'john@example.com' },
 *     settings: { theme: 'dark' }
 *   },
 *   ui: { isLoading: false }
 * });
 * 
 * // 깊은 경로의 값 선택
 * const userName = useStorePathSelector(appStore, ['user', 'profile', 'name']);
 * const userTheme = useStorePathSelector(appStore, ['user', 'settings', 'theme']);
 * ```
 */
export function useStorePathSelector<T>(
  store: Store<T>,
  path: (string | number)[],
  equalityFn: (a: any, b: any) => boolean = defaultEqualityFn
): any {
  const selector = useMemo(() => {
    return (value: T) => {
      let current: any = value;
      for (const key of path) {
        if (current == null) return undefined;
        current = current[key];
      }
      return current;
    };
  }, [path]);
  
  return useStoreSelector(store, selector, equalityFn);
}

// Re-export equality functions for convenience
export { defaultEqualityFn };