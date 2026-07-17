import {
  type KeyboardEvent,
  type UIEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MAX_TEXT_SOURCE_LENGTH, type WorkspaceFile } from '../workspace';

export type WorkspaceSearchFocusRequest = {
  path: string;
  requestId: number;
  line: number;
};

type SyntaxToken = {
  className?: string;
  value: string;
};

type SyntaxLineResult = {
  tokens: SyntaxToken[];
  blockCommentOpen: boolean;
};

function pushPlainToken(tokens: SyntaxToken[], value: string) {
  if (value) tokens.push({ value });
}

function tokenizeHtmlTag(tag: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let tagNameSeen = false;
  let cursor = 0;
  const parts = /(<\/?|\/?>|[A-Za-z][\w:-]*|=|"[^"\n]*"|'[^'\n]*')/g;
  let match = parts.exec(tag);

  while (match) {
    pushPlainToken(tokens, tag.slice(cursor, match.index));
    const value = match[0];
    const className =
      value.startsWith('"') || value.startsWith("'")
        ? 'syntax-string'
        : value.startsWith('<') || value.endsWith('>')
          ? 'syntax-tag'
          : !tagNameSeen && value !== '=' && !value.startsWith('/')
            ? 'syntax-tag'
            : value === '='
              ? undefined
              : 'syntax-attribute';
    if (className === 'syntax-tag' && /^[A-Za-z]/.test(value)) {
      tagNameSeen = true;
    }
    tokens.push({ className, value });
    cursor = match.index + value.length;
    match = parts.exec(tag);
  }
  pushPlainToken(tokens, tag.slice(cursor));
  return tokens;
}

function highlightHtmlLine(
  line: string,
  blockCommentOpen = false
): SyntaxLineResult {
  const tokens: SyntaxToken[] = [];
  let cursor = 0;
  const parts = /<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>/g;
  while (cursor < line.length) {
    if (blockCommentOpen) {
      const commentEnd = line.indexOf('-->', cursor);
      if (commentEnd < 0) {
        tokens.push({
          className: 'syntax-comment',
          value: line.slice(cursor),
        });
        return { tokens, blockCommentOpen: true };
      }
      tokens.push({
        className: 'syntax-comment',
        value: line.slice(cursor, commentEnd + 3),
      });
      cursor = commentEnd + 3;
      blockCommentOpen = false;
      continue;
    }

    const commentStart = line.indexOf('<!--', cursor);
    parts.lastIndex = cursor;
    const match = parts.exec(line);
    if (commentStart >= 0 && (!match || commentStart < match.index)) {
      pushPlainToken(tokens, line.slice(cursor, commentStart));
      const commentEnd = line.indexOf('-->', commentStart + 4);
      if (commentEnd < 0) {
        tokens.push({
          className: 'syntax-comment',
          value: line.slice(commentStart),
        });
        return { tokens, blockCommentOpen: true };
      }
      tokens.push({
        className: 'syntax-comment',
        value: line.slice(commentStart, commentEnd + 3),
      });
      cursor = commentEnd + 3;
      continue;
    }
    if (!match) {
      pushPlainToken(tokens, line.slice(cursor));
      break;
    }
    pushPlainToken(tokens, line.slice(cursor, match.index));
    if (match[0].startsWith('<!--')) {
      tokens.push({ className: 'syntax-comment', value: match[0] });
    } else {
      tokens.push(...tokenizeHtmlTag(match[0]));
    }
    cursor = match.index + match[0].length;
  }
  return { tokens, blockCommentOpen };
}

