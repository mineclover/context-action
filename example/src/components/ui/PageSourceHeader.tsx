import { useStoreValue } from '@context-action/react';
import { useSourceLinkRegistry } from '../../stores/SourceLinkRegistry';
import { GITHUB_CONFIG } from '../../constants/github';
import { cn } from '../../lib/utils';

interface PageSourceHeaderProps {
  /** 페이지의 소스링크 등록 ID */
  sourceId?: string;
  /** 직접 파일 경로들 지정 (등록 없이 사용시) */
  filePaths?: string[];
  /** 헤더 스타일 */
  variant?: 'minimal' | 'standard' | 'detailed';
  /** 추가 클래스명 */
  className?: string;
}

export function PageSourceHeader({ 
  sourceId, 
  filePaths = [],
  variant = 'standard',
  className 
}: PageSourceHeaderProps) {
  const entriesStore = useSourceLinkRegistry('entries');
  const entries = useStoreValue(entriesStore);
  
  // 등록된 소스 정보 가져오기
  const registeredSource = sourceId ? entries[sourceId] : null;
  
  // 표시할 링크들 결정
  const sourceLinks = registeredSource 
    ? [{ name: registeredSource.name, url: registeredSource.githubPath, isMain: true }]
    : filePaths.map(path => ({ 
        name: path.split('/').pop()?.replace('.tsx', '').replace('.ts', '') || 'Source',
        url: GITHUB_CONFIG.getExampleUrl(path),
        isMain: filePaths.length === 1
      }));

  if (sourceLinks.length === 0) return null;

  // Minimal variant - 작은 아이콘 링크
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {sourceLinks.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
            title={`View ${link.name} source on GitHub`}
          >
            📝 {link.isMain ? 'Source' : link.name}
          </a>
        ))}
      </div>
    );
  }

  // Detailed variant - 풍부한 정보와 함께
  if (variant === 'detailed') {
    return (
      <div className={cn('bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4 mb-6', className)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📝</span>
              <h3 className="text-sm font-medium text-gray-700">Implementation Files</h3>
            </div>
            
            {registeredSource?.description && (
              <p className="text-xs text-gray-600 mb-3">{registeredSource.description}</p>
            )}
            
            <div className="flex flex-wrap gap-2">
              {sourceLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-md text-xs font-medium text-gray-700 hover:text-blue-700 transition-all"
                >
                  <span className="font-mono text-xs text-gray-500">{link.name}</span>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  </svg>
                </a>
              ))}
            </div>

            {registeredSource?.tags && registeredSource.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {registeredSource.tags.map(tag => (
                  <span key={tag} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Standard variant - 기본 헤더 스타일
  return (
    <div className={cn('flex items-center justify-end gap-2 mb-4', className)}>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>📝</span>
        <span>View source:</span>
      </div>
      <div className="flex gap-1">
        {sourceLinks.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-all',
              link.isMain 
                ? 'bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            )}
          >
            {link.name}
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}