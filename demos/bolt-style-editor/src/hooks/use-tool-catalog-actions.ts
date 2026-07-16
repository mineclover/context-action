import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef } from 'react';
import type { ToolCall } from '../local-agent-plan';
import type { ConfirmationRequest } from '../views/editor-dialogs';
import type { ToolCatalogDefinition } from '../views/tool-catalog-panel';
import type { WorkspaceFile } from '../workspace';
import type {
  ToolExecutionOptions,
  ToolExecutionOutcome,
} from './use-tool-execution';

export type ToolCatalogActionsOptions = {
  activeFile: WorkspaceFile;
  activeSource: string;
  snapshotRevision: number;
  selectedToolName: string;
  selectedToolDefinition?: ToolCatalogDefinition;
  toolArgumentsText: string;
  toolArgumentsError: string | null;
  setToolArgumentsText: Dispatch<SetStateAction<string>>;
  setToolArgumentsError: Dispatch<SetStateAction<string | null>>;
  requestConfirmation: (request: ConfirmationRequest) => Promise<boolean>;
  executeQuickTool: (
    call: ToolCall,
    options?: ToolExecutionOptions
  ) => Promise<ToolExecutionOutcome>;
};

export function useToolCatalogActions({
  activeFile,
  activeSource,
  snapshotRevision,
  selectedToolName,
  selectedToolDefinition,
  toolArgumentsText,
  toolArgumentsError,
  setToolArgumentsText,
  setToolArgumentsError,
  requestConfirmation,
  executeQuickTool,
}: ToolCatalogActionsOptions) {
  const toolArgumentsSampleRef = useRef(true);

  const paletteCallFor = (name: string): ToolCall | null => {
    switch (name) {
      case 'workspace.getStatus':
      case 'workspace.listFiles':
      case 'preview.getStatus':
      case 'preview.refresh':
        return { name, arguments: {} };
      case 'workspace.readFile':
      case 'workspace.downloadFile':
      case 'workspace.openFile':
        return { name, arguments: { path: activeFile.path } };
      case 'workspace.createFile':
        return {
          name,
          arguments: {
            path: 'notes.md',
            source: '# Created from the tool palette\n',
            expectedRevision: snapshotRevision,
          },
        };
      case 'workspace.renameFile': {
        const filename = activeFile.path.split('/').pop() ?? activeFile.path;
        return {
          name,
          arguments: {
            fromPath: activeFile.path,
            toPath: `renamed-${filename}`,
            expectedRevision: snapshotRevision,
          },
        };
      }
      case 'workspace.deleteFile':
        return {
          name,
          arguments: { path: 'README.md', expectedRevision: snapshotRevision },
        };
      case 'workspace.writeFile':
        return {
          name,
          arguments: {
            path: activeFile.path,
            source: activeSource,
            expectedRevision: snapshotRevision,
          },
        };
      case 'workspace.saveAll':
      case 'workspace.saveCheckpoint':
      case 'workspace.reset':
      case 'workspace.reloadFolder':
      case 'workspace.undo':
      case 'workspace.redo':
      case 'workspace.revertFile':
        return {
          name,
          arguments:
            name === 'workspace.revertFile'
              ? { path: activeFile.path, expectedRevision: snapshotRevision }
              : { expectedRevision: snapshotRevision },
        };
      case 'workspace.disconnectFolder':
        return { name, arguments: {} };
      case 'workspace.applyPatch': {
        if (activeFile.kind === 'asset') return null;
        const line = activeSource.split('\n').find((value) => value.trim());
        if (!line) return null;
        return {
          name,
          arguments: {
            path: activeFile.path,
            search: line,
            replace: `${line}  `,
            occurrence: 'first',
            expectedRevision: snapshotRevision,
          },
        };
      }
      case 'preview.setTheme':
        return { name, arguments: { theme: 'violet' } };
      case 'preview.addFeature':
        return {
          name,
          arguments: {
            title: 'Palette feature',
            description: 'Added from the visible tool palette.',
          },
        };
      case 'preview.updateHero':
        return {
          name,
          arguments: {
            title: 'A page shaped by a tool call.',
            subtitle: 'The visible registry can update the hero copy directly.',
          },
        };
      default:
        return null;
    }
  };

  const resetSelectedToolArguments = () => {
    const sample = selectedToolName ? paletteCallFor(selectedToolName) : null;
    toolArgumentsSampleRef.current = true;
    setToolArgumentsText(JSON.stringify(sample?.arguments ?? {}, null, 2));
    setToolArgumentsError(null);
  };

  useEffect(() => {
    resetSelectedToolArguments();
  }, [selectedToolName, activeFile.path]);

  useEffect(() => {
    if (toolArgumentsSampleRef.current) resetSelectedToolArguments();
  }, [snapshotRevision]);

  const handleToolArgumentsChange = (value: string) => {
    toolArgumentsSampleRef.current = false;
    setToolArgumentsText(value);
    if (toolArgumentsError) setToolArgumentsError(null);
  };

  const parseToolArguments = (): Record<string, unknown> | null => {
    try {
      const parsed: unknown = JSON.parse(toolArgumentsText);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Arguments must be a JSON object.');
      }
      setToolArgumentsError(null);
      return parsed as Record<string, unknown>;
    } catch (error) {
      setToolArgumentsError(
        error instanceof Error ? error.message : 'Invalid JSON arguments.'
      );
      return null;
    }
  };

  const runSelectedTool = async () => {
    if (!selectedToolName || !selectedToolDefinition) return;
    const argumentsValue = parseToolArguments();
    if (!argumentsValue) return;
    if (
      selectedToolDefinition.annotations?.destructiveHint === true &&
      !(await requestConfirmation({
        title: 'Run destructive tool sample?',
        message: `${selectedToolName} can change or remove workspace data. Review the arguments and confirm before running it.`,
        confirmLabel: 'Run tool',
        tone: 'danger',
      }))
    ) {
      return;
    }
    await executeQuickTool({
      name: selectedToolName,
      arguments: argumentsValue,
    });
  };

  return {
    parseToolArguments,
    resetSelectedToolArguments,
    handleToolArgumentsChange,
    runSelectedTool,
    toolArgumentsSampleRef,
  };
}
