/**
 * @fileoverview Mouse Events Index Page
 * 
 * Navigation hub for all mouse events implementations
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { PageWithLogMonitor } from '../../components/LogMonitor';
import { Badge } from '../../components/ui';

export function MouseEventsIndexPage() {
  const implementations = [
    {
      path: '/actionguard/mouse-events/ref-context',
      title: '🎯 RefContext Implementation',
      description: 'Advanced separation of concerns using createRefContext with three independent domain contexts for maximum performance and maintainability',
      features: ['🎯 Position Context: cursor & trail management', '🎨 Visual Effects: click animations & SVG paths', '📊 Performance: FPS tracking & metrics', '⚡ Zero React re-renders with direct DOM'],
      performance: 'Excellent',
      complexity: 'Advanced',
      color: 'purple'
    },
    {
      path: '/actionguard/mouse-events/optimized',
      title: '🚀 Optimized (Canvas-style)',
      description: 'Zero React re-renders with isolated rendering',
      features: ['Canvas-style rendering', '60fps performance', 'Zero re-renders', 'Hardware acceleration'],
      performance: 'Excellent',
      complexity: 'Advanced',
      color: 'emerald'
    },
    {
      path: '/actionguard/mouse-events/enhanced-context-store',
      title: '🏪 Enhanced Context Store',
      description: 'Advanced Context Store with real-time debugging',
      features: ['Individual store access', 'Real-time debugger', 'Performance metrics', 'Fine-grained reactivity'],
      performance: 'Very Good',
      complexity: 'Advanced',
      color: 'blue'
    },
    {
      path: '/actionguard/mouse-events/context-store-action',
      title: '⚡ Context Store Action-Based',
      description: 'Action-based state management with reactive updates',
      features: ['Action handlers', 'Store integration', 'Event-driven', 'Reactive updates'],
      performance: 'Good',
      complexity: 'Intermediate',
      color: 'purple'
    },
    {
      path: '/actionguard/mouse-events/clean-architecture',
      title: '🏗️ Clean Architecture',
      description: 'Traditional Clean Architecture with separated layers',
      features: ['Pure View components', 'Controller layer', 'Service layer', 'Dependency injection'],
      performance: 'Good',
      complexity: 'Intermediate',
      color: 'orange'
    },
    {
      path: '/actionguard/mouse-events/legacy',
      title: '📜 Legacy Implementation',
      description: 'Original implementation with React state management',
      features: ['React state', 'Traditional hooks', 'Component-based', 'Simple structure'],
      performance: 'Basic',
      complexity: 'Simple',
      color: 'gray'
    }
  ];

  return (
    <PageWithLogMonitor
      pageId="mouse-events-index"
      title="Mouse Events Implementations"
      initialConfig={{ enableToast: false, maxLogs: 20 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>🖱️ Mouse Events Implementations</h1>
          <p className="page-description">
            Explore different approaches to mouse event handling with varying optimization strategies.
            Each implementation showcases different architectural patterns and performance techniques.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {implementations.map((impl, index) => (
            <div key={impl.path} className={`bg-${impl.color}-50 border border-${impl.color}-200 rounded-lg p-6 hover:shadow-lg transition-shadow`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {impl.title}
                </h2>
                <div className="flex gap-2">
                  <Badge variant="outline" className={`bg-${impl.color}-100 text-${impl.color}-800`}>
                    {impl.performance}
                  </Badge>
                  <Badge variant="outline" className="bg-gray-100 text-gray-700">
                    {impl.complexity}
                  </Badge>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">
                {impl.description}
              </p>
              
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Key Features:</h3>
                <ul className="grid grid-cols-2 gap-1 text-sm text-gray-600">
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
                className={`inline-flex items-center gap-2 px-4 py-2 bg-${impl.color}-600 text-white rounded-lg hover:bg-${impl.color}-700 transition-colors text-sm font-medium`}
              >
                View Implementation
                <span>→</span>
              </Link>
            </div>
          ))}
        </div>

        {/* RefContext Spotlight Section */}
        <div className="mt-8 bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🎯</span>
            <div>
              <h2 className="text-xl font-bold text-purple-900">
                RefContext Implementation Spotlight
              </h2>
              <p className="text-purple-700 text-sm">
                The most advanced approach with perfect separation of concerns
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🏗️</span>
                <h3 className="font-semibold text-purple-900">Architecture Benefits</h3>
              </div>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• <strong>Independent Contexts:</strong> Each domain (position, effects, metrics) managed separately</li>
                <li>• <strong>Type Safety:</strong> Full TypeScript support with createRefContext API</li>
                <li>• <strong>Clean Boundaries:</strong> No cross-contamination between concerns</li>
                <li>• <strong>Testable:</strong> Each context can be unit tested independently</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">⚡</span>
                <h3 className="font-semibold text-purple-900">Performance Features</h3>
              </div>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• <strong>Zero Re-renders:</strong> Direct DOM manipulation bypasses React</li>
                <li>• <strong>Hardware Acceleration:</strong> Uses transform3d for smooth animations</li>
                <li>• <strong>60fps Throttling:</strong> Optimized update frequency</li>
                <li>• <strong>Real-time Metrics:</strong> Live performance monitoring</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🎨</span>
                <h3 className="font-semibold text-purple-900">User Experience</h3>
              </div>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• <strong>Smooth Interactions:</strong> Cursor tracking with trail effects</li>
                <li>• <strong>Visual Feedback:</strong> Click animations and path visualization</li>
                <li>• <strong>Performance Insights:</strong> FPS counter and metrics dashboard</li>
                <li>• <strong>Responsive Controls:</strong> Real-time settings and configuration</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🎯 Performance Comparison Guide
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-emerald-100 p-3 rounded-lg">
              <h3 className="font-semibold text-emerald-800 mb-1">Excellent</h3>
              <p className="text-emerald-700">Zero React re-renders, hardware acceleration, 60fps+</p>
            </div>
            
            <div className="bg-blue-100 p-3 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-1">Very Good</h3>
              <p className="text-blue-700">Optimized subscriptions, selective updates, good performance</p>
            </div>
            
            <div className="bg-purple-100 p-3 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-1">Good</h3>
              <p className="text-purple-700">Decent optimization, some re-renders, acceptable performance</p>
            </div>
            
            <div className="bg-gray-100 p-3 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-1">Basic</h3>
              <p className="text-gray-700">Traditional React patterns, frequent re-renders, simple approach</p>
            </div>
          </div>
        </div>
      </div>
    </PageWithLogMonitor>
  );
}