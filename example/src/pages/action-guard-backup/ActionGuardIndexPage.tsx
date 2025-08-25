/**
 * ActionGuard Domain Index Page
 * Comprehensive demonstration of advanced action handling, performance optimization, and API management patterns
 */

import React from 'react';
import { 
  StandardPageTemplate, 
  StructuredPageContent,
  FeatureComparison,
  BestPracticesSection
} from '../../domains/shared/templates';
import { DemoCard, Section } from '../../domains/shared/components';
import { Link } from 'react-router-dom';

// ActionGuard demo configurations
const actionGuardDemos = [
  {
    path: '/action-guard/performance',
    title: '⚡ Performance Optimization',
    description: 'Priority-based action execution, throttling, and performance monitoring',
    tags: ['Priority', 'Performance', 'Optimization'],
    category: 'Performance',
    complexity: 'Advanced'
  },
  {
    path: '/action-guard/api-management', 
    title: '🌐 API Management',
    description: 'Request blocking, caching, duplicate prevention, and error handling',
    tags: ['API', 'Blocking', 'Cache'],
    category: 'API',
    complexity: 'Intermediate'
  },
  {
    path: '/action-guard/search-patterns',
    title: '🔍 Search Patterns',
    description: 'Advanced search with debouncing, abortion, and result caching',
    tags: ['Search', 'Debounce', 'Abort'],
    category: 'Search',
    complexity: 'Intermediate'
  },
  {
    path: '/action-guard/event-handling',
    title: '🖱️ Event Handling',
    description: 'Optimized event processing, scroll handling, and user interactions',
    tags: ['Events', 'Scroll', 'Interaction'],
    category: 'Events',
    complexity: 'Advanced'
  },
  {
    path: '/action-guard/conditional-execution',
    title: '🎯 Conditional Execution',
    description: 'Permission-based execution, feature flags, and business rule validation',
    tags: ['Conditional', 'Permissions', 'Rules'],
    category: 'Logic',
    complexity: 'Advanced'
  }
];

const actionGuardFeatures = [
  {
    name: 'Priority-Based Execution',
    description: 'Execute actions based on priority levels with intelligent queuing',
    benefits: [
      'Predictable execution order',
      'Resource optimization',
      'Better user experience'
    ],
    drawbacks: [
      'Increased complexity',
      'Memory overhead for queuing'
    ],
    codeExample: `
// Priority-based action execution
await dispatch('highPriorityAction', payload, { priority: 1 });
await dispatch('normalAction', payload, { priority: 5 });
    `
  },
  {
    name: 'Request Deduplication',
    description: 'Prevent duplicate API requests and optimize network usage',
    benefits: [
      'Reduced server load',
      'Faster response times',
      'Improved user experience'
    ],
    drawbacks: [
      'Cache management complexity',
      'Potential stale data issues'
    ],
    codeExample: `
// Automatic request deduplication
const result = await dispatch('fetchUser', { id: '123' });
// Second call returns cached result
const cachedResult = await dispatch('fetchUser', { id: '123' });
    `
  },
  {
    name: 'Intelligent Throttling',
    description: 'Smart event throttling with context awareness',
    benefits: [
      'Performance optimization',
      'Reduced resource usage',
      'Smooth user interactions'
    ],
    drawbacks: [
      'Potential input lag',
      'Configuration complexity'
    ],
    codeExample: `
// Context-aware throttling
useActionHandler('searchQuery', async (payload) => {
  // Automatically throttled based on context
  return await performSearch(payload.query);
}, { throttle: 'smart' });
    `
  }
];

const bestPractices = [
  {
    category: 'Performance',
    icon: '⚡',
    recommendations: [
      {
        type: 'do' as const,
        text: 'Use priority levels for critical actions',
        explanation: 'Ensure important user actions execute first'
      },
      {
        type: 'do' as const,
        text: 'Implement request deduplication',
        explanation: 'Prevent unnecessary network requests'
      },
      {
        type: 'dont' as const,
        text: 'Over-throttle user interactions',
        explanation: 'Can create perceived lag in the interface'
      }
    ]
  },
  {
    category: 'API Management',
    icon: '🌐',
    recommendations: [
      {
        type: 'do' as const,
        text: 'Implement circuit breaker patterns',
        explanation: 'Gracefully handle API failures'
      },
      {
        type: 'consider' as const,
        text: 'Cache strategies for different data types',
        explanation: 'Static data vs. dynamic data need different approaches'
      },
      {
        type: 'dont' as const,
        text: 'Ignore error boundary patterns',
        explanation: 'Proper error handling is crucial for user experience'
      }
    ]
  }
];

const sections = [
  {
    id: 'demos',
    title: 'ActionGuard Demonstrations',
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {actionGuardDemos.map((demo) => (
          <DemoCard key={demo.path} title={demo.title}>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{demo.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {demo.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Category: {demo.category}</span>
                <span>Level: {demo.complexity}</span>
              </div>

              <Link
                to={demo.path}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                View Demo
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </DemoCard>
        ))}
      </div>
    )
  },
  {
    id: 'features',
    title: 'Core Features',
    content: <FeatureComparison features={actionGuardFeatures} />
  },
  {
    id: 'best-practices',
    title: 'Best Practices',
    content: <BestPracticesSection practices={bestPractices} />
  }
];

/**
 * ActionGuard Index Page Component
 */
export default function ActionGuardIndexPage() {
  return (
    <StructuredPageContent
      title="🛡️ ActionGuard - Advanced Action Management"
      description="Comprehensive demonstrations of advanced action handling patterns including performance optimization, API management, and intelligent request processing using the Context-Action framework."
      sections={sections}
    />
  );
}