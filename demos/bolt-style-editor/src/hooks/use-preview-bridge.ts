import { isPreviewBridgeMessage } from '@context-action/live-code-editor';
import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { BrowserWorkspace } from '../workspace';

const PREVIEW_ERROR_MESSAGE_LIMIT = 240;

function boundPreviewErrorMessage(message: string): string {
  const normalized = message.trim();
  return (normalized || 'Preview runtime error').slice(
    0,
    PREVIEW_ERROR_MESSAGE_LIMIT
  );
}

export type UsePreviewBridgeOptions = {
  workspace: BrowserWorkspace;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  revision: number;
};

/** Connects one parent-owned workspace revision to its sandbox iframe acknowledgement. */
export function usePreviewBridge({
  workspace,
  iframeRef,
  revision,
}: UsePreviewBridgeOptions): void {
  const expectedRevisionRef = useRef(revision);

  useEffect(() => {
    expectedRevisionRef.current = revision;
  }, [revision]);

  useEffect(() => {
    const handlePreviewMessage = (event: MessageEvent<unknown>) => {
      const iframeWindow = iframeRef.current?.contentWindow;
      if (!iframeWindow || event.source !== iframeWindow) return;
      if (!isPreviewBridgeMessage(event.data)) return;
      if (event.data.revision !== expectedRevisionRef.current) return;

      if (event.data.type === 'context-action.preview.ready') {
        workspace.setPreviewStatus(event.data.revision, 'synced');
      } else {
        workspace.setPreviewStatus(
          event.data.revision,
          'error',
          boundPreviewErrorMessage(event.data.message)
        );
      }
    };

    window.addEventListener('message', handlePreviewMessage);
    return () => window.removeEventListener('message', handlePreviewMessage);
  }, [iframeRef, workspace]);
}
