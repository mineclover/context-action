/**
 * @fileoverview Context Store Mouse Events 전용 페이지
 *
 * Context Store Pattern을 집중적으로 보여주는 독립 페이지
 */

import { EnhancedContextStoreContainer } from './context-store-pattern/containers/EnhancedContextStoreContainer';

/**
 * Context Store 마우스 이벤트 전용 페이지
 */
export function ContextStoreMouseEventsPage() {
  console.log(
    '📄 ContextStoreMouseEventsPage render at',
    new Date().toISOString()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="bg-emerald-100 border border-emerald-300 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">🏪</span>
              <div>
                <h1 className="text-3xl font-bold text-emerald-800">
                  Context Store Pattern
                </h1>
                <p className="text-lg text-emerald-600 mt-1">
                  Advanced React Context + Individual Stores Architecture
                </p>
              </div>
            </div>
            <div className="text-sm text-emerald-700 space-y-2">
              <p>
                🎯 <strong>Individual Store Access:</strong> Fine-grained
                reactivity with <code>useMouseEventsStore('position')</code>{' '}
                pattern
              </p>
              <p>
                ⚡ <strong>Selective Subscriptions:</strong> Components
                subscribe only to the data they need
              </p>
              <p>
                🔄 <strong>Action Integration:</strong> Built-in action handling
                with context isolation and automatic updates
              </p>
              <p>
                📊 <strong>Real-time Analytics:</strong> Live performance
                metrics and computed value tracking
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Context Store 컨테이너 */}
        <EnhancedContextStoreContainer />

        {/* 아키텍처 설명 */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-emerald-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-emerald-500">🏗️</span>
              Architecture Benefits
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <div>
                  <strong>Type-Safe Store Access:</strong> Full TypeScript
                  support with individual store typing
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <div>
                  <strong>Automatic Provider Management:</strong> Context
                  providers handle store lifecycle and cleanup
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <div>
                  <strong>Action Pipeline Integration:</strong> Seamless action
                  dispatch with store updates
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <div>
                  <strong>Computed Value Optimization:</strong> Lazy evaluation
                  with automatic dependency tracking
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-emerald-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-emerald-500">⚡</span>
              Performance Features
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <div>
                  <strong>Selective Re-renders:</strong> Components update only
                  when their subscribed data changes
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <div>
                  <strong>Memoized Computations:</strong> Expensive calculations
                  cached until dependencies change
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <div>
                  <strong>Batch Updates:</strong> Multiple store updates
                  combined into single render cycle
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <div>
                  <strong>Context Isolation:</strong> Multiple store instances
                  without interference
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Enhanced Usage Guide */}
        <div className="mt-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-emerald-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="text-2xl">📚</span>
            Interactive Usage Guide & Code Examples
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-emerald-500">🏪</span>
                  Individual Store Access
                </h4>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto font-mono leading-relaxed">
{`// 🎯 Access specific stores
const positionStore = useMouseEventsStore('position');
const movementStore = useMouseEventsStore('movement');
const clicksStore = useMouseEventsStore('clicks');
const computedStore = useMouseEventsStore('computed');
const performanceStore = useMouseEventsStore('performance');

// ⚡ Subscribe to values (reactive)
const position = useStoreValue(positionStore);
const movement = useStoreValue(movementStore);
const clicks = useStoreValue(clicksStore);`}
                </pre>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-blue-500">🚀</span>
                  Action Dispatch Pattern
                </h4>
                <pre className="bg-gray-900 text-blue-400 p-4 rounded-lg text-xs overflow-x-auto font-mono leading-relaxed">
{`// 🎯 Get action dispatcher
const dispatch = useMouseEventsActionDispatch();

// 🖱️ Dispatch mouse events
dispatch('mouseMove', { x, y, timestamp });
dispatch('mouseClick', { x, y, button, timestamp });
dispatch('mouseEnter', { x, y, timestamp });
dispatch('mouseLeave', { x, y, timestamp });

// 🔄 Reset state
dispatch('resetMouseState');`}
                </pre>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-purple-500">🏗️</span>
                  Provider Setup
                </h4>
                <pre className="bg-gray-900 text-purple-400 p-4 rounded-lg text-xs overflow-x-auto font-mono leading-relaxed">
{`// 🏪 Context Store Pattern Provider
<MouseEventsProvider registryId="unique-id">
  <YourComponent />
</MouseEventsProvider>

// 🎯 Or use HOC pattern
const withMouseEvents = withMouseEventsStore('instance-id');
const EnhancedComponent = withMouseEvents(YourComponent);`}
                </pre>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-orange-500">⚡</span>
                  Performance Tips
                </h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span><strong>Selective Subscriptions:</strong> Only subscribe to stores you need</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span><strong>Individual Store Access:</strong> Avoid re-renders on unrelated updates</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span><strong>Action Batching:</strong> Multiple store updates in single action</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span><strong>Computed Values:</strong> Lazy evaluation with automatic caching</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Statistics */}
        <div className="mt-6 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">📊</span>
            Live Demo Statistics
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            The interactive area above demonstrates real-time Context Store Pattern behavior. 
            Watch the store values update as you interact with the demo area.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-600">5</div>
              <div className="text-xs text-emerald-800">Individual Stores</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">∞</div>
              <div className="text-xs text-blue-800">Real-time Updates</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">100%</div>
              <div className="text-xs text-purple-800">Type Safety</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">⚡</div>
              <div className="text-xs text-orange-800">Optimized Renders</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContextStoreMouseEventsPage;
