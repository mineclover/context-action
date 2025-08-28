import React from 'react';
import { Link } from 'react-router-dom';
import { cardVariants, gridVariants } from '@/components/ui/variants';

interface ActionGuardDemo {
  id: string;
  title: string;
  description: string;
  path: string;
  category: 'basic' | 'advanced' | 'conditional' | 'performance';
  features: string[];
  difficulty: 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
  status: 'Complete' | 'Preview' | 'Coming Soon';
  icon: string;
}

const actionGuardDemos: ActionGuardDemo[] = [
  {
    id: 'search',
    title: 'Advanced Search',
    description: 'Real-time search with debouncing, error handling, and result caching',
    path: '/actionguard/search',
    category: 'advanced',
    features: ['Debounced input', 'Error boundary', 'Result caching', 'Loading states'],
    difficulty: 'Intermediate',
    status: 'Complete',
    icon: '🔍'
  },
  {
    id: 'scroll',
    title: 'Advanced Scroll',
    description: 'Infinite scroll implementation with performance optimization',
    path: '/actionguard/scroll',
    category: 'advanced',
    features: ['Infinite scroll', 'Virtual scrolling', 'Performance monitoring', 'Memory management'],
    difficulty: 'Advanced',
    status: 'Complete',
    icon: '📜'
  },
  {
    id: 'api-blocking',
    title: 'API Blocking',
    description: 'Demonstration of request blocking and deduplication patterns',
    path: '/actionguard/api-blocking',
    category: 'advanced',
    features: ['Request deduplication', 'Concurrent protection', 'Error recovery', 'Unified structure'],
    difficulty: 'Intermediate',
    status: 'Complete',
    icon: '🚫'
  },
  {
    id: 'conditional',
    title: 'Conditional Patterns',
    description: 'Complete collection of conditional execution patterns for enterprise applications',
    path: '/actionguard/conditional',
    category: 'conditional',
    features: ['Environment-based execution', 'Feature flags', 'Permission-based access', 'Business rules', 'Time-based logic', 'Combined patterns'],
    difficulty: 'Advanced',
    status: 'Complete',
    icon: '🔄'
  },
  {
    id: 'throttle',
    title: 'Throttle Comparison',
    description: 'Compare different throttling strategies and their performance characteristics',
    path: '/actionguard/throttle-comparison',
    category: 'performance',
    features: ['Throttle strategies', 'Performance comparison', 'Visual metrics', 'Interactive testing'],
    difficulty: 'Intermediate',
    status: 'Complete',
    icon: '⚖️'
  },
  {
    id: 'mouse-events',
    title: 'Mouse Events Collection',
    description: 'Comprehensive mouse event handling patterns and optimizations',
    path: '/actionguard/mouse-events',
    category: 'basic',
    features: ['Event optimization', 'RefContext integration', 'Performance monitoring', 'Multiple implementations'],
    difficulty: 'Basic',
    status: 'Complete',
    icon: '🖱️'
  },
  {
    id: 'priority-advanced',
    title: 'Advanced Priority Performance',
    description: 'Multi-instance priority testing with comprehensive analytics',
    path: '/actionguard/priority-performance-advanced',
    category: 'performance',
    features: ['Multi-instance testing', 'Advanced analytics', 'Performance benchmarking', 'Comparison tools'],
    difficulty: 'Expert',
    status: 'Complete',
    icon: '🚀'
  }
];

