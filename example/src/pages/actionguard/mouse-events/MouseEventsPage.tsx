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
            Complete separation of View, Controller, Service layers. 
            Testable, maintainable architecture with dependency injection and clean interfaces.
          </p>
        </div>
      </div>

      {/* Clean Architecture Container */}
      <MouseEventsContainer />
      
      {/* Context Store Container (Action-Based) */}
      <div className="mt-8">
        <ContextStoreMouseEventsWrapper />
      </div>
      
      {/* Context Store Container with Navigation */}
      <div className="mt-8">
        <div className="mb-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏪</span>
                <h2 className="text-lg font-semibold text-emerald-800">
                  Context Store Pattern - Preview
                </h2>
              </div>
              <Link 
                to="/actionguard/mouse-events/context-store"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                🚀 Enhanced Context Store Page
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
            <p className="text-sm text-emerald-700 mt-2">
              Individual stores with selective subscriptions. Click the button above to see the enhanced version with real-time analytics and performance metrics.
            </p>
          </div>
        </div>
        <ContextStoreMouseEventsContainer />
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