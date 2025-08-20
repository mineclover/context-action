/**
 * @fileoverview Demos Index Page - Context-Action 프레임워크 데모 허브
 * 다양한 실사용 시나리오를 보여주는 데모 컬렉션
 */

import React from 'react';
import { PageLayout } from '../../components/layout/PageLayout';

export function DemosIndexPage() {
  return (
    <PageLayout
      title="Context-Action Demos"
      description="Context-Action 프레임워크의 다양한 실사용 시나리오를 보여주는 데모 컬렉션"
    >
      <div className="max-w-6xl mx-auto p-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-8 rounded-xl mb-8 border border-purple-200">
          <div className="flex items-start gap-6">
            <div className="text-4xl">🎭</div>
            <div>
              <h1 className="text-3xl font-bold text-purple-900 mb-4">Context-Action 프레임워크 데모</h1>
              <p className="text-purple-800 text-lg mb-6">
                실제 애플리케이션에서 자주 사용되는 패턴들을 Context-Action 프레임워크로 구현한 
                데모 컬렉션입니다. 각 데모는 완전히 동작하는 기능과 함께 구현 방법을 설명합니다.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-purple-900 mb-3">🎯 학습 목표</h3>
                  <ul className="text-purple-700 space-y-2 text-sm">
                    <li>• 실제 시나리오에서의 패턴 적용</li>
                    <li>• 상태 관리와 액션 처리의 조화</li>
                    <li>• 확장 가능한 아키텍처 설계</li>
                    <li>• 성능 최적화 기법</li>
                    <li>• 유지보수성 향상 방법</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-purple-900 mb-3">📋 포함된 데모</h3>
                  <ul className="text-purple-700 space-y-2 text-sm">
                    <li>• <strong>Chat Demo</strong>: 실시간 채팅 시스템</li>
                    <li>• <strong>Shopping Cart</strong>: 전자상거래 장바구니</li>
                    <li>• <strong>Todo List</strong>: 할 일 관리 앱</li>
                    <li>• <strong>User Profile</strong>: 사용자 프로필 관리</li>
                    <li>• <strong>더 많은 데모들...</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Store Demos */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">🏪 Store 시나리오 데모</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Combined Store Scenarios */}
            <a 
              href="/demos/store-scenarios"
              className="group bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-purple-300"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🏪</div>
              <h3 className="font-semibold text-lg mb-2 text-gray-800 group-hover:text-purple-600">
                전체 Store 컬렉션
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                4개의 핵심 상태 관리 패턴을 한 페이지에서 모두 확인
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">All-in-One</span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Complete</span>
              </div>
              <div className="text-purple-500 text-sm font-medium group-hover:underline">
                전체 보기 →
              </div>
            </a>

            {/* Todo List Demo */}
            <a 
              href="/demos/todo-list"
              className="group bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">✅</div>
              <h3 className="font-semibold text-lg mb-2 text-gray-800 group-hover:text-blue-600">
                Todo List Demo
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                기본적인 CRUD 패턴과 필터링, 정렬 기능
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">CRUD</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Filter & Sort</span>
              </div>
              <div className="text-blue-500 text-sm font-medium group-hover:underline">
                데모 보기 →
              </div>
            </a>

            {/* Shopping Cart Demo */}
            <a 
              href="/demos/shopping-cart"
              className="group bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-purple-300"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🛒</div>
              <h3 className="font-semibold text-lg mb-2 text-gray-800 group-hover:text-purple-600">
                Shopping Cart Demo
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                복잡한 계산과 상태 관리, 실시간 가격 업데이트
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Real-time Calc</span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Commerce</span>
              </div>
              <div className="text-purple-500 text-sm font-medium group-hover:underline">
                데모 보기 →
              </div>
            </a>

            {/* Chat Demo */}
            <a 
              href="/demos/chat"
              className="group bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-green-300"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">💬</div>
              <h3 className="font-semibold text-lg mb-2 text-gray-800 group-hover:text-green-600">
                Chat Demo
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                실시간 메시징과 사용자 관리, 메시지 히스토리
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Real-time</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Auto Scroll</span>
              </div>
              <div className="text-green-500 text-sm font-medium group-hover:underline">
                데모 보기 →
              </div>
            </a>

            {/* User Profile Demo */}
            <a 
              href="/demos/user-profile"
              className="group bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-orange-300"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">👤</div>
              <h3 className="font-semibold text-lg mb-2 text-gray-800 group-hover:text-orange-600">
                User Profile Demo
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                폼 처리와 유효성 검사, 실시간 업데이트
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Form</span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Validation</span>
              </div>
              <div className="text-orange-500 text-sm font-medium group-hover:underline">
                데모 보기 →
              </div>
            </a>
          </div>
        </div>

        {/* Other Categories */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">🗂️ 기타 데모 카테고리</h2>
          <div className="grid md:grid-cols-2 gap-6">

            {/* Future Categories - Placeholder */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="text-3xl mb-3 opacity-50">🎨</div>
              <h3 className="font-semibold text-lg mb-2 text-gray-500">
                UI Pattern Demos
              </h3>
              <p className="text-gray-400 text-sm mb-3">
                모달, 드롭다운, 탭 등 UI 패턴을 Context-Action으로 구현한 데모들
              </p>
              <div className="text-gray-400 text-sm font-medium">
                구현 예정...
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="text-3xl mb-3 opacity-50">⚡</div>
              <h3 className="font-semibold text-lg mb-2 text-gray-500">
                Performance Demos
              </h3>
              <p className="text-gray-400 text-sm mb-3">
                최적화 기법과 성능 개선 사례를 보여주는 고급 데모들
              </p>
              <div className="text-gray-400 text-sm font-medium">
                구현 예정...
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">🚀 빠른 시작</h2>
          <div className="bg-gray-50 p-6 rounded-lg border">
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-3 text-gray-800">추천 학습 순서</h3>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</span>
                    <div>
                      <a href="/demos/todo-list" className="font-medium text-blue-600 hover:underline">Todo List Demo</a>
                      <div className="text-sm text-gray-600">기본적인 CRUD 패턴 학습</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">2</span>
                    <div>
                      <a href="/demos/shopping-cart" className="font-medium text-blue-600 hover:underline">Shopping Cart Demo</a>
                      <div className="text-sm text-gray-600">복잡한 상태 관리와 계산 로직</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">3</span>
                    <div>
                      <a href="/demos/chat" className="font-medium text-blue-600 hover:underline">Chat Demo</a>
                      <div className="text-sm text-gray-600">실시간 업데이트와 성능 최적화</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">4</span>
                    <div>
                      <a href="/demos/user-profile" className="font-medium text-blue-600 hover:underline">User Profile Demo</a>
                      <div className="text-sm text-gray-600">폼 처리와 유효성 검사</div>
                    </div>
                  </li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-3 text-gray-800">핵심 개념</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Store Pattern</h4>
                    <p className="text-gray-600 text-sm">
                      상태를 중앙에서 관리하고 컴포넌트 간 데이터 공유
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Action Handling</h4>
                    <p className="text-gray-600 text-sm">
                      비즈니스 로직을 액션 핸들러로 분리하여 관리
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Type Safety</h4>
                    <p className="text-gray-600 text-sm">
                      TypeScript로 완전한 타입 안전성 보장
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">✨ 데모 특징</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
              <div className="text-2xl mb-3">💡</div>
              <h3 className="font-semibold text-lg mb-2 text-blue-600">실용적 패턴</h3>
              <p className="text-blue-700 text-sm">
                실제 프로덕션에서 사용할 수 있는 검증된 패턴들을 제공합니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
              <div className="text-2xl mb-3">🔧</div>
              <h3 className="font-semibold text-lg mb-2 text-green-600">완전한 구현</h3>
              <p className="text-green-700 text-sm">
                각 데모는 완전히 동작하는 기능과 함께 소스 코드를 제공합니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-lg border border-purple-200">
              <div className="text-2xl mb-3">📚</div>
              <h3 className="font-semibold text-lg mb-2 text-purple-600">상세한 설명</h3>
              <p className="text-purple-700 text-sm">
                각 구현 결정의 이유와 대안적 접근법을 자세히 설명합니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200">
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="font-semibold text-lg mb-2 text-orange-600">최적화 기법</h3>
              <p className="text-orange-700 text-sm">
                성능 최적화와 메모리 효율성을 고려한 구현 방법을 보여줍니다.
              </p>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold mb-4">🔗 추가 자료</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a href="/docs" className="text-blue-600 hover:text-blue-800 text-sm hover:underline">
              📖 프레임워크 문서
            </a>
            <a href="/refs" className="text-blue-600 hover:text-blue-800 text-sm hover:underline">
              🎯 Refs Management
            </a>
            <a href="/store" className="text-blue-600 hover:text-blue-800 text-sm hover:underline">
              🏪 Store 시스템
            </a>
            <a href="/actionguard" className="text-blue-600 hover:text-blue-800 text-sm hover:underline">
              🛡️ Action Guard
            </a>
            <a href="/react" className="text-blue-600 hover:text-blue-800 text-sm hover:underline">
              ⚛️ React 통합
            </a>
            <a href="/api" className="text-blue-600 hover:text-blue-800 text-sm hover:underline">
              📚 API 레퍼런스
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}