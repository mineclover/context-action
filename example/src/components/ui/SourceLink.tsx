import { useStoreValue } from '@context-action/react';
import { GITHUB_CONFIG } from '../../constants/github';
import { cn } from '../../lib/utils';
import { useSourceLinkRegistry } from '../../stores/SourceLinkRegistry';

interface SourceLinkProps {
  filePath: string; // 파일 경로로 직접 접근
  variant?: 'button' | 'text' | 'icon' | 'badge';
  showDescription?: boolean;
  className?: string;
}

export function SourceLink({
  filePath,
  variant = 'button',
  showDescription = false,
  className,
}: SourceLinkProps) {
  const entriesStore = useSourceLinkRegistry('entries');
  const entries = useStoreValue(entriesStore);

  // filePath로 등록된 항목 찾기
  const entry = entries[filePath];

  // 등록된 항목이나 직접 경로 사용
  const sourceUrl = entry?.githubPath || GITHUB_CONFIG.getExampleUrl(filePath);

  const displayName = entry?.name || 'View Source';
  const description = entry?.description;

  if (!sourceUrl) return null;

  // variant별 렌더링
  if (variant === 'badge') {
    return (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 text-xs',
          'bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full',
          'transition-colors duration-200',
          className
        )}
      >
        📝 {entry ? entry.name : 'Source'}
      </a>
    );
  }

  if (variant === 'icon') {
    return (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600',
          'transition-colors duration-200',
          className
        )}
      >
        📝 Source
      </a>
    );
  }

  if (variant === 'text') {
    return (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'text-sm text-blue-600 hover:text-blue-800 underline',
          'transition-colors duration-200',
          className
        )}
      >
        {displayName}
      </a>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center gap-2 px-3 py-2',
          'bg-gray-100 hover:bg-blue-50 border border-gray-200',
          'hover:border-blue-300 rounded-md transition-all duration-200',
          'text-gray-700 hover:text-blue-700 text-sm font-medium'
        )}
      >
        📝 {displayName}
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
        </svg>
      </a>

      {showDescription && description && (
        <p className="text-xs text-gray-500 pl-3">{description}</p>
      )}
    </div>
  );
}