function highlightScriptLine(
  line: string,
  language: WorkspaceFile['language'],
  blockCommentOpen = false
): SyntaxLineResult {
  const tokens: SyntaxToken[] = [];
  const isCss = language === 'css';
  let cursor = 0;
  const parts = isCss
    ? /(\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:important|from|to|and|or|not)\b|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*(?=\())/g
    : /(\/\*[\s\S]*?\*\/|\/\/.*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|if|else|for|while|new|true|false|null|undefined|async|await|class|this|import|export|interface|type|enum|public|private|protected|readonly|implements|extends|as|unknown|never|void|any|string|number|boolean)\b|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*(?=\())/g;
  const keywordPattern = isCss
    ? /^(important|from|to|and|or|not)$/
    : /^(const|let|var|function|return|if|else|for|while|new|true|false|null|undefined|async|await|class|this|import|export|interface|type|enum|public|private|protected|readonly|implements|extends|as|unknown|never|void|any|string|number|boolean)$/;
  while (cursor < line.length) {
    if (blockCommentOpen) {
      const commentEnd = line.indexOf('*/', cursor);
      if (commentEnd < 0) {
        tokens.push({
          className: 'syntax-comment',
          value: line.slice(cursor),
        });
        return { tokens, blockCommentOpen: true };
      }
      tokens.push({
        className: 'syntax-comment',
        value: line.slice(cursor, commentEnd + 2),
      });
      cursor = commentEnd + 2;
      blockCommentOpen = false;
      continue;
    }

    const commentStart = line.indexOf('/*', cursor);
    parts.lastIndex = cursor;
    const match = parts.exec(line);
    if (commentStart >= 0 && (!match || commentStart < match.index)) {
      pushPlainToken(tokens, line.slice(cursor, commentStart));
      const commentEnd = line.indexOf('*/', commentStart + 2);
      if (commentEnd < 0) {
        tokens.push({
          className: 'syntax-comment',
          value: line.slice(commentStart),
        });
        return { tokens, blockCommentOpen: true };
      }
      tokens.push({
        className: 'syntax-comment',
        value: line.slice(commentStart, commentEnd + 2),
      });
      cursor = commentEnd + 2;
      continue;
    }
    if (!match) {
      pushPlainToken(tokens, line.slice(cursor));
      break;
    }

    pushPlainToken(tokens, line.slice(cursor, match.index));
    const value = match[0];
    const className =
      value.startsWith('/*') || value.startsWith('//')
        ? 'syntax-comment'
        : value.startsWith('"') ||
            value.startsWith("'") ||
            value.startsWith('`')
          ? 'syntax-string'
          : /^\d/.test(value)
            ? 'syntax-number'
            : keywordPattern.test(value)
              ? 'syntax-keyword'
              : 'syntax-function';
    tokens.push({ className, value });
    cursor = match.index + value.length;
  }
  return { tokens, blockCommentOpen };
}

function highlightJsonLine(line: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let cursor = 0;
  const parts =
    /"(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false|null)\b/g;
  let match = parts.exec(line);

  while (match) {
    pushPlainToken(tokens, line.slice(cursor, match.index));
    const value = match[0];
    const isKey =
      value.startsWith('"') &&
      /^\s*:/.test(line.slice(match.index + value.length));
    tokens.push({
      className: isKey
        ? 'syntax-attribute'
        : value.startsWith('"')
          ? 'syntax-string'
          : /^(true|false|null)$/.test(value)
            ? 'syntax-keyword'
            : 'syntax-number',
      value,
    });
    cursor = match.index + value.length;
    match = parts.exec(line);
  }
  pushPlainToken(tokens, line.slice(cursor));
  return tokens;
}

function highlightMarkdownLine(line: string): SyntaxToken[] {
  if (/^\s*#{1,6}\s/.test(line)) {
    return [{ className: 'syntax-keyword', value: line }];
  }

  const tokens: SyntaxToken[] = [];
  let cursor = 0;
  const parts = /`[^`]*`|\[[^\]]+\]\([^)]*\)|\*\*[^*]+\*\*|^\s*[-*+]\s+/g;
  let match = parts.exec(line);

  while (match) {
    pushPlainToken(tokens, line.slice(cursor, match.index));
    const value = match[0];
    tokens.push({
      className: value.startsWith('`')
        ? 'syntax-string'
        : value.startsWith('[')
          ? 'syntax-attribute'
          : 'syntax-keyword',
      value,
    });
    cursor = match.index + value.length;
    match = parts.exec(line);
  }
  pushPlainToken(tokens, line.slice(cursor));
  return tokens;
}

function highlightSourceLine(
  line: string,
  language: WorkspaceFile['language'],
  blockCommentOpen: boolean
): SyntaxLineResult {
  if (language === 'html') return highlightHtmlLine(line, blockCommentOpen);
  if (
    language === 'css' ||
    language === 'javascript' ||
    language === 'typescript'
  ) {
    return highlightScriptLine(line, language, blockCommentOpen);
  }
  if (language === 'json') {
    return { tokens: highlightJsonLine(line), blockCommentOpen: false };
  }
  if (language === 'markdown') {
    return { tokens: highlightMarkdownLine(line), blockCommentOpen: false };
  }
  return { tokens: [{ value: line }], blockCommentOpen: false };
}

