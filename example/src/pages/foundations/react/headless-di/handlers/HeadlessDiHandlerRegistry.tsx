import type { ActionObserverEvent } from '@context-action/core';
import { type ReactNode, useCallback, useEffect, useMemo } from 'react';
import {
  HeadlessDocumentStoreProvider,
  HeadlessSessionStoreProvider,
  HeadlessWorkspaceActionProvider,
  useHeadlessSessionStore,
  useHeadlessWorkspaceObserver,
} from '../contexts/HeadlessDiContexts';
import type { HeadlessWorkspaceRuntime } from '../runtime/createHeadlessWorkspace';

interface HeadlessDiHandlerRegistryProps {
  runtime: HeadlessWorkspaceRuntime;
  children: ReactNode;
}

function HeadlessDiHandlerRegistry({
  runtime,
  children,
}: HeadlessDiHandlerRegistryProps) {
  const viewLocalStore = useHeadlessSessionStore('viewLocal');

  const observeAppendBullet = useCallback(
    (
      event: ActionObserverEvent<{ text: string; source: 'react' | 'headless' }>
    ) => {
      viewLocalStore.update((draft) => {
        draft.draftHeadline = `Observed ${event.payload.source} note: ${event.payload.text}`;
        return undefined;
      });
    },
    [viewLocalStore]
  );

  // React-scoped observer attaches only while the React Provider subtree
  // is mounted, and detaches on unmount without touching headless commands.
  useHeadlessWorkspaceObserver('appendBullet', observeAppendBullet, {
    id: 'react-view-telemetry-observer',
    priority: 1,
  });

  useEffect(() => {
    runtime.notifyTopologyChange();
    return () => {
      // ActionContext unregisters React-scoped observers asynchronously via
      // microtask/shutdown cleanup; re-check topology after cleanup settles.
      runtime.notifyTopologyChange();
      queueMicrotask(() => {
        queueMicrotask(() => {
          queueMicrotask(() => {
            runtime.notifyTopologyChange();
          });
        });
      });
      setTimeout(() => {
        runtime.notifyTopologyChange();
      }, 0);
    };
  }, [runtime]);

  return <>{children}</>;
}

interface HeadlessDiProvidersProps {
  runtime: HeadlessWorkspaceRuntime;
  children: ReactNode;
}

export function HeadlessDiProviders({
  runtime,
  children,
}: HeadlessDiProvidersProps) {
  const externalSessionStores = useMemo(
    () => ({ session: runtime.sessionStore }),
    [runtime]
  );

  return (
    <HeadlessWorkspaceActionProvider
      register={runtime.register}
      ownership="shared"
    >
      <HeadlessSessionStoreProvider
        stores={externalSessionStores}
        ownership="shared"
      >
        <HeadlessDocumentStoreProvider
          manager={runtime.documentManager}
          ownership="shared"
        >
          <HeadlessDiHandlerRegistry runtime={runtime}>
            {children}
          </HeadlessDiHandlerRegistry>
        </HeadlessDocumentStoreProvider>
      </HeadlessSessionStoreProvider>
    </HeadlessWorkspaceActionProvider>
  );
}
