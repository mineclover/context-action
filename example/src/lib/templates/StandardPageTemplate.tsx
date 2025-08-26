/**
 * Standard Page Template
 * Consistent page structure template following Context-Action architecture patterns
 */

import React, { useCallback, useEffect } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '@/components/LogMonitor';
import {
  DemoCard,
  CodeExample,
  DynamicPatternBadge,
  Section
} from '@/components/ui';

// Template props interface
export interface StandardPageTemplateProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

// Content wrapper with consistent structure
export interface PageContentProps {
  title: string;
  description: string;
  sections: PageSection[];
}

export interface PageSection {
  id: string;
  title: string;
  content: React.ReactNode;
  className?: string;
}

// Demo section interface
export interface DemoSectionProps {
  title: string;
  description: string;
  patternType?: 'store' | 'action' | 'async' | 'ref' | 'integration' | 'performance' | 'api' | 'search' | 'interaction';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  demos: DemoCardConfig[];
  codeExample?: string;
}

export interface DemoCardConfig {
  title: string;
  description: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  showCode?: boolean;
  codeExample?: string;
}

// Standard page template component
export function StandardPageTemplate({
  title,
  description,
  children,
  className = ''
}: StandardPageTemplateProps) {
  // Create pageId from title
  const pageId = title.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  return (
    <PageWithLogMonitor pageId={pageId}>
      {/* Temporarily replaced DomainLayout with div until component is available */}
      <div className={`domain-layout ${className || ''}`}>
        <div className="domain-layout-header">
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        <div className="domain-layout-content">
          {children}
        </div>
      </div>
    </PageWithLogMonitor>
  );
}

// Structured page content component
export function StructuredPageContent({
  title,
  description,
  sections
}: PageContentProps) {
  return (
    <StandardPageTemplate title={title} description={description}>
      <div className="space-y-8">
        {sections.map((section) => (
          <Section 
            key={section.id} 
            title={section.title}
            className={section.className}
          >
            {section.content}
          </Section>
        ))}
      </div>
    </StandardPageTemplate>
  );
}

// Demo section component
export function DemoSection({
  title,
  description,
  patternType = 'integration',
  difficulty = 'intermediate',
  demos,
  codeExample
}: DemoSectionProps) {
  return (
    <Section title={title}>
      <div className="space-y-6">
        {/* Section header */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
          <DynamicPatternBadge type={patternType} difficulty={difficulty} />
          <div className="flex-1">
            <p className="text-gray-700">{description}</p>
          </div>
        </div>

        {/* Demo cards */}
        <div className="space-y-6">
          {demos.map((demo, index) => {
            const DemoComponent = demo.component;
            return (
              <DemoCard 
                key={index} 
                title={demo.title}
                className="h-full"
              >
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">{demo.description}</p>
                  <DemoComponent {...(demo.props || {})} />
                  {demo.showCode && demo.codeExample && (
                    <CodeExample>{demo.codeExample}</CodeExample>
                  )}
                </div>
              </DemoCard>
            );
          })}
        </div>

        {/* Section code example */}
        {codeExample && (
          <CodeExample>{codeExample}</CodeExample>
        )}
      </div>
    </Section>
  );
}

// Feature comparison component
export interface FeatureComparisonProps {
  title?: string;
  features: Array<{
    name: string;
    description: string;
    benefits: string[];
    drawbacks?: string[];
    codeExample?: string;
  }>;
}

export function FeatureComparison({ 
  title = "Feature Comparison",
  features 
}: FeatureComparisonProps) {
  return (
    <Section title={title}>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <DemoCard key={index} title={feature.name}>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{feature.description}</p>
              
              <div>
                <h5 className="text-sm font-medium text-green-700 mb-2">✅ Benefits</h5>
                <ul className="text-sm space-y-1">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="text-green-600">• {benefit}</li>
                  ))}
                </ul>
              </div>

              {feature.drawbacks && feature.drawbacks.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-orange-700 mb-2">⚠️ Considerations</h5>
                  <ul className="text-sm space-y-1">
                    {feature.drawbacks.map((drawback, i) => (
                      <li key={i} className="text-orange-600">• {drawback}</li>
                    ))}
                  </ul>
                </div>
              )}

              {feature.codeExample && (
                <CodeExample>{feature.codeExample}</CodeExample>
              )}
            </div>
          </DemoCard>
        ))}
      </div>
    </Section>
  );
}

// Best practices section component
export interface BestPracticesSectionProps {
  title?: string;
  practices: Array<{
    category: string;
    icon?: string;
    recommendations: Array<{
      type: 'do' | 'dont' | 'consider';
      text: string;
      explanation?: string;
    }>;
  }>;
}

export function BestPracticesSection({ 
  title = "Best Practices",
  practices 
}: BestPracticesSectionProps) {
  const getRecommendationIcon = (type: 'do' | 'dont' | 'consider') => {
    switch (type) {
      case 'do': return '✅';
      case 'dont': return '❌';
      case 'consider': return '💡';
    }
  };

  const getRecommendationColor = (type: 'do' | 'dont' | 'consider') => {
    switch (type) {
      case 'do': return 'text-green-700';
      case 'dont': return 'text-red-700';
      case 'consider': return 'text-blue-700';
    }
  };

  return (
    <Section title={title}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {practices.map((practice, index) => (
          <DemoCard key={index} title={`${practice.icon || '📋'} ${practice.category}`}>
            <div className="space-y-3">
              {practice.recommendations.map((rec, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-lg flex-shrink-0">
                    {getRecommendationIcon(rec.type)}
                  </span>
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${getRecommendationColor(rec.type)}`}>
                      {rec.text}
                    </div>
                    {rec.explanation && (
                      <div className="text-xs text-gray-600 mt-1">
                        {rec.explanation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </DemoCard>
        ))}
      </div>
    </Section>
  );
}

// Hook for consistent page logging
export function usePageLogger(pageName: string) {
  const logger = useActionLoggerWithToast();

  const logPageAction = useCallback((action: string, data?: any) => {
    logger.logAction(`[${pageName}] ${action}`, data);
  }, [logger, pageName]);

  const logPageError = useCallback((error: string, data?: any) => {
    logger.logError(`[${pageName}] ${error}`, data);
  }, [logger, pageName]);

  const logPageSuccess = useCallback((message: string, data?: any) => {
    logger.logSystem(`[${pageName}] ${message}`, data);
  }, [logger, pageName]);

  useEffect(() => {
    logPageAction('Page initialized');
  }, [logPageAction]);

  return {
    logPageAction,
    logPageError,
    logPageSuccess
  };
}

// Export all template components
export * from './index';