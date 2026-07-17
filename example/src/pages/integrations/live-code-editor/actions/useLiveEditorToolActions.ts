import { listAllTools, toToolCallRequest } from '@context-action/react';
import { useCallback, useMemo, useState } from 'react';
import { createToolCallSessionId } from '../../../../lib/tool-call-trace';
import { formatToolResultText } from '../../../../lib/tool-result-format';
import { useLiveEditorToolRegistry } from '../LiveEditorToolchain';

export function useLiveEditorToolActions() {
  const registry = useLiveEditorToolRegistry();
  const [localStatusResult, setLocalStatusResult] = useState('');
  const [localCallResult, setLocalCallResult] = useState('');
  const [localOpenResult, setLocalOpenResult] = useState('');
  const [localSaveResult, setLocalSaveResult] = useState('');
  const [localSaveAllResult, setLocalSaveAllResult] = useState('');
  const [localMutationResult, setLocalMutationResult] = useState('');
  const [localPatchResult, setLocalPatchResult] = useState('');
  const [modelShapedResult, setModelShapedResult] = useState('');
  const [modelSaveResult, setModelSaveResult] = useState('');

  const toolDefinitions = useMemo(() => listAllTools(registry), [registry]);

  const callLocalTool = useCallback(
    (
      name: string,
      argumentsValue: Record<string, unknown>,
      sessionId = createToolCallSessionId()
    ) =>
      registry.callTool(
        toToolCallRequest({
          id: `local-${Date.now()}-${name}`,
          name,
          arguments: argumentsValue,
        }),
        { context: { source: 'local', mode: 'direct', sessionId } }
      ),
    [registry]
  );

  const inspectEditorStatus = useCallback(async () => {
    const result = await callLocalTool('editor.getStatus', {});
    setLocalStatusResult(
      formatToolResultText(result, 'Local editor.getStatus failed.')
    );
  }, [callLocalTool]);

  const inspectRegistry = useCallback(async () => {
    const result = await callLocalTool('editor.listFiles', {});
    setLocalCallResult(
      formatToolResultText(result, 'Local tools/call failed.')
    );
  }, [callLocalTool]);

  const openWorkspaceFile = useCallback(async () => {
    try {
      const result = await callLocalTool('editor.openFile', {
        path: 'script.js',
      });
      setLocalOpenResult(
        formatToolResultText(result, 'Local editor.openFile failed.')
      );
    } catch (error) {
      setLocalOpenResult(
        error instanceof Error ? error.message : 'Local editor.openFile failed.'
      );
    }
  }, [callLocalTool]);

  const saveActiveWorkspaceFile = useCallback(async () => {
    try {
      const sessionId = createToolCallSessionId();
      const listing = await callLocalTool('editor.listFiles', {}, sessionId);
      if (listing.isError) {
        setLocalSaveResult(
          listing.error?.message ?? 'Could not list workspace files.'
        );
        return;
      }
      const value = listing.structuredContent;
      const activePath =
        value && typeof value === 'object' && 'activePath' in value
          ? value.activePath
          : undefined;
      if (typeof activePath !== 'string' || !activePath) {
        setLocalSaveResult('Workspace did not return an active text path.');
        return;
      }
      const result = await callLocalTool(
        'editor.saveFile',
        { path: activePath },
        sessionId
      );
      setLocalSaveResult(
        formatToolResultText(result, 'Local editor.saveFile failed.')
      );
    } catch (error) {
      setLocalSaveResult(
        error instanceof Error ? error.message : 'Local editor.saveFile failed.'
      );
    }
  }, [callLocalTool]);

  const saveAllWorkspaceFiles = useCallback(async () => {
    try {
      const result = await callLocalTool('editor.saveAll', {});
      setLocalSaveAllResult(
        formatToolResultText(result, 'Local editor.saveAll failed.')
      );
    } catch (error) {
      setLocalSaveAllResult(
        error instanceof Error ? error.message : 'Local editor.saveAll failed.'
      );
    }
  }, [callLocalTool]);

  const runLocalMutation = useCallback(async () => {
    const result = await callLocalTool('editor.setScenario', {
      scenario: 'invalid',
    });
    setLocalMutationResult(
      formatToolResultText(result, 'Local mutation failed.')
    );
  }, [callLocalTool]);

  const runModelShapedCall = useCallback(async () => {
    const sessionId = createToolCallSessionId();
    const result = await registry.executeModelToolCall(
      {
        id: `model-shaped-${Date.now()}`,
        name: 'editor.setScenario',
        arguments: { scenario: 'blocked' },
      },
      { context: { source: 'model', mode: 'agent', sessionId } }
    );
    setModelShapedResult(
      formatToolResultText(result, 'Model-shaped call failed.')
    );
  }, [registry]);

  const runModelShapedSave = useCallback(async () => {
    const sessionId = createToolCallSessionId();
    const result = await registry.executeModelToolCall(
      {
        id: `model-shaped-save-${Date.now()}`,
        name: 'editor.saveFile',
        arguments: { path: 'index.html' },
      },
      { context: { source: 'model', mode: 'agent', sessionId } }
    );
    setModelSaveResult(
      formatToolResultText(result, 'Model-shaped save failed.')
    );
  }, [registry]);

  const runLocalPatch = useCallback(async () => {
    const sessionId = createToolCallSessionId();
    const documentResult = await callLocalTool(
      'editor.getDocument',
      {},
      sessionId
    );
    if (documentResult.isError) {
      setLocalPatchResult(
        documentResult.error?.message ?? 'Could not read the current document.'
      );
      return;
    }

    const documentValue = documentResult.structuredContent;
    if (!documentValue || typeof documentValue !== 'object') {
      setLocalPatchResult('Current document result was not structured.');
      return;
    }
    const document = documentValue as {
      source?: unknown;
      revision?: unknown;
    };
    const source = typeof document.source === 'string' ? document.source : '';
    const revision =
      typeof document.revision === 'number' ? document.revision : undefined;
    const line = source.split('\n').find((value) => value.trim());
    if (!line || revision === undefined) {
      setLocalPatchResult(
        'Current document does not expose a patchable source.'
      );
      return;
    }

    const patchResult = await callLocalTool(
      'editor.applyPatch',
      {
        search: line,
        replace: `${line}  `,
        occurrence: 'first',
        expectedRevision: revision,
      },
      sessionId
    );
    setLocalPatchResult(
      formatToolResultText(patchResult, 'Local patch failed.')
    );
  }, [callLocalTool]);

  return {
    toolDefinitions,
    results: {
      localStatusResult,
      localCallResult,
      localOpenResult,
      localSaveResult,
      localSaveAllResult,
      localMutationResult,
      localPatchResult,
      modelShapedResult,
      modelSaveResult,
    },
    commands: {
      inspectEditorStatus,
      inspectRegistry,
      openWorkspaceFile,
      saveActiveWorkspaceFile,
      saveAllWorkspaceFiles,
      runLocalMutation,
      runModelShapedCall,
      runModelShapedSave,
      runLocalPatch,
    },
  } satisfies {
    toolDefinitions: ReturnType<typeof registry.listTools>['tools'];
    results: Record<string, string>;
    commands: Record<string, () => Promise<void>>;
  };
}
