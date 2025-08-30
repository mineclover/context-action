import { useStoreValue } from '@context-action/react';
import { useSourceLinkRegistry } from '../../stores/SourceLinkRegistry';
import { GITHUB_CONFIG } from '../../constants/github';
import { cn } from '../../lib/utils';

interface SourceLinkProps {
  id?: string;                  // 등록된 ID로 링크
  filePath?: string;           // 직접 파일 경로 지정
  variant?: 'button' | 'text' | 'icon' | 'badge';
  showDescription?: boolean;
  className?: string;
}

export function SourceLink({ 
  id, 
  filePath, 
  variant = 'button',
  showDescription = false,
  className 
}: SourceLinkProps) {
  const entriesStore = useSourceLinkRegistry('entries');
  const entries = useStoreValue(entriesStore);
  
  // ID로 등록된 항목 찾기
  const entry = id ? entries[id] : null;
  
  // 직접 경로 또는 등록된 항목 사용
  const sourceUrl = entry 
    ? entry.githubPath 
    : filePath 
    ? GITHUB_CONFIG.getExampleUrl(filePath)
    : null;
    
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