function ActionGuardOverview() {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Basic': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-orange-100 text-orange-800';
      case 'Expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Complete': return 'bg-green-100 text-green-800';
      case 'Preview': return 'bg-blue-100 text-blue-800';
      case 'Coming Soon': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic': return 'border-l-blue-500';
      case 'advanced': return 'border-l-purple-500';
      case 'conditional': return 'border-l-cyan-500';
      case 'performance': return 'border-l-orange-500';
      default: return 'border-l-gray-500';
    }
  };

  const categoryGroups = {
    basic: actionGuardDemos.filter(demo => demo.category === 'basic'),
    advanced: actionGuardDemos.filter(demo => demo.category === 'advanced'),
    conditional: actionGuardDemos.filter(demo => demo.category === 'conditional'),
    performance: actionGuardDemos.filter(demo => demo.category === 'performance')
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link 
            to="/" 
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            🏠 Home
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">🛡️ ActionGuard Demonstrations</h1>
        <p className="text-xl text-gray-600 mb-4">
          Advanced action handling patterns, performance optimization, and enterprise-level features
        </p>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-sm text-indigo-800">
            <strong>ActionGuard Overview:</strong> This section contains sophisticated examples of the Context-Action framework's 
            advanced capabilities including conditional execution, performance optimization, and enterprise patterns. 
            Each demo focuses on real-world scenarios with comprehensive explanations and interactive testing.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{actionGuardDemos.length}</div>
          <div className="text-sm text-gray-600">Total Demos</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{actionGuardDemos.filter(d => d.status === 'Complete').length}</div>
          <div className="text-sm text-gray-600">Complete</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{actionGuardDemos.filter(d => d.difficulty === 'Advanced' || d.difficulty === 'Expert').length}</div>
          <div className="text-sm text-gray-600">Advanced</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{categoryGroups.conditional.length}</div>
          <div className="text-sm text-gray-600">Conditional Patterns</div>
        </div>
      </div>

      {/* Category Sections */}
      <div className="space-y-10">
        {/* Conditional Execution Patterns */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-4 h-4 bg-cyan-500 rounded"></span>
            🔄 Conditional Execution Patterns
          </h2>
          <p className="text-gray-600 mb-6">
            Enterprise-level conditional logic patterns for complex business requirements
          </p>
          <div className={gridVariants({ cols: 1 })}>
            {categoryGroups.conditional.map((demo) => (
              <Link
                key={demo.id}
                to={demo.path}
                className={`${cardVariants({ variant: 'outlined', hover: true })} ${getCategoryColor(demo.category)} border-l-4 block`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{demo.icon}</span>
                    <h3 className="text-lg font-semibold">{demo.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(demo.difficulty)}`}>
                      {demo.difficulty}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(demo.status)}`}>
                      {demo.status}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{demo.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {demo.features.map((feature, index) => (
                    <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {feature}
                    </div>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Advanced Demos */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-4 h-4 bg-purple-500 rounded"></span>
            🚀 Advanced Demonstrations
          </h2>
          <p className="text-gray-600 mb-6">
            Sophisticated patterns for real-world application scenarios
          </p>
          <div className={gridVariants({ cols: 2 })}>
            {categoryGroups.advanced.map((demo) => (
              <Link
                key={demo.id}
                to={demo.path}
                className={`${cardVariants({ variant: 'outlined', hover: true })} ${getCategoryColor(demo.category)} border-l-4 block`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{demo.icon}</span>
                    <h3 className="text-lg font-semibold">{demo.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(demo.difficulty)}`}>
                      {demo.difficulty}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{demo.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {demo.features.map((feature, index) => (
                    <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Performance Optimization */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-4 h-4 bg-orange-500 rounded"></span>
            ⚡ Performance Optimization
          </h2>
          <p className="text-gray-600 mb-6">
            Performance-focused demonstrations with metrics and benchmarking
          </p>
          <div className={gridVariants({ cols: 3 })}>
            {categoryGroups.performance.map((demo) => (
              <Link
                key={demo.id}
                to={demo.path}
                className={`${cardVariants({ variant: 'outlined', hover: true })} ${getCategoryColor(demo.category)} border-l-4 block`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{demo.icon}</span>
                  <h3 className="text-lg font-semibold">{demo.title}</h3>
                </div>
                
                <p className="text-gray-700 mb-4 text-sm">{demo.description}</p>
                
                <div className="flex flex-wrap gap-1">
                  {demo.features.slice(0, 2).map((feature, index) => (
                    <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Basic Examples */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-4 h-4 bg-blue-500 rounded"></span>
            🎯 Fundamental Examples
          </h2>
          <p className="text-gray-600 mb-6">
            Essential patterns and foundational concepts
          </p>
          <div className={gridVariants({ cols: 2 })}>
            {categoryGroups.basic.map((demo) => (
              <Link
                key={demo.id}
                to={demo.path}
                className={`${cardVariants({ variant: 'outlined', hover: true })} ${getCategoryColor(demo.category)} border-l-4 block`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{demo.icon}</span>
                  <h3 className="text-lg font-semibold">{demo.title}</h3>
                </div>
                
                <p className="text-gray-700 mb-4">{demo.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {demo.features.map((feature, index) => (
                    <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Learning Path */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">📚 Recommended Learning Path</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-green-700 mb-3 flex items-center">
              <span className="text-lg mr-2">🌱</span> Start Here
            </h3>
            <ol className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-green-600">1.</span>
                <span><strong>Mouse Events</strong> - Basic event handling and optimization patterns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-green-600">2.</span>
                <span><strong>Advanced Search</strong> - Real-time processing with debouncing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-green-600">3.</span>
                <span><strong>API Blocking</strong> - Request management and error handling</span>
              </li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-medium text-orange-700 mb-3 flex items-center">
              <span className="text-lg mr-2">🚀</span> Advanced Topics
            </h3>
            <ol className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-orange-600">1.</span>
                <span><strong>Priority Performance</strong> - Handler coordination and metrics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-orange-600">2.</span>
                <span><strong>Conditional Patterns</strong> - Enterprise logic and business rules</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-orange-600">3.</span>
                <span><strong>Advanced Scroll</strong> - Performance optimization and virtualization</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActionGuardOverview;