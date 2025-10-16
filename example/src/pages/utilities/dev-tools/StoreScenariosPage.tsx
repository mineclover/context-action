/**
 * @fileoverview Store Scenarios Demo Page
 * 다양한 상태 관리 시나리오를 보여주는 실용적인 데모들
 */

import { PageWithLogMonitor } from '@/components/LogMonitor';
import { ChatDemo } from '@/pages/integrations/business/store-scenarios/components';
import { StoreScenarios } from '@/pages/integrations/business/store-scenarios/stores';

export function StoreScenariosPage() {
  return (
    <PageWithLogMonitor pageId="store-scenarios" title="Store Scenarios">
      <StoreScenarios.Provider>
        <div className="max-w-6xl mx-auto p-6">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-8 rounded-xl mb-8 border border-purple-200">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                🏪 Store Scenarios Demo
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                다양한 상태 관리 시나리오를 보여주는 실용적인 데모들
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  ⚠️ 일부 데모들이 제거되어 현재 Chat Demo만 사용 가능합니다.
                </p>
              </div>
            </div>
          </div>

          {/* Chat Demo Section */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 p-6">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <span className="text-3xl">💬</span>
                      Chat Demo
                    </h2>
                    <p className="text-green-100 text-sm mt-2 leading-relaxed">
                      실시간 채팅 시스템 데모
                    </p>
                  </div>
                  <div className="text-right text-green-100 text-xs">
                    <div>Real-time Chat</div>
                    <div>Auto Scroll</div>
                    <div>Multi Users</div>
                  </div>
                </div>
              </div>
              <div className="p-0">
                <ChatDemo />
              </div>
            </div>
          </div>

          {/* Removed Demos Info */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              🗑️ 제거된 데모들
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-lg mb-4 text-gray-600">
                  🛒 Shopping Cart
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  복잡한 계산과 실시간 가격 업데이트를 보여주는 쇼핑카트 데모
                </p>
                <div className="text-xs text-gray-500">상태: 제거됨</div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-lg mb-4 text-gray-600">
                  ✅ Todo List
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  CRUD 작업과 필터링, 정렬 기능을 보여주는 할일 관리 데모
                </p>
                <div className="text-xs text-gray-500">상태: 제거됨</div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-lg mb-4 text-gray-600">
                  👤 User Profile
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  폼 처리와 검증 패턴을 보여주는 사용자 프로필 데모
                </p>
                <div className="text-xs text-gray-500">상태: 제거됨</div>
              </div>
            </div>
          </div>

          {/* Available Features */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              ✅ 사용 가능한 기능들
            </h2>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-green-600">
                  Chat Demo 기능
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>
                    • <strong>실시간 메시징</strong>: Enter 키로 전송
                  </li>
                  <li>
                    • <strong>사용자 전환</strong>: 사용자명 변경 가능
                  </li>
                  <li>
                    • <strong>자동 응답</strong>: Bot 자동 응답
                  </li>
                  <li>
                    • <strong>타이핑 인디케이터</strong>: 타이핑 상태 표시
                  </li>
                  <li>
                    • <strong>메시지 히스토리</strong>: 모든 메시지 저장
                  </li>
                  <li>
                    • <strong>빠른 메시지</strong>: 템플릿 메시지
                  </li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-blue-600">
                  기술적 특징
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>
                    • <strong>Store Architecture</strong>: 메시지 히스토리 관리
                  </li>
                  <li>
                    • <strong>Immutable Updates</strong>: 메시지 배열 불변성
                  </li>
                  <li>
                    • <strong>Real-time Updates</strong>: 즉시 UI 반영
                  </li>
                  <li>
                    • <strong>Auto Scroll</strong>: 스마트 스크롤 관리
                  </li>
                  <li>
                    • <strong>Ref Management</strong>: DOM 참조 최적화
                  </li>
                  <li>
                    • <strong>Event Handling</strong>: 키보드 이벤트
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Related Links */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              🔗 관련 리소스
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <a
                href="/demos/chat"
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                💬 Chat Demo 페이지
              </a>
              <a
                href="/refs/canvas"
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                🎨 Canvas Ref Demo
              </a>
              <a
                href="/actionguard/scroll"
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                📜 Advanced Scroll Demo
              </a>
            </div>
          </div>
        </div>
      </StoreScenarios.Provider>
    </PageWithLogMonitor>
  );
}
