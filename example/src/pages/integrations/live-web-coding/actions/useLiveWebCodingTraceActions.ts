import { useCallback, useState } from 'react';
import { clearLiveWebCodingTrace } from '../../../../lib/live-web-coding-trace';
import {
  downloadTextFile,
  serializeToolTrace,
  writeClipboardText,
} from '../../../../lib/tool-call-trace';

export function useLiveWebCodingTraceActions(
  trace: Parameters<typeof serializeToolTrace>[0]
) {
  const [traceCopied, setTraceCopied] = useState(false);
  const [error, setError] = useState('');

  const clear = useCallback(() => {
    clearLiveWebCodingTrace();
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
      setError('웹 코딩 trace를 복사하지 못했습니다. Download를 사용하세요.');
    }
  }, [trace]);

  const download = useCallback(() => {
    if (!trace.length) return;
    downloadTextFile(
      serializeToolTrace(trace),
      'context-action-web-trace.json'
    );
  }, [trace]);

  return {
    traceCopied,
    error,
    commands: { clear, copy, download },
  };
}
