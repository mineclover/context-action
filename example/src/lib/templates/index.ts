/**
 * Shared Templates Index
 * Comprehensive export of all reusable page and domain templates
 */

// Note: Standard and Domain templates have been removed as they were not used in the application

// Template utilities and patterns
export const TEMPLATE_PATTERNS = {
  // Common demo configurations
  DEFAULT_DEMO_CONFIG: {
    showCode: true,
    complexity: 'Intermediate' as const,
    patternType: 'integration' as const
  },
  
  // Common best practice categories
  BEST_PRACTICE_CATEGORIES: {
    PERFORMANCE: {
      category: 'Performance Optimization',
      icon: '⚡'
    },
    SECURITY: {
      category: 'Security & Safety',
      icon: '🛡️'
    },
    API: {
      category: 'API Management',
      icon: '🌐'
    },
    SEARCH: {
      category: 'Search Optimization',
      icon: '🔍'
    },
    INTERACTION: {
      category: 'User Interaction',
      icon: '🖱️'
    },
    ACCESSIBILITY: {
      category: 'Accessibility',
      icon: '♿'
    },
    CODE_QUALITY: {
      category: 'Code Quality',
      icon: '🔧'
    }
  },
  
  // Common feature benefit/drawback patterns
  FEATURE_PATTERNS: {
    PERFORMANCE_BENEFITS: [
      'Improved execution speed',
      'Reduced resource usage',
      'Better user experience',
      'Scalable architecture'
    ],
    PERFORMANCE_DRAWBACKS: [
      'Increased complexity',
      'Memory overhead',
      'Setup complexity'
    ],
    API_BENEFITS: [
      'Automatic error handling',
      'Request deduplication',
      'Built-in caching',
      'Performance monitoring'
    ],
    API_DRAWBACKS: [
      'Cache invalidation complexity',
      'Memory usage for caching',
      'Configuration overhead'
    ],
    SEARCH_BENEFITS: [
      'Improved search performance',
      'Automatic query optimization',
      'Built-in debouncing',
      'Result caching'
    ],
    SEARCH_DRAWBACKS: [
      'Initial setup complexity',
      'Memory usage for caching',
      'Configuration requirements'
    ],
    INTERACTION_BENEFITS: [
      'Smooth user experience',
      'Optimized event handling',
      'Accessibility compliance',
      'Performance optimization'
    ],
    INTERACTION_DRAWBACKS: [
      'Event handling complexity',
      'Browser compatibility',
      'Testing complexity'
    ]
  }
} as const;

// Template creation helpers
export function createPerformanceTemplate(config: {
  title: string;
  description: string;
  demos: any[];
  metrics?: any;
  benchmarks?: any[];
}) {
  return {
    ...config,
    features: [
      {
        name: 'Performance Monitoring',
        description: 'Real-time performance tracking and metrics collection',
        benefits: TEMPLATE_PATTERNS.FEATURE_PATTERNS.PERFORMANCE_BENEFITS,
        drawbacks: TEMPLATE_PATTERNS.FEATURE_PATTERNS.PERFORMANCE_DRAWBACKS.slice(0, 2)
      }
    ],
    bestPractices: [
      {
        ...TEMPLATE_PATTERNS.BEST_PRACTICE_CATEGORIES.PERFORMANCE,
        recommendations: [
          {
            type: 'do' as const,
            text: 'Monitor performance metrics regularly',
            explanation: 'Regular monitoring helps identify performance regressions early'
          },
          {
            type: 'do' as const,
            text: 'Set performance budgets',
            explanation: 'Clear budgets help maintain consistent user experience'
          }
        ]
      }
    ]
  };
}

export function createApiTemplate(config: {
  title: string;
  description: string;
  demos: any[];
  endpoints: any[];
}) {
  return {
    ...config,
    features: [
      {
        name: 'Request Management',
        description: 'Advanced API request handling with caching and deduplication',
        benefits: TEMPLATE_PATTERNS.FEATURE_PATTERNS.API_BENEFITS,
        drawbacks: TEMPLATE_PATTERNS.FEATURE_PATTERNS.API_DRAWBACKS
      }
    ],
    bestPractices: [
      {
        ...TEMPLATE_PATTERNS.BEST_PRACTICE_CATEGORIES.API,
        recommendations: [
          {
            type: 'do' as const,
            text: 'Implement request deduplication',
            explanation: 'Prevents unnecessary network requests and server load'
          },
          {
            type: 'consider' as const,
            text: 'Use appropriate cache TTL values',
            explanation: 'Balance between data freshness and performance'
          }
        ]
      }
    ]
  };
}

export function createSearchTemplate(config: {
  title: string;
  description: string;
  demos: any[];
  searchStrategies: any[];
}) {
  return {
    ...config,
    features: [
      {
        name: 'Smart Search',
        description: 'Intelligent search with debouncing and optimization',
        benefits: TEMPLATE_PATTERNS.FEATURE_PATTERNS.SEARCH_BENEFITS,
        drawbacks: TEMPLATE_PATTERNS.FEATURE_PATTERNS.SEARCH_DRAWBACKS
      }
    ],
    bestPractices: [
      {
        ...TEMPLATE_PATTERNS.BEST_PRACTICE_CATEGORIES.SEARCH,
        recommendations: [
          {
            type: 'do' as const,
            text: 'Use appropriate debounce timing',
            explanation: '300ms provides good balance between responsiveness and performance'
          },
          {
            type: 'do' as const,
            text: 'Implement result limits',
            explanation: 'Prevents UI performance issues with large result sets'
          }
        ]
      }
    ]
  };
}

export function createInteractionTemplate(config: {
  title: string;
  description: string;
  demos: any[];
  interactionPatterns: any[];
  a11yConsiderations?: any[];
}) {
  return {
    ...config,
    features: [
      {
        name: 'Event Optimization',
        description: 'Optimized user interaction handling with accessibility support',
        benefits: TEMPLATE_PATTERNS.FEATURE_PATTERNS.INTERACTION_BENEFITS,
        drawbacks: TEMPLATE_PATTERNS.FEATURE_PATTERNS.INTERACTION_DRAWBACKS
      }
    ],
    bestPractices: [
      {
        ...TEMPLATE_PATTERNS.BEST_PRACTICE_CATEGORIES.INTERACTION,
        recommendations: [
          {
            type: 'do' as const,
            text: 'Optimize high-frequency events',
            explanation: 'Use throttling or debouncing for events like scroll and mousemove'
          },
          {
            type: 'do' as const,
            text: 'Implement accessibility features',
            explanation: 'Ensure keyboard navigation and screen reader compatibility'
          }
        ]
      }
    ]
  };
}