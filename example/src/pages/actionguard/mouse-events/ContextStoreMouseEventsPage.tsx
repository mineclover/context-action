/**
 * @fileoverview Context Store Mouse Events 전용 페이지
 * 
 * Context Store Pattern을 집중적으로 보여주는 독립 페이지
 */

import { EnhancedContextStoreContainer } from './containers/EnhancedContextStoreContainer';

/**
 * Context Store 마우스 이벤트 전용 페이지
 */
export function ContextStoreMouseEventsPage() {
  console.log('📄 ContextStoreMouseEventsPage render at', new Date().toISOString());
  
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
                🎯 <strong>Individual Store Access:</strong> Fine-grained reactivity with <code>useMouseEventsStore('position')</code> pattern
              </p>
              <p>
                ⚡ <strong>Selective Subscriptions:</strong> Components subscribe only to the data they need
              </p>
              <p>
                🔄 <strong>Action Integration:</strong> Built-in action handling with context isolation and automatic updates
              </p>
              <p>
                📊 <strong>Real-time Analytics:</strong> Live performance metrics and computed value tracking
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
                  <strong>Type-Safe Store Access:</strong> Full TypeScript support with individual store typing
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <div>
                  <strong>Automatic Provider Management:</strong> Context providers handle store lifecycle and cleanup
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <div>
                  <strong>Action Pipeline Integration:</strong> Seamless action dispatch with store updates
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <div>
                  <strong>Computed Value Optimization:</strong> Lazy evaluation with automatic dependency tracking
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
                  <strong>Selective Re-renders:</strong> Components update only when their subscribed data changes
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <div>
                  <strong>Memoized Computations:</strong> Expensive calculations cached until dependencies change
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <div>
                  <strong>Batch Updates:</strong> Multiple store updates combined into single render cycle
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <div>
                  <strong>Context Isolation:</strong> Multiple store instances without interference
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* 사용법 가이드 */}
        <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-blue-500">📚</span>
            Usage Guide
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Individual Store Access</h4>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`// Access specific stores
const positionStore = useMouseEventsStore('position');
const movementStore = useMouseEventsStore('movement');
const clicksStore = useMouseEventsStore('clicks');

// Subscribe to values
const position = useStoreValue(positionStore);
const movement = useStoreValue(movementStore);`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Action Dispatch</h4>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`// Get action dispatcher
const dispatch = useMouseEventsActionDispatch();

// Dispatch actions
dispatch('mouseMove', { x, y, timestamp });
dispatch('mouseClick', { x, y, button, timestamp });
dispatch('resetMouseState');`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContextStoreMouseEventsPage;