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
    description: 'Fundamental concepts of the Context-Action framework including createActionContext pattern and handler registration',
    path: '/core/basics',
    category: 'foundation',
    concepts: ['createActionContext', 'Handler Registration', 'Action Dispatch', 'Provider Pattern'],
    difficulty: 'Basic',
    order: 1,
    icon: '🎯'
  },
  {
    id: 'advanced',
    title: 'Core Advanced',
    description: 'Advanced action pipeline features including priority management, result handling, and complex workflows',
    path: '/core/advanced',
    category: 'foundation',
    concepts: ['Priority System', 'Handler Results', 'Pipeline Controller', 'Abort Mechanisms'],
    difficulty: 'Intermediate',
    order: 2,
    icon: '⚡'
  },
  {
    id: 'store-basics',
    title: 'Store Basics',
    description: 'State management fundamentals with reactive store patterns and declarative store integration',
    path: '/store/basics',
    category: 'integration',
    concepts: ['Store Creation', 'Reactive Updates', 'Subscription Patterns', 'Declarative Store Pattern'],
    difficulty: 'Basic',
    order: 3,
    icon: '🏪'
  },
  {
    id: 'immutability',
    title: 'Immutability Test',
    description: 'Deep dive into immutability patterns and state safety verification with performance analysis',
    path: '/store/immutability-test',
    category: 'integration',
    concepts: ['Immutable Updates', 'State Safety', 'Reference Equality', 'Performance Impact'],
    difficulty: 'Intermediate',
    order: 4,
    icon: '🔒'
  },
  {
    id: 'useStoreValue-patterns',
    title: 'useStoreValue Patterns',
    description: 'Core useStoreValue patterns for selective subscriptions, conditional updates, and comparison strategies',
    path: '/store/useStoreValue-patterns',
    category: 'patterns',
    concepts: ['Selective Subscriptions', 'Conditional Updates', 'Comparison Strategies', 'Performance Optimization'],
    difficulty: 'Intermediate',
    order: 5,
    icon: '🎯'
  },
  {
    id: 'useStoreSelector-patterns',
    title: 'useStoreSelector Patterns',
    description: 'Multiple store selection patterns for combining and transforming data from multiple stores',
    path: '/store/useStoreSelector-patterns',
    category: 'patterns',
    concepts: ['Multi-Store Selection', 'Data Transformation', 'Complex Aggregation', 'Memoized Selectors'],
    difficulty: 'Advanced',
    order: 6,
    icon: '🔍'
  },
  {
    id: 'useStoreManager-api',
    title: 'useStoreManager API',
    description: 'Low-level store access for advanced operations, bulk updates, and direct store management',
    path: '/store/useStoreManager-api',
    category: 'patterns',
    concepts: ['Direct Store Access', 'Bulk Operations', 'Advanced Management', 'Performance Patterns'],
    difficulty: 'Advanced',
    order: 7,
    icon: '⚙️'
  },
  {
    id: 'useComputedStore-patterns',
    title: 'useComputedStore Patterns',
    description: 'Computed value patterns with useComputedStore for derived state and reactive calculations',
    path: '/store/useComputedStore-patterns',
    category: 'patterns',
    concepts: ['Derived State', 'Reactive Calculations', 'Multi-Store Computations', 'Performance Optimization'],
    difficulty: 'Intermediate',
    order: 8,
    icon: '🧮'
  },
  {
    id: 'withProvider-pattern',
    title: 'withProvider Pattern',
    description: 'Higher-Order Component pattern for automatic Provider wrapping and clean component trees',
    path: '/store/withProvider-pattern',
    category: 'patterns',
    concepts: ['HOC Pattern', 'Provider Composition', 'Component Wrapping', 'Clean Architecture'],
    difficulty: 'Advanced',
    order: 9,
    icon: '🔧'
  },
  {
    id: 'store-configuration',
    title: 'Store Configuration',
    description: 'Performance optimization and custom comparison strategies for complex store scenarios',
    path: '/store/store-configuration',
    category: 'patterns',
    concepts: ['Comparison Strategies', 'Performance Tuning', 'Custom Comparators', 'Memory Optimization'],
    difficulty: 'Advanced',
    order: 10,
    icon: '⚙️'
  },
  {
    id: 'performance-patterns',
    title: 'Performance Patterns',
    description: 'Performance optimization patterns including memoization, batching, and debugging techniques',
    path: '/store/performance-patterns',
    category: 'patterns',
    concepts: ['Memoization', 'Batched Updates', 'Subscription Optimization', 'Performance Monitoring'],
    difficulty: 'Advanced',
    order: 11,
    icon: '⚡'
  },
  {
    id: 'action-basic-usage',
    title: 'Action Basic Usage',
    description: 'Fundamental action patterns with type-safe dispatching and handler registration',
    path: '/action/basic-usage',
    category: 'patterns',
    concepts: ['Action Dispatching', 'Handler Registration', 'Result Handling', 'Multiple Contexts'],
    difficulty: 'Basic',
    order: 12,
    icon: '🎯'
  },
  {
    id: 'action-type-system',
    title: 'Action Type System',
    description: 'Complete TypeScript integration with ActionPayloadMap and type safety patterns',
    path: '/action/type-system',
    category: 'patterns',
    concepts: ['Type Safety', 'ActionPayloadMap', 'Generic Types', 'IntelliSense Support'],
    difficulty: 'Intermediate',
    order: 13,
    icon: '🔧'
  },
  {
    id: 'action-dispatch-patterns',
    title: 'Action Dispatch Patterns',
    description: 'Advanced dispatching with execution modes, filtering, and performance optimization',
    path: '/action/dispatch-patterns',
    category: 'patterns',
    concepts: ['Execution Modes', 'Handler Filtering', 'Performance Optimization', 'Batch Processing'],
    difficulty: 'Advanced',
    order: 14,
    icon: '⚡'
  },
  {
    id: 'provider',
    title: 'Unified Provider',
    description: 'React integration with unified provider patterns and context management architecture',
    path: '/react/provider',
    category: 'integration',
    concepts: ['Provider Patterns', 'Context Integration', 'Unified Architecture', 'Component Isolation'],
    difficulty: 'Intermediate',
    order: 15,
    icon: '🔧'
  },
  {
    id: 'context',
    title: 'React Context',
    description: 'React Context API integration with Context-Action framework patterns and best practices',
    path: '/react/context',
    category: 'integration',
    concepts: ['Context API', 'Provider Trees', 'Context Consumption', 'Performance Optimization'],
    difficulty: 'Intermediate',
    order: 16,
    icon: '🏗️'
  },
  {
    id: 'hooks',
    title: 'React Hooks',
    description: 'Essential React hooks for Context-Action integration and comprehensive state management',
    path: '/react/hooks',
    category: 'integration',
    concepts: ['useActionDispatch', 'useStoreValue', 'useActionHandler', 'Custom Hooks'],
    difficulty: 'Basic',
    order: 17,
    icon: '🎣'
  },
  {
    id: 'action-result',
    title: 'useActionWithResult',
    description: 'Advanced hook for action execution with result handling, loading states, and complex workflow orchestration',
    path: '/react/useActionWithResult',
    category: 'patterns',
    concepts: ['Result Collection', 'Sequential Execution', 'Parallel Execution', 'Result Strategies'],
    difficulty: 'Advanced',
    order: 18,
    icon: '✨'
  },
  {
    id: 'async-basic-usage',
    title: 'Async Basic Usage',
    description: 'Comprehensive async patterns with real-time state access and timeout protection',
    path: '/async/basic-usage',
    category: 'patterns',
    concepts: ['Real-time State', 'Wait-then-Execute', 'Timeout Protection', 'Conditional Await'],
    difficulty: 'Intermediate',
    order: 19,
    icon: '⏳'
  },
  {
    id: 'async-realtime-state',
    title: 'Real-time State Access',
    description: 'Avoiding closure traps with store.getValue() patterns and race condition prevention',
    path: '/async/realtime-state',
    category: 'patterns',
    concepts: ['Closure Traps', 'Race Conditions', 'Multi-Store Coordination', 'State Validation'],
    difficulty: 'Intermediate',
    order: 20,
    icon: '🔄'
  },
  {
    id: 'async-wait-execute',
    title: 'Wait-Then-Execute',
    description: 'Safe DOM operations after element availability with sequential coordination',
    path: '/async/wait-then-execute',
    category: 'patterns',
    concepts: ['Element Waiting', 'Sequential Operations', 'Animation Coordination', 'Form Validation'],
    difficulty: 'Intermediate',
    order: 21,
    icon: '🎯'
  },
  {
    id: 'async-timeout-protection',
    title: 'Timeout Protection',
    description: 'Preventing infinite waits with fallback strategies and circuit breaker patterns',
    path: '/async/timeout-protection',
    category: 'patterns',
    concepts: ['Timeout Strategies', 'Circuit Breaker', 'Fallback Patterns', 'Performance Monitoring'],
    difficulty: 'Advanced',
    order: 22,
    icon: '⏰'
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
        
        {/* Framework Overview */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">🏗️ Context-Action Framework Overview</h2>
          <p className="text-blue-800 mb-4">
            Context-Action은 React 애플리케이션을 위한 혁신적인 상태 관리 프레임워크로, 
            <strong> 문서 중심의 컨텍스트 분리</strong>와 <strong>효과적인 아티팩트 관리</strong>를 통해 
            기존 라이브러리의 한계를 극복합니다.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">🎯 핵심 철학</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>문서-아티팩트 중심 설계:</strong> 문서 테마별 컨텍스트 분리</li>
                <li>• <strong>완벽한 관심사 분리:</strong> View, ViewModel, Model의 명확한 경계</li>
                <li>• <strong>타입 안전성:</strong> 전체 시스템에 걸친 엄격한 타입 검사</li>
                <li>• <strong>MVVM 아키텍처:</strong> 비즈니스 로직의 체계적 관리</li>
              </ul>
            </div>
            
            <div className="bg-white/50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">🔧 해결하는 문제</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>높은 React 결합도:</strong> 컴포넌트 모듈화 및 props 처리 어려움</li>
                <li>• <strong>이진 상태 접근:</strong> 단순 전역/로컬 상태 구분의 한계</li>
                <li>• <strong>핸들러/트리거 관리:</strong> 복잡한 상호작용 및 비즈니스 로직 처리</li>
                <li>• <strong>스케일링 문제:</strong> 대규모 애플리케이션에서의 상태 관리</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Architecture Diagram */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📐 아키텍처 구조</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
              <h3 className="font-medium text-green-700 mb-2">🎨 View Layer</h3>
              <p className="text-sm text-gray-600 mb-2">React Components</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• UI 렌더링</li>
                <li>• 사용자 상호작용</li>
                <li>• 상태 구독</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-medium text-blue-700 mb-2">⚡ ViewModel Layer</h3>
              <p className="text-sm text-gray-600 mb-2">Action Pipeline</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• 비즈니스 로직</li>
                <li>• 액션 처리</li>
                <li>• 상태 변경</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
              <h3 className="font-medium text-purple-700 mb-2">🏪 Model Layer</h3>
              <p className="text-sm text-gray-600 mb-2">Store System</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• 상태 관리</li>
                <li>• 데이터 영속성</li>
                <li>• 반응형 업데이트</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Two Main Patterns */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-amber-900 mb-4">🎭 두 가지 주요 패턴</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h3 className="font-medium text-amber-800 mb-2">🎯 Action Only Pattern</h3>
              <p className="text-sm text-gray-600 mb-2">
                <code className="bg-amber-100 px-2 py-1 rounded text-xs">createActionContext</code>
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 순수 액션 디스패칭 (상태 관리 없음)</li>
                <li>• 이벤트 시스템, 커맨드 패턴</li>
                <li>• 타입 안전한 액션 디스패치</li>
                <li>• 경량화된 구조</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg">
              <h3 className="font-medium text-amber-800 mb-2">🏪 Store Only Pattern</h3>
              <p className="text-sm text-gray-600 mb-2">
                <code className="bg-amber-100 px-2 py-1 rounded text-xs">createDeclarativeStorePattern</code>
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 순수 상태 관리 (액션 디스패치 없음)</li>
                <li>• 데이터 레이어, 단순 상태</li>
                <li>• 뛰어난 타입 추론</li>
                <li>• 간소화된 API</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-sm text-indigo-800">
            <strong>학습 경로:</strong> 이 섹션은 Context-Action 프레임워크의 핵심 개념들을 체계적으로 학습할 수 있는 
            구조화된 경로를 제공합니다. Foundation 개념부터 시작하여 Integration 패턴으로 진행하고, 
            고급 Patterns로 마무리합니다. 각 개념은 이전 개념들을 기반으로 구성되어 있어 순차적 학습이 최적입니다.
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
        <h2 className="text-2xl font-semibold mb-4">🎯 핵심 프레임워크 개념</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-red-700 mb-3 flex items-center">
              <span className="text-lg mr-2">🏗️</span> Foundation (기초)
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <code>createActionContext</code> 패턴</li>
              <li>• 핸들러 등록 및 우선순위</li>
              <li>• 액션 파이프라인 실행</li>
              <li>• 에러 처리 및 복구</li>
              <li>• 성능 모니터링</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-blue-700 mb-3 flex items-center">
              <span className="text-lg mr-2">🔗</span> Integration (통합)
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• React hooks 및 providers</li>
              <li>• <code>createDeclarativeStorePattern</code></li>
              <li>• Context API 통합</li>
              <li>• 컴포넌트 아키텍처</li>
              <li>• 반응형 상태 구독</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-purple-700 mb-3 flex items-center">
              <span className="text-lg mr-2">🎨</span> Patterns (패턴)
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <code>useActionWithResult</code> 고급 패턴</li>
              <li>• Sequential/Parallel 실행</li>
              <li>• 결과 수집 및 전략</li>
              <li>• 프로덕션 최적 사례</li>
              <li>• 확장 가능한 아키텍처</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-green-900 mb-4">🚀 빠른 시작 가이드</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-green-800 mb-3">📖 권장 학습 순서</h3>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li><strong>Core Basics</strong> - createActionContext 패턴 이해</li>
              <li><strong>Store Basics</strong> - 상태 관리 기초</li>
              <li><strong>React Hooks</strong> - 필수 hooks 학습</li>
              <li><strong>Core Advanced</strong> - 고급 액션 파이프라인</li>
              <li><strong>useActionWithResult</strong> - 고급 결과 처리</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-medium text-green-800 mb-3">⚡ 실전 적용 팁</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• 간단한 상태: <strong>Store Only Pattern</strong> 사용</li>
              <li>• 이벤트 처리: <strong>Action Only Pattern</strong> 사용</li>
              <li>• 복합 앱: 두 패턴을 <strong>조합</strong>하여 사용</li>
              <li>• 항상 <code>useCallback</code>으로 핸들러 최적화</li>
              <li>• 타입 안전성을 위해 인터페이스 정의</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-yellow-900 mb-4">💡 모범 사례</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">🎯 Action 패턴</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• 명확한 액션 인터페이스 정의</li>
              <li>• Provider로 컴포넌트 감싸기</li>
              <li>• useCallback으로 핸들러 메모화</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">🏪 Store 패턴</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• 초기값으로 타입 추론 활용</li>
              <li>• useStoreValue로 반응형 구독</li>
              <li>• 불변성 원칙 준수</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">⚡ 성능 최적화</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• 필요한 상태만 구독</li>
              <li>• 핸들러 우선순위 활용</li>
              <li>• 메모리 누수 방지</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoreConceptsOverview;