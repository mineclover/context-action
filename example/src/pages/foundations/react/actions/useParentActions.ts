import { useCallback, useEffect } from 'react';
import { useParentActionHandler, useParentActionDispatch, useParentStoreManager } from '../contexts/ParentContext';

// ==============================================
// PARENT DOMAIN - Action Handlers
// ==============================================

/**
 * 상위 카운터 액션 핸들러들
 */
export function useParentCounterActions() {
  const storeManager = useParentStoreManager();
  const dispatch = useParentActionDispatch();

  // 상위 카운터 증가 핸들러
  const incrementParentCounterHandler = useCallback(async (payload: void, controller: any) => {
    const parentCounterStore = storeManager.getStore('parent-counter');
    const currentValue = parentCounterStore.getValue();
    const newValue = currentValue + 1;
    
    parentCounterStore.setValue(newValue);
    
    // 단순한 콘솔 로그 사용
    console.log('🔄 Parent Counter 증가:', { previousValue: currentValue, newValue });
  }, [storeManager]);

  // 상위 카운터 리셋 핸들러
  const resetParentCounterHandler = useCallback(async (payload: void, controller: any) => {
    const parentCounterStore = storeManager.getStore('parent-counter');
    const previousValue = parentCounterStore.getValue();
    
    parentCounterStore.setValue(0);
    
    // 단순한 콘솔 로그 사용
    console.log('🔄 Parent Counter 리셋:', { previousValue });
  }, [storeManager]);

  // 핸들러 등록 - 명시적 ID 사용
  useParentActionHandler('incrementParentCounter', incrementParentCounterHandler, { id: 'parent-counter-increment' });
  useParentActionHandler('resetParentCounter', resetParentCounterHandler, { id: 'parent-counter-reset' });

  // 리프레시 횟수 확인용 useEffect
  useEffect(() => {
    console.log('🔄 Parent Counter Actions 리프레시됨 - storeManager 변경');
  }, [storeManager]);

  // View에서 사용할 액션 함수들
  const incrementParentCounter = useCallback(() => 
    dispatch('incrementParentCounter', undefined), [dispatch]);
  
  const resetParentCounter = useCallback(() => 
    dispatch('resetParentCounter', undefined), [dispatch]);

  return { incrementParentCounter, resetParentCounter };
}

/**
 * 하위 컴포넌트 제어 요청 액션 핸들러
 */
export function useParentControlActions() {
  const dispatch = useParentActionDispatch();

  // 하위 컴포넌트 제어 요청 핸들러 (하위 컴포넌트가 상위에 등록한 핸들러 호출)
  const requestChildControlHandler = useCallback(async (payload: { childId: string; action: 'increment' | 'reset'; amount?: number }, controller: any) => {
    const { childId, action, amount } = payload;
    
    // 단순한 콘솔 로그 사용
    console.log('🔄 하위 컴포넌트 제어 요청:', { childId, action, amount });
    
    // 하위 컴포넌트가 상위에 등록한 핸들러를 호출
    // 이 핸들러는 하위 컴포넌트들이 상위에 등록한 제어 핸들러를 실행시킴
  }, []);

  // 핸들러 등록 - 명시적 ID 사용
  useParentActionHandler('requestChildControl', requestChildControlHandler, { id: 'parent-request-child-control' });

  // 리프레시 횟수 확인용 useEffect
  useEffect(() => {
    console.log('🔄 Parent Control Actions 리프레시됨');
  }, []);

  // View에서 사용할 액션 함수들
  const requestChildControl = useCallback((childId: string, action: 'increment' | 'reset', amount?: number) => 
    dispatch('requestChildControl', { childId, action, amount }), [dispatch]);

  return { requestChildControl };
}

/**
 * 데이터 로그 관리 액션 핸들러들
 */
export function useParentDataActions() {
  const storeManager = useParentStoreManager();
  const dispatch = useParentActionDispatch();

  // 하위 컴포넌트 등록 핸들러 - 로깅만
  const onChildRegisteredHandler = useCallback(async (payload: { childId: string; childType: string }, controller: any) => {
    const { childId, childType } = payload;
    console.log('🔄 하위 컴포넌트 등록:', { childId, childType });
  }, []);



  // 사용자 상호작용 핸들러
  const onUserInteractionHandler = useCallback(async (payload: { action: string; payload: any }, controller: any) => {
    const { action, payload: interactionPayload } = payload;
    
    // 단순한 콘솔 로그 사용
    console.log('🔄 사용자 상호작용:', { action, payload: interactionPayload });
  }, []);

  // 핸들러 등록 - 명시적 ID 사용
  useParentActionHandler('onChildRegistered', onChildRegisteredHandler, { id: 'parent-child-registration' });
  useParentActionHandler('onUserInteraction', onUserInteractionHandler, { id: 'parent-user-interaction' });

  // 리프레시 횟수 확인용 useEffect
  useEffect(() => {
    console.log('🔄 Parent Data Actions 리프레시됨 - storeManager 변경');
  }, [storeManager]);

  // View에서 사용할 액션 함수들
  const registerChild = useCallback((childId: string, childType: string) => 
    dispatch('onChildRegistered', { childId, childType }), [dispatch]);
  
  const logDataChange = useCallback((source: string, data: any) => 
    dispatch('onDataChanged', { source, data }), [dispatch]);
  
  const logUserInteraction = useCallback((action: string, payload: any) => 
    dispatch('onUserInteraction', { action, payload }), [dispatch]);

  return { registerChild, logDataChange, logUserInteraction };
}
