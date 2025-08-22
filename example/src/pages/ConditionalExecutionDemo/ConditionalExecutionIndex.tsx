import React from 'react';
import { Link } from 'react-router-dom';

const conditionalPatterns = [
  {
    id: 'environment',
    title: '🌍 Environment-Based Execution',
    description: 'Different handlers for dev, staging, and production environments',
    path: '/actionguard/conditional/environment',
    features: [
      'Fast deployment for development',
      'Integration testing for staging',
      'Blue-green deployment for production',
      'Environment-specific validation'
    ],
    difficulty: 'Basic',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
  },
  {
    id: 'feature-flags',
    title: '🎯 Feature Flag Integration',
    description: 'Runtime feature toggling with gradual rollouts',
    path: '/actionguard/conditional/feature-flags',
    features: [
      'Dynamic feature enablement',
      'A/B testing capabilities',
      'Graceful feature degradation',
      'Real-time toggle controls'
    ],
    difficulty: 'Intermediate',
    color: 'bg-green-50 border-green-200 hover:bg-green-100'
  },
  {
    id: 'permissions',
    title: '🔒 Permission-Based Execution',
    description: 'Role-based access control with audit logging',
    path: '/actionguard/conditional/permissions',
    features: [
      'Role-based handler execution',
      'Early permission validation',
      'Audit trail generation',
      'Security-first design'
    ],
    difficulty: 'Intermediate',
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
  },
  {
    id: 'business-rules',
    title: '💼 Business Rule Engine',
    description: 'Complex business logic with cascading rules',
    path: '/actionguard/conditional/business-rules',
    features: [
      'Credit limit validation',
      'Tier-based pricing',
      'Inventory management',
      'Dynamic discount calculation'
    ],
    difficulty: 'Advanced',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
  },
  {
    id: 'time-based',
    title: '⏰ Time-Based Execution',
    description: 'Schedule-aware processing with business hours logic',
    path: '/actionguard/conditional/time-based',
    features: [
      'Business hours detection',
      'Off-hours processing',
      'Task scheduling',
      'Time zone handling'
    ],
    difficulty: 'Basic',
    color: 'bg-pink-50 border-pink-200 hover:bg-pink-100'
  },
  {
    id: 'combined',
    title: '🔀 Combined Patterns',
    description: 'Real-world scenarios combining multiple patterns',
    path: '/actionguard/conditional/combined',
    features: [
      'Multi-pattern coordination',
      'Complex workflows',
      'Enterprise scenarios',
      'Integration examples'
    ],
    difficulty: 'Expert',
    color: 'bg-gray-50 border-gray-200 hover:bg-gray-100'
  }
];

export function ConditionalExecutionIndex() {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Basic': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-orange-100 text-orange-800';
      case 'Expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link 
            to="/actionguard" 
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            ← Back to ActionGuard
          </Link>
          <Link 
            to="/" 
            className="text-gray-600 hover:text-gray-800 underline text-sm"
          >
            🏠 Home
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">🔄 Conditional & Dynamic Execution Patterns</h1>
        <p className="text-lg text-gray-600 mb-2">
          Master advanced conditional execution patterns in Context-Action framework
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Each pattern demonstrates a specific conditional execution technique with focused examples,
            interactive controls, and detailed explanations. Start with basic patterns and progress
            to advanced combinations.
          </p>
        </div>
      </div>

      {/* Pattern Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {conditionalPatterns.map((pattern) => (
          <Link
            key={pattern.id}
            to={pattern.path}
            className={`border rounded-lg p-6 transition-all ${pattern.color}`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-semibold">{pattern.title}</h3>
              <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(pattern.difficulty)}`}>
                {pattern.difficulty}
              </span>
            </div>
            
            <p className="text-gray-700 mb-4">{pattern.description}</p>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Key Features:</div>
              <ul className="text-sm text-gray-600 space-y-1">
                {pattern.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-4 text-sm text-blue-600 font-medium">
              Explore Demo →
            </div>
          </Link>
        ))}
      </div>

      {/* Learning Path */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">📚 Recommended Learning Path</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-green-700 mb-2">🌱 Beginners</h3>
            <ol className="text-sm text-gray-700 space-y-2">
              <li>1. Start with <strong>Environment-Based Execution</strong> to understand handler filtering</li>
              <li>2. Learn <strong>Time-Based Execution</strong> for schedule-aware processing</li>
              <li>3. Move to <strong>Feature Flags</strong> for dynamic behavior control</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-medium text-orange-700 mb-2">🚀 Advanced</h3>
            <ol className="text-sm text-gray-700 space-y-2">
              <li>1. Master <strong>Permission-Based Execution</strong> for security patterns</li>
              <li>2. Implement <strong>Business Rules</strong> for complex logic</li>
              <li>3. Combine patterns in <strong>Real-World Scenarios</strong></li>
            </ol>
          </div>
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">🏗️ Architecture Overview</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-medium text-blue-900 mb-2">Handler Registration</h3>
            <p className="text-sm text-blue-800">
              Handlers register with metadata (environment, features, permissions) for conditional execution
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded">
            <h3 className="font-medium text-green-900 mb-2">Pipeline Filtering</h3>
            <p className="text-sm text-green-800">
              Action pipeline filters handlers based on runtime conditions before execution
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded">
            <h3 className="font-medium text-purple-900 mb-2">Result Aggregation</h3>
            <p className="text-sm text-purple-800">
              Multiple handlers coordinate through stores and pipeline results
            </p>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-yellow-900 mb-4">💡 Quick Tips</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-yellow-800">
          <div>
            <strong>Testing Strategy:</strong> Each demo includes comprehensive test scenarios
            to validate conditional logic behavior
          </div>
          <div>
            <strong>Real-time Monitoring:</strong> Use the execution panel to track handler
            execution flow and results
          </div>
          <div>
            <strong>Pattern Combination:</strong> Start with individual patterns before
            attempting complex combinations
          </div>
          <div>
            <strong>Performance Impact:</strong> Monitor execution times to understand
            the cost of conditional logic
          </div>
        </div>
      </div>
    </div>
  );
}