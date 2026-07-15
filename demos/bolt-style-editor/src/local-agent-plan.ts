export type ToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

export const revisionGuardedWorkspaceTools = new Set([
  'workspace.reset',
  'workspace.createFile',
  'workspace.renameFile',
  'workspace.deleteFile',
  'workspace.writeFile',
  'workspace.applyPatch',
  'workspace.revertFile',
  'workspace.undo',
  'workspace.redo',
  'workspace.saveCheckpoint',
  'workspace.saveAll',
  'workspace.reloadFolder',
]);

export const revisionProducingWorkspaceTools = new Set(
  [...revisionGuardedWorkspaceTools].filter(
    (name) =>
      name !== 'workspace.saveCheckpoint' && name !== 'workspace.saveAll'
  )
);

const localMutationToolNames = new Set([
  'workspace.reset',
  ...revisionGuardedWorkspaceTools,
  'workspace.saveAll',
  'workspace.reloadFolder',
  'workspace.disconnectFolder',
  'workspace.downloadFile',
  'workspace.undo',
  'workspace.redo',
  'preview.refresh',
  'preview.setTheme',
  'preview.addFeature',
  'preview.updateHero',
]);

const localFileListingToolNames = new Set([
  'workspace.applyPatch',
  'workspace.renameFile',
  'workspace.deleteFile',
  'workspace.writeFile',
  'workspace.revertFile',
  'workspace.downloadFile',
]);

const localTextInspectionToolNames = new Set([
  'workspace.applyPatch',
  'workspace.writeFile',
  'workspace.revertFile',
]);

