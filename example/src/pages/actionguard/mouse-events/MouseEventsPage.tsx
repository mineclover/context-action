/**
 * @fileoverview Mouse Events Demo Page
 *
 * Context → Data/Action → Hook → View 계층 구조를 따르는 마우스 이벤트 데모 페이지
 */

import { Link } from 'react-router-dom';
import { MouseEventsContainer } from './clean-architecture/containers/MouseEventsContainer';
import { ContextStoreMouseEventsWrapper } from './context-store-action-based/ContextStoreMouseEventsWrapper';
import { ContextStoreMouseEventsContainer } from './context-store-pattern/containers/ContextStoreMouseEventsContainer';

/**
 * Clean Architecture 마우스 이벤트 UI
 */
const MouseEventsUI = () => {
  console.log('🖥️ MouseEventsUI render at', new Date().toISOString());

  return (
    <div className="page-container">
      {/* 헤더 설명 */}
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🏗️</span>
            <h2 className="text-lg font-semibold text-blue-800">
              Clean Architecture - Separated Concerns
            </h2>
          </div>
          <p className="text-sm text-blue-700">
            Complete separation of View, Controller, Service layers. Testable,
            maintainable architecture with dependency injection and clean
            interfaces.
          </p>
        </div>
      </div>

      {/* Clean Architecture Container */}
      <MouseEventsContainer />

      {/* Context Store Container (Action-Based) */}
      <div className="mt-8">
        <ContextStoreMouseEventsWrapper />
      </div>

      {/* Context Store Pattern Navigation */}
      <div className="mt-8">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏪</span>
              <div>
                <h2 className="text-xl font-semibold text-emerald-800">
                  Context Store Pattern Demo
                </h2>
                <p className="text-sm text-emerald-600 mt-1">
                  Advanced individual store management with selective subscriptions
                </p>
              </div>
            </div>
            <Link
              to="/actionguard/mouse-events/context-store"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
            >
              <span className="text-lg">🚀</span>
              View Enhanced Demo
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </Link>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-emerald-200">
              <h4 className="font-semibold text-emerald-800 text-sm mb-2">
                ⚡ Key Features
              </h4>
              <ul className="text-xs text-emerald-700 space-y-1">
                <li>• Individual store access & selective subscriptions</li>
                <li>• Real-time mouse tracking with visual feedback</li>
                <li>• Action-based state management</li>
                <li>• Performance optimized rendering</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-emerald-200">
              <h4 className="font-semibold text-emerald-800 text-sm mb-2">
                🎯 What You'll See
              </h4>
              <ul className="text-xs text-emerald-700 space-y-1">
                <li>• Live cursor tracking & path visualization</li>
                <li>• Click indicators & interaction history</li>
                <li>• Store value displays & computed metrics</li>
                <li>• Architecture benefits demonstration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 마우스 이벤트 데모 페이지 - Clean Architecture
 *
 * Context나 Provider 없이 순수한 의존성 주입으로 구성
 */
export function MouseEventsPage() {
  console.log('📄 MouseEventsPage render at', new Date().toISOString());

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Advanced Mouse Events Architecture Comparison
        </h1>
        <MouseEventsUI />
      </div>
    </div>
  );
}

export default MouseEventsPage;
