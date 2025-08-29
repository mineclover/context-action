/**
 * @fileoverview Enhanced Context Store Page - MVVM Entry Point
 * 
 * Main page component integrating MVVM architecture with Context-Action framework:
 * - MouseEventsModelProvider: Model layer with declarative contexts
 * - EnhancedContextStoreView: View layer with hooks-based state injection
 * - Clean separation between Model, ViewModel, and View layers
 */

import React, { useState } from 'react';
import { MouseEventsModelProvider } from './context/MouseEventsModel';
import { EnhancedContextStoreView } from './components/EnhancedContextStoreView';
import { NonReactiveView } from './components/NonReactiveView';

/**
 * Enhanced Context Store 메인 페이지
 * 
 * MVVM 아키텍처 통합:
 * - Model: MouseEventsModel (Context declarations)
 * - ViewModel: Hooks (state injection, event handlers)
 * - View: Reactive vs Non-Reactive patterns comparison
 */
export function EnhancedContextStorePage() {
  const [isNonReactive, setIsNonReactive] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50">
      {/* Architecture Mode Selector */}
      <div className="p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-purple-200 shadow-lg mb-6">
          <h1 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-3">
            <span className="text-3xl">🏪</span>
            Enhanced Context Store Architecture
          </h1>
          
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setIsNonReactive(false)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                !isNonReactive 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              🔔 Reactive Pattern
            </button>
            
            <button
              onClick={() => setIsNonReactive(true)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                isNonReactive 
                  ? 'bg-green-600 text-white shadow-lg' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              🚀 Non-Reactive Pattern
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">🔔 Reactive Pattern</h3>
              <ul className="space-y-1 text-purple-700">
                <li>• Store subscriptions with useStoreValue()</li>
                <li>• React re-renders on state changes</li>
                <li>• Traditional reactive architecture</li>
                <li>• Canvas updates via useEffect</li>
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">🚀 Non-Reactive Pattern</h3>
              <ul className="space-y-1 text-green-700">
                <li>• Direct DOM manipulation with RefContext</li>
                <li>• Zero React re-renders guaranteed</li>
                <li>• Store.getValue() on-demand access</li>
                <li>• Pure performance optimization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Model Layer - Declarative Context Management */}
      <MouseEventsModelProvider>
        
        {/* View Layer - Conditional Architecture Pattern */}
        {isNonReactive ? (
          <NonReactiveView />
        ) : (
          <EnhancedContextStoreView />
        )}
        
      </MouseEventsModelProvider>
    </div>
  );
}

export default EnhancedContextStorePage;