/**
 * Domain-Specific Templates
 * Specialized templates for different domain patterns in Context-Action framework
 */

import React from 'react';
import { 
  StandardPageTemplate,
  DemoSection,
  FeatureComparison,
  BestPracticesSection
} from './StandardPageTemplate';
import { DemoCard, Section } from '@/components/ui';

// Domain configuration interfaces
export interface DomainDemoConfig {
  title: string;
  description: string;
  path?: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  tags?: string[];
  category?: string;
  complexity?: 'Beginner' | 'Intermediate' | 'Advanced';
  showCode?: boolean;
  codeExample?: string;
}

export interface DomainFeature {
  name: string;
  description: string;
  benefits: string[];
  drawbacks?: string[];
  codeExample?: string;
  useCases?: string[];
  performance?: {
    impact: 'low' | 'medium' | 'high';
    description: string;
  };
}

export interface DomainBestPractice {
  category: string;
  icon?: string;
  recommendations: Array<{
    type: 'do' | 'dont' | 'consider';
    text: string;
    explanation?: string;
    codeExample?: string;
  }>;
}

// Performance-focused domain template
export interface PerformanceDomainTemplateProps {
  title: string;
  description: string;
  demos: DomainDemoConfig[];
  features: DomainFeature[];
  bestPractices: DomainBestPractice[];
  performanceMetrics?: {
    baseline: Record<string, string | number>;
    optimized: Record<string, string | number>;
    improvement: Record<string, string>;
  };
  benchmarks?: Array<{
    scenario: string;
    baseline: number;
    optimized: number;
    improvement: string;
    description: string;
  }>;
}

