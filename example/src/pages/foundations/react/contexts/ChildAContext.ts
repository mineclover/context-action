import { type ActionPayloadMap, createActionContext, createStoreContext } from '@context-action/react';

// ==============================================
// CHILD A DOMAIN - MVVM Architecture
// ==============================================

// 🗄️ Model Layer - Store Types Definition
export interface ChildAStores {
  'counter': number;
}

// ⚙️ ViewModel Layer - Action Types Definition
export interface ChildAActions extends ActionPayloadMap {
  incrementCounter: { amount: number };
  resetCounter: void;
  controlChild: { childId: string; action: 'increment' | 'reset'; amount?: number };
}

// 🗄️ Model Layer - Store Context Creation
export const {
  Provider: ChildAModelProvider,
  useStore: useChildAStore,
  useStoreManager: useChildAStoreManager
} = createStoreContext<ChildAStores>('ChildA', {
  'counter': { 
    initialValue: 0 
  }
});

// ⚙️ ViewModel Layer - Action Context Creation
export const {
  Provider: ChildAActionProvider,
  useActionDispatch: useChildAActionDispatch,
  useActionHandler: useChildAActionHandler
} = createActionContext<ChildAActions>('ChildA');
