import type { WorkspaceFile } from '../workspace';

export function FileIcon({ file }: { file: WorkspaceFile }) {
  const color =
    file.language === 'html'
      ? 'orange'
      : file.language === 'css'
        ? 'blue'
        : file.language === 'javascript'
          ? 'yellow'
          : 'gray';
  return <span className={`file-icon file-icon-${color}`} aria-hidden="true" />;
}
