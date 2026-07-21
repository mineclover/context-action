import {
  readWorkspaceSavePlanDetails,
  verifyWorkspaceSavePlan,
} from '@context-action/live-code-editor';
import {
  listAllTools,
  type ToolCallResult,
  toToolCallRequest,
} from '@context-action/tool-protocol';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { WorkspaceFileSystemAdapter } from '../../../../lib/live-code-editor-filesystem';
import { createToolCallSessionId } from '../../../../lib/tool-call-trace';
import { formatToolResultText } from '../../../../lib/tool-result-format';
import { useLiveEditorToolRegistry } from '../LiveEditorToolchain';

interface LocalToolOptions {
  readonly idempotencyKey?: string;
}

interface LastSaveFileOperation {
  readonly toolName: 'editor.saveFile';
  readonly idempotencyKey: string;
  readonly path: string;
  readonly expectedSource: string;
  readonly sessionId: string;
}

interface LastSaveAllOperation {
  readonly toolName: 'editor.saveAll';
  readonly idempotencyKey: string;
  readonly sessionId: string;
}

type LastSaveOperation = LastSaveFileOperation | LastSaveAllOperation;

function readDocumentValue(
  value: unknown
): { readonly file: string; readonly source: string } | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as { file?: unknown; source?: unknown };
  return typeof candidate.file === 'string' &&
    typeof candidate.source === 'string'
    ? { file: candidate.file, source: candidate.source }
    : undefined;
}

function readStatusValue(value: unknown):
  | {
      readonly activePath: string;
      readonly dirtyPaths: readonly string[];
      readonly workspaceRevision: number;
      readonly documentRevision: number;
    }
  | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as {
    activePath?: unknown;
    dirtyPaths?: unknown;
    workspaceRevision?: unknown;
    documentRevision?: unknown;
  };
  return typeof candidate.activePath === 'string' &&
    Array.isArray(candidate.dirtyPaths) &&
    candidate.dirtyPaths.every((path) => typeof path === 'string') &&
    typeof candidate.workspaceRevision === 'number' &&
    typeof candidate.documentRevision === 'number'
    ? {
        activePath: candidate.activePath,
        dirtyPaths: candidate.dirtyPaths,
        workspaceRevision: candidate.workspaceRevision,
        documentRevision: candidate.documentRevision,
      }
    : undefined;
}

