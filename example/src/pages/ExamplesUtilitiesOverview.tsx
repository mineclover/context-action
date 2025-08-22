import React from 'react';
import { Link } from 'react-router-dom';
import { cardVariants, gridVariants } from '../components/ui/variants';

interface ExampleUtility {
  id: string;
  title: string;
  description: string;
  path: string;
  category: 'practical' | 'utilities' | 'specialized';
  features: string[];
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  status: 'Complete' | 'Preview' | 'Coming Soon';
  icon: string;
}

const examplesUtilities: ExampleUtility[] = [
  // Utilities
  {
    id: 'toast-config',
    title: 'Toast Configuration',
    description: 'Complete toast notification system with configuration and theming',
    path: '/examples/toast-config',
    category: 'utilities',
    features: ['Multiple toast types', 'Configuration system', 'Animation controls', 'Theme integration'],
    difficulty: 'Basic',
    status: 'Complete',
    icon: '🍞'
  },
  {
    id: 'concurrent-actions',
    title: 'Concurrent Actions Test',
    description: 'Testing concurrent action execution and race condition handling',
    path: '/examples/concurrent-actions',
    category: 'utilities',
    features: ['Concurrency testing', 'Race condition handling', 'Performance metrics', 'Stress testing'],
    difficulty: 'Advanced',
    status: 'Complete',
    icon: '🔄'
  },
  {
    id: 'enhanced-search',
    title: 'Enhanced Abortable Search',
    description: 'Advanced search with abort capabilities and request management',
    path: '/examples/enhanced-search',
    category: 'utilities',
    features: ['Abortable requests', 'Search optimization', 'Error handling', 'Loading states'],
    difficulty: 'Intermediate',
    status: 'Complete',
    icon: '🔍'
  },
  {
    id: 'logger-demo',
    title: 'Logger System',
    description: 'Comprehensive logging system with multiple levels and formatting',
    path: '/logger/demo',
    category: 'utilities',
    features: ['Multiple log levels', 'Formatted output', 'Performance tracking', 'Debug tools'],
    difficulty: 'Basic',
    status: 'Complete',
    icon: '📝'
  },
  // Practical Examples
  {
    id: 'element-management',
    title: 'Element Management',
    description: 'Dynamic element creation and management with React integration',
    path: '/examples/element-management',
    category: 'practical',
    features: ['Dynamic elements', 'Element lifecycle', 'Integration patterns', 'Performance optimization'],
    difficulty: 'Intermediate',
    status: 'Complete',
    icon: '🎯'
  },
  // Specialized Features
  {
    id: 'refs-management',
    title: 'Refs Management',
    description: 'Comprehensive ref management patterns and performance optimization',
    path: '/refs',
    category: 'specialized',
    features: ['Ref patterns', 'Performance optimization', 'Canvas integration', 'Form building'],
    difficulty: 'Advanced',
    status: 'Complete',
    icon: '🎯'
  },
  {
    id: 'canvas-ref',
    title: 'Canvas Ref Demo',
    description: 'Advanced canvas manipulation using ref patterns',
    path: '/refs/canvas',
    category: 'specialized',
    features: ['Canvas API', 'Ref integration', 'Performance optimization', 'Event handling'],
    difficulty: 'Advanced',
    status: 'Complete',
    icon: '🎨'
  },
  {
    id: 'form-builder',
    title: 'Form Builder Ref Demo',
    description: 'Dynamic form building with ref-based field management',
    path: '/refs/form-builder',
    category: 'specialized',
    features: ['Dynamic forms', 'Field management', 'Validation patterns', 'Ref optimization'],
    difficulty: 'Advanced',
    status: 'Complete',
    icon: '📝'
  },
  {
    id: 'waitforrefs-performance',
    title: 'useWaitForRefs Performance',
    description: 'Performance verification and optimization for ref waiting patterns',
    path: '/refs/waitforrefs-performance',
    category: 'specialized',
    features: ['Performance verification', 'Optimization patterns', 'Benchmarking', 'Memory management'],
    difficulty: 'Expert',
    status: 'Complete',
    icon: '⚡'
  },
  {
    id: 'pipeline-flow-control',
    title: 'Pipeline Flow Control',
    description: 'Interactive pipeline control with priority jumping and complex branching',
    path: '/pipeline/flow-control',
    category: 'specialized',
    features: ['Priority jumping', 'Early returns', 'Complex branching', 'Interactive playground'],
    difficulty: 'Advanced',
    status: 'Complete',
    icon: '🔀'
  }
];

