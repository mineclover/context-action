import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  buildFileTree,
  collectDirectoryPaths,
  type FileTreeEntry,
} from '../file-tree';
import type { WorkspaceFile } from '../workspace';
import { FileIcon } from './file-icon';

function FileTreeEntryView({
  entry,
  depth,
  expandedPaths,
  activePath,
  dirtyPaths,
  disabled,
  focusedPath,
  onFocusItem,
  onItemKeyDown,
  registerItem,
  onToggle,
  onSelect,
}: {
  entry: FileTreeEntry;
  depth: number;
  expandedPaths: ReadonlySet<string>;
  activePath: string;
  dirtyPaths: ReadonlySet<string>;
  disabled: boolean;
  focusedPath: string;
  onFocusItem: (path: string) => void;
  onItemKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    entry: FileTreeEntry
  ) => void;
  registerItem: (path: string, element: HTMLButtonElement | null) => void;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
}) {
  const indentation = { paddingLeft: `${12 + depth * 15}px` };

  if (entry.kind === 'directory') {
    const expanded = expandedPaths.has(entry.path);
    return (
      <div key={entry.path}>
        <button
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${entry.path}`}
          className="directory-row"
          disabled={disabled}
          aria-level={depth + 1}
          onFocus={() => onFocusItem(entry.path)}
          onKeyDown={(event) => onItemKeyDown(event, entry)}
          onClick={() => onToggle(entry.path)}
          ref={(element) => registerItem(entry.path, element)}
          style={indentation}
          tabIndex={focusedPath === entry.path ? 0 : -1}
          type="button"
          role="treeitem"
        >
          <span className="directory-chevron" aria-hidden="true">
            {expanded ? '⌄' : '›'}
          </span>
          <span className="directory-icon" aria-hidden="true">
            ▱
          </span>
          <span>{entry.name}</span>
        </button>
        {expanded ? (
          <div role="group">
            {entry.children.map((child) => (
              <FileTreeEntryView
                activePath={activePath}
                depth={depth + 1}
                disabled={disabled}
                dirtyPaths={dirtyPaths}
                entry={child}
                expandedPaths={expandedPaths}
                focusedPath={focusedPath}
                key={child.path}
                onFocusItem={onFocusItem}
                onItemKeyDown={onItemKeyDown}
                onSelect={onSelect}
                onToggle={onToggle}
                registerItem={registerItem}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <button
      className={`file-row ${entry.path === activePath ? 'file-row-active' : ''} ${dirtyPaths.has(entry.path) ? 'file-row-dirty' : ''}`}
      disabled={disabled}
      aria-current={entry.path === activePath ? 'page' : undefined}
      aria-label={`Open ${entry.path}`}
      aria-level={depth + 1}
      aria-selected={entry.path === activePath}
      onFocus={() => onFocusItem(entry.path)}
      onKeyDown={(event) => onItemKeyDown(event, entry)}
      onClick={() => onSelect(entry.path)}
      ref={(element) => registerItem(entry.path, element)}
      style={indentation}
      tabIndex={focusedPath === entry.path ? 0 : -1}
      title={entry.path}
      type="button"
      role="treeitem"
    >
      <FileIcon file={entry.file} />
      <span>{entry.name}</span>
      {dirtyPaths.has(entry.path) ? (
        <span
          aria-label="Unsaved changes"
          className="file-dirty-dot"
          title="Unsaved changes"
        >
          •
        </span>
      ) : null}
    </button>
  );
}

export function WorkspaceFileTree({
  files,
  activePath,
  dirtyPaths,
  disabled,
  onSelect,
}: {
  files: readonly WorkspaceFile[];
  activePath: string;
  dirtyPaths: ReadonlySet<string>;
  disabled: boolean;
  onSelect: (path: string) => void;
}) {
  const entries = useMemo(() => buildFileTree(files), [files]);
  const directoryPaths = collectDirectoryPaths(entries);
  const directorySignature = directoryPaths.join('\u0000');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(directoryPaths)
  );
  const [focusedPath, setFocusedPath] = useState(activePath);
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    setExpandedPaths(new Set(directoryPaths));
  }, [directorySignature]);

  useEffect(() => {
    setFocusedPath(activePath);
  }, [activePath]);

  const visibleEntries = useMemo(() => {
    const result: Array<{ entry: FileTreeEntry; depth: number }> = [];
    const visit = (items: readonly FileTreeEntry[], depth: number) => {
      for (const entry of items) {
        result.push({ entry, depth });
        if (entry.kind === 'directory' && expandedPaths.has(entry.path)) {
          visit(entry.children, depth + 1);
        }
      }
    };
    visit(entries, 0);
    return result;
  }, [entries, expandedPaths]);

  const focusPath = (path: string) => {
    if (!visibleEntries.some(({ entry }) => entry.path === path)) return;
    setFocusedPath(path);
    window.requestAnimationFrame(() => itemRefs.current.get(path)?.focus());
  };

  const toggleDirectory = (path: string) => {
    setExpandedPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleItemKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    entry: FileTreeEntry
  ) => {
    const currentIndex = visibleEntries.findIndex(
      ({ entry: currentEntry }) => currentEntry.path === entry.path
    );
    if (currentIndex < 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next =
        visibleEntries[Math.min(currentIndex + 1, visibleEntries.length - 1)];
      if (next) focusPath(next.entry.path);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const previous = visibleEntries[Math.max(currentIndex - 1, 0)];
      if (previous) focusPath(previous.entry.path);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      const first = visibleEntries[0];
      if (first) focusPath(first.entry.path);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      const last = visibleEntries.at(-1);
      if (last) focusPath(last.entry.path);
      return;
    }
    if (event.key === 'ArrowRight' && entry.kind === 'directory') {
      event.preventDefault();
      if (!expandedPaths.has(entry.path)) {
        toggleDirectory(entry.path);
        const firstChild = entry.children[0];
        if (firstChild) {
          setFocusedPath(firstChild.path);
          window.requestAnimationFrame(() =>
            itemRefs.current.get(firstChild.path)?.focus()
          );
        }
      } else {
        const child = visibleEntries[currentIndex + 1];
        if (child && child.depth > (visibleEntries[currentIndex]?.depth ?? 0)) {
          focusPath(child.entry.path);
        }
      }
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (entry.kind === 'directory' && expandedPaths.has(entry.path)) {
        toggleDirectory(entry.path);
        return;
      }
      const parentPath = entry.path.split('/').slice(0, -1).join('/');
      if (parentPath) focusPath(parentPath);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (entry.kind === 'directory') toggleDirectory(entry.path);
      else onSelect(entry.path);
    }
  };

  const registerItem = useCallback(
    (path: string, element: HTMLButtonElement | null) => {
      if (element) itemRefs.current.set(path, element);
      else itemRefs.current.delete(path);
    },
    []
  );

  return (
    <div aria-label="Workspace files" className="file-tree" role="tree">
      {entries.map((entry) => (
        <FileTreeEntryView
          activePath={activePath}
          depth={0}
          disabled={disabled}
          dirtyPaths={dirtyPaths}
          entry={entry}
          expandedPaths={expandedPaths}
          focusedPath={focusedPath}
          key={entry.path}
          onFocusItem={setFocusedPath}
          onItemKeyDown={handleItemKeyDown}
          onSelect={onSelect}
          onToggle={toggleDirectory}
          registerItem={registerItem}
        />
      ))}
    </div>
  );
}
