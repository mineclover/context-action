import type { WorkspaceFile } from './workspace';

function attributeValue(tag: string, name: string): string | null {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')
  );
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function resolveLocalPath(
  fromPath: string,
  requestedPath: string
): string | null {
  const rawPath = requestedPath.trim().split(/[?#]/, 1)[0];
  let path: string;
  try {
    path = decodeURIComponent(rawPath);
  } catch {
    return null;
  }
  if (!path || /^(?:[a-z][a-z\d+.-]*:|\/\/|#|data:)/i.test(path)) {
    return null;
  }

  const base = fromPath.split('/');
  base.pop();
  const segments = (path.startsWith('/') ? [] : base).concat(path.split('/'));
  const normalized: string[] = [];
  for (const segment of segments) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      normalized.pop();
    } else {
      normalized.push(segment);
    }
  }
  return normalized.join('/') || null;
}

function findReferencedFile(
  files: readonly WorkspaceFile[],
  fromPath: string,
  requestedPath: string,
  language: WorkspaceFile['language']
): WorkspaceFile | undefined {
  const resolvedPath = resolveLocalPath(fromPath, requestedPath);
  return resolvedPath
    ? files.find(
        (file) => file.path === resolvedPath && file.language === language
      )
    : undefined;
}

export type WorkspaceAssetUrls = Readonly<Record<string, string>>;

const WORKSPACE_MODULE_SPECIFIER_PREFIX =
  'https://context-action.local/workspace-module/';

const MAX_INLINE_CSS_IMPORTS = 32;
const MAX_PREVIEW_JS_IMPORTS = 32;

export type PreviewDiagnostic = {
  kind: 'missing-reference' | 'blocked-external-reference';
  sourcePath: string;
  requestedPath: string;
  message: string;
};

export type PreviewBridgeMessage =
  | { type: 'context-action.preview.ready'; revision: number }
  | {
      type: 'context-action.preview.error';
      revision: number;
      message: string;
    };

function appendPreviewBridge(html: string, revision: number): string {
  const bridge = `<script>(function(){const revision=${revision};let failed=false;const send=function(message){window.parent.postMessage(Object.assign({revision:revision},message),'*')};const reportError=function(message){if(failed)return;failed=true;send({type:'context-action.preview.error',message:message||'Preview runtime error'})};window.addEventListener('error',function(event){reportError(event.message||'Preview runtime error')});window.addEventListener('unhandledrejection',function(event){const reason=event.reason;reportError(reason&&reason.message?String(reason.message):String(reason||'Unhandled preview rejection'))});window.addEventListener('DOMContentLoaded',function(){if(!failed)send({type:'context-action.preview.ready'})})})();</script>`;
  if (/<head\b[^>]*>/i.test(html)) {
    return html.replace(
      /<head\b[^>]*>/i,
      (openingTag) => `${openingTag}${bridge}`
    );
  }
  if (/<body\b[^>]*>/i.test(html)) {
    return html.replace(
      /<body\b[^>]*>/i,
      (openingTag) => `${bridge}${openingTag}`
    );
  }
  return `${bridge}${html}`;
}

function buildMissingPreviewDocument(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HTML entry required</title>
    <style>
      :root { color-scheme: dark; font-family: ui-sans-serif, system-ui, sans-serif; }
      body { display: grid; min-height: 100vh; margin: 0; place-items: center; background: #0d1016; color: #e7e9ef; }
      main { max-width: 420px; padding: 28px; border: 1px solid #3b315f; border-radius: 16px; background: #171326; box-shadow: 0 18px 48px rgb(0 0 0 / 28%); }
      span { color: #b9a9ff; font: 700 11px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; text-transform: uppercase; }
      h1 { margin: 12px 0 8px; font-size: 22px; letter-spacing: -.03em; }
      p { margin: 0; color: #a4aabd; font-size: 13px; line-height: 1.6; }
      code { color: #e4dfff; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    </style>
  </head>
  <body>
    <main>
      <span>Preview waiting</span>
      <h1>Add an HTML entry file</h1>
      <p>The workspace has no HTML file to render. Add <code>index.html</code> or another <code>.html</code> file, then refresh the preview.</p>
    </main>
  </body>
</html>`;
}

export function findPreviewHtmlFile(
  files: readonly WorkspaceFile[]
): WorkspaceFile | undefined {
  return (
    files.find((file) => file.path === 'index.html') ??
    files.find((file) => file.language === 'html')
  );
}

export function findPreviewStylesheetFile(
  files: readonly WorkspaceFile[]
): WorkspaceFile | undefined {
  return (
    files.find((file) => file.path === 'styles.css') ??
    files.find((file) => file.language === 'css')
  );
}

function rewriteCssAssetUrls(
  source: string,
  cssPath: string,
  assetUrls: WorkspaceAssetUrls
): string {
  return source.replace(
    /url\(\s*(["']?)([^)"']+)\1\s*\)/gi,
    (match, _quote: string, requestedPath: string) => {
      const resolvedPath = resolveLocalPath(cssPath, requestedPath);
      const assetUrl = resolvedPath ? assetUrls[resolvedPath] : undefined;
      return assetUrl ? `url("${assetUrl}")` : match;
    }
  );
}

type CssImportState = { count: number };

function toJavaScriptDataUrl(source: string): string {
  const encodedSource = encodeURIComponent(source).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
  return `data:text/javascript;charset=utf-8,${encodedSource}`;
}

export function workspaceJavaScriptModuleSpecifier(path: string): string {
  return `${WORKSPACE_MODULE_SPECIFIER_PREFIX}${path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`;
}

type JavaScriptModuleReferenceReplacer = (
  match: string,
  prefix: string,
  quote: string,
  requestedPath: string
) => string;

function mayStartJavaScriptRegex(source: string, slashIndex: number): boolean {
  let index = slashIndex - 1;
  while (index >= 0 && /\s/.test(source[index])) index -= 1;
  if (index < 0) return true;
  if (/[([{=,:;!&|?+\-*%^~<>]/.test(source[index])) return true;
  return /\b(?:return|throw|case|delete|void|typeof|instanceof|in|of)\s*$/.test(
    source.slice(Math.max(0, index - 12), index + 1)
  );
}

function maskJavaScriptNonCode(source: string): Uint8Array {
  const codeMask = new Uint8Array(source.length);
  codeMask.fill(1);
  const maskRange = (start: number, end: number) => {
    codeMask.fill(0, start, end);
  };

  function scanTemplate(start: number): number {
    maskRange(start, start + 1);
    let index = start + 1;
    while (index < source.length) {
      if (source[index] === '\\') {
        maskRange(index, Math.min(source.length, index + 2));
        index += 2;
        continue;
      }
      if (source[index] === '`') {
        maskRange(index, index + 1);
        return index + 1;
      }
      if (source[index] === '$' && source[index + 1] === '{') {
        maskRange(index, index + 2);
        index = scanCode(index + 2, true);
        continue;
      }
      maskRange(index, index + 1);
      index += 1;
    }
    return index;
  }

  function scanCode(start: number, stopAtBrace: boolean): number {
    let index = start;
    let braceDepth = 0;
    while (index < source.length) {
      const character = source[index];
      const nextCharacter = source[index + 1];
      if (stopAtBrace && character === '}') {
        if (braceDepth === 0) return index + 1;
        braceDepth -= 1;
        index += 1;
        continue;
      }
      if (stopAtBrace && character === '{') {
        braceDepth += 1;
        index += 1;
        continue;
      }
      if (character === '/' && nextCharacter === '/') {
        const commentStart = index;
        index += 2;
        while (index < source.length && source[index] !== '\n') index += 1;
        maskRange(commentStart, index);
        continue;
      }
      if (character === '/' && nextCharacter === '*') {
        const commentStart = index;
        index += 2;
        while (
          index < source.length &&
          !(source[index] === '*' && source[index + 1] === '/')
        ) {
          index += 1;
        }
        index = Math.min(source.length, index + 2);
        maskRange(commentStart, index);
        continue;
      }
      if (character === '/' && mayStartJavaScriptRegex(source, index)) {
        const regexStart = index;
        index += 1;
        let inCharacterClass = false;
        while (index < source.length) {
          if (source[index] === '\\') {
            index += 2;
            continue;
          }
          if (source[index] === '[') inCharacterClass = true;
          if (source[index] === ']') inCharacterClass = false;
          if (source[index] === '/' && !inCharacterClass) {
            index += 1;
            while (/[a-z]/i.test(source[index] ?? '')) index += 1;
            break;
          }
          index += 1;
        }
        maskRange(regexStart, index);
        continue;
      }
      if (character === "'" || character === '"') {
        const quote = character;
        const stringStart = index;
        index += 1;
        while (index < source.length) {
          if (source[index] === '\\') {
            index += 2;
            continue;
          }
          if (source[index] === quote) {
            index += 1;
            break;
          }
          index += 1;
        }
        maskRange(stringStart, index);
        continue;
      }
      if (character === '`') {
        index = scanTemplate(index);
        continue;
      }
      index += 1;
    }
    return index;
  }

  scanCode(0, false);
  return codeMask;
}

function replaceJavaScriptModuleReferences(
  source: string,
  replacer: JavaScriptModuleReferenceReplacer
): string {
  const codeMask = maskJavaScriptNonCode(source);
  return source.replace(
    /(\b(?:import|export)\s*(?:\(\s*)?(?:[^'"\n;]*?\sfrom\s*)?)(["'])([^"']+)\2/g,
    (
      match,
      prefix: string,
      quote: string,
      requestedPath: string,
      offset: number
    ) => {
      if (!codeMask[offset]) return match;
      return replacer(match, prefix, quote, requestedPath);
    }
  );
}

export function rewriteJavaScriptModuleImports(
  source: string,
  jsPath: string,
  files: readonly WorkspaceFile[]
): string {
  return replaceJavaScriptModuleReferences(
    source,
    (match, prefix, quote, requestedPath) => {
      const imported = findReferencedFile(
        files,
        jsPath,
        requestedPath,
        'javascript'
      );
      if (imported) {
        return `${prefix}${quote}${workspaceJavaScriptModuleSpecifier(imported.path)}${quote}`;
      }
      const trimmedPath = requestedPath.trim();
      const isLocalPath =
        trimmedPath.startsWith('.') || trimmedPath.startsWith('/');
      if (isExternalReference(trimmedPath) || isLocalPath) {
        const reason = isExternalReference(trimmedPath)
          ? `External module import blocked: ${trimmedPath}`
          : `Missing local module import: ${trimmedPath}`;
        return `${prefix}${quote}${toJavaScriptDataUrl(`throw new Error(${JSON.stringify(reason)});`)}${quote}`;
      }
      return match;
    }
  );
}

function buildJavaScriptModuleBootstrap(
  source: string,
  sourcePath: string,
  files: readonly WorkspaceFile[],
  rootKey = sourcePath
): string {
  type PendingModule = {
    key: string;
    path: string;
    source: string;
  };

  const pending: PendingModule[] = [{ key: rootKey, path: sourcePath, source }];
  const queued = new Set([rootKey]);
  const moduleSources = new Map<string, string>();
  let importCount = 0;

  for (let index = 0; index < pending.length; index += 1) {
    const module = pending[index];
    const rewritten = replaceJavaScriptModuleReferences(
      module.source,
      (match, prefix, quote, requestedPath) => {
        const imported = findReferencedFile(
          files,
          module.path,
          requestedPath,
          'javascript'
        );
        if (imported) {
          if (importCount >= MAX_PREVIEW_JS_IMPORTS) {
            const reason = `JavaScript module import limit exceeded at: ${requestedPath}`;
            return `${prefix}${quote}${toJavaScriptDataUrl(`throw new Error(${JSON.stringify(reason)});`)}${quote}`;
          }
          importCount += 1;
          if (!queued.has(imported.path)) {
            queued.add(imported.path);
            pending.push({
              key: imported.path,
              path: imported.path,
              source: imported.source,
            });
          }
          return `${prefix}${quote}${workspaceJavaScriptModuleSpecifier(imported.path)}${quote}`;
        }
        const trimmedPath = requestedPath.trim();
        const isLocalPath =
          trimmedPath.startsWith('.') || trimmedPath.startsWith('/');
        if (isExternalReference(trimmedPath) || isLocalPath) {
          const reason = isExternalReference(trimmedPath)
            ? `External module import blocked: ${trimmedPath}`
            : `Missing local module import: ${trimmedPath}`;
          return `${prefix}${quote}${toJavaScriptDataUrl(`throw new Error(${JSON.stringify(reason)});`)}${quote}`;
        }
        return match;
      }
    );
    moduleSources.set(module.key, rewritten);
  }

  const serializedSources = JSON.stringify(
    Object.fromEntries(moduleSources)
  ).replaceAll('<', '\\u003c');
  const rootSpecifier = workspaceJavaScriptModuleSpecifier(rootKey);
  return `<script>(function(){const sources=${serializedSources};const urls=Object.create(null);Object.keys(sources).forEach(function(key){urls[${JSON.stringify(WORKSPACE_MODULE_SPECIFIER_PREFIX)}+key.split('/').map(encodeURIComponent).join('/')]=URL.createObjectURL(new Blob([sources[key]],{type:'text/javascript'}))});window.addEventListener('pagehide',function(){Object.keys(urls).forEach(function(key){URL.revokeObjectURL(urls[key])})},{once:true});const importMap=document.createElement('script');importMap.type='importmap';importMap.textContent=JSON.stringify({imports:urls});(document.head||document.documentElement).appendChild(importMap);import(${JSON.stringify(rootSpecifier)}).catch(function(error){setTimeout(function(){throw error},0)})})();</script>`;
}

function visitJavaScriptModuleReferences(
  source: string,
  callback: (requestedPath: string) => void
): void {
  replaceJavaScriptModuleReferences(
    source,
    (match, _prefix, _quote, requestedPath) => {
      callback(requestedPath);
      return match;
    }
  );
}

function inlineCssImports(
  source: string,
  cssPath: string,
  files: readonly WorkspaceFile[],
  assetUrls: WorkspaceAssetUrls,
  importedPaths: ReadonlySet<string>,
  state: CssImportState
): string {
  const withImports = source.replace(
    /@import\s+(?:url\(\s*(["']?)([^)"'\s]+)\1\s*\)|(["'])([^"']+)\3)\s*([^;]*);/gi,
    (
      _match,
      _urlQuote: string,
      urlPath: string,
      quotedPathQuote: string,
      quotedPath: string,
      media: string
    ) => {
      const requestedPath = quotedPathQuote ? quotedPath : urlPath;
      const imported = findReferencedFile(files, cssPath, requestedPath, 'css');
      if (!imported) {
        return `/* Blocked unresolved workspace @import: ${requestedPath} */`;
      }
      if (importedPaths.has(imported.path)) {
        return `/* Skipped cyclic workspace @import: ${imported.path} */`;
      }
      if (state.count >= MAX_INLINE_CSS_IMPORTS) {
        return `/* Skipped workspace @import limit at: ${imported.path} */`;
      }
      state.count += 1;
      const importedSource = inlineCssImports(
        imported.source,
        imported.path,
        files,
        assetUrls,
        new Set([...importedPaths, imported.path]),
        state
      );
      return media.trim()
        ? `@media ${media.trim()} {\n${importedSource}\n}`
        : importedSource;
    }
  );
  return rewriteCssAssetUrls(withImports, cssPath, assetUrls);
}

function inlineStylesheets(
  html: string,
  htmlPath: string,
  files: readonly WorkspaceFile[],
  assetUrls: WorkspaceAssetUrls
): string {
  return html.replace(/<link\b[^>]*>/gi, (tag) => {
    const href = attributeValue(tag, 'href');
    const rel = attributeValue(tag, 'rel')?.toLowerCase() ?? '';
    if (
      !href ||
      (!rel.includes('stylesheet') && !/\.css(?:[?#]|$)/i.test(href))
    ) {
      return tag;
    }

    const css = findReferencedFile(files, htmlPath, href, 'css');
    return css
      ? `<style data-workspace-source="${css.path}">${inlineCssImports(css.source, css.path, files, assetUrls, new Set([css.path]), { count: 0 })}</style>`
      : '';
  });
}

function inlineScripts(
  html: string,
  htmlPath: string,
  files: readonly WorkspaceFile[]
): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (tag) => {
    const src = attributeValue(tag, 'src');
    const isModule =
      attributeValue(tag, 'type')?.trim().toLowerCase() === 'module';
    const inlineSource =
      tag.match(/^<script\b[^>]*>([\s\S]*?)<\/script>$/i)?.[1] ?? '';
    if (!src) {
      if (!isModule) return tag;
      return buildJavaScriptModuleBootstrap(
        inlineSource,
        htmlPath,
        files,
        `__context-action-inline-module:${htmlPath}`
      );
    }

    const javascript = findReferencedFile(files, htmlPath, src, 'javascript');
    if (!javascript) return '';

    const openingTag = tag.match(/^<script\b([^>]*)>/i)?.[1] ?? '';
    const attributes = openingTag.replace(
      /\s+src\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i,
      ''
    );
    if (isModule) {
      return buildJavaScriptModuleBootstrap(
        javascript.source,
        javascript.path,
        files
      );
    }
    return `<script${attributes}>${javascript.source}</script>`;
  });
}

function isIgnoredReference(requestedPath: string): boolean {
  const value = requestedPath.trim();
  return (
    !value ||
    value.startsWith('#') ||
    /^(?:data:|blob:|javascript:)/i.test(value)
  );
}

function isExternalReference(requestedPath: string): boolean {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(requestedPath.trim());
}

function collectReferenceDiagnostic(
  diagnostics: PreviewDiagnostic[],
  files: readonly WorkspaceFile[],
  sourcePath: string,
  requestedPath: string,
  label: string,
  seen: Set<string>,
  allowExternal = false
): void {
  if (isIgnoredReference(requestedPath)) return;
  const normalizedRequestedPath = requestedPath.trim();
  const key = `${sourcePath}\u0000${label}\u0000${normalizedRequestedPath}`;
  if (seen.has(key)) return;
  seen.add(key);
  if (isExternalReference(normalizedRequestedPath)) {
    if (allowExternal) return;
    diagnostics.push({
      kind: 'blocked-external-reference',
      sourcePath,
      requestedPath: normalizedRequestedPath,
      message: `External ${label} is blocked in the sandbox: ${normalizedRequestedPath}`,
    });
    return;
  }
  const resolvedPath = resolveLocalPath(sourcePath, normalizedRequestedPath);
  if (!resolvedPath || !files.some((file) => file.path === resolvedPath)) {
    diagnostics.push({
      kind: 'missing-reference',
      sourcePath,
      requestedPath: normalizedRequestedPath,
      message: `Missing ${label}: ${normalizedRequestedPath}`,
    });
  }
}

export function collectPreviewDiagnostics(
  files: readonly WorkspaceFile[]
): PreviewDiagnostic[] {
  const diagnostics: PreviewDiagnostic[] = [];
  const seen = new Set<string>();
  const htmlFile = findPreviewHtmlFile(files);
  if (!htmlFile) return diagnostics;
  const reachableCssPaths = new Set<string>();
  const javascriptQueue: Array<{ path: string; source: string }> = [];
  const queuedJavaScriptPaths = new Set<string>();

  htmlFile.source.replace(/<link\b[^>]*>/gi, (tag) => {
    const href = attributeValue(tag, 'href');
    const rel = attributeValue(tag, 'rel')?.toLowerCase() ?? '';
    if (href && (rel.includes('stylesheet') || /\.css(?:[?#]|$)/i.test(href))) {
      collectReferenceDiagnostic(
        diagnostics,
        files,
        htmlFile.path,
        href,
        'stylesheet',
        seen
      );
      const resolvedPath = resolveLocalPath(htmlFile.path, href);
      const css = resolvedPath
        ? files.find(
            (file) => file.path === resolvedPath && file.language === 'css'
          )
        : undefined;
      if (css) reachableCssPaths.add(css.path);
    }
    return tag;
  });

  htmlFile.source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (tag) => {
    const src = attributeValue(tag, 'src');
    const isModule =
      attributeValue(tag, 'type')?.trim().toLowerCase() === 'module';
    if (!src) {
      if (isModule) {
        javascriptQueue.push({
          path: htmlFile.path,
          source:
            tag.match(/^<script\b[^>]*>([\s\S]*?)<\/script>$/i)?.[1] ?? '',
        });
      }
      return tag;
    }
    collectReferenceDiagnostic(
      diagnostics,
      files,
      htmlFile.path,
      src,
      'script',
      seen
    );
    const javascript = findReferencedFile(
      files,
      htmlFile.path,
      src,
      'javascript'
    );
    if (isModule && javascript && !queuedJavaScriptPaths.has(javascript.path)) {
      queuedJavaScriptPaths.add(javascript.path);
      javascriptQueue.push({
        path: javascript.path,
        source: javascript.source,
      });
    }
    return tag;
  });

  for (
    let javascriptIndex = 0;
    javascriptIndex < javascriptQueue.length;
    javascriptIndex += 1
  ) {
    const javascript = javascriptQueue[javascriptIndex];
    visitJavaScriptModuleReferences(javascript.source, (requestedPath) => {
      if (isIgnoredReference(requestedPath)) return;
      if (isExternalReference(requestedPath)) {
        collectReferenceDiagnostic(
          diagnostics,
          files,
          javascript.path,
          requestedPath,
          'module import',
          seen
        );
        return;
      }
      const trimmedPath = requestedPath.trim();
      if (!trimmedPath.startsWith('.') && !trimmedPath.startsWith('/')) {
        return;
      }
      collectReferenceDiagnostic(
        diagnostics,
        files,
        javascript.path,
        requestedPath,
        'module import',
        seen
      );
      const imported = findReferencedFile(
        files,
        javascript.path,
        requestedPath,
        'javascript'
      );
      if (imported && !queuedJavaScriptPaths.has(imported.path)) {
        queuedJavaScriptPaths.add(imported.path);
        javascriptQueue.push({ path: imported.path, source: imported.source });
      }
    });
  }

  const assetTags = new Set([
    'audio',
    'embed',
    'image',
    'img',
    'object',
    'source',
    'track',
    'video',
  ]);
  htmlFile.source.replace(
    /<([a-z][\w:-]*)\b[^>]*>/gi,
    (tag, tagName: string) => {
      if (!assetTags.has(tagName.toLowerCase())) return tag;
      for (const attribute of ['data', 'poster', 'src']) {
        const requestedPath = attributeValue(tag, attribute);
        if (requestedPath) {
          collectReferenceDiagnostic(
            diagnostics,
            files,
            htmlFile.path,
            requestedPath,
            'asset',
            seen,
            true
          );
        }
      }
      return tag;
    }
  );

  const cssPaths = [...reachableCssPaths];
  for (let cssIndex = 0; cssIndex < cssPaths.length; cssIndex += 1) {
    const file = files.find(
      (candidate) => candidate.path === cssPaths[cssIndex]
    );
    if (!file) continue;
    file.source.replace(
      /@import\s+(?:url\(\s*(["']?)([^)"'\s]+)\1\s*\)|(["'])([^"']+)\3)\s*([^;]*);/gi,
      (
        match,
        _urlQuote: string,
        urlPath: string,
        quotedPathQuote: string,
        quotedPath: string
      ) => {
        collectReferenceDiagnostic(
          diagnostics,
          files,
          file.path,
          quotedPathQuote ? quotedPath : urlPath,
          'stylesheet import',
          seen
        );
        const resolvedPath = resolveLocalPath(
          file.path,
          quotedPathQuote ? quotedPath : urlPath
        );
        const imported = resolvedPath
          ? files.find(
              (candidate) =>
                candidate.path === resolvedPath && candidate.language === 'css'
            )
          : undefined;
        if (imported && !reachableCssPaths.has(imported.path)) {
          reachableCssPaths.add(imported.path);
          cssPaths.push(imported.path);
        }
        return match;
      }
    );
    file.source.replace(
      /url\(\s*(["']?)([^)"']+)\1\s*\)/gi,
      (match, _quote: string, requestedPath: string) => {
        collectReferenceDiagnostic(
          diagnostics,
          files,
          file.path,
          requestedPath,
          'asset',
          seen,
          true
        );
        return match;
      }
    );
  }

  return diagnostics;
}

function rewriteHtmlAssetReferences(
  html: string,
  htmlPath: string,
  assetUrls: WorkspaceAssetUrls
): string {
  const assetTags = new Set([
    'audio',
    'embed',
    'image',
    'img',
    'link',
    'object',
    'source',
    'track',
    'video',
  ]);
  return html.replace(/<([a-z][\w:-]*)\b[^>]*>/gi, (tag, tagName: string) => {
    if (!assetTags.has(tagName.toLowerCase())) return tag;
    return tag.replace(
      /(\s(?:data|href|poster|src)\s*=\s*)(["']?)([^"'\s>]+)\2/gi,
      (attribute, prefix: string, quote: string, requestedPath: string) => {
        const resolvedPath = resolveLocalPath(htmlPath, requestedPath);
        const assetUrl = resolvedPath ? assetUrls[resolvedPath] : undefined;
        return assetUrl ? `${prefix}${quote}${assetUrl}${quote}` : attribute;
      }
    );
  });
}

export function buildPreviewDocument(
  files: WorkspaceFile[],
  assetUrls: WorkspaceAssetUrls = {},
  previewRevision?: number
): string {
  const htmlFile = findPreviewHtmlFile(files);
  if (!htmlFile) {
    const diagnostic = buildMissingPreviewDocument();
    return previewRevision === undefined
      ? diagnostic
      : appendPreviewBridge(diagnostic, previewRevision);
  }

  const withStyles = inlineStylesheets(
    htmlFile.source,
    htmlFile.path,
    files,
    assetUrls
  );
  const withScripts = inlineScripts(withStyles, htmlFile.path, files);
  const withAssets = rewriteHtmlAssetReferences(
    withScripts,
    htmlFile.path,
    assetUrls
  );
  return previewRevision === undefined
    ? withAssets
    : appendPreviewBridge(withAssets, previewRevision);
}
