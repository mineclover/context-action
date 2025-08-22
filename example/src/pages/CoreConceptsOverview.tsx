import React from 'react';
import { Link } from 'react-router-dom';
import { cardVariants, gridVariants } from '../components/ui/variants';

interface CoreConcept {
  id: string;
  title: string;
  description: string;
  path: string;
  category: 'foundation' | 'integration' | 'patterns';
  concepts: string[];
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  order: number;
  icon: string;
}

const coreConcepts: CoreConcept[] = [
  {
    id: 'basics',
    title: 'Core Basics',
    description: 'Fundamental concepts of the Context-Action framework including action registration and pipeline execution',
    path: '/core/basics',
    category: 'foundation',
    concepts: ['ActionRegister', 'Handler Registration', 'Pipeline Execution', 'Error Handling'],
    difficulty: 'Basic',
    order: 1,
    icon: '🎯'
  },
  {
    id: 'advanced',
    title: 'Core Advanced',
    description: 'Advanced action pipeline features including priority management and result handling',
    path: '/core/advanced',
    category: 'foundation',
    concepts: ['Priority System', 'Handler Results', 'Pipeline Controller', 'Abort Mechanisms'],
    difficulty: 'Intermediate',
    order: 2,
    icon: '⚡'
  },
  {
    id: 'features',
    title: 'Core Features',
    description: 'Complete feature showcase with interactive examples and comprehensive testing',
    path: '/core/features',
    category: 'foundation',
    concepts: ['Feature Showcase', 'Interactive Examples', 'Performance Metrics', 'Best Practices'],
    difficulty: 'Advanced',
    order: 3,
    icon: '🚀'
  },
  {
    id: 'store-basics',
    title: 'Store Basics',
    description: 'State management fundamentals with reactive store patterns and integration',
    path: '/store/basics',
    category: 'integration',
    concepts: ['Store Creation', 'Reactive Updates', 'Subscription Patterns', 'Store Integration'],
    difficulty: 'Basic',
    order: 4,
    icon: '🏪'
  },
  {
    id: 'immutability',
    title: 'Immutability Test',
    description: 'Deep dive into immutability patterns and state safety verification',
    path: '/store/immutability-test',
    category: 'integration',
    concepts: ['Immutable Updates', 'State Safety', 'Reference Equality', 'Performance Impact'],
    difficulty: 'Intermediate',
    order: 5,
    icon: '🔒'
  },
  {
    id: 'provider',
    title: 'Unified Provider',
    description: 'React integration with unified provider patterns and context management',
    path: '/react/provider',
    category: 'integration',
    concepts: ['Provider Patterns', 'Context Integration', 'Unified Architecture', 'Component Isolation'],
    difficulty: 'Intermediate',
    order: 6,
    icon: '🔧'
  },
  {
    id: 'context',
    title: 'React Context',
    description: 'React Context API integration with Context-Action framework patterns',
    path: '/react/context',
    category: 'integration',
    concepts: ['Context API', 'Provider Trees', 'Context Consumption', 'Performance Optimization'],
    difficulty: 'Intermediate',
    order: 7,
    icon: '🏗️'
  },
  {
    id: 'hooks',
    title: 'React Hooks',
    description: 'Essential React hooks for Context-Action integration and state management',
    path: '/react/hooks',
    category: 'integration',
    concepts: ['useActionDispatch', 'useStoreValue', 'useActionHandler', 'Custom Hooks'],
    difficulty: 'Basic',
    order: 8,
    icon: '🎣'
  },
  {
    id: 'action-result',
    title: 'useActionWithResult',
    description: 'Advanced hook for action execution with result handling and loading states',
    path: '/react/useActionWithResult',
    category: 'patterns',
    concepts: ['Result Handling', 'Loading States', 'Error Management', 'Async Patterns'],
    difficulty: 'Advanced',
    order: 9,
    icon: '✨'
  },
  {
    id: 'unified-pattern',
    title: 'Unified Pattern',
    description: 'Complete integration pattern combining actions, stores, and React components',
    path: '/unified-pattern/demo',
    category: 'patterns',
    concepts: ['Pattern Integration', 'Architecture Design', 'Best Practices', 'Production Patterns'],
    difficulty: 'Advanced',
    order: 10,
    icon: '🚀'
  }
];

