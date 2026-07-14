import { createToolContext } from '@context-action/react';
import type { ReactNode } from 'react';
import {
  LiveEditorDocumentManager,
  type LiveEditorDocumentSnapshot,
} from '../../../lib/live-code-editor-bridge';
import { liveEditorToolsSchema } from '../../../lib/live-editor-tools-schema';

export const {
  Provider: LiveEditorToolProvider,
  useToolHandler: useLiveEditorToolHandler,
  useToolRegistry: useLiveEditorToolRegistry,
} = createToolContext('LiveEditorTools', {
  schema: liveEditorToolsSchema,
  debug: true,
});

function LiveEditorToolHandlers({
  manager,
  getResetSource,
  children,
}: {
  manager: LiveEditorDocumentManager;
  getResetSource: () => string;
  children: ReactNode;
}) {
  useLiveEditorToolHandler('editor.getDocument', () => manager.getSnapshot());

  useLiveEditorToolHandler('editor.getPreviewStatus', () =>
    manager.getPreviewStatus()
  );

  const updateAndWait = async (patch: Parameters<LiveEditorDocumentManager['update']>[0]) => {
    const snapshot = manager.update(patch);
    const preview = await manager.waitForRendered(snapshot.revision);
    return { ...snapshot, preview };
  };

  useLiveEditorToolHandler('editor.setDocument', ({ source, scenario }) => {
    return updateAndWait({
      source,
      ...(scenario === undefined ? {} : { scenario }),
    });
  });

  useLiveEditorToolHandler('editor.setScenario', ({ scenario }) =>
    updateAndWait({ scenario })
  );

  useLiveEditorToolHandler('editor.resetDocument', () => {
    const snapshot: LiveEditorDocumentSnapshot = manager.getSnapshot();
    return updateAndWait({ source: getResetSource(), scenario: snapshot.scenario });
  });

  return <>{children}</>;
}

export function LiveEditorToolchainProvider({
  manager,
  getResetSource,
  children,
}: {
  manager: LiveEditorDocumentManager;
  getResetSource: () => string;
  children: ReactNode;
}) {
  return (
    <LiveEditorToolProvider>
      <LiveEditorToolHandlers manager={manager} getResetSource={getResetSource}>
        {children}
      </LiveEditorToolHandlers>
    </LiveEditorToolProvider>
  );
}
