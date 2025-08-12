/**
 * @fileoverview Mouse Events Demo Page
 * 
 * Context → Data/Action → Hook → View 계층 구조를 따르는 마우스 이벤트 데모 페이지
 */

import { MouseEventsContainer } from './containers/MouseEventsContainer';
import { StoreBasedMouseEventsContainer } from './containers/StoreBasedMouseEventsContainer';

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
      
      {/* Reactive Stores Container */}
      <div className="mt-8">
        <StoreBasedMouseEventsContainer />
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