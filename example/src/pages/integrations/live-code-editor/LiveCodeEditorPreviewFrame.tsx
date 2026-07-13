import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createLiveEditorDocumentMessage,
  isLiveEditorChildMessage,
  type LiveEditorDocumentSnapshot,
} from '../../../lib/live-code-editor-bridge';
import styles from './LiveCodeEditorPage.module.css';

interface LiveCodeEditorPreviewFrameProps {
  document: LiveEditorDocumentSnapshot;
}

const previewSource = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
      body { margin: 0; min-width: 0; background: #f8fafc; color: #1f2937; }
      main { display: grid; gap: 12px; padding: 18px; }
      .eyebrow { color: #635bce; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
      h1 { margin: 0; font-size: 18px; letter-spacing: -.03em; }
      p { margin: 0; color: #667085; font-size: 12px; line-height: 1.5; }
      pre { max-height: 210px; overflow: auto; margin: 0; border: 1px solid #dfe4ea; border-radius: 8px; padding: 12px; background: #111827; color: #d9e1ee; font: 11px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; }
      .meta { display: flex; flex-wrap: wrap; gap: 6px; }
      .meta span { border: 1px solid #dfe4ea; border-radius: 999px; padding: 4px 7px; color: #667085; font-size: 10px; }
      .status { border-radius: 8px; padding: 9px 10px; background: #eef8f2; color: #17613c; font-size: 11px; }
      .status[data-state="invalid"], .status[data-state="blocked"] { background: #fff7e8; color: #955b09; }
    </style>
  </head>
  <body>
    <main>
      <span class="eyebrow">sandboxed iframe preview</span>
      <h1 id="title">Loading document…</h1>
      <p id="description">Waiting for the parent document manager.</p>
      <div class="meta"><span id="file">file</span><span id="revision">revision 0</span><span id="scenario">scenario</span></div>
      <pre id="source">Waiting for a controlled document projection.</pre>
      <div class="status" id="status" data-state="ready">Parent-owned bridge is ready.</div>
    </main>
    <script>
      const CHANNEL = 'context-action.live-editor';
      const parentWindow = window.parent;
      const post = (message) => parentWindow.postMessage({ channel: CHANNEL, ...message }, '*');
      const render = (documentSnapshot) => {
        document.getElementById('title').textContent = documentSnapshot.exampleId + ' preview';
        document.getElementById('description').textContent = 'Rendered from a controlled document projection. Editor code is not executed in this frame.';
        document.getElementById('file').textContent = documentSnapshot.file;
        document.getElementById('revision').textContent = 'revision ' + documentSnapshot.revision;
        document.getElementById('scenario').textContent = 'scenario ' + documentSnapshot.scenario;
        document.getElementById('source').textContent = documentSnapshot.source;
        const status = document.getElementById('status');
        status.dataset.state = documentSnapshot.scenario;
        status.textContent = 'Rendered revision ' + documentSnapshot.revision + ' through parent → iframe bridge.';
        post({ type: 'editor:rendered', revision: documentSnapshot.revision });
      };
      window.addEventListener('message', (event) => {
        if (event.source !== parentWindow) return;
        const message = event.data;
        if (!message || message.channel !== CHANNEL) return;
        if (message.type === 'editor:init' || message.type === 'editor:document') {
          try { render(message.document); }
          catch (error) { post({ type: 'editor:error', message: String(error), revision: message.document && message.document.revision }); }
        }
      });
      post({ type: 'editor:ready' });
    </script>
  </body>
</html>`;

export function LiveCodeEditorPreviewFrame({
  document: documentSnapshot,
}: LiveCodeEditorPreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [renderedRevision, setRenderedRevision] = useState<number | null>(null);
  const srcDoc = useMemo(() => previewSource, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (!isLiveEditorChildMessage(event.data)) return;

      if (event.data.type === 'editor:ready') {
        setIsReady(true);
        iframeRef.current?.contentWindow?.postMessage(
          createLiveEditorDocumentMessage(documentSnapshot, 'editor:init'),
          '*'
        );
        return;
      }

      if (event.data.type === 'editor:rendered') {
        setRenderedRevision(event.data.revision);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [documentSnapshot]);

  useEffect(() => {
    if (!isReady) return;
    iframeRef.current?.contentWindow?.postMessage(
      createLiveEditorDocumentMessage(documentSnapshot),
      '*'
    );
  }, [documentSnapshot, isReady]);

  return (
    <div className={styles.iframePreview}>
      <div className={styles.iframePreviewHeader}>
        <span>preview bridge</span>
        <span>{renderedRevision === documentSnapshot.revision ? 'synced' : 'syncing…'}</span>
      </div>
      <iframe
        ref={iframeRef}
        className={styles.previewFrame}
        title="Live Code Editor sandboxed preview"
        sandbox="allow-scripts"
        srcDoc={srcDoc}
      />
    </div>
  );
}