export function useLiveEditorToolActions({
  filesystemAdapter,
  onRecoveredPaths,
}: {
  readonly filesystemAdapter: WorkspaceFileSystemAdapter;
  readonly onRecoveredPaths?: (paths: readonly string[]) => void;
}) {
  const registry = useLiveEditorToolRegistry();
  const [localStatusResult, setLocalStatusResult] = useState('');
  const [localCallResult, setLocalCallResult] = useState('');
  const [localOpenResult, setLocalOpenResult] = useState('');
  const [localSaveResult, setLocalSaveResult] = useState('');
  const [localSaveAllResult, setLocalSaveAllResult] = useState('');
  const [localSaveRecoveryResult, setLocalSaveRecoveryResult] = useState('');
  const [localMutationResult, setLocalMutationResult] = useState('');
  const [localPatchResult, setLocalPatchResult] = useState('');
  const [modelShapedResult, setModelShapedResult] = useState('');
  const [modelSaveResult, setModelSaveResult] = useState('');
  const lastSaveOperationRef = useRef<LastSaveOperation | null>(null);

  const toolDefinitions = useMemo(() => listAllTools(registry), [registry]);

  const callLocalTool = useCallback(
    (
      name: string,
      argumentsValue: Record<string, unknown>,
      sessionId = createToolCallSessionId(),
      options: LocalToolOptions = {}
    ) =>
      registry.callTool(
        toToolCallRequest({
          id: `local-${Date.now()}-${name}`,
          name,
          arguments: argumentsValue,
        }),
        {
          context: { source: 'local', mode: 'direct', sessionId },
          ...(options.idempotencyKey === undefined
            ? {}
            : { idempotencyKey: options.idempotencyKey }),
        }
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
      const documentResult = await callLocalTool(
        'editor.getDocument',
        {},
        sessionId
      );
      const document = readDocumentValue(documentResult.structuredContent);
      if (documentResult.isError || !document) {
        setLocalSaveResult(
          formatToolResultText(
            documentResult,
            'Could not read the active document.'
          )
        );
        return;
      }
      const path = document.file === activePath ? activePath : document.file;
      const idempotencyKey = `editor.saveFile:${sessionId}:${path}`;
      lastSaveOperationRef.current = {
        toolName: 'editor.saveFile',
        idempotencyKey,
        path,
        expectedSource: document.source,
        sessionId,
      };
      const result = await callLocalTool(
        'editor.saveFile',
        { path },
        sessionId,
        { idempotencyKey }
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

  const recoverLastSave = useCallback(async () => {
    const operation = lastSaveOperationRef.current;
    if (!operation) {
      setLocalSaveRecoveryResult(
        'No save operation is available for recovery.'
      );
      return;
    }

    try {
      let recoveredPaths: readonly string[] | undefined;
      const record = await registry.recoverOperation(
        operation.toolName,
        operation.idempotencyKey,
        async (unknown) => {
          if (operation.toolName === 'editor.saveFile') {
            const externalFile = await filesystemAdapter.readFile(
              operation.path
            );
            if (!externalFile) {
              throw new Error(
                `The folder does not contain ${operation.path}; the save outcome remains unknown.`
              );
            }
            const externalSource = await externalFile.blob.text();
            if (externalSource !== operation.expectedSource) {
              throw new Error(
                `The folder content for ${operation.path} differs from the attempted save; manual reconciliation is required.`
              );
            }
            recoveredPaths = [operation.path];
          } else {
            const details = readWorkspaceSavePlanDetails(
              unknown.result?.error?.details
            );
            if (!details) {
              throw new Error(
                'The saveAll operation has no durable file manifest; manual reconciliation is required.'
              );
            }
            recoveredPaths = await verifyWorkspaceSavePlan(
              details,
              async (path) => {
                const externalFile = await filesystemAdapter.readFile(path);
                return externalFile?.blob.text();
              }
            );
          }

          const statusResult = await registry.callTool(
            toToolCallRequest({
              id: `recovery-status-${operation.sessionId}`,
              name: 'editor.getStatus',
              arguments: {},
            }),
            {
              context: {
                source: 'local',
                mode: 'direct',
                sessionId: operation.sessionId,
              },
            }
          );
          const status = readStatusValue(statusResult.structuredContent);
          if (statusResult.isError || !status) {
            throw new Error(
              statusResult.error?.message ??
                'The editor status could not be read for recovery.'
            );
          }

          const paths = recoveredPaths ?? [];
          const recoveredResult: ToolCallResult = {
            toolCallId: unknown.result?.toolCallId,
            content: [
              {
                type: 'text',
                text: `Recovered ${paths.join(', ')} from the connected folder.`,
              },
            ],
            structuredContent:
              operation.toolName === 'editor.saveFile'
                ? {
                    path: paths[0],
                    activePath: status.activePath,
                    savedTo: 'filesystem',
                    dirtyPaths: [...status.dirtyPaths],
                    workspaceRevision: status.workspaceRevision,
                    documentRevision: status.documentRevision,
                  }
                : {
                    savedPaths: [...paths],
                    activePath: status.activePath,
                    dirtyPaths: [...status.dirtyPaths],
                    workspaceRevision: status.workspaceRevision,
                    documentRevision: status.documentRevision,
                  },
          };
          return { state: 'completed' as const, result: recoveredResult };
        },
        {
          source: 'local',
          mode: 'direct',
          sessionId: operation.sessionId,
        }
      );
      if (record?.state === 'completed' && recoveredPaths) {
        onRecoveredPaths?.(recoveredPaths);
      }
      setLocalSaveRecoveryResult(
        record
          ? `Save recovery: ${record.state} · ${operation.toolName}`
          : 'No durable save record was found.'
      );
    } catch (error) {
      setLocalSaveRecoveryResult(
        error instanceof Error ? error.message : 'Save recovery failed.'
      );
    }
  }, [filesystemAdapter, onRecoveredPaths, registry]);

  const saveAllWorkspaceFiles = useCallback(async () => {
    const sessionId = createToolCallSessionId();
    const idempotencyKey = `editor.saveAll:${sessionId}`;
    lastSaveOperationRef.current = {
      toolName: 'editor.saveAll',
      idempotencyKey,
      sessionId,
    };
    try {
      const result = await callLocalTool('editor.saveAll', {}, sessionId, {
        idempotencyKey,
      });
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
      {
        context: { source: 'model', mode: 'agent', sessionId },
        idempotencyKey: `editor.saveFile:${sessionId}:index.html`,
      }
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
      localSaveRecoveryResult,
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
      recoverLastSave,
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
