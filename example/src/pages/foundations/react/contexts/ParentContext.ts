import { type ActionPayloadMap, createActionContext, createStoreContext } from '@context-action/react';

// ==============================================
// PARENT DOMAIN - MVVM Architecture
// ==============================================

// 🗄️ Model Layer - Store Types Definition
export interface ParentStores {
  'registered-children': Array<{ childId: string; childType: string }>;
  'parent-counter': number;
}

// ⚙️ ViewModel Layer - Action Types Definition
export interface ParentActions extends ActionPayloadMap {
  // 하위 컴포넌트들이 등록할 수 있는 인터페이스만 정의
  onChildRegistered: { childId: string; childType: string };
  onUserInteraction: { action: string; payload: any };
  // 상위 자체 액션
  incrementParentCounter: void;
  resetParentCounter: void;
  // 하위 컴포넌트 제어 요청 (하위 컴포넌트가 상위에 등록한 핸들러 호출)
  requestChildControl: {
    childId: string;
    action: 'increment' | 'reset';
    amount?: number;
  };
}

// 🗄️ Model Layer - Store Context Creation
export const {
  Provider: ParentModelProvider,
  useStore: useParentStore,
  useStoreManager: useParentStoreManager
} = createStoreContext<ParentStores>('Parent', {
  'registered-children': { 
    initialValue: [] as Array<{ childId: string; childType: string }> 
  },
  'parent-counter': { 
    initialValue: 0 
  }
});

// ⚙️ ViewModel Layer - Action Context Creation
export const {
  Provider: ParentActionProvider,
  useActionDispatch: useParentActionDispatch,
  useActionHandler: useParentActionHandler
} = createActionContext<ParentActions>('Parent');
