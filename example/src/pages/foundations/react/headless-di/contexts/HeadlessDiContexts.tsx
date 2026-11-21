import {
  createActionContext,
  createStoreContext,
  createTimeTravelStoreContext,
} from '@context-action/react';
import {
  createInitialDocumentState,
  createInitialSessionState,
  createInitialViewLocalState,
  type HeadlessSessionState,
  type HeadlessWorkspaceActions,
  type ViewLocalState,
  type WorkspaceDocumentState,
} from '../business/headlessWorkspaceRules';

export interface HeadlessSessionStoreMap {
  session: HeadlessSessionState;
  viewLocal: ViewLocalState;
}

export interface HeadlessDocumentStoreMap {
  document: WorkspaceDocumentState;
}

export const {
  Provider: HeadlessWorkspaceActionProvider,
  useActionDispatch: useHeadlessWorkspaceDispatch,
  useActionObserver: useHeadlessWorkspaceObserver,
} = createActionContext<HeadlessWorkspaceActions>('HeadlessWorkspaceActions');

export const {
  Provider: HeadlessSessionStoreProvider,
  useStore: useHeadlessSessionStore,
} = createStoreContext<HeadlessSessionStoreMap>('HeadlessSessionStores', {
  session: createInitialSessionState(),
  viewLocal: createInitialViewLocalState(),
});

export const {
  Provider: HeadlessDocumentStoreProvider,
  useStore: useHeadlessDocumentStore,
  useTimeTravelControls: useHeadlessDocumentControls,
} = createTimeTravelStoreContext<HeadlessDocumentStoreMap>(
  'HeadlessDocumentStores',
  {
    document: {
      initialValue: createInitialDocumentState(),
      maxHistory: 20,
    },
  }
);
