/**
 * @fileoverview Form Builder Demo Page
 * 동적 폼 빌더에서의 DOM element 관리 데모
 */

import React from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { FormBuilderExample } from '../../examples/element-management/integration-example';

export function FormBuilderDemoPage() {
  return (
    <PageLayout
      title="Form Builder Demo"
      description="동적 폼 빌더에서의 DOM element 관리를 보여주는 데모"
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Demo Description */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-8 border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="text-3xl">📝</div>
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-3">Form Builder Demo</h2>
              <p className="text-blue-800 mb-4 text-lg">
                동적 폼 빌더에서의 DOM element 관리를 보여주는 실시간 데모입니다.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">🎯 핵심 기능</h3>
                  <ul className="text-blue-700 space-y-1 text-sm">
                    <li>• 클릭으로 폼 필드 선택</li>
                    <li>• Cmd/Ctrl + 클릭으로 다중 선택</li>
                    <li>• 선택된 필드들 일괄 삭제</li>
                    <li>• 실시간 element 상태 모니터링</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">⌨️ 키보드 단축키</h3>
                  <ul className="text-blue-700 space-y-1 text-sm">
                    <li>• <code className="bg-blue-200 px-1 rounded">Ctrl + Home</code>: 첫 번째 input 포커스</li>
                    <li>• <code className="bg-blue-200 px-1 rounded">Ctrl + End</code>: 마지막 input 포커스</li>
                    <li>• <code className="bg-blue-200 px-1 rounded">Delete</code>: 선택된 필드 삭제</li>
                    <li>• <code className="bg-blue-200 px-1 rounded">Escape</code>: 선택 해제</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Content */}
        <div className="min-h-screen">
          <FormBuilderExample />
        </div>

        {/* Technical Implementation */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6">🔧 기술적 구현</h2>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 text-green-600">📦 Core 패키지</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <strong>ElementManager</strong>: 중앙화된 element 생명주기 관리
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <strong>Action Pipeline</strong>: 모든 element 조작이 action을 통해 수행
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <strong>자동 정리</strong>: 주기적 stale element 검출 및 제거
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <strong>메타데이터</strong>: Element별 커스텀 정보 저장 및 관리
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 text-blue-600">⚛️ React 통합</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <div>
                    <strong>useElementRef</strong>: 자동 element 등록 ref hook
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <div>
                    <strong>useFocusedElement</strong>: 포커스 상태 관리 및 추적
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <div>
                    <strong>useElementSelection</strong>: 다중 선택 상태 관리
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <div>
                    <strong>Managed Components</strong>: 자동 등록 Form 컴포넌트들
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6">🌟 주요 특징</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-lg border border-red-200">
              <div className="text-2xl mb-3">🎯</div>
              <h3 className="font-semibold text-lg mb-2 text-red-600">중앙화된 관리</h3>
              <p className="text-red-700 text-sm">
                모든 폼 필드가 중앙 registry에서 관리되어 일관성과 성능을 보장합니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
              <div className="text-2xl mb-3">🛡️</div>
              <h3 className="font-semibold text-lg mb-2 text-blue-600">Type Safety</h3>
              <p className="text-blue-700 text-sm">
                TypeScript 기반 완전한 타입 안전성으로 런타임 에러를 방지합니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="font-semibold text-lg mb-2 text-green-600">실시간 반응</h3>
              <p className="text-green-700 text-sm">
                Element 상태 변경에 대한 즉각적인 UI 업데이트를 제공합니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-lg border border-purple-200">
              <div className="text-2xl mb-3">🎮</div>
              <h3 className="font-semibold text-lg mb-2 text-purple-600">다중 선택</h3>
              <p className="text-purple-700 text-sm">
                키보드 단축키를 활용한 직관적인 다중 선택 및 조작 기능입니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
              <div className="text-2xl mb-3">🔄</div>
              <h3 className="font-semibold text-lg mb-2 text-yellow-600">자동 최적화</h3>
              <p className="text-yellow-700 text-sm">
                Stale element 자동 탐지 및 정리로 메모리 누수를 방지합니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200">
              <div className="text-2xl mb-3">🔍</div>
              <h3 className="font-semibold text-lg mb-2 text-indigo-600">디버깅 도구</h3>
              <p className="text-indigo-700 text-sm">
                실시간 element 상태 모니터링 및 디버깅 패널을 제공합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6">🔗 관련 데모</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <a 
              href="/examples/element-management/canvas"
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl group-hover:scale-110 transition-transform">🎨</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-800 group-hover:text-blue-600">
                    Canvas Management Demo
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Canvas 기반 그래픽 에디터에서의 고급 element 관리를 체험해보세요.
                  </p>
                  <span className="text-blue-500 text-sm font-medium group-hover:underline">
                    데모 보기 →
                  </span>
                </div>
              </div>
            </a>

            <a 
              href="/examples/element-management"
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl group-hover:scale-110 transition-transform">🏠</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-800 group-hover:text-blue-600">
                    Element Management 홈
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    모든 Element 관리 데모와 기술 문서를 한 곳에서 확인하세요.
                  </p>
                  <span className="text-blue-500 text-sm font-medium group-hover:underline">
                    홈으로 가기 →
                  </span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}