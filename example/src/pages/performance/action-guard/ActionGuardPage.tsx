/**
 * ActionGuard Main Page
 * Comprehensive demonstration of advanced action handling and performance optimization patterns
 */

import { createPerformanceTemplate } from '@/lib/templates';
import { ActionGuardDemos } from './components';

// Demo configurations for the performance template
const demos = [
  {
    title: 'Performance & Priority Execution',
    description:
      'Real-time performance monitoring with priority-based action execution',
    component: ActionGuardDemos,
    showCode: true,
    category: 'Performance',
    complexity: 'Advanced' as const,
    codeExample: `
// Priority-based execution with performance monitoring
const { execute, metrics } = usePriorityExecution();
const { recordAction } = useActionPerformanceMonitor();

// Execute high-priority actions first
await execute('criticalAction', payload, 1); // Priority 1 (highest)
await execute('normalAction', payload, 5);   // Priority 5 (normal)
    `,
  },
];

// Performance metrics for the template
const performanceMetrics = {
  baseline: {
    'Action Execution': '150ms',
    'Memory Usage': '45MB',
    'Event Processing': '25ms',
    'API Response': '200ms',
  },
  optimized: {
    'Action Execution': '85ms',
    'Memory Usage': '32MB',
    'Event Processing': '12ms',
    'API Response': '120ms',
  },
  improvement: {
    'Speed Improvement': '43% faster',
    'Memory Reduction': '29% less',
    'Event Optimization': '52% faster',
    'API Performance': '40% faster',
  },
};

// Benchmark results
const benchmarks = [
  {
    scenario: 'High-frequency mouse events',
    baseline: 150,
    optimized: 85,
    improvement: '43% faster',
    description: 'Optimized throttling reduces processing overhead',
  },
  {
    scenario: 'API request deduplication',
    baseline: 200,
    optimized: 120,
    improvement: '40% faster',
    description: 'Cache hits eliminate redundant network requests',
  },
  {
    scenario: 'Priority-based execution',
    baseline: 180,
    optimized: 95,
    improvement: '47% faster',
    description: 'Smart queuing prioritizes critical actions',
  },
  {
    scenario: 'Search with debouncing',
    baseline: 300,
    optimized: 120,
    improvement: '60% faster',
    description: 'Debounced queries reduce unnecessary requests',
  },
];

const _actionGuardFeatures = [
  {
    name: 'Priority-Based Execution',
    description:
      'Execute actions based on configurable priority levels with intelligent queuing',
    benefits: [
      'Predictable execution order',
      'Resource optimization',
      'Better user experience under load',
      'Configurable priority levels',
    ],
    drawbacks: [
      'Increased memory usage for queuing',
      'Complexity in priority management',
    ],
    codeExample: `
// Define action priorities
const priorities = {
  USER_INTERACTION: 1,    // Highest priority
  DATA_SYNC: 3,          // Medium priority  
  BACKGROUND_TASK: 5     // Lowest priority
};

// Execute with priority
await execute('saveUserData', userData, priorities.USER_INTERACTION);
    `,
  },
  {
    name: 'Intelligent API Management',
    description:
      'Advanced API request handling with caching, deduplication, and error recovery',
    benefits: [
      'Automatic request deduplication',
      'Smart caching with TTL',
      'Circuit breaker pattern',
      'Performance metrics tracking',
    ],
    drawbacks: ['Memory overhead for caching', 'Cache invalidation complexity'],
    codeExample: `
// API request with caching and deduplication
const config: ApiRequestConfig = {
  url: '/api/user/profile',
  method: 'GET',
  cacheKey: 'user-profile',
  cacheTtl: 300000, // 5 minutes
  timeout: 10000
};

const result = await apiExecute(config);
// Subsequent requests return cached result
    `,
  },
  {
    name: 'Smart Search with Debouncing',
    description:
      'Optimized search implementation with automatic debouncing and abort capabilities',
    benefits: [
      'Automatic query debouncing',
      'Request abortion for performance',
      'Configurable search parameters',
      'Built-in error handling',
    ],
    drawbacks: [
      'Slight delay in search results',
      'Complexity in abort handling',
    ],
    codeExample: `
// Smart search with configuration
const { search, results, isLoading } = useSmartSearch(searchFn, {
  debounceMs: 300,
  minLength: 2,
  maxResults: 50,
  includeHighlight: true
});

await search(query); // Automatically debounced
    `,
  },
  {
    name: 'Event Throttling System',
    description:
      'Intelligent event throttling to prevent performance degradation',
    benefits: [
      'Reduces unnecessary processing',
      'Improves scroll performance',
      'Configurable throttle timing',
      'Maintains user responsiveness',
    ],
    drawbacks: ['Potential input lag', 'Event batching complexity'],
    codeExample: `
// Throttled event handler
const throttledHandler = useThrottledEventHandler(
  (event) => {
    // Process expensive operation
    updateVisualization(event);
  },
  100 // Throttle to 100ms
);

// Use in component
<div onMouseMove={throttledHandler} />
    `,
  },
];

const _bestPractices = [
  {
    category: 'Performance Optimization',
    icon: '⚡',
    recommendations: [
      {
        type: 'do' as const,
        text: 'Monitor action execution times',
        explanation: 'Track performance metrics to identify bottlenecks',
      },
      {
        type: 'do' as const,
        text: 'Use priority levels appropriately',
        explanation: 'Critical user interactions should have highest priority',
      },
      {
        type: 'dont' as const,
        text: 'Over-throttle user interactions',
        explanation: 'Can create perceived lag and poor user experience',
      },
      {
        type: 'consider' as const,
        text: 'Batch processing for bulk operations',
        explanation: 'Group similar operations for better performance',
      },
    ],
  },
  {
    category: 'API Management',
    icon: '🌐',
    recommendations: [
      {
        type: 'do' as const,
        text: 'Implement request deduplication',
        explanation: 'Prevents unnecessary network requests and server load',
      },
      {
        type: 'do' as const,
        text: 'Use appropriate cache TTL values',
        explanation: 'Balance between data freshness and performance',
      },
      {
        type: 'dont' as const,
        text: 'Cache sensitive user data indefinitely',
        explanation: 'Security and privacy implications',
      },
      {
        type: 'consider' as const,
        text: 'Circuit breaker for external APIs',
        explanation: 'Graceful degradation when external services fail',
      },
    ],
  },
  {
    category: 'Search Optimization',
    icon: '🔍',
    recommendations: [
      {
        type: 'do' as const,
        text: 'Use appropriate debounce timing',
        explanation:
          '300ms is good balance between responsiveness and performance',
      },
      {
        type: 'do' as const,
        text: 'Implement search result limits',
        explanation: 'Prevents UI performance issues with large result sets',
      },
      {
        type: 'consider' as const,
        text: 'Search result caching',
        explanation: 'Cache common searches for better performance',
      },
    ],
  },
];

/**
 * ActionGuard Main Page Component
 * Demonstrates advanced action handling patterns and performance optimization techniques
 */
export default function ActionGuardPage() {
  // Create the template configuration
  const templateConfig = createPerformanceTemplate({
    title: '🛡️ ActionGuard - Advanced Action Management',
    description:
      "Comprehensive demonstrations of performance optimization, priority-based execution, API management, and intelligent throttling using the Context-Action framework's advanced capabilities.",
    demos,
    metrics: performanceMetrics,
    benchmarks,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {templateConfig.title}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {templateConfig.description}
            </p>
          </header>

          <ActionGuardDemos />
        </div>
      </div>
    </div>
  );
}