function CoreConceptsOverview() {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Basic': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'foundation': return 'border-l-red-500';
      case 'integration': return 'border-l-blue-500';
      case 'patterns': return 'border-l-purple-500';
      default: return 'border-l-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'foundation': return '🏗️';
      case 'integration': return '🔗';
      case 'patterns': return '🎨';
      default: return '📝';
    }
  };

  const categoryGroups = {
    foundation: coreConcepts.filter(concept => concept.category === 'foundation'),
    integration: coreConcepts.filter(concept => concept.category === 'integration'),
    patterns: coreConcepts.filter(concept => concept.category === 'patterns')
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
        
        <h1 className="text-4xl font-bold mb-4">🎯 Core Concepts</h1>
        <p className="text-xl text-gray-600 mb-4">
          Fundamental concepts and integration patterns of the Context-Action framework
        </p>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-sm text-indigo-800">
            <strong>Learning Path:</strong> This section provides a structured learning path through the core concepts 
            of Context-Action framework. Start with Foundation concepts, move to Integration patterns, and finish 
            with advanced Patterns. Each concept builds upon the previous ones for optimal understanding.
          </p>
        </div>
      </div>

      {/* Learning Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{categoryGroups.foundation.length}</div>
          <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
            <span>🏗️</span> Foundation
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{categoryGroups.integration.length}</div>
          <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
            <span>🔗</span> Integration
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{categoryGroups.patterns.length}</div>
          <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
            <span>🎨</span> Patterns
          </div>
        </div>
      </div>

      {/* Sequential Learning Path */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">📖 Sequential Learning Path</h2>
        <p className="text-gray-600 mb-6">
          Follow this numbered sequence for optimal learning progression
        </p>
        <div className="space-y-4">
          {coreConcepts.sort((a, b) => a.order - b.order).map((concept) => (
            <Link
              key={concept.id}
              to={concept.path}
              className={`${cardVariants({ variant: 'outlined', hover: true })} ${getCategoryColor(concept.category)} border-l-4 block`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-gray-600">{concept.order}</span>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-2xl">{concept.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold">{concept.title}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        {getCategoryIcon(concept.category)} {concept.category}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(concept.difficulty)}`}>
                        {concept.difficulty}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{concept.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {concept.concepts.map((conceptItem, index) => (
                      <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {conceptItem}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Category-based Grouping */}
      <div className="space-y-10">
        {/* Foundation */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-4 h-4 bg-red-500 rounded"></span>
            🏗️ Foundation Concepts
          </h2>
          <p className="text-gray-600 mb-6">
            Core framework concepts and fundamental patterns
          </p>
          <div className={gridVariants({ cols: 3 })}>
            {categoryGroups.foundation.map((concept) => (
              <Link
                key={concept.id}
                to={concept.path}
                className={`${cardVariants({ variant: 'outlined', hover: true })} ${getCategoryColor(concept.category)} border-l-4 block`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{concept.icon}</span>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Step {concept.order}</span>
                      <h3 className="text-lg font-semibold">{concept.title}</h3>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4 text-sm">{concept.description}</p>
                
                <div className="flex flex-wrap gap-1">
                  {concept.concepts.slice(0, 2).map((conceptItem, index) => (
                    <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {conceptItem}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Integration */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-4 h-4 bg-blue-500 rounded"></span>
            🔗 Integration Patterns
          </h2>
          <p className="text-gray-600 mb-6">
            React integration, state management, and component patterns
          </p>
          <div className={gridVariants({ cols: 2 })}>
            {categoryGroups.integration.map((concept) => (
              <Link
                key={concept.id}
                to={concept.path}
                className={`${cardVariants({ variant: 'outlined', hover: true })} ${getCategoryColor(concept.category)} border-l-4 block`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{concept.icon}</span>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Step {concept.order}</span>
                      <h3 className="text-lg font-semibold">{concept.title}</h3>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(concept.difficulty)}`}>
                    {concept.difficulty}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-4">{concept.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {concept.concepts.map((conceptItem, index) => (
                    <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {conceptItem}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Patterns */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-4 h-4 bg-purple-500 rounded"></span>
            🎨 Advanced Patterns
          </h2>
          <p className="text-gray-600 mb-6">
            Advanced integration patterns and production-ready architectures
          </p>
          <div className={gridVariants({ cols: 2 })}>
            {categoryGroups.patterns.map((concept) => (
              <Link
                key={concept.id}
                to={concept.path}
                className={`${cardVariants({ variant: 'outlined', hover: true })} ${getCategoryColor(concept.category)} border-l-4 block`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{concept.icon}</span>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Step {concept.order}</span>
                      <h3 className="text-lg font-semibold">{concept.title}</h3>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(concept.difficulty)}`}>
                    {concept.difficulty}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-4">{concept.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {concept.concepts.map((conceptItem, index) => (
                    <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {conceptItem}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Key Concepts Summary */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">🎯 Key Framework Concepts</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-red-700 mb-3 flex items-center">
              <span className="text-lg mr-2">🏗️</span> Foundation
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Action pipeline and registration</li>
              <li>• Handler priority and execution</li>
              <li>• Error handling and recovery</li>
              <li>• Performance monitoring</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-blue-700 mb-3 flex items-center">
              <span className="text-lg mr-2">🔗</span> Integration
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• React hooks and providers</li>
              <li>• State management patterns</li>
              <li>• Context API integration</li>
              <li>• Component architecture</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-purple-700 mb-3 flex items-center">
              <span className="text-lg mr-2">🎨</span> Patterns
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Advanced result handling</li>
              <li>• Unified architecture design</li>
              <li>• Production best practices</li>
              <li>• Scalable patterns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoreConceptsOverview;