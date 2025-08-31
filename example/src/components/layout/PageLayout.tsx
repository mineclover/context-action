import type React from 'react';
import { cn } from '../../lib/utils';
import { Card, CardContent, Container } from '../ui';
import { PageSourceHeader } from '../ui/PageSourceHeader';

export interface PageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  category?: 'core' | 'store' | 'react' | 'logger' | 'actionguard' | 'debug';
  /** 소스 링크 설정 */
  sourceConfig?: {
    /** 등록된 소스 ID 사용 */
    sourceId?: string;
    /** 직접 파일 경로 지정 */
    filePaths?: string[];
    /** 소스 헤더 표시 형태 */
    variant?: 'minimal' | 'standard' | 'detailed';
    /** 소스 헤더 숨기기 */
    hideSource?: boolean;
  };
}

export function PageLayout({
  title,
  description,
  children,
  className,
  size = 'lg',
  category,
  sourceConfig,
}: PageLayoutProps) {
  const showSourceHeader = sourceConfig && !sourceConfig.hideSource;
  
  return (
    <Container size={size} className={className}>
      <header className="mb-8">
        {/* Source Header - 상단에 위치 */}
        {showSourceHeader && (
          <PageSourceHeader
            sourceId={sourceConfig.sourceId}
            filePaths={sourceConfig.filePaths}
            variant={sourceConfig.variant || 'standard'}
          />
        )}
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        {description && (
          <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
      </header>
      {children}
    </Container>
  );
}

interface PageSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'bordered';
  category?: 'core' | 'store' | 'react' | 'logger' | 'actionguard' | 'debug';
}

export function PageSection({
  title,
  children,
  className,
  variant = 'default',
  category,
}: PageSectionProps) {
  return (
    <Card
      variant={variant}
      category={category}
      className={cn('mb-6', className)}
    >
      <CardContent>
        {title && (
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

interface FeatureHighlightProps {
  icon?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  category?: 'core' | 'store' | 'react' | 'logger' | 'actionguard' | 'debug';
}

export function FeatureHighlight({
  icon,
  title,
  description,
  children,
  category = 'core',
}: FeatureHighlightProps) {
  const categoryColors = {
    core: 'text-danger-600',
    store: 'text-success-600',
    react: 'text-purple-600',
    logger: 'text-warning-600',
    actionguard: 'text-pink-600',
    debug: 'text-indigo-600',
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50/50">
      {icon && <div className="flex-shrink-0 text-2xl">{icon}</div>}
      <div className="flex-1">
        <h3 className={cn('font-semibold mb-2', categoryColors[category])}>
          {title}
        </h3>
        <p className="text-gray-600 text-sm mb-3">{description}</p>
        {children}
      </div>
    </div>
  );
}

export interface DemoCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  category?: 'core' | 'store' | 'react' | 'logger' | 'actionguard' | 'debug';
  className?: string;
}

export function DemoCard({
  title,
  description,
  children,
  category = 'core',
  className,
}: DemoCardProps) {
  return (
    <Card category={category} className={cn('mb-6', className)}>
      <CardContent>
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
