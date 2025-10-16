/**
 * @fileoverview Mouse Events Index Page
 *
 * Navigation hub for all mouse events implementations
 */

import { Link } from 'react-router-dom';
import { PageWithLogMonitor } from '@/components/LogMonitor';
import { Badge } from '@/components/ui';

export function MouseEventsIndexPage() {
  // 메인 아키텍처 패턴 비교 (핵심 3가지)
  const mainPatterns = [
    {
      path: '/actionguard/mouse-events/legacy',
      title: '📜 Legacy Pattern',
      description:
        'Action Context + useState - Simple action dispatching with local state',
      features: [
        'Action dispatching',
        'useState hook',
        'Component state',
        'Simple structure',
      ],
      performance: 'Basic',
      complexity: 'Simple',
      color: 'purple',
    },
    {
      path: '/actionguard/mouse-events/reactive',
      title: '🔔 Reactive Pattern',
      description:
        'MVVM + Store Context + useStoreValue - Traditional React rendering with Store subscriptions',
      features: [
        'Store subscriptions',
        'React re-renders',
        'MVVM architecture',
        'Reactive updates',
      ],
      performance: 'Very Good',
      complexity: 'Advanced',
      color: 'purple',
    },
    {
      path: '/actionguard/mouse-events/non-reactive',
      title: '🚀 Non-Reactive Pattern',
      description:
        'MVVM + Store Context + RefContext - Zero React re-renders with direct DOM manipulation',
      features: [
        'Zero re-renders',
        'Direct DOM',
        'RefContext optimization',
        'Maximum performance',
      ],
      performance: 'Excellent',
      complexity: 'Advanced',
      color: 'green',
    },
  ];

  // 추가 구현 예시들 (특화된 데모들)
  const additionalExamples = [
    {
      path: '/actionguard/mouse-events/context-store-action',
      title: '⚡ Action-Based Store Demo',
      description: 'Action-driven state management with Store integration',
      features: [
        'Action handlers',
        'Store integration',
        'Event-driven',
        'Business logic separation',
      ],
      performance: 'Good',
      complexity: 'Intermediate',
      color: 'indigo',
    },
    {
      path: '/actionguard/mouse-events/canvas-ref-demo',
      title: '🎨 Canvas RefContext Demo',
      description:
        'Advanced RefContext with Canvas API for maximum performance',
      features: [
        'Canvas API',
        'GPU acceleration',
        'Direct DOM access',
        'Type-safe refs',
      ],
      performance: 'Excellent',
      complexity: 'Advanced',
      color: 'emerald',
    },
    {
      path: '/actionguard/mouse-events/context-store',
      title: '🏪 Context Store Demo',
      description: 'Traditional context-based store management',
      features: [
        'Context providers',
        'Store patterns',
        'React integration',
        'State management',
      ],
      performance: 'Good',
      complexity: 'Intermediate',
      color: 'blue',
    },
  ];

  return (
    <PageWithLogMonitor
      pageId="mouse-events-index"
      title="Mouse Events Implementations"
      initialConfig={{ enableToast: false, maxLogs: 20 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>🖱️ Mouse Events Architecture Patterns</h1>
          <p className="page-description">
            Compare three distinct architectural patterns for mouse event
            handling: Legacy (Action Context), Reactive (Store subscriptions),
            and Non-Reactive (RefContext optimization). Each demonstrates
            different trade-offs between simplicity, reactivity, and
            performance.
          </p>
        </header>

        {/* 메인 아키텍처 패턴 비교 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              🎯 Core Architecture Patterns
            </h2>
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              Pattern Comparison
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {mainPatterns.map((impl, index) => (
              <div
                key={impl.path}
                className={`bg-${impl.color}-50 border border-${impl.color}-200 rounded-lg p-6 hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {impl.title}
                  </h3>
                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className={`bg-${impl.color}-100 text-${impl.color}-800`}
                    >
                      {impl.performance}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-gray-100 text-gray-700"
                    >
                      {impl.complexity}
                    </Badge>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{impl.description}</p>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Key Features:
                  </h4>
                  <ul className="grid grid-cols-1 gap-1 text-sm text-gray-600">
                    {impl.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to={impl.path}
                  className={`inline-flex items-center gap-2 px-4 py-2 bg-${impl.color}-600 text-white rounded-lg hover:bg-${impl.color}-700 transition-colors text-sm font-medium w-full justify-center`}
                >
                  View Implementation
                  <span>→</span>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* 추가 특화 데모들 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              🛠️ Specialized Demos
            </h2>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Advanced Examples
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {additionalExamples.map((impl, index) => (
              <div
                key={impl.path}
                className={`bg-${impl.color}-50 border border-${impl.color}-200 rounded-lg p-6 hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {impl.title}
                  </h3>
                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className={`bg-${impl.color}-100 text-${impl.color}-800`}
                    >
                      {impl.performance}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-gray-100 text-gray-700"
                    >
                      {impl.complexity}
                    </Badge>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{impl.description}</p>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Key Features:
                  </h4>
                  <ul className="grid grid-cols-1 gap-1 text-sm text-gray-600">
                    {impl.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to={impl.path}
                  className={`inline-flex items-center gap-2 px-4 py-2 bg-${impl.color}-600 text-white rounded-lg hover:bg-${impl.color}-700 transition-colors text-sm font-medium w-full justify-center`}
                >
                  View Demo
                  <span>→</span>
                </Link>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🎯 Architecture Pattern Comparison
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-purple-100 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">
                📜 Legacy Pattern
              </h3>
              <div className="space-y-2 text-purple-700">
                <p>
                  <strong>Architecture:</strong> Action Context + useState
                </p>
                <p>
                  <strong>Performance:</strong> Basic (frequent re-renders)
                </p>
                <p>
                  <strong>Complexity:</strong> Simple
                </p>
                <p>
                  <strong>Best for:</strong> Learning, prototyping
                </p>
              </div>
            </div>

            <div className="bg-purple-100 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">
                🔔 Reactive Pattern
              </h3>
              <div className="space-y-2 text-purple-700">
                <p>
                  <strong>Architecture:</strong> MVVM + Store + useStoreValue
                </p>
                <p>
                  <strong>Performance:</strong> Very Good (optimized
                  subscriptions)
                </p>
                <p>
                  <strong>Complexity:</strong> Advanced
                </p>
                <p>
                  <strong>Best for:</strong> Production, complex state
                </p>
              </div>
            </div>

            <div className="bg-green-100 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">
                🚀 Non-Reactive Pattern
              </h3>
              <div className="space-y-2 text-green-700">
                <p>
                  <strong>Architecture:</strong> MVVM + Store + RefContext
                </p>
                <p>
                  <strong>Performance:</strong> Excellent (zero re-renders)
                </p>
                <p>
                  <strong>Complexity:</strong> Advanced
                </p>
                <p>
                  <strong>Best for:</strong> High-frequency updates, animations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWithLogMonitor>
  );
}
