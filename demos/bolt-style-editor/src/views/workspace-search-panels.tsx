import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { WorkspaceFile } from '../workspace';
import { useModalDialog } from './editor-dialogs';
import { FileIcon } from './file-icon';

export type WorkspaceSearchMatch = {
  path: string;
  line: number;
  preview: string;
};

function findWorkspaceMatches(
  files: readonly WorkspaceFile[],
  query: string
): WorkspaceSearchMatch[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];

  const matches: WorkspaceSearchMatch[] = [];
  for (const file of files) {
    if (file.kind === 'asset') continue;
    for (const [index, sourceLine] of file.source.split('\n').entries()) {
      if (!sourceLine.toLocaleLowerCase().includes(normalizedQuery)) continue;
      matches.push({
        path: file.path,
        line: index + 1,
        preview: sourceLine.trim().slice(0, 120) || '(blank line)',
      });
      if (matches.length >= 80) return matches;
    }
  }
  return matches;
}

export function WorkspaceSearchPanel({
  files,
  onClose,
  onQueryChange,
  onSelect,
  query,
}: {
  files: readonly WorkspaceFile[];
  onClose: () => void;
  onQueryChange: (query: string) => void;
  onSelect: (match: WorkspaceSearchMatch) => void;
  query: string;
}) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const matches = useMemo(
    () => findWorkspaceMatches(files, query),
    [files, query]
  );

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex((current) =>
      Math.min(current, Math.max(matches.length - 1, 0))
    );
  }, [matches.length]);

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) =>
        matches.length ? (current + 1) % matches.length : 0
      );
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        matches.length ? (current - 1 + matches.length) % matches.length : 0
      );
      return;
    }
    if (event.key === 'Enter' && matches[activeIndex]) {
      event.preventDefault();
      onSelect(matches[activeIndex]);
    }
  };

  return (
    <section
      aria-label="Search workspace"
      className="workspace-search-panel"
      id="workspace-search-panel"
    >
      <div className="workspace-search-toolbar">
        <span className="workspace-search-icon" aria-hidden="true">
          ⌕
        </span>
        <input
          ref={searchInputRef}
          aria-label="Search workspace files"
          onChange={(event) => {
            setActiveIndex(0);
            onQueryChange(event.target.value);
          }}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search all workspace files…"
          type="search"
          value={query}
        />
        <span
          aria-live="polite"
          className="workspace-search-count"
          role="status"
        >
          {query.trim()
            ? `${matches.length}${matches.length === 80 ? '+' : ''}`
            : 'Type to search'}
        </span>
        <button
          aria-label="Close workspace search"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </div>
      {query.trim() ? (
        <div
          aria-label="Workspace search results"
          className="workspace-search-results"
          id="workspace-search-results"
        >
          {matches.length ? (
            matches.map((match, index) => (
              <button
                aria-current={index === activeIndex ? 'true' : undefined}
                className={`workspace-search-result ${index === activeIndex ? 'workspace-search-result-active' : ''}`}
                key={`${match.path}-${match.line}-${index}`}
                onClick={() => onSelect(match)}
                onMouseEnter={() => setActiveIndex(index)}
                type="button"
              >
                <span>
                  {match.path}:{match.line}
                </span>
                <code>{match.preview}</code>
              </button>
            ))
          ) : (
            <div className="workspace-search-empty">No matching lines</div>
          )}
        </div>
      ) : null}
    </section>
  );
}

export function QuickOpenPanel({
  files,
  onClose,
  onSelect,
}: {
  files: readonly WorkspaceFile[];
  onClose: () => void;
  onSelect: (path: string) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useModalDialog<HTMLElement>(onClose);
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return files
      .filter(
        (file) =>
          !normalizedQuery ||
          file.path.toLocaleLowerCase().includes(normalizedQuery)
      )
      .slice(0, 40);
  }, [files, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex((current) =>
      Math.min(current, Math.max(results.length - 1, 0))
    );
  }, [results.length]);

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length ? (current + 1) % results.length : 0
      );
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length ? (current - 1 + results.length) % results.length : 0
      );
      return;
    }
    if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      void onSelect(results[activeIndex].path);
    }
  };

  return (
    <div
      className="settings-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <section
        aria-labelledby="quick-open-title"
        aria-modal="true"
        className="settings-dialog quick-open-dialog"
        ref={dialogRef}
        role="dialog"
      >
        <div className="settings-heading">
          <div>
            <span className="panel-label">Workspace</span>
            <h2 id="quick-open-title">Quick open file</h2>
          </div>
          <button
            aria-label="Close quick open"
            className="settings-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <label className="settings-field">
          <span>File path</span>
          <input
            ref={inputRef}
            aria-label="Quick open workspace file"
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search workspace files…"
            type="search"
            value={query}
          />
        </label>
        <div aria-live="polite" className="quick-open-count" role="status">
          {results.length
            ? `${results.length}${results.length === 40 ? '+' : ''} file${results.length === 1 ? '' : 's'}`
            : 'No matching files'}
        </div>
        <div aria-label="Quick open results" className="quick-open-results">
          {results.length ? (
            results.map((file, index) => (
              <button
                aria-current={index === activeIndex ? 'true' : undefined}
                className={`quick-open-result ${index === activeIndex ? 'quick-open-result-active' : ''}`}
                key={file.path}
                onClick={() => void onSelect(file.path)}
                onMouseEnter={() => setActiveIndex(index)}
                type="button"
              >
                <FileIcon file={file} />
                <span>{file.path}</span>
                {file.kind === 'asset' ? <small>asset</small> : null}
              </button>
            ))
          ) : (
            <div className="quick-open-empty">Try a different file name.</div>
          )}
        </div>
        <p className="quick-open-hint">
          ↑↓ to navigate · Enter to open · Esc to close
        </p>
      </section>
    </div>
  );
}
