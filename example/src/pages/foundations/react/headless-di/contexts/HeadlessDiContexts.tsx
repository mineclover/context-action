import { createActionContext, createStoreContext } from '@context-action/react';
import { createTimeTravelStoreContext } from '@context-action/react/time-travel';
import {
  createInitialDocumentState,
  createInitialSessionState,
  createInitialViewLocalState,
  type HeadlessSessionState,
  type HeadlessViewActions,
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
  Provider: HeadlessViewActionProvider,
  useActionDispatch: useHeadlessViewDispatch,
  useActionCommandHandler: useHeadlessViewActionCommandHandler,
} = createActionContext<HeadlessViewActions>('HeadlessViewActions');

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
