import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createLiveEditorDocumentMessage,
  isLiveEditorChildMessage,
  type LiveEditorDocumentSnapshot,
  type LiveEditorPreviewFile,
  type LiveEditorPreviewPayload,
} from '../../../lib/live-code-editor-bridge';
import styles from './LiveCodeEditorPage.module.css';

interface LiveCodeEditorPreviewFrameProps {
  document: LiveEditorDocumentSnapshot;
  workspaceFiles: readonly LiveEditorPreviewFile[];
  entryPath?: string;
  onRendered?: (revision: number) => void;
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
    <script data-bridge-runtime>
      const CHANNEL = 'context-action.live-editor';
      const parentWindow = window.parent;
      let lastRevision = -1;
      const post = (message) => parentWindow.postMessage({ channel: CHANNEL, ...message }, '*');
      const isExternalReference = (value) => /^(?:[a-z][a-z0-9+.-]*:|\\/\\/)/i.test(value.trim());
      const normalizePath = (path) => {
        const segments = path.split('/');
        const result = [];
        for (const segment of segments) {
          if (!segment || segment === '.') continue;
          if (segment === '..') { result.pop(); continue; }
          result.push(segment);
        }
        return result.join('/');
      };
      const resolvePath = (reference, ownerPath) => {
        const cleanReference = reference.trim().split(/[?#]/, 1)[0];
        if (!cleanReference || isExternalReference(cleanReference)) return null;
        const base = cleanReference.startsWith('/') ? [] : ownerPath.split('/').slice(0, -1);
        return normalizePath(base.concat(cleanReference.replace(/^\\/+/, '').split('/')).join('/'));
      };
      const isJavaScriptType = (type) => !type || /^(?:text|application)\\/(?:java|ecma)script$/i.test(type) || type.toLowerCase() === 'module';
      const createScript = (scriptNode, source) => {
        const script = document.createElement('script');
        for (const attribute of Array.from(scriptNode.attributes)) {
          if (attribute.name === 'src' || attribute.name === 'integrity' || attribute.name === 'crossorigin') continue;
          script.setAttribute(attribute.name, attribute.value);
        }
        script.textContent = source;
        return script;
      };
      const materializeNode = (node, ownerPath, files) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return node.cloneNode(true);
        const element = node;
        if (element.tagName === 'SCRIPT') {
          if (!isJavaScriptType(element.getAttribute('type'))) return null;
          const source = element.getAttribute('src')
            ? files.get(resolvePath(element.getAttribute('src'), ownerPath))
            : element.textContent || '';
          if (source === undefined) return null;
          return createScript(element, source);
        }
        const clone = element.cloneNode(false);
        for (const child of Array.from(element.childNodes)) {
          const materialized = materializeNode(child, ownerPath, files);
          if (materialized) clone.appendChild(materialized);
        }
        return clone;
      };
      const renderWorkspace = (documentSnapshot, preview) => {
        if (!preview.entryPath) throw new Error('Workspace runtime has no HTML entry file.');
        const files = new Map(preview.files.map((file) => [file.path, file.source]));
        const entrySource = files.get(preview.entryPath);
        if (entrySource === undefined) throw new Error('HTML entry file is not in the workspace.');
        const parsed = new DOMParser().parseFromString(entrySource, 'text/html');
        const bridgeScript = document.querySelector('script[data-bridge-runtime]');
        const nextHead = document.createElement('head');
        for (const child of Array.from(parsed.head.children)) {
          if (child.tagName === 'LINK' && (child.getAttribute('rel') || '').toLowerCase() === 'stylesheet') {
            const cssPath = resolvePath(child.getAttribute('href') || '', preview.entryPath);
            const css = cssPath ? files.get(cssPath) : undefined;
            if (css !== undefined) {
              const style = document.createElement('style');
              style.dataset.workspacePath = cssPath;
              style.textContent = css;
              nextHead.appendChild(style);
            }
            continue;
          }
          const materialized = materializeNode(child, preview.entryPath, files);
          if (materialized) nextHead.appendChild(materialized);
        }
        document.head.replaceChildren(...Array.from(nextHead.childNodes));
        const nextBody = [];
        for (const child of Array.from(parsed.body.childNodes)) {
          const materialized = materializeNode(child, preview.entryPath, files);
          if (materialized) nextBody.push(materialized);
        }
        if (bridgeScript) nextBody.push(bridgeScript);
        document.body.replaceChildren(...nextBody);
        document.documentElement.lang = parsed.documentElement.lang || 'en';
        document.title = parsed.title || preview.entryPath;
        return 'Executed ' + preview.entryPath + ' with local CSS/JS in the sandbox.';
      };
      const renderDocument = (documentSnapshot, preview) => {
        if (!documentSnapshot || typeof documentSnapshot.revision !== 'number') return;
        if (documentSnapshot.revision < lastRevision) return;
        lastRevision = documentSnapshot.revision;
        if (preview && preview.execute && preview.entryPath) {
          const message = renderWorkspace(documentSnapshot, preview);
          post({ type: 'editor:rendered', revision: documentSnapshot.revision });
          return message;
        }
        const status = document.getElementById('status');
        document.getElementById('title').textContent = documentSnapshot.exampleId + ' preview';
        document.getElementById('description').textContent = 'Rendered from a controlled document projection. Editor code is not executed in this frame.';
        document.getElementById('file').textContent = documentSnapshot.file;
        document.getElementById('revision').textContent = 'revision ' + documentSnapshot.revision;
        document.getElementById('scenario').textContent = 'scenario ' + documentSnapshot.scenario;
        document.getElementById('source').textContent = documentSnapshot.source;
        status.dataset.state = documentSnapshot.scenario;
        status.textContent = 'Rendered revision ' + documentSnapshot.revision + ' through parent → iframe bridge.';
        post({ type: 'editor:rendered', revision: documentSnapshot.revision });
        return status.textContent;
      };
      window.addEventListener('message', (event) => {
        if (event.source !== parentWindow) return;
        const message = event.data;
        if (!message || message.channel !== CHANNEL) return;
        if (message.type === 'editor:init' || message.type === 'editor:document') {
          try {
            const statusText = renderDocument(message.document, message.preview);
            const status = document.getElementById('status');
            if (message.preview && message.preview.execute && status) {
              status.textContent = statusText;
              status.dataset.state = 'ready';
            }
          } catch (error) {
            const status = document.getElementById('status');
            if (status) {
              status.dataset.state = 'blocked';
              status.textContent = 'Workspace runtime error: ' + String(error);
            }
            post({ type: 'editor:error', message: String(error), revision: message.document && message.document.revision });
          }
        }
      });
      post({ type: 'editor:ready' });
    </script>
  </body>
</html>`;

export function LiveCodeEditorPreviewFrame({
  document: documentSnapshot,
  workspaceFiles,
  entryPath,
  onRendered,
}: LiveCodeEditorPreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [renderedRevision, setRenderedRevision] = useState<number | null>(null);
  const srcDoc = useMemo(() => previewSource, []);
  const preview = useMemo<LiveEditorPreviewPayload>(
    () => ({
      execute: Boolean(entryPath),
      ...(entryPath ? { entryPath } : {}),
      files: workspaceFiles.map(({ path, source }) => ({ path, source })),
    }),
    [entryPath, workspaceFiles]
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (!isLiveEditorChildMessage(event.data)) return;

      if (event.data.type === 'editor:ready') {
        setIsReady(true);
        iframeRef.current?.contentWindow?.postMessage(
          createLiveEditorDocumentMessage(
            documentSnapshot,
            'editor:init',
            preview
          ),
          '*'
        );
        return;
      }

      if (event.data.type === 'editor:rendered') {
        if (event.data.revision === documentSnapshot.revision) {
          setRenderedRevision(event.data.revision);
          onRendered?.(event.data.revision);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [documentSnapshot, onRendered, preview]);

  useEffect(() => {
    if (!isReady) return;
    iframeRef.current?.contentWindow?.postMessage(
      createLiveEditorDocumentMessage(
        documentSnapshot,
        'editor:document',
        preview
      ),
      '*'
    );
  }, [documentSnapshot, isReady, preview]);

  const isWorkspaceRuntime = preview.execute && Boolean(preview.entryPath);

  return (
    <div className={styles.iframePreview}>
      <div className={styles.iframePreviewHeader}>
        <span>
          {isWorkspaceRuntime ? 'workspace runtime' : 'preview bridge'}
        </span>
        <span>
          {renderedRevision === documentSnapshot.revision
            ? 'synced'
            : 'syncing…'}
        </span>
      </div>
      <iframe
        ref={iframeRef}
        key={isWorkspaceRuntime ? 'workspace-runtime' : 'bridge-preview'}
        className={styles.previewFrame}
        title="Live Code Editor sandboxed preview"
        sandbox="allow-scripts"
        srcDoc={srcDoc}
      />
    </div>
  );
}