function highlightSourceLines(
  source: string,
  language: WorkspaceFile['language']
): SyntaxToken[][] {
  let blockCommentOpen = false;
  return source.split('\n').map((line) => {
    const result = highlightSourceLine(line, language, blockCommentOpen);
    blockCommentOpen = result.blockCommentOpen;
    return result.tokens;
  });
}

function getCursorPosition(source: string, offset: number) {
  const safeOffset = Math.max(0, Math.min(offset, source.length));
  const beforeCursor = source.slice(0, safeOffset);
  const lines = beforeCursor.split('\n');
  return {
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
  };
}

function findTextMatches(source: string, query: string): number[] {
  const normalizedQuery = query.toLocaleLowerCase();
  if (!normalizedQuery) return [];

  const normalizedSource = source.toLocaleLowerCase();
  const matches: number[] = [];
  let cursor = 0;
  while (cursor <= normalizedSource.length - normalizedQuery.length) {
    const index = normalizedSource.indexOf(normalizedQuery, cursor);
    if (index < 0) break;
    matches.push(index);
    cursor = index + Math.max(normalizedQuery.length, 1);
  }
  return matches;
}

export function CodeEditor({
  file,
  source,
  disabled = false,
  focusRequest,
  onFocusRequestConsumed,
  onOpenWorkspaceSearch,
  onBlur,
  onChange,
}: {
  file: WorkspaceFile;
  source: string;
  disabled?: boolean;
  focusRequest?: WorkspaceSearchFocusRequest;
  onFocusRequestConsumed?: () => void;
  onOpenWorkspaceSearch?: () => void;
  onBlur?: () => void;
  onChange: (source: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findIndex, setFindIndex] = useState(0);
  const [cursorOffset, setCursorOffset] = useState(0);
  const highlightedSource = useMemo(() => {
    return highlightSourceLines(source, file.language);
  }, [file.language, source]);

  useEffect(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    if (!textarea || !highlight) return;
    textarea.scrollTop = 0;
    textarea.scrollLeft = 0;
    highlight.scrollTop = 0;
    highlight.scrollLeft = 0;
    textarea.setSelectionRange(0, 0);
    setCursorOffset(0);
    setFindOpen(false);
    setFindQuery('');
  }, [file.path]);

  useEffect(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    if (!textarea || !highlight || !focusRequest) return;

    const lines = source.split('\n');
    const lineIndex = Math.max(
      0,
      Math.min(focusRequest.line - 1, lines.length - 1)
    );
    const lineStart = lines
      .slice(0, lineIndex)
      .reduce((offset, line) => offset + line.length + 1, 0);
    const lineEnd = lineStart + (lines[lineIndex]?.length ?? 0);
    textarea.focus();
    textarea.setSelectionRange(lineStart, lineEnd);
    setCursorOffset(lineStart);
    const lineHeight = Number.parseFloat(
      window.getComputedStyle(textarea).lineHeight
    );
    textarea.scrollTop = Math.max(
      0,
      lineIndex * (Number.isFinite(lineHeight) ? lineHeight : 19) - 38
    );
    highlight.scrollTop = textarea.scrollTop;
    onFocusRequestConsumed?.();
  }, [file.path, focusRequest?.requestId]);

  const matches = useMemo(
    () => findTextMatches(source, findQuery),
    [source, findQuery]
  );
  const cursorPosition = getCursorPosition(source, cursorOffset);
  const sourceLengthLabel = `${source.length.toLocaleString('en-US')} / ${MAX_TEXT_SOURCE_LENGTH.toLocaleString('en-US')} chars`;
  const sourceExceedsLimit = source.length > MAX_TEXT_SOURCE_LENGTH;

  const updateCursor = (textarea: HTMLTextAreaElement) => {
    setCursorOffset(textarea.selectionStart);
  };

  const selectMatch = (requestedIndex: number) => {
    if (!matches.length) return;
    const nextIndex = (requestedIndex + matches.length) % matches.length;
    const start = matches[nextIndex];
    const end = start + findQuery.length;
    setFindIndex(nextIndex);
    textareaRef.current?.focus();
    textareaRef.current?.setSelectionRange(start, end);
    if (textareaRef.current) updateCursor(textareaRef.current);
  };

  const openFind = () => {
    const textarea = textareaRef.current;
    const selectedText = textarea
      ? textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)
      : '';
    setFindQuery(selectedText.length <= 80 ? selectedText : '');
    setFindIndex(0);
    setFindOpen(true);
    window.requestAnimationFrame(() => findInputRef.current?.focus());
  };

  const closeFind = () => {
    setFindOpen(false);
    textareaRef.current?.focus();
  };

  const syncScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    const highlight = highlightRef.current;
    if (!highlight) return;
    highlight.scrollTop = textarea.scrollTop;
    highlight.scrollLeft = textarea.scrollLeft;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const modifierKey = event.metaKey || event.ctrlKey;
    if (
      modifierKey &&
      event.shiftKey &&
      event.key.toLowerCase() === 'f' &&
      onOpenWorkspaceSearch
    ) {
      event.preventDefault();
      onOpenWorkspaceSearch();
      return;
    }
    if (modifierKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      openFind();
      return;
    }
    if (modifierKey && event.key.toLowerCase() === 'g' && findOpen) {
      event.preventDefault();
      selectMatch(findIndex + (event.shiftKey ? -1 : 1));
      return;
    }
    if (event.key === 'Escape' && findOpen) {
      event.preventDefault();
      closeFind();
      return;
    }
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextSource = `${source.slice(0, start)}  ${source.slice(end)}`;
    onChange(nextSource);
    setCursorOffset(start + 2);
    window.requestAnimationFrame(() => {
      textareaRef.current?.setSelectionRange(start + 2, start + 2);
    });
  };

  return (
    <>
      <div className="code-header">
        <span>{file.language}</span>
        <span>
          Ln {cursorPosition.line}, Col {cursorPosition.column} ·{' '}
          {source.split('\n').length} lines ·{' '}
          <span
            aria-label={
              sourceExceedsLimit
                ? `${sourceLengthLabel}; save limit exceeded`
                : sourceLengthLabel
            }
            className={`code-source-length ${sourceExceedsLimit ? 'code-source-length-warning' : ''}`}
            title={
              sourceExceedsLimit
                ? 'Reduce this source below the workspace mutation limit before saving.'
                : 'Workspace text mutation limit'
            }
          >
            {sourceLengthLabel}
          </span>
        </span>
      </div>
      <div className="code-scroll">
        <pre ref={highlightRef} aria-hidden="true" className="code-highlight">
          {highlightedSource.map((line, index) => (
            <span className="code-line" key={`${file.path}-highlight-${index}`}>
              <span className="line-number">
                {String(index + 1).padStart(2, '0')}
              </span>
              <code>
                {line.length > 0
                  ? line.map((token, tokenIndex) => (
                      <span
                        className={token.className}
                        key={`${file.path}-${index}-${tokenIndex}`}
                      >
                        {token.value}
                      </span>
                    ))
                  : ' '}
              </code>
            </span>
          ))}
        </pre>
        <textarea
          ref={textareaRef}
          aria-label={`Edit ${file.path}`}
          aria-keyshortcuts="Control+F Meta+F Control+G Meta+G Control+Shift+F Meta+Shift+F"
          className="code-input"
          disabled={disabled}
          onChange={(event) => {
            updateCursor(event.currentTarget);
            onChange(event.target.value);
          }}
          onClick={(event) => updateCursor(event.currentTarget)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          onKeyUp={(event) => updateCursor(event.currentTarget)}
          onSelect={(event) => updateCursor(event.currentTarget)}
          onScroll={syncScroll}
          spellCheck={false}
          value={source}
          wrap="off"
        />
        {findOpen ? (
          <div className="code-find-bar" role="search">
            <span className="code-find-icon" aria-hidden="true">
              /
            </span>
            <input
              ref={findInputRef}
              aria-label="Find in file"
              onChange={(event) => {
                setFindQuery(event.target.value);
                setFindIndex(0);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  selectMatch(findIndex + (event.shiftKey ? -1 : 1));
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  closeFind();
                }
              }}
              placeholder="Find"
              value={findQuery}
            />
            <span className="code-find-count">
              {findQuery
                ? `${matches.length ? findIndex + 1 : 0}/${matches.length}`
                : 'Find'}
            </span>
            <button
              aria-label="Find previous"
              disabled={!matches.length}
              onClick={() => selectMatch(findIndex - 1)}
              type="button"
            >
              ↑
            </button>
            <button
              aria-label="Find next"
              disabled={!matches.length}
              onClick={() => selectMatch(findIndex + 1)}
              type="button"
            >
              ↓
            </button>
            <button aria-label="Close find" onClick={closeFind} type="button">
              ×
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