export function inferWorkspacePath(prompt: string): string | null {
  const explicitPath = prompt.match(
    /(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.(?:html?|css|m?js|json|md|txt|tsx?|jsx?)(?=\b|[^A-Za-z0-9_.-])/i
  )?.[0];
  if (explicitPath) return explicitPath;
  if (/\breadme\b/i.test(prompt)) return 'README.md';
  if (/\bindex\b/i.test(prompt)) return 'index.html';
  if (/\bstyles?\b/i.test(prompt)) return 'styles.css';
  if (/\bapp\b/i.test(prompt)) return 'app.js';
  if (/\bnotes?\b/i.test(prompt)) return 'notes.md';
  return null;
}

function inferRenamePaths(
  prompt: string
): { fromPath: string; toPath: string } | null {
  if (!/(?:rename|move|이름\s*(?:변경|바꾸|바꿔)|파일\s*이름)/i.test(prompt)) {
    return null;
  }
  const pathPattern =
    /(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.(?:html?|css|m?js|json|md|txt|tsx?|jsx?)/gi;
  const paths = Array.from(prompt.matchAll(pathPattern), (match) => match[0]);
  const uniquePaths = paths.filter(
    (path, index) => paths.indexOf(path) === index
  );
  if (uniquePaths.length < 2) return null;
  return { fromPath: uniquePaths[0], toPath: uniquePaths[1] };
}

function inferQuotedTextPatch(
  prompt: string,
  requestedPath: string | null
): { path: string; search: string; replace: string } | null {
  if (!/(replace|change|edit|update|바꾸|바꿔|변경|수정|교체)/i.test(prompt)) {
    return null;
  }
  const quotedValues = Array.from(
    prompt.matchAll(/["“]([^"”]+)["”]/g),
    (match) => match[1]?.trim() ?? ''
  ).filter(Boolean);
  const values = quotedValues.filter((value) => value !== requestedPath);
  if (values.length < 2) return null;
  const [search, replace] = values;
  return {
    path: requestedPath ?? 'index.html',
    search,
    replace,
  };
}

function inferPromptQuotedValues(
  prompt: string,
  requestedPath: string | null
): string[] {
  return Array.from(
    prompt.matchAll(/"([^"]+)"|“([^”]+)”|'([^']+)'|「([^」]+)」/g),
    (match) =>
      match[1]?.trim() ??
      match[2]?.trim() ??
      match[3]?.trim() ??
      match[4]?.trim() ??
      ''
  ).filter((value) => value && value !== requestedPath);
}

function inferHeroCopy(
  prompt: string,
  requestedPath: string | null
): { title: string; subtitle: string } | null {
  if (!/(hero|headline|title|subtitle|제목|부제목|히어로)/i.test(prompt)) {
    return null;
  }
  const values = inferPromptQuotedValues(prompt, requestedPath);
  if (!values.length) return null;
  return {
    title: values[0],
    subtitle:
      values[1] ??
      'The agent selected a typed preview tool and updated the hero copy.',
  };
}

function inferFeatureCopy(
  prompt: string,
  requestedPath: string | null
): { title: string; description: string } | null {
  if (!/(feature|card|section|기능|카드|섹션)/i.test(prompt)) return null;
  const values = inferPromptQuotedValues(prompt, requestedPath);
  if (!values.length) return null;
  return {
    title: values[0],
    description:
      values[1] ??
      'Added from the conversation through a typed preview.addFeature call.',
  };
}

export function promptToToolCalls(
  prompt: string,
  activePath?: string
): ToolCall[] {
  const normalized = prompt.toLowerCase();
  const calls: ToolCall[] = [];
  const resetRequest =
    /초기화해?줘?|처음부터\s*(다시|시작)|기본\s*예제/i.test(prompt) ||
    (/(reset|start over|restore demo)/i.test(prompt) &&
      /(workspace|demo|작업공간|프로젝트|상태)/i.test(prompt));
  const deleteRequest =
    /(delete|remove|삭제|지워)/i.test(prompt) && /(file|파일)/i.test(prompt);
  const saveRequest = /(save|persist|저장|폴더에 반영|파일시스템)/i.test(
    prompt
  );
  const disconnectRequest =
    /(disconnect|unlink|연결 해제|연결을 해제|폴더 해제)/i.test(prompt) &&
    /(folder|directory|폴더|디렉터리)/i.test(prompt);
  const reloadRequest =
    /(reload|re-read|refresh|다시 읽|새로고침|재로드)/i.test(prompt) &&
    /(folder|directory|폴더|디렉터리)/i.test(prompt);
  const statusRequest =
    /(status|상태|folder sync|폴더 연결|저장 가능|writable)/i.test(prompt);
  const requestedPath = inferWorkspacePath(prompt);
  const renamePaths = inferRenamePaths(prompt);
  const openRequest =
    /(open|show|view|열어|열기|보여|파일을\s*(?:선택|열))/i.test(prompt);
  const downloadRequest = /(download|export|다운로드|내려받|받아\s*줘)/i.test(
    prompt
  );
  const undoRequest = /(\bundo\b|실행\s*취소|되돌리(?:기|어|줘|고))/i.test(
    prompt
  );
  const redoRequest = /(\bredo\b|재실행|다시\s*실행)/i.test(prompt);
  const visualCopyRequest =
    /(hero|headline|title|subtitle|feature|card|section|제목|부제목|히어로|기능|카드|섹션)/i.test(
      prompt
    );
  const textPatch =
    visualCopyRequest && !requestedPath
      ? null
      : inferQuotedTextPatch(prompt, requestedPath);
  const heroCopy = inferHeroCopy(prompt, requestedPath);
  const featureCopy = inferFeatureCopy(prompt, requestedPath);

  if (resetRequest) return [{ name: 'workspace.reset', arguments: {} }];

  if (statusRequest && !textPatch && !saveRequest && !reloadRequest) {
    return [{ name: 'workspace.getStatus', arguments: {} }];
  }

  if (textPatch) {
    calls.push({
      name: 'workspace.applyPatch',
      arguments: { ...textPatch, occurrence: 'first' },
    });
  }

  if (renamePaths) {
    calls.push({ name: 'workspace.renameFile', arguments: renamePaths });
  }

  if (openRequest && requestedPath && !textPatch && !renamePaths) {
    calls.push({
      name: 'workspace.openFile',
      arguments: { path: requestedPath },
    });
  }

  const downloadPath = requestedPath ?? activePath ?? null;
  if (downloadRequest && downloadPath) {
    calls.push({
      name: 'workspace.downloadFile',
      arguments: { path: downloadPath },
    });
  }
  if (downloadRequest && !downloadPath) {
    return [{ name: 'workspace.listFiles', arguments: {} }];
  }

  if (undoRequest) calls.push({ name: 'workspace.undo', arguments: {} });
  if (redoRequest) calls.push({ name: 'workspace.redo', arguments: {} });

  if (
    /(refresh|reload|새로고침|갱신)/i.test(prompt) &&
    /(preview|미리보기)/i.test(prompt) &&
    !reloadRequest
  ) {
    calls.push({ name: 'preview.refresh', arguments: {} });
  }

  if (deleteRequest && requestedPath) {
    calls.push({
      name: 'workspace.deleteFile',
      arguments: { path: requestedPath },
    });
  }
  if (deleteRequest && !requestedPath) {
    return [{ name: 'workspace.listFiles', arguments: {} }];
  }

  if (/(create|new|생성|만들)/i.test(prompt) && /(file|파일)/i.test(prompt)) {
    calls.push({
      name: 'workspace.createFile',
      arguments: {
        path: requestedPath ?? 'notes.md',
        source:
          '# New workspace file\n\nCreated through the typed workspace.createFile tool.\n',
      },
    });
  }

  const theme =
    normalized.includes('emerald') || normalized.includes('green')
      ? 'emerald'
      : normalized.includes('amber') || normalized.includes('orange')
        ? 'amber'
        : normalized.includes('rose') || normalized.includes('pink')
          ? 'rose'
          : normalized.includes('violet') ||
              normalized.includes('purple') ||
              prompt.includes('보라')
            ? 'violet'
            : null;

  if (theme) calls.push({ name: 'preview.setTheme', arguments: { theme } });

  if (/(feature|card|section|기능|카드)/i.test(prompt)) {
    calls.push({
      name: 'preview.addFeature',
      arguments: {
        title: featureCopy?.title ?? 'Conversation-driven feature',
        description:
          featureCopy?.description ??
          'A new card was added through a typed Context-Action tool call.',
      },
    });
  }

  if (
    /(hero|headline|hero\s+copy|landing\s+page|update\s+(?:the\s+)?title|제목|랜딩\s*페이지|히어로)/i.test(
      prompt
    )
  ) {
    calls.push({
      name: 'preview.updateHero',
      arguments: {
        title: heroCopy?.title ?? 'A page shaped by conversation.',
        subtitle:
          heroCopy?.subtitle ??
          'The agent selected tools, changed the workspace, and refreshed the preview.',
      },
    });
  }

  if (saveRequest) calls.push({ name: 'workspace.saveAll', arguments: {} });
  if (reloadRequest) {
    calls.push({ name: 'workspace.reloadFolder', arguments: {} });
  }
  if (disconnectRequest) {
    calls.push({ name: 'workspace.disconnectFolder', arguments: {} });
  }

  return calls.length > 0
    ? calls
    : [{ name: 'workspace.listFiles', arguments: {} }];
}

export function buildLocalAgentPlan(
  prompt: string,
  browserOnlyWorkspace = false,
  activePath?: string
): ToolCall[] {
  const requestedCalls = promptToToolCalls(prompt, activePath).map((call) =>
    browserOnlyWorkspace && call.name === 'workspace.saveAll'
      ? { name: 'workspace.saveCheckpoint', arguments: call.arguments }
      : call
  );
  const mutationCalls = requestedCalls.filter((call) =>
    localMutationToolNames.has(call.name)
  );
  if (!mutationCalls.length) return requestedCalls;

  const preflightCalls: ToolCall[] = [
    { name: 'workspace.getStatus', arguments: {} },
  ];
  const fileCall = mutationCalls.find((call) =>
    localFileListingToolNames.has(call.name)
  );
  const path =
    typeof fileCall?.arguments.path === 'string'
      ? fileCall.arguments.path
      : fileCall?.name === 'workspace.renameFile' &&
          typeof fileCall.arguments.fromPath === 'string'
        ? fileCall.arguments.fromPath
        : undefined;
  if (typeof path === 'string' && path.trim()) {
    preflightCalls.push({ name: 'workspace.listFiles', arguments: {} });
    if (fileCall && localTextInspectionToolNames.has(fileCall.name)) {
      preflightCalls.push({
        name: 'workspace.readFile',
        arguments: { path },
      });
    }
  }
  return [...preflightCalls, ...requestedCalls];
}

export function readResultRevision(
  result: { structuredContent?: unknown },
  fallback: number
): number {
  const structured = result.structuredContent;
  if (
    !structured ||
    typeof structured !== 'object' ||
    Array.isArray(structured) ||
    typeof (structured as { revision?: unknown }).revision !== 'number'
  ) {
    return fallback;
  }
  return (structured as { revision: number }).revision;
}
