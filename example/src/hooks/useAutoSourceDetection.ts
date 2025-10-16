import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

interface AutoDetectedSource {
  mainFile: string;
  relatedFiles: string[];
  category: string;
  estimatedPath: string;
}

/**
 * 현재 라우트 기반으로 소스 파일들을 자동 추정하는 Hook
 * URL 패턴을 분석해서 관련 소스 파일들을 추천
 */
export function useAutoSourceDetection(): AutoDetectedSource | null {
  const location = useLocation();

  return useMemo(() => {
    const pathname = location.pathname;

    // URL 패턴 분석
    const pathSegments = pathname.split('/').filter(Boolean);

    if (pathSegments.length === 0) return null;

    // 카테고리별 패턴 매칭
    const patterns: Array<{
      pattern: RegExp;
      mainFile: (matches: RegExpMatchArray) => string;
      relatedFiles: (matches: RegExpMatchArray) => string[];
      category: string;
    }> = [
      // Core patterns
      {
        pattern: /^\/core\/(.*)/,
        mainFile: (matches) =>
          `pages/foundations/core/${matches[1] ? matches[1].charAt(0).toUpperCase() + matches[1].slice(1) : 'Default'}Page.tsx`,
        relatedFiles: () => ['components/core/', 'hooks/use*.ts'],
        category: 'core',
      },

      // Store patterns
      {
        pattern: /^\/store\/(.*)/,
        mainFile: (matches) =>
          `pages/foundations/store/${matches[1] ? matches[1].charAt(0).toUpperCase() + matches[1].slice(1) : 'Default'}Page.tsx`,
        relatedFiles: () => ['stores/', 'hooks/use*Store*.ts'],
        category: 'store',
      },

      // React patterns
      {
        pattern: /^\/react\/(.*)/,
        mainFile: (matches) =>
          `pages/integrations/react/${matches[1] ? matches[1].charAt(0).toUpperCase() + matches[1].slice(1) : 'Default'}Page.tsx`,
        relatedFiles: () => ['components/react/', 'hooks/use*.ts'],
        category: 'react',
      },

      // Demo patterns
      {
        pattern: /^\/demos\/(.*)/,
        mainFile: (matches) =>
          `pages/demos/${
            matches[1]
              ? matches[1]
                  .split('-')
                  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                  .join('')
              : 'Default'
          }Demo.tsx`,
        relatedFiles: (matches) => [
          `components/demos/${matches[1]}/`,
          `stores/${matches[1]}Store.ts`,
          `hooks/use${matches[1] ? matches[1].charAt(0).toUpperCase() + matches[1].slice(1) : 'Default'}*.ts`,
        ],
        category: 'demos',
      },

      // ActionGuard patterns
      {
        pattern: /^\/actionguard\/(.*)/,
        mainFile: (matches) =>
          `pages/actionguard/${
            matches[1]
              ? matches[1]
                  .split('-')
                  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                  .join('')
              : 'Default'
          }Page.tsx`,
        relatedFiles: () => [
          'components/actionguard/',
          'hooks/useActionGuard*.ts',
        ],
        category: 'actionguard',
      },

      // Performance patterns
      {
        pattern: /^\/performance\/(.*)/,
        mainFile: (matches) =>
          `pages/performance/${matches[1] ? matches[1].charAt(0).toUpperCase() + matches[1].slice(1) : 'Default'}Page.tsx`,
        relatedFiles: () => [
          'components/performance/',
          'hooks/usePerformance*.ts',
        ],
        category: 'performance',
      },

      // Utilities patterns
      {
        pattern: /^\/utilities\/(.*)/,
        mainFile: (matches) =>
          `pages/utilities/${
            matches[1]
              ? matches[1]
                  .split('-')
                  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                  .join('')
              : 'Default'
          }.tsx`,
        relatedFiles: () => ['components/ui/', 'utils/', 'hooks/use*.ts'],
        category: 'utilities',
      },

      // Refs patterns
      {
        pattern: /^\/refs\/(.*)/,
        mainFile: (matches) =>
          `pages/refs/${matches[1] ? matches[1].charAt(0).toUpperCase() + matches[1].slice(1) : 'Default'}Page.tsx`,
        relatedFiles: () => ['components/refs/', 'hooks/useRef*.ts'],
        category: 'refs',
      },
    ];

    // 패턴 매칭 시도
    for (const { pattern, mainFile, relatedFiles, category } of patterns) {
      const matches = pathname.match(pattern);
      if (matches) {
        return {
          mainFile: mainFile(matches),
          relatedFiles: relatedFiles(matches),
          category,
          estimatedPath: pathname,
        };
      }
    }

    // 기본 패턴 (단순 경로 기반)
    if (pathSegments.length >= 1) {
      const pageName = pathSegments[pathSegments.length - 1];
      const capitalizedName = pageName
        ? pageName.charAt(0).toUpperCase() + pageName.slice(1)
        : 'Default';

      return {
        mainFile: `pages/${pathSegments.join('/')}/${capitalizedName}Page.tsx`,
        relatedFiles: [`components/${pathSegments.join('/')}/`],
        category: pathSegments[0] || 'general',
        estimatedPath: pathname,
      };
    }

    return null;
  }, [location.pathname]);
}

/**
 * 자동 감지된 소스 파일들을 정리해서 반환하는 Helper Hook
 */
export function useSmartSourceLinks(): {
  filePaths: string[];
  category: string;
} | null {
  const detection = useAutoSourceDetection();

  return useMemo(() => {
    if (!detection) return null;

    // 실제 존재할 가능성이 높은 파일들만 필터링
    const probableFiles = [
      detection.mainFile,
      // 관련 파일들은 실제 구현에 따라 조정 필요
    ].filter(Boolean);

    return {
      filePaths: probableFiles,
      category: detection.category,
    };
  }, [detection]);
}