export function PerformanceDomainTemplate({
  title,
  description,
  demos,
  features,
  bestPractices,
  performanceMetrics,
  benchmarks
}: PerformanceDomainTemplateProps) {
  const demoSection = {
    title: 'Interactive Demonstrations',
    description: 'Hands-on demos showcasing performance optimization patterns and techniques',
    patternType: 'performance' as const,
    difficulty: 'advanced' as const,
    demos: demos.map(demo => ({
      title: demo.title,
      description: demo.description,
      component: demo.component,
      props: demo.props,
      showCode: demo.showCode,
      codeExample: demo.codeExample
    }))
  };

  return (
    <StandardPageTemplate title={title} description={description}>
      <div className="space-y-12">
        {/* Performance Metrics Overview */}
        {performanceMetrics && (
          <Section title="📊 Performance Impact">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DemoCard title="Baseline Performance">
                <div className="space-y-3">
                  {Object.entries(performanceMetrics.baseline).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm text-gray-600">{key}:</span>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </DemoCard>

              <DemoCard title="Optimized Performance">
                <div className="space-y-3">
                  {Object.entries(performanceMetrics.optimized).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm text-gray-600">{key}:</span>
                      <span className="text-sm font-medium text-green-600">{value}</span>
                    </div>
                  ))}
                </div>
              </DemoCard>

              <DemoCard title="Improvement Metrics">
                <div className="space-y-3">
                  {Object.entries(performanceMetrics.improvement).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm text-gray-600">{key}:</span>
                      <span className="text-sm font-medium text-blue-600">{value}</span>
                    </div>
                  ))}
                </div>
              </DemoCard>
            </div>
          </Section>
        )}

        {/* Benchmark Results */}
        {benchmarks && benchmarks.length > 0 && (
          <Section title="🏆 Benchmark Results">
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Scenario</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Baseline</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Optimized</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Improvement</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {benchmarks.map((benchmark, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{benchmark.scenario}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{benchmark.baseline}ms</td>
                      <td className="px-4 py-3 text-sm text-green-600 font-medium">{benchmark.optimized}ms</td>
                      <td className="px-4 py-3 text-sm text-blue-600 font-medium">{benchmark.improvement}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{benchmark.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Main Demos */}
        <DemoSection {...demoSection} />

        {/* Feature Analysis */}
        <FeatureComparison title="Performance Features" features={features} />

        {/* Best Practices */}
        <BestPracticesSection title="Performance Best Practices" practices={bestPractices} />
      </div>
    </StandardPageTemplate>
  );
}

// API-focused domain template
export interface ApiDomainTemplateProps {
  title: string;
  description: string;
  endpoints: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description: string;
    example: string;
    response: string;
  }>;
  demos: DomainDemoConfig[];
  features: DomainFeature[];
  bestPractices: DomainBestPractice[];
}

export function ApiDomainTemplate({
  title,
  description,
  endpoints,
  demos,
  features,
  bestPractices
}: ApiDomainTemplateProps) {
  const demoSection = {
    title: 'API Management Demonstrations',
    description: 'Interactive examples of API handling, caching, and error management patterns',
    patternType: 'api' as const,
    difficulty: 'intermediate' as const,
    demos: demos.map(demo => ({
      title: demo.title,
      description: demo.description,
      component: demo.component,
      props: demo.props,
      showCode: demo.showCode,
      codeExample: demo.codeExample
    }))
  };

  return (
    <StandardPageTemplate title={title} description={description}>
      <div className="space-y-12">
        {/* API Endpoints Reference */}
        <Section title="📡 API Endpoints">
          <div className="grid grid-cols-1 gap-4">
            {endpoints.map((endpoint, index) => (
              <DemoCard key={index} title={`${endpoint.method} ${endpoint.path}`}>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">{endpoint.description}</p>
                  
                  <div>
                    <h5 className="text-sm font-medium mb-2">Example Request:</h5>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      <code>{endpoint.example}</code>
                    </pre>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium mb-2">Response Format:</h5>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      <code>{endpoint.response}</code>
                    </pre>
                  </div>
                </div>
              </DemoCard>
            ))}
          </div>
        </Section>

        {/* Main Demos */}
        <DemoSection {...demoSection} />

        {/* Feature Analysis */}
        <FeatureComparison title="API Management Features" features={features} />

        {/* Best Practices */}
        <BestPracticesSection title="API Best Practices" practices={bestPractices} />
      </div>
    </StandardPageTemplate>
  );
}

// Search-focused domain template
export interface SearchDomainTemplateProps {
  title: string;
  description: string;
  searchStrategies: Array<{
    name: string;
    description: string;
    pros: string[];
    cons: string[];
    useCases: string[];
    codeExample: string;
  }>;
  demos: DomainDemoConfig[];
  features: DomainFeature[];
  bestPractices: DomainBestPractice[];
}

export function SearchDomainTemplate({
  title,
  description,
  searchStrategies,
  demos,
  features,
  bestPractices
}: SearchDomainTemplateProps) {
  const demoSection = {
    title: 'Search Pattern Demonstrations',
    description: 'Interactive examples of search optimization, debouncing, and result management',
    patternType: 'search' as const,
    difficulty: 'intermediate' as const,
    demos: demos.map(demo => ({
      title: demo.title,
      description: demo.description,
      component: demo.component,
      props: demo.props,
      showCode: demo.showCode,
      codeExample: demo.codeExample
    }))
  };

  return (
    <StandardPageTemplate title={title} description={description}>
      <div className="space-y-12">
        {/* Search Strategies Comparison */}
        <Section title="🔍 Search Strategies">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {searchStrategies.map((strategy, index) => (
              <DemoCard key={index} title={strategy.name}>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">{strategy.description}</p>
                  
                  <div>
                    <h5 className="text-sm font-medium text-green-700 mb-2">✅ Advantages</h5>
                    <ul className="text-sm space-y-1">
                      {strategy.pros.map((pro, i) => (
                        <li key={i} className="text-green-600">• {pro}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-orange-700 mb-2">⚠️ Considerations</h5>
                    <ul className="text-sm space-y-1">
                      {strategy.cons.map((con, i) => (
                        <li key={i} className="text-orange-600">• {con}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-blue-700 mb-2">🎯 Use Cases</h5>
                    <ul className="text-sm space-y-1">
                      {strategy.useCases.map((useCase, i) => (
                        <li key={i} className="text-blue-600">• {useCase}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium mb-2">Code Example</h5>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      <code>{strategy.codeExample}</code>
                    </pre>
                  </div>
                </div>
              </DemoCard>
            ))}
          </div>
        </Section>

        {/* Main Demos */}
        <DemoSection {...demoSection} />

        {/* Feature Analysis */}
        <FeatureComparison title="Search Features" features={features} />

        {/* Best Practices */}
        <BestPracticesSection title="Search Best Practices" practices={bestPractices} />
      </div>
    </StandardPageTemplate>
  );
}

// Interactive domain template for UI/UX focused content
export interface InteractiveDomainTemplateProps {
  title: string;
  description: string;
  interactionPatterns: Array<{
    name: string;
    description: string;
    events: string[];
    performance: {
      frequency: string;
      optimization: string;
      impact: string;
    };
    codeExample: string;
  }>;
  demos: DomainDemoConfig[];
  features: DomainFeature[];
  bestPractices: DomainBestPractice[];
  a11yConsiderations?: Array<{
    aspect: string;
    guideline: string;
    implementation: string;
  }>;
}

export function InteractiveDomainTemplate({
  title,
  description,
  interactionPatterns,
  demos,
  features,
  bestPractices,
  a11yConsiderations
}: InteractiveDomainTemplateProps) {
  const demoSection = {
    title: 'Interaction Pattern Demonstrations',
    description: 'Interactive examples of user interaction handling, event optimization, and accessibility patterns',
    patternType: 'interaction' as const,
    difficulty: 'advanced' as const,
    demos: demos.map(demo => ({
      title: demo.title,
      description: demo.description,
      component: demo.component,
      props: demo.props,
      showCode: demo.showCode,
      codeExample: demo.codeExample
    }))
  };

  return (
    <StandardPageTemplate title={title} description={description}>
      <div className="space-y-12">
        {/* Interaction Patterns Analysis */}
        <Section title="🖱️ Interaction Patterns">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {interactionPatterns.map((pattern, index) => (
              <DemoCard key={index} title={pattern.name}>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">{pattern.description}</p>
                  
                  <div>
                    <h5 className="text-sm font-medium mb-2">Events Handled:</h5>
                    <div className="flex flex-wrap gap-1">
                      {pattern.events.map((event, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <h5 className="text-sm font-medium mb-2">Performance Profile:</h5>
                    <div className="space-y-1 text-xs">
                      <div><strong>Frequency:</strong> {pattern.performance.frequency}</div>
                      <div><strong>Optimization:</strong> {pattern.performance.optimization}</div>
                      <div><strong>Impact:</strong> {pattern.performance.impact}</div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium mb-2">Implementation:</h5>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      <code>{pattern.codeExample}</code>
                    </pre>
                  </div>
                </div>
              </DemoCard>
            ))}
          </div>
        </Section>

        {/* Accessibility Considerations */}
        {a11yConsiderations && a11yConsiderations.length > 0 && (
          <Section title="♿ Accessibility Considerations">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {a11yConsiderations.map((consideration, index) => (
                <DemoCard key={index} title={consideration.aspect}>
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-blue-700 mb-1">Guideline:</h5>
                      <p className="text-xs text-gray-600">{consideration.guideline}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-green-700 mb-1">Implementation:</h5>
                      <p className="text-xs text-gray-600">{consideration.implementation}</p>
                    </div>
                  </div>
                </DemoCard>
              ))}
            </div>
          </Section>
        )}

        {/* Main Demos */}
        <DemoSection {...demoSection} />

        {/* Feature Analysis */}
        <FeatureComparison title="Interaction Features" features={features} />

        {/* Best Practices */}
        <BestPracticesSection title="Interaction Best Practices" practices={bestPractices} />
      </div>
    </StandardPageTemplate>
  );
}