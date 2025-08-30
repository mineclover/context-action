import { type ActionPayloadMap, createActionContext, createStoreContext } from '@context-action/react';

// ==============================================
// CHILD B DOMAIN - MVVM Architecture
// ==============================================

// 🗄️ Model Layer - Store Types Definition
export interface ChildBStores {
  'text': string;
}

// ⚙️ ViewModel Layer - Action Types Definition
export interface ChildBActions extends ActionPayloadMap {
  updateText: { newText: string };
  clearText: void;
}

// 🗄️ Model Layer - Store Context Creation
export const {
  Provider: ChildBModelProvider,
  useStore: useChildBStore,
  useStoreManager: useChildBStoreManager
} = createStoreContext<ChildBStores>('ChildB', {
  'text': { 
    initialValue: 'Hello World' 
  }
});

// ⚙️ ViewModel Layer - Action Context Creation
export const {
  Provider: ChildBActionProvider,
  useActionDispatch: useChildBActionDispatch,
  useActionHandler: useChildBActionHandler
} = createActionContext<ChildBActions>('ChildB');
