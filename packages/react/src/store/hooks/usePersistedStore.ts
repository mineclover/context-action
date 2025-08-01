import { useRef, useEffect } from 'react';
import { Store } from '../Store';
import { useStoreSync } from '../store-sync';

/**
 * 지속성 옵션 인터페이스
 * 핵심 기능: Storage API 및 직렬화 방식 설정
 */
interface PersistOptions {
  storage?: Storage;                        // localStorage, sessionStorage 등
  serialize?: (value: any) => string;       // 객체 → 문자열 변환
  deserialize?: (value: string) => any;     // 문자열 → 객체 변환
}

/**
 * 지속성 Store Hook
 * 핵심 기능: localStorage/sessionStorage에 자동 저장/로드되는 Store 생성
 * 
 * 핵슬 로직:
 * 1. 초기화 - Storage에서 기존 값 로드 또는 초기값 사용
 * 2. 자동 저장 - Store 값 변경 시 Storage에 자동 저장
 * 3. 교차 탭 동기화 - storage 이벤트로 다른 탭과 동기화
 * 4. 에러 처리 - 직렬화/역직렬화 실패 시 경고 로그
 * 
 * @param key Storage 키
 * @param initialValue 초기값
 * @param options 지속성 옵션
 * @returns 지속성 Store 인스턴스
 */
export function usePersistedStore<T>(
  key: string,
  initialValue: T,
  options: PersistOptions = {}
) {
  const {
    storage = localStorage,           // 기본값: localStorage
    serialize = JSON.stringify,       // 기본값: JSON 직렬화
    deserialize = JSON.parse          // 기본값: JSON 역직렬화
  } = options;
  
  const storeRef = useRef<Store<T>>();
  
  // Store 초기화 - 저장된 값 또는 초기값 사용
  if (!storeRef.current) {
    let value = initialValue;
    
    // Storage에서 기존 값 로드 시도
    try {
      const stored = storage.getItem(key);
      if (stored !== null) {
        value = deserialize(stored);
      }
    } catch (error) {
      console.warn(`Failed to load persisted value for "${key}":`, error);
    }
    
    storeRef.current = new Store(key, value);
  }
  
  const store = storeRef.current;
  // 반응형 구독 - Store 변경 시 React 컴포넌트 재렌더링
  useStoreSync(store);
  
  // 자동 지속성 - Store 변경 시 Storage에 자동 저장
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      try {
        const value = store.getValue();
        storage.setItem(key, serialize(value));
      } catch (error) {
        console.warn(`Failed to persist value for "${key}":`, error);
      }
    });
    
    return unsubscribe;
  }, [store, key, storage, serialize]);
  
  // 교차 탭 동기화 - 다른 탭에서 Storage 변경 시 동기화
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // 해당 키의 변경사항만 처리
      if (e.key === key && e.newValue !== null) {
        try {
          const value = deserialize(e.newValue);
          store.setValue(value);
        } catch (error) {
          console.warn(`Failed to sync value for "${key}":`, error);
        }
      }
    };
    
    // Storage 이벤트 리스너 등록/해제
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [store, key, deserialize]);
  
  return store;
}