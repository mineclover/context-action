import { useCallback, useState } from 'react';
import { clearLiveEditorTrace } from '../../../../lib/live-editor-trace';
import {
  downloadTextFile,
  serializeToolTrace,
  writeClipboardText,
} from '../../../../lib/tool-call-trace';

export function useLiveEditorTraceActions(
  trace: Parameters<typeof serializeToolTrace>[0]
) {
  const [traceCopied, setTraceCopied] = useState(false);
  const [error, setError] = useState('');

  const clear = useCallback(() => {
    clearLiveEditorTrace();
  }, []);

  const copy = useCallback(async () => {
    if (!trace.length) return;
    try {
      await writeClipboardText(serializeToolTrace(trace));
      setError('');
      setTraceCopied(true);
      window.setTimeout(() => setTraceCopied(false), 1600);
    } catch {
      setTraceCopied(false);
      setError(
        'Could not copy the editor execution trace. Use Download instead.'
      );
    }
  }, [trace]);

  const download = useCallback(() => {
    if (!trace.length) return;
    downloadTextFile(
      serializeToolTrace(trace),
      'context-action-editor-trace.json'
    );
  }, [trace]);

  return {
    traceCopied,
    error,
    commands: { clear, copy, download },
  };
}
