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
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    status: 'Complete'
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
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    status: 'Complete'
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
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    status: 'Preview'
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
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    status: 'Preview'
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
    color: 'bg-pink-50 border-pink-200 hover:bg-pink-100',
    status: 'Preview'
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
    color: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
    status: 'Preview'
  }
];

export function ConditionalPatternsIndex() {
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
        
        <h1 className="text-4xl font-bold mb-4">🔄 Conditional & Dynamic Execution Patterns</h1>
        <p className="text-xl text-gray-600 mb-4">
          Master advanced conditional execution patterns in Context-Action framework
        </p>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-sm text-indigo-800">
            <strong>Learning Path:</strong> Each pattern demonstrates a specific conditional execution technique with focused examples,
            interactive controls, and detailed explanations. Start with basic patterns and progress
            to advanced combinations for enterprise-level applications.
          </p>
        </div>
      </div>

      {/* Pattern Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {conditionalPatterns.map((pattern) => (
          <Link
            key={pattern.id}
            to={pattern.path}
            className={`border rounded-lg p-6 transition-all duration-200 ${pattern.color} block`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-semibold">{pattern.title}</h3>
              <div className="flex flex-col gap-1">
                <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(pattern.difficulty)}`}>
                  {pattern.difficulty}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(pattern.status)}`}>
                  {pattern.status}
                </span>
              </div>
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
            
            <div className="mt-4 text-sm text-blue-600 font-medium flex items-center">
              <span>Explore Pattern</span>
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Learning Path Guide */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">📚 Recommended Learning Path</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-green-700 mb-3 flex items-center">
              <span className="text-lg mr-2">🌱</span> Beginners Start Here
            </h3>
            <ol className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-green-600">1.</span>
                <span><strong>Environment-Based Execution</strong> - Learn handler filtering and environment-specific logic</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-green-600">2.</span>
                <span><strong>Time-Based Execution</strong> - Understand schedule-aware processing patterns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-green-600">3.</span>
                <span><strong>Feature Flags</strong> - Master dynamic behavior control and A/B testing</span>
              </li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-medium text-orange-700 mb-3 flex items-center">
              <span className="text-lg mr-2">🚀</span> Advanced Path
            </h3>
            <ol className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-orange-600">1.</span>
                <span><strong>Permission-Based Execution</strong> - Implement security patterns and access control</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-orange-600">2.</span>
                <span><strong>Business Rules</strong> - Build complex logic engines with cascading rules</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-orange-600">3.</span>
                <span><strong>Combined Patterns</strong> - Master enterprise-level pattern coordination</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">🏗️ Architecture Overview</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Handler Registration</h3>
            <p className="text-sm text-blue-800">
              Handlers register with metadata (environment, features, permissions) for conditional execution based on runtime context
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">Pipeline Filtering</h3>
            <p className="text-sm text-green-800">
              Action pipeline intelligently filters handlers based on runtime conditions before execution, ensuring optimal performance
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-900 mb-2">Result Coordination</h3>
            <p className="text-sm text-purple-800">
              Multiple handlers coordinate through stores and pipeline results for complex business workflows
            </p>
          </div>
        </div>
      </div>

      {/* Performance & Best Practices */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-yellow-900 mb-4">💡 Performance Tips & Best Practices</h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-yellow-800">
          <div>
            <h3 className="font-medium mb-2">Performance Optimization:</h3>
            <ul className="space-y-1">
              <li>• Use early returns to avoid unnecessary processing</li>
              <li>• Implement handler priority for optimal execution order</li>
              <li>• Cache expensive computations across handler calls</li>
              <li>• Monitor execution times to identify bottlenecks</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Development Strategy:</h3>
            <ul className="space-y-1">
              <li>• Start with individual patterns before combining</li>
              <li>• Use comprehensive test scenarios for validation</li>
              <li>• Implement proper error handling and fallbacks</li>
              <li>• Document your conditional logic for team collaboration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}