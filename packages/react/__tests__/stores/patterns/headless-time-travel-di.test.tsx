/**
 * @fileoverview Tests for headless-first TimeTravelStore / TimeTravelStoreManager DI on createTimeTravelStoreContext().Provider.
 */

import { act, render, waitFor } from '@testing-library/react';
import React, { Activity } from 'react';
import {
  ActionRegister,
  type ActionPayloadMap,
} from '@context-action/core';
import {
  createActionContext,
  useStoreValue,
} from '@context-action/react';
import {
  createTimeTravelStore,
  createTimeTravelStoreContext,
  isTimeTravelStore,
  TimeTravelStoreManager,
  type TimeTravelStore,
} from '@context-action/react/time-travel';

interface DocumentContent {
  title: string;
  body: string;
}

interface DraftMeta {
  cursor: number;
}

interface EditorStoreShape {
  doc: DocumentContent;
  meta: DraftMeta;
}

describe('Headless TimeTravelStore / TimeTravelStoreManager DI on createTimeTravelStoreContext.Provider', () => {
  it('routes hooks to an externally created TimeTravelStoreManager with shared ownership and preserves undo/redo history across unmount/remount', async () => {
    const externalManager = new TimeTravelStoreManager<EditorStoreShape>('HeadlessEditorMgr', {
      doc: { initialValue: { title: 'v0', body: '' }, maxHistory: 20 },
      meta: { cursor: 0 },
    });

    const rawDocStore = externalManager.getStore('doc');
    if (!isTimeTravelStore(rawDocStore)) throw new Error('Expected TimeTravelStore');
    const docStore = rawDocStore;
    docStore.setValue({ title: 'v1', body: 'hello' });

    const EditorStores = createTimeTravelStoreContext<EditorStoreShape>('EditorStores', {
      doc: { initialValue: { title: 'init', body: '' }, maxHistory: 20 },
      meta: { cursor: 0 },
    });

    let resolvedManager: TimeTravelStoreManager<EditorStoreShape> | undefined;
    let resolvedDocStore: TimeTravelStore<DocumentContent> | undefined;
    let controls!: ReturnType<typeof EditorStores.useTimeTravelControls<'doc'>>;

    function EditorView() {
      resolvedManager = EditorStores.useStoreManager();
      resolvedDocStore = EditorStores.useTimeTravelStore('doc');
      controls = EditorStores.useTimeTravelControls('doc');
      const doc = useStoreValue(resolvedDocStore);
      return (
        <span data-testid="editor">
          {doc.title}:{controls.position}/{controls.historyLength}:{String(controls.canUndo)}
        </span>
      );
    }

    const firstView = render(
      <EditorStores.Provider manager={externalManager}>
        <EditorView />
      </EditorStores.Provider>
    );

    expect(resolvedManager).toBe(externalManager);
    expect(resolvedDocStore).toBe(docStore);
    expect(firstView.getByTestId('editor').textContent).toBe('v1:1/2:true');

    act(() => {
      docStore.setValue({ title: 'v2', body: 'world' });
    });
    await waitFor(() => {
      expect(firstView.getByTestId('editor').textContent).toBe('v2:2/3:true');
    });

    act(() => {
      controls.undo();
    });
    await waitFor(() => {
      expect(firstView.getByTestId('editor').textContent).toBe('v1:1/3:true');
    });

    // Default ownership is 'shared': unmount leaves external manager & history alive.
    firstView.unmount();
    expect(docStore.isStoreDisposed()).toBe(false);
    expect(docStore.getSafeValue()).toEqual({ title: 'v1', body: 'hello' });
    expect(docStore.canRedo()).toBe(true);

    act(() => {
      docStore.redo();
    });

    // Remounting picks up live redo state and history cleanly.
    const secondView = render(
      <EditorStores.Provider manager={externalManager}>
        <EditorView />
      </EditorStores.Provider>
    );
    await waitFor(() => {
      expect(secondView.getByTestId('editor').textContent).toBe('v2:2/3:true');
    });

    secondView.unmount();
    externalManager.dispose();
  });

  it('supports partial external stores map, preserves shared TimeTravelStore across inline re-renders/clear/unmount, and disposes internal sibling stores', async () => {
    const externalDoc = createTimeTravelStore<DocumentContent>('doc', {
      title: 'shared-0',
      body: 'base',
    }, { maxHistory: 20, readMode: 'safe' });

    const EditorStores = createTimeTravelStoreContext<EditorStoreShape>('PartialEditorStores', {
      doc: { initialValue: { title: 'fallback', body: '' }, maxHistory: 20 },
      meta: { initialValue: { cursor: 10 }, timeTravel: false },
    });

    let observedDoc: TimeTravelStore<DocumentContent> | undefined;
    let observedMeta: ReturnType<typeof EditorStores.useStore<'meta'>> | undefined;
    let clearStores: (() => void) | undefined;
    let controls!: ReturnType<typeof EditorStores.useTimeTravelControls<'doc'>>;

    function Panel({ tick }: { tick: number }) {
      observedDoc = EditorStores.useTimeTravelStore('doc');
      observedMeta = EditorStores.useStore('meta');
      clearStores = EditorStores.useStoreClear();
      controls = EditorStores.useTimeTravelControls('doc');
      const doc = useStoreValue(observedDoc);
      const meta = useStoreValue(observedMeta);
      return (
        <div data-testid="panel">
          {tick}:{doc.title}:{meta.cursor}:{controls.historyLength}
        </div>
      );
    }

    const view = render(
      <EditorStores.Provider stores={{ doc: externalDoc }}>
        <Panel tick={1} />
      </EditorStores.Provider>
    );

    expect(observedDoc).toBe(externalDoc);
    const initialMetaStore = observedMeta!;
    expect(view.getByTestId('panel').textContent).toBe('1:shared-0:10:1');

    act(() => {
      initialMetaStore.setValue({ cursor: 42 });
      externalDoc.setValue({ title: 'shared-1', body: 'updated' });
    });

    await waitFor(() => {
      expect(view.getByTestId('panel').textContent).toBe('1:shared-1:42:2');
    });

    // Fresh inline object literal with identical external store reference reuses manager & meta store.
    view.rerender(
      <EditorStores.Provider stores={{ doc: externalDoc }}>
        <Panel tick={2} />
      </EditorStores.Provider>
    );
    expect(observedMeta).toBe(initialMetaStore);
    expect(view.getByTestId('panel').textContent).toBe('2:shared-1:42:2');

    // useStoreClear resets manager-owned 'meta' while keeping shared external 'doc' and its history alive.
    act(() => {
      clearStores?.();
    });
    expect(initialMetaStore.isStoreDisposed()).toBe(true);
    expect(externalDoc.isStoreDisposed()).toBe(false);
    expect(externalDoc.getHistory()).toHaveLength(2);

    const recreatedMetaStore = observedMeta!;
    expect(recreatedMetaStore).not.toBe(initialMetaStore);
    expect(recreatedMetaStore.getValue()).toEqual({ cursor: 10 });

    act(() => {
      controls.undo();
    });
    await waitFor(() => {
      expect(externalDoc.getSafeValue()).toEqual({ title: 'shared-0', body: 'base' });
    });

    view.unmount();
    expect(recreatedMetaStore.isStoreDisposed()).toBe(true);
    expect(externalDoc.isStoreDisposed()).toBe(false);
    externalDoc.dispose();
  });

  it('disposes injected TimeTravelStoreManager and injected stores on unmount when ownership is owned', () => {
    const ownedManager = new TimeTravelStoreManager<EditorStoreShape>('OwnedTTManager', {
      doc: { initialValue: { title: 'owned', body: '' }, maxHistory: 10 },
      meta: { cursor: 0 },
    });
    const managedDoc = ownedManager.getStore('doc');

    const OwnedEditorStores = createTimeTravelStoreContext<EditorStoreShape>('OwnedTTContext', {
      doc: { initialValue: { title: 'fallback', body: '' }, maxHistory: 10 },
      meta: { cursor: 0 },
    });

    const mgrView = render(
      <OwnedEditorStores.Provider manager={ownedManager} ownership="owned">
        <div />
      </OwnedEditorStores.Provider>
    );
    expect(managedDoc.isStoreDisposed()).toBe(false);
    mgrView.unmount();
    expect(managedDoc.isStoreDisposed()).toBe(true);

    const ownedExternalDoc = createTimeTravelStore<DocumentContent>('owned-doc', {
      title: 'temp',
      body: '',
    }, { readMode: 'safe' });

    const storesView = render(
      <OwnedEditorStores.Provider stores={{ doc: ownedExternalDoc }} ownership="owned">
        <div />
      </OwnedEditorStores.Provider>
    );
    expect(ownedExternalDoc.isStoreDisposed()).toBe(false);
    storesView.unmount();
    expect(ownedExternalDoc.isStoreDisposed()).toBe(true);
  });

  it('rebinds useStore, useStorePath, useStoreSelector, and useTimeTravelControls cleanly when swapping shared and owned managers', async () => {
    const sharedMgr = new TimeTravelStoreManager<EditorStoreShape>('SharedTT', {
      doc: { initialValue: { title: 'shared-title', body: 'a' }, maxHistory: 10 },
      meta: { cursor: 1 },
    });
    const ownedMgr = new TimeTravelStoreManager<EditorStoreShape>('OwnedTT', {
      doc: { initialValue: { title: 'owned-title', body: 'b' }, maxHistory: 10 },
      meta: { cursor: 2 },
    });

    const sharedDoc = sharedMgr.getStore('doc');
    const ownedDoc = ownedMgr.getStore('doc');

    const SwapEditorStores = createTimeTravelStoreContext<EditorStoreShape>('SwapTT', {
      doc: { initialValue: { title: '', body: '' }, maxHistory: 10 },
      meta: { cursor: 0 },
    });

    let activeStore: TimeTravelStore<DocumentContent> | undefined;

    function Reader() {
      activeStore = SwapEditorStores.useTimeTravelStore('doc');
      const title = SwapEditorStores.useStorePath<'doc', string>('doc', ['title']);
      const summary = SwapEditorStores.useStoreSelector('doc', doc => `${doc.title}:${doc.body}`);
      const controls = SwapEditorStores.useTimeTravelControls('doc');
      return (
        <span data-testid="reader">
          {title}|{summary}|{controls.historyLength}
        </span>
      );
    }

    const view = render(
      <SwapEditorStores.Provider manager={sharedMgr}>
        <Reader />
      </SwapEditorStores.Provider>
    );
    expect(activeStore).toBe(sharedDoc);
    expect(view.getByTestId('reader').textContent).toBe('shared-title|shared-title:a|1');

    // Swap shared -> owned: sharedMgr stays alive, UI rebinds to ownedMgr.
    view.rerender(
      <SwapEditorStores.Provider manager={ownedMgr} ownership="owned">
        <Reader />
      </SwapEditorStores.Provider>
    );
    await waitFor(() => {
      expect(view.getByTestId('reader').textContent).toBe('owned-title|owned-title:b|1');
    });
    expect(activeStore).toBe(ownedDoc);
    expect(sharedDoc.isStoreDisposed()).toBe(false);
    expect(ownedDoc.isStoreDisposed()).toBe(false);

    // Swap owned -> shared: ownedMgr is disposed, UI rebinds to sharedMgr.
    view.rerender(
      <SwapEditorStores.Provider manager={sharedMgr}>
        <Reader />
      </SwapEditorStores.Provider>
    );
    await waitFor(() => {
      expect(view.getByTestId('reader').textContent).toBe('shared-title|shared-title:a|1');
    });
    expect(ownedDoc.isStoreDisposed()).toBe(true);
    expect(sharedDoc.isStoreDisposed()).toBe(false);

    view.unmount();
    expect(sharedDoc.isStoreDisposed()).toBe(false);
    sharedMgr.dispose();
  });

  it('retains injected TimeTravelStore history through React StrictMode effect replay', async () => {
    const externalDoc = createTimeTravelStore<DocumentContent>('strict-tt', {
      title: 's0',
      body: '',
    }, { maxHistory: 10, readMode: 'safe' });

    const Stores = createTimeTravelStoreContext<{ doc: DocumentContent }>('StrictTT', {
      doc: { initialValue: { title: 'init', body: '' }, maxHistory: 10 },
    });

    function Viewer() {
      const doc = useStoreValue(Stores.useTimeTravelStore('doc'));
      const controls = Stores.useTimeTravelControls('doc');
      return (
        <span data-testid="strict">
          {doc.title}:{controls.historyLength}
        </span>
      );
    }

    const view = render(
      <React.StrictMode>
        <Stores.Provider stores={{ doc: externalDoc }}>
          <Viewer />
        </Stores.Provider>
      </React.StrictMode>
    );

    expect(view.getByTestId('strict').textContent).toBe('s0:1');

    act(() => {
      externalDoc.setValue({ title: 's1', body: 'next' });
    });

    await waitFor(() => {
      expect(view.getByTestId('strict').textContent).toBe('s1:2');
    });
    expect(externalDoc.isStoreDisposed()).toBe(false);

    view.unmount();
    expect(externalDoc.isStoreDisposed()).toBe(false);
    externalDoc.dispose();
  });

  const itWithActivity = typeof Activity === 'undefined' ? it.skip : it;

  itWithActivity('retains injected TimeTravelStore history across React Activity hide/reveal', async () => {
    const externalDoc = createTimeTravelStore<DocumentContent>('activity-tt', {
      title: 'a0',
      body: '',
    }, { maxHistory: 10, readMode: 'safe' });

    const Stores = createTimeTravelStoreContext<{ doc: DocumentContent }>('ActivityTT', {
      doc: { initialValue: { title: 'init', body: '' }, maxHistory: 10 },
    });

    function Viewer() {
      const doc = useStoreValue(Stores.useTimeTravelStore('doc'));
      const controls = Stores.useTimeTravelControls('doc');
      return (
        <span data-testid="activity">
          {doc.title}:{controls.historyLength}
        </span>
      );
    }

    const tree = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <Stores.Provider stores={{ doc: externalDoc }}>
          <Viewer />
        </Stores.Provider>
      </Activity>
    );

    const view = render(tree('visible'));
    expect(view.getByTestId('activity').textContent).toBe('a0:1');

    await act(async () => {
      view.rerender(tree('hidden'));
      await Promise.resolve();
    });
    expect(externalDoc.isStoreDisposed()).toBe(false);

    act(() => {
      externalDoc.setValue({ title: 'a1', body: 'updated' });
    });

    await act(async () => {
      view.rerender(tree('visible'));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(view.getByTestId('activity').textContent).toBe('a1:2');
    });
    expect(externalDoc.isStoreDisposed()).toBe(false);

    view.unmount();
    expect(externalDoc.isStoreDisposed()).toBe(false);
    externalDoc.dispose();
  });

  it('integrates ActionRegister DI and TimeTravelStore DI for headless undo/redo domain workflows', async () => {
    interface CanvasActions extends ActionPayloadMap {
      rename: { title: string };
      undoTitle: void;
    }
    interface CanvasStores {
      doc: DocumentContent;
    }

    const canvasRegister = new ActionRegister<CanvasActions>({ name: 'HeadlessCanvas' });
    const canvasDocStore = createTimeTravelStore<DocumentContent>('doc', {
      title: 'Untitled',
      body: '',
    }, { maxHistory: 20, readMode: 'safe' });

    canvasRegister.registerCommand('rename', ({ title }) => {
      canvasDocStore.update(draft => {
        draft.title = title;
      });
    }, { id: 'canvas-rename' });

    canvasRegister.registerCommand('undoTitle', () => {
      canvasDocStore.undo();
    }, { id: 'canvas-undo' });

    const CanvasActionsContext = createActionContext<CanvasActions>('CanvasActions');
    const CanvasStoresContext = createTimeTravelStoreContext<CanvasStores>('CanvasStores', {
      doc: { initialValue: { title: '', body: '' }, maxHistory: 20 },
    });

    let dispatch!: ReturnType<typeof CanvasActionsContext.useActionDispatch>;

    function CanvasView() {
      dispatch = CanvasActionsContext.useActionDispatch();
      const doc = useStoreValue(CanvasStoresContext.useTimeTravelStore('doc'));
      const controls = CanvasStoresContext.useTimeTravelControls('doc');
      return (
        <span data-testid="canvas">
          {doc.title}:{String(controls.canUndo)}:{controls.historyLength}
        </span>
      );
    }

    const view = render(
      <CanvasActionsContext.Provider register={canvasRegister}>
        <CanvasStoresContext.Provider stores={{ doc: canvasDocStore }}>
          <CanvasView />
        </CanvasStoresContext.Provider>
      </CanvasActionsContext.Provider>
    );

    expect(view.getByTestId('canvas').textContent).toBe('Untitled:false:1');

    await act(async () => {
      await dispatch('rename', { title: 'Architecture v2' });
    });
    await waitFor(() => {
      expect(view.getByTestId('canvas').textContent).toBe('Architecture v2:true:2');
    });

    await act(async () => {
      await dispatch('undoTitle');
    });
    await waitFor(() => {
      expect(view.getByTestId('canvas').textContent).toBe('Untitled:false:2');
    });

    // Unmount UI; domain register & time-travel history survive intact.
    view.unmount();
    expect(canvasDocStore.isStoreDisposed()).toBe(false);
    expect(canvasDocStore.canRedo()).toBe(true);

    await canvasRegister.destroyAsync();
    canvasDocStore.dispose();
  });
});
