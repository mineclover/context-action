import { toToolCallRequest, toToolListRequest } from '@context-action/react';
import { useEffect, useRef, useState } from 'react';
import type { BoltStyleRegistry } from '../bolt-style-tool-context';
import type { ToolTraceEntry } from '../tool-trace';
import type { ToolCatalogDefinition } from '../views/tool-catalog-panel';

function downloadTextFile(
  value: string,
  filename: string,
  mimeType = 'application/json'
): void {
  const blob = new Blob([value], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 0);
}

async function writeClipboardText(value: string): Promise<void> {
  const clipboard = navigator.clipboard;
  if (clipboard?.writeText) {
    try {
      await Promise.race([
        clipboard.writeText(value),
        new Promise<never>((_, reject) => {
          window.setTimeout(
            () => reject(new Error('Clipboard access timed out.')),
            800
          );
        }),
      ]);
      return;
    } catch {
      // Fall through to the synchronous browser copy path.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } finally {
    textarea.remove();
  }
  if (!copied) throw new Error('Clipboard access is unavailable.');
}

export type StudioExportActionsOptions = {
  registry: BoltStyleRegistry;
  traceEntries: readonly ToolTraceEntry[];
  selectedToolName: string;
  selectedToolDefinition?: ToolCatalogDefinition;
  parseToolArguments: () => Record<string, unknown> | null;
};

export function useStudioExportActions({
  registry,
  traceEntries,
  selectedToolName,
  selectedToolDefinition,
  parseToolArguments,
}: StudioExportActionsOptions) {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const copyFeedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimerRef.current !== null) {
        window.clearTimeout(copyFeedbackTimerRef.current);
      }
    };
  }, []);

  const showCopyFeedback = (message: string) => {
    if (copyFeedbackTimerRef.current !== null) {
      window.clearTimeout(copyFeedbackTimerRef.current);
    }
    setCopyFeedback(message);
    copyFeedbackTimerRef.current = window.setTimeout(() => {
      copyFeedbackTimerRef.current = null;
      setCopyFeedback(null);
    }, 1800);
  };

  const copyJson = async (label: string, value: unknown) => {
    try {
      await writeClipboardText(JSON.stringify(value, null, 2));
      showCopyFeedback(`${label} copied`);
    } catch (error) {
      showCopyFeedback(
        `${error instanceof Error ? error.message : 'Copy failed.'} Use Download instead.`
      );
    }
  };

  const downloadJson = (label: string, value: unknown, filename: string) => {
    downloadTextFile(JSON.stringify(value, null, 2), filename);
    showCopyFeedback(`${label} downloaded`);
  };

  const downloadToolList = () => {
    downloadJson(
      'tools/list result',
      registry.listTools(toToolListRequest()),
      'context-action-tools-list.json'
    );
  };

  const copySelectedToolCall = async () => {
    if (!selectedToolName) return;
    const argumentsValue = parseToolArguments();
    if (!argumentsValue) return;
    await copyJson(
      'tools/call request',
      toToolCallRequest({ name: selectedToolName, arguments: argumentsValue })
    );
  };

  const downloadSelectedToolDefinition = () => {
    if (!selectedToolDefinition) return;
    downloadJson(
      'Tool definition',
      selectedToolDefinition,
      `context-action-${selectedToolDefinition.name.replaceAll('.', '-')}-definition.json`
    );
  };

  const downloadSelectedToolCall = () => {
    if (!selectedToolName) return;
    const argumentsValue = parseToolArguments();
    if (!argumentsValue) return;
    downloadJson(
      'tools/call request',
      toToolCallRequest({ name: selectedToolName, arguments: argumentsValue }),
      `context-action-${selectedToolName.replaceAll('.', '-')}-call.json`
    );
  };

  const downloadExecutionTrace = () => {
    if (!traceEntries.length) return;
    downloadTextFile(
      JSON.stringify(traceEntries, null, 2),
      'context-action-studio-trace.json'
    );
  };

  return {
    copyFeedback,
    copyJson,
    copySelectedToolCall,
    downloadToolList,
    downloadSelectedToolDefinition,
    downloadSelectedToolCall,
    downloadExecutionTrace,
  };
}
