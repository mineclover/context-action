import { createToolContext } from '@context-action/react';
import type { ReactNode } from 'react';
import {
  LiveEditorDocumentManager,
  type LiveEditorDocumentSnapshot,
} from '../../../lib/live-code-editor-bridge';
import { applyLiveEditorTextPatch } from '../../../lib/live-editor-text-patch';
import { liveEditorToolsSchema } from '../../../lib/live-editor-tools-schema';
import { recordLiveEditorToolCall } from '../../../lib/live-editor-trace';

export const {
  Provider: LiveEditorToolProvider,
  useToolHandler: useLiveEditorToolHandler,
  useToolRegistry: useLiveEditorToolRegistry,
} = createToolContext('LiveEditorTools', {
  schema: liveEditorToolsSchema,
  debug: true,
  onToolCall: recordLiveEditorToolCall,
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

  const updateAndWait = async (
    patch: Parameters<LiveEditorDocumentManager['update']>[0],
    signal?: AbortSignal
  ) => {
    if (signal?.aborted) throw new Error('Editor update cancelled.');
    const snapshot = manager.update(patch);
    const preview = await manager.waitForRendered(
      snapshot.revision,
      2_000,
      signal
    );
    if (preview.state === 'error') {
      throw new Error(
        `Preview execution failed: ${preview.message ?? 'unknown runtime error.'}`
      );
    }
    if (preview.state === 'timeout') {
      throw new Error(
        'Preview did not acknowledge the requested revision within 2 seconds.'
      );
    }
    return { ...snapshot, preview };
  };

  useLiveEditorToolHandler<'editor.setDocument', unknown>(
    'editor.setDocument',
    ({ source, scenario }, controller) =>
      updateAndWait(
        {
          source,
          ...(scenario === undefined ? {} : { scenario }),
        },
        controller.signal
      )
  );

  useLiveEditorToolHandler<'editor.applyPatch', unknown>(
    'editor.applyPatch',
    ({ search, replace, occurrence, expectedRevision }, controller) => {
      const current = manager.getSnapshot();
      if (
        expectedRevision !== undefined &&
        expectedRevision !== current.revision
      ) {
        throw new Error(
          `Editor revision mismatch: expected ${expectedRevision}, current ${current.revision}. Re-read the document before applying the patch.`
        );
      }
      const patch = applyLiveEditorTextPatch(
        current.source,
        search,
        replace,
        occurrence
      );
      if (patch.source.length > 100_000) {
        throw new Error(
          'Patched document exceeds the 100,000 character limit.'
        );
      }
      return updateAndWait({ source: patch.source }, controller.signal).then(
        (snapshot) => ({
          ...snapshot,
          replacements: patch.replacements,
        })
      );
    }
  );

  useLiveEditorToolHandler<'editor.setScenario', unknown>(
    'editor.setScenario',
    ({ scenario }, controller) => updateAndWait({ scenario }, controller.signal)
  );

  useLiveEditorToolHandler<'editor.resetDocument', unknown>(
    'editor.resetDocument',
    (_, controller) => {
      const snapshot: LiveEditorDocumentSnapshot = manager.getSnapshot();
      return updateAndWait(
        {
          source: getResetSource(),
          scenario: snapshot.scenario,
        },
        controller.signal
      );
    }
  );

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
