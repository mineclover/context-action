import React from 'react';
import { useSmartSourceLinks } from '../../hooks/useAutoSourceDetection';
import { PageLayout, type PageLayoutProps } from './PageLayout';

interface SmartPageLayoutProps extends Omit<PageLayoutProps, 'sourceConfig'> {
  /**
   * 소스 링크 설정 - 'auto'로 설정시 자동 감지
   */
  sourceConfig?: PageLayoutProps['sourceConfig'] | 'auto' | false;
}

/**
 * 자동 소스 감지 기능이 포함된 PageLayout
 * URL 패턴을 기반으로 관련 소스 파일들을 자동으로 추정하고 표시
 */
export function SmartPageLayout({
  sourceConfig = 'auto',
  ...props
}: SmartPageLayoutProps) {
  const autoDetected = useSmartSourceLinks();

  // sourceConfig 결정
  const resolvedSourceConfig = React.useMemo(() => {
    if (sourceConfig === false) {
      return { hideSource: true };
    }

    if (sourceConfig === 'auto') {
      return autoDetected
        ? {
            filePaths: autoDetected.filePaths,
            variant: 'standard' as const,
          }
        : { hideSource: true };
    }

    return sourceConfig;
  }, [sourceConfig, autoDetected]);

  return <PageLayout {...props} sourceConfig={resolvedSourceConfig} />;
}

/**
 * 개발 모드에서 자동 감지 결과를 확인할 수 있는 디버그 컴포넌트
 */
export function AutoDetectionDebug() {
  const autoDetected = useSmartSourceLinks();

  if (!autoDetected || process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg font-mono max-w-xs">
      <div className="font-bold mb-2">🔍 Auto-detected sources:</div>
      <div className="space-y-1">
        <div>Category: {autoDetected.category}</div>
        <div>Files: {autoDetected.filePaths.length}</div>
        {autoDetected.filePaths.map((path, i) => (
          <div key={i} className="text-gray-300 truncate">
            {i + 1}. {path}
          </div>
        ))}
      </div>
    </div>
  );
}
