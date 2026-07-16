export const WEB_CODING_SYSTEM_PROMPT =
  'You are a realtime web coding assistant. Inspect the workspace before editing. Use web.setTheme, web.addFeature, web.updateHero, web.applyPatch, or web.writeFile to make the requested change. When read results include a workspace revision, pass it as expectedRevision for mutations. The user expects a visible HTML/CSS/JS preview update.';

export type LocalWebToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

function inferWebWorkspacePath(prompt: string): string {
  const explicitPath = prompt.match(
    /(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.(?:html?|css|m?js|json|md|txt)(?=\b|[^A-Za-z0-9_.-])/i
  )?.[0];
  if (explicitPath) return explicitPath;
  if (/\bstyle/i.test(prompt)) return 'style.css';
  if (/\bscript/i.test(prompt)) return 'script.js';
  return 'index.html';
}

function inferQuotedWebPatch(
  prompt: string
): { path: string; search: string; replace: string } | null {
  if (!/(replace|change|edit|update|바꾸|바꿔|변경|수정|교체)/i.test(prompt)) {
    return null;
  }
  const quotedValues = Array.from(
    prompt.matchAll(/["“]([^"”]+)["”]/g),
    (match) => match[1]?.trim()
  ).filter((value): value is string => Boolean(value));
  if (quotedValues.length < 2) return null;
  const [search, replace] = quotedValues;
  if (!search || !replace) return null;
  return {
    path: inferWebWorkspacePath(prompt),
    search,
    replace,
  };
}

export function planLocalWebToolCalls(prompt: string): LocalWebToolCall[] {
  const normalized = prompt.toLowerCase();
  const calls: LocalWebToolCall[] = [];
  const textPatch = inferQuotedWebPatch(prompt);

  if (textPatch) {
    calls.push({
      name: 'web.applyPatch',
      arguments: { ...textPatch, occurrence: 'first' },
    });
  }

  if (/(보라|purple|violet)/i.test(normalized)) {
    calls.push({ name: 'web.setTheme', arguments: { theme: 'violet' } });
  } else if (/(초록|green|emerald|mint)/i.test(normalized)) {
    calls.push({ name: 'web.setTheme', arguments: { theme: 'emerald' } });
  } else if (/(주황|amber|orange)/i.test(normalized)) {
    calls.push({ name: 'web.setTheme', arguments: { theme: 'amber' } });
  } else if (/(분홍|rose|pink)/i.test(normalized)) {
    calls.push({ name: 'web.setTheme', arguments: { theme: 'rose' } });
  }

  if (/(기능|feature|카드|추가)/i.test(normalized)) {
    calls.push({
      name: 'web.addFeature',
      arguments: {
        title: 'AI generated feature',
        description: 'A new card was added through a controlled web tool call.',
      },
    });
  }

  if (/(제목|hero|랜딩|landing)/i.test(normalized)) {
    calls.push({
      name: 'web.updateHero',
      arguments: {
        title: 'A live page shaped by conversation.',
        subtitle:
          'The chat selected tools, the workspace changed, and the iframe acknowledged the revision.',
      },
    });
  }

  return calls.length > 0
    ? calls
    : [{ name: 'web.getWorkspace', arguments: {} }];
}