function ExamplesUtilitiesOverview() {
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
      case 'practical': return 'border-l-orange-500';
      case 'utilities': return 'border-l-teal-500';
      case 'specialized': return 'border-l-blue-500';
      default: return 'border-l-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'practical': return '🛠️';
      case 'utilities': return '🔧';
      case 'specialized': return '🎯';
      default: return '📝';
    }
  };

  const categoryGroups = {
    practical: examplesUtilities.filter(item => item.category === 'practical'),
    utilities: examplesUtilities.filter(item => item.category === 'utilities'),
    specialized: examplesUtilities.filter(item => item.category === 'specialized')
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
        
        <h1 className="text-4xl font-bold mb-4">🛠️ Examples & Utilities</h1>
        <p className="text-xl text-gray-600 mb-4">
          Practical examples, utility tools, and specialized features for real-world development
        </p>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-sm text-indigo-800">
            <strong>Purpose:</strong> This section contains practical examples and utility tools that demonstrate 
            real-world usage patterns, specialized features, and advanced techniques. These examples are designed 
            to be copied, modified, and integrated into your own projects.
          </p>
        </div>
      </div>

      {/* Quick Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-teal-600">{examplesUtilities.length}</div>
          <div className="text-sm text-gray-600">Total Examples</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{examplesUtilities.filter(e => e.status === 'Complete').length}</div>
          <div className="text-sm text-gray-600">Complete</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{categoryGroups.specialized.length}</div>
          <div className="text-sm text-gray-600">Specialized</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{examplesUtilities.filter(e => e.difficulty === 'Advanced' || e.difficulty === 'Expert').length}</div>
          <div className="text-sm text-gray-600">Advanced</div>
        </div>
      </div>

      {/* Category Sections */}
      <div className="space-y-10">
        {/* Practical Examples */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-4 h-4 bg-orange-500 rounded"></span>
            🛠️ Practical Examples
          </h2>
          <p className="text-gray-600 mb-6">
            Real-world examples ready for production use and integration
          </p>
          <div className={gridVariants({ cols: 1 })}>
            {categoryGroups.practical.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`${cardVariants({ variant: 'outlined', hover: true })} ${getCategoryColor(item.category)} border-l-4 block`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(item.difficulty)}`}>
                      {item.difficulty}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{item.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {item.features.map((feature, index) => (
                    <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Utilities */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-4 h-4 bg-teal-500 rounded"></span>
            🔧 Development Utilities
          </h2>
          <p className="text-gray-600 mb-6">
            Tools and utilities for development, testing, and debugging
          </p>
          <div className={gridVariants({ cols: 2 })}>
            {categoryGroups.utilities.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`${cardVariants({ variant: 'outlined', hover: true })} ${getCategoryColor(item.category)} border-l-4 block`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(item.difficulty)}`}>
                    {item.difficulty}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-4">{item.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {item.features.map((feature, index) => (
                    <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Specialized Features */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-4 h-4 bg-blue-500 rounded"></span>
            🎯 Specialized Features
          </h2>
          <p className="text-gray-600 mb-6">
            Advanced features for specialized use cases and performance optimization
          </p>
          <div className={gridVariants({ cols: 2 })}>
            {categoryGroups.specialized.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`${cardVariants({ variant: 'outlined', hover: true })} ${getCategoryColor(item.category)} border-l-4 block`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(item.difficulty)}`}>
                    {item.difficulty}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-4">{item.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {item.features.map((feature, index) => (
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

      {/* Usage Guides */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">📋 Usage Guidelines</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-orange-700 mb-3 flex items-center">
              <span className="text-lg mr-2">🛠️</span> Practical Examples
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Ready for production integration</li>
              <li>• Copy and customize patterns</li>
              <li>• Well-documented implementation</li>
              <li>• Performance optimized</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-teal-700 mb-3 flex items-center">
              <span className="text-lg mr-2">🔧</span> Development Utilities
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Development and debugging tools</li>
              <li>• Testing utilities and frameworks</li>
              <li>• Performance monitoring</li>
              <li>• Configuration systems</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-blue-700 mb-3 flex items-center">
              <span className="text-lg mr-2">🎯</span> Specialized Features
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Advanced performance patterns</li>
              <li>• Specialized use cases</li>
              <li>• Expert-level implementations</li>
              <li>• Cutting-edge techniques</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Integration Tips */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-yellow-900 mb-4">💡 Integration Tips</h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-yellow-800">
          <div>
            <h3 className="font-medium mb-2">Getting Started:</h3>
            <ul className="space-y-1">
              <li>• Start with practical examples for immediate value</li>
              <li>• Use utilities to enhance development workflow</li>
              <li>• Explore specialized features for advanced needs</li>
              <li>• Combine patterns for complex requirements</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Best Practices:</h3>
            <ul className="space-y-1">
              <li>• Understand the underlying patterns before copying</li>
              <li>• Adapt examples to fit your specific use cases</li>
              <li>• Test performance implications in your context</li>
              <li>• Document customizations for team knowledge</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamplesUtilitiesOverview;