import { ActionRegister } from '@context-action/core';
import {
  createStore,
  createTimeTravelStore,
  type Store,
  type TimeTravelStore,
  TimeTravelStoreManager,
} from '@context-action/react';
import {
  createInitialDocumentState,
  createInitialSessionState,
  formatWorkspaceSummary,
  type HeadlessSessionState,
  type HeadlessWorkspaceActions,
  validateBulletText,
  validateDocumentTitle,
  type WorkspaceDocumentState,
} from '../business/headlessWorkspaceRules';

export interface HeadlessDocumentStoreMap {
  document: WorkspaceDocumentState;
}

export interface HeadlessRuntimeSummary {
  title: string;
  bulletCount: number;
  bullets: string[];
  revision: number;
  publishedTitle: string | null;
  lastSource: HeadlessSessionState['lastSource'];
  lastError: string | null;
  canUndo: boolean;
  canRedo: boolean;
  position: number;
  historyLength: number;
  appendHandlerCount: number;
  summaryText: string;
}

export interface HeadlessWorkspaceRuntime {
  readonly register: ActionRegister<HeadlessWorkspaceActions>;
  readonly sessionStore: Store<HeadlessSessionState>;
  readonly documentStore: TimeTravelStore<WorkspaceDocumentState>;
  readonly documentManager: TimeTravelStoreManager<HeadlessDocumentStoreMap>;
  getSummary: () => HeadlessRuntimeSummary;
  subscribeSummary: (listener: () => void) => () => void;
  notifyTopologyChange: () => void;
  dispose: () => void;
}

export function createHeadlessWorkspace(): HeadlessWorkspaceRuntime {
  const register = new ActionRegister<HeadlessWorkspaceActions>({
    name: 'HeadlessSymmetricWorkspace',
    registry: { debug: false },
  });

  const sessionStore = createStore<HeadlessSessionState>(
    'session',
    createInitialSessionState()
  );

  const initialDoc = createInitialDocumentState();
  const documentStore = createTimeTravelStore<WorkspaceDocumentState>(
    'document',
    initialDoc,
    { maxHistory: 20, mutable: false }
  );

  const documentManager = new TimeTravelStoreManager<HeadlessDocumentStoreMap>(
    'HeadlessDocumentManager',
    {
      document: {
        initialValue: initialDoc,
        maxHistory: 20,
      },
    },
    20,
    {
      externalStores: { document: documentStore },
      externalOwnership: 'shared',
    }
  );

  const topologyListeners = new Set<() => void>();

  const notifyTopologyChange = () => {
    for (const listener of topologyListeners) {
      listener();
    }
  };

  register.registerGuard(
    'updateTitle',
    (payload, controller) => {
      const check = validateDocumentTitle(payload.title);
      if (!check.valid) {
        sessionStore.update((draft) => {
          draft.lastError = check.reason;
          return undefined;
        });
        controller.abort(check.reason ?? 'Invalid title');
      }
    },
    { id: 'headless-title-guard', priority: 100 }
  );

  register.registerGuard(
    'appendBullet',
    (payload, controller) => {
      const check = validateBulletText(payload.text);
      if (!check.valid) {
        sessionStore.update((draft) => {
          draft.lastError = check.reason;
          return undefined;
        });
        controller.abort(check.reason ?? 'Invalid note');
      }
    },
    { id: 'headless-bullet-guard', priority: 100 }
  );

  register.registerCommand(
    'updateTitle',
    (payload) => {
      const check = validateDocumentTitle(payload.title);
      documentStore.update((draft) => {
        draft.title = check.normalized;
        return undefined;
      });
      sessionStore.update((draft) => {
        draft.revision += 1;
        draft.lastSource = payload.source;
        draft.lastError = null;
        return undefined;
      });
    },
    { id: 'headless-update-title', priority: 10 }
  );

  register.registerCommand(
    'appendBullet',
    (payload) => {
      const check = validateBulletText(payload.text);
      documentStore.update((draft) => {
        draft.bullets.push(check.normalized);
        return undefined;
      });
      sessionStore.update((draft) => {
        draft.revision += 1;
        draft.lastSource = payload.source;
        draft.lastError = null;
        return undefined;
      });
    },
    { id: 'headless-append-bullet', priority: 10 }
  );

  register.registerCommand(
    'publishSnapshot',
    (payload) => {
      const currentDoc = documentStore.getValue();
      sessionStore.update((draft) => {
        draft.revision += 1;
        draft.publishedTitle = currentDoc.title;
        draft.lastSource = payload.source;
        draft.lastError = null;
        return undefined;
      });
    },
    { id: 'headless-publish-snapshot', priority: 10 }
  );

  register.registerCommand(
    'resetWorkspace',
    () => {
      documentStore.reset();
      sessionStore.setValue(createInitialSessionState());
    },
    { id: 'headless-reset-workspace', priority: 10 }
  );

  let cachedSummary: HeadlessRuntimeSummary | null = null;

  const getSummary = (): HeadlessRuntimeSummary => {
    const session = sessionStore.getSnapshot().value;
    const doc = documentStore.getSnapshot().value;
    const canUndo = documentStore.canUndo();
    const canRedo = documentStore.canRedo();
    const position = documentStore.getPosition();
    const historyLength = documentStore.getHistory().length;
    const appendHandlerCount = register.getHandlerCount('appendBullet');

    if (
      cachedSummary &&
      cachedSummary.title === doc.title &&
      cachedSummary.bulletCount === doc.bullets.length &&
      cachedSummary.bullets === doc.bullets &&
      cachedSummary.revision === session.revision &&
      cachedSummary.publishedTitle === session.publishedTitle &&
      cachedSummary.lastSource === session.lastSource &&
      cachedSummary.lastError === session.lastError &&
      cachedSummary.canUndo === canUndo &&
      cachedSummary.canRedo === canRedo &&
      cachedSummary.position === position &&
      cachedSummary.historyLength === historyLength &&
      cachedSummary.appendHandlerCount === appendHandlerCount
    ) {
      return cachedSummary;
    }

    cachedSummary = {
      title: doc.title,
      bulletCount: doc.bullets.length,
      bullets: doc.bullets,
      revision: session.revision,
      publishedTitle: session.publishedTitle,
      lastSource: session.lastSource,
      lastError: session.lastError,
      canUndo,
      canRedo,
      position,
      historyLength,
      appendHandlerCount,
      summaryText: formatWorkspaceSummary(session, doc),
    };
    return cachedSummary;
  };

  const subscribeSummary = (listener: () => void): (() => void) => {
    const unsubSession = sessionStore.subscribe(listener);
    const unsubDoc = documentStore.subscribe(listener);
    topologyListeners.add(listener);
    return () => {
      unsubSession();
      unsubDoc();
      topologyListeners.delete(listener);
    };
  };

  const dispose = () => {
    register.destroy();
    documentManager.dispose();
    documentStore.dispose();
    sessionStore.dispose();
  };

  return {
    register,
    sessionStore,
    documentStore,
    documentManager,
    getSummary,
    subscribeSummary,
    notifyTopologyChange,
    dispose,
  };
}
