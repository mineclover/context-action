/**
 * @fileoverview Element Management Demo Page
 * DOM element 관리 시스템의 실제 데모를 보여주는 허브 페이지
 */

import React from 'react';
import { PageLayout } from '../../components/layout/PageLayout';

export function ElementManagementPage() {
  return (
    <PageLayout
      title="Element Management System"
      description="Context-Action 프레임워크를 활용한 DOM element 관리 시스템 데모"
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl mb-12 border border-blue-200">
          <div className="flex items-start gap-6">
            <div className="text-5xl">🏗️</div>
            <div>
              <h2 className="text-3xl font-bold text-blue-900 mb-4">Element Management System</h2>
              <p className="text-blue-800 mb-6 text-lg leading-relaxed">
                Context-Action 프레임워크의 핵심 기능인 DOM element 관리 시스템을 체험해보세요.
                실제 애플리케이션에서 사용할 수 있는 두 가지 실용적인 예제를 제공합니다.
              </p>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-3">🎯 핵심 가치</h3>
                  <ul className="text-blue-700 space-y-2">
                    <li>• 중앙화된 DOM element 관리</li>
                    <li>• 타입 안전한 element 참조</li>
                    <li>• 자동 생명주기 관리</li>
                    <li>• 실시간 상태 추적</li>
                    <li>• 메모리 누수 방지</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-blue-900 mb-3">🛠️ 기술적 특징</h3>
                  <ul className="text-blue-700 space-y-2">
                    <li>• React Hook 기반 API</li>
                    <li>• Context-Action 통합</li>
                    <li>• TypeScript 완전 지원</li>
                    <li>• 개발자 친화적 디버깅</li>
                    <li>• 확장 가능한 아키텍처</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Form Builder Demo Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">📝</div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Form Builder Demo</h3>
                  <p className="text-green-100">동적 폼 빌더에서의 DOM element 관리</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-6 leading-relaxed">
                복잡한 폼 구조에서 각 필드 element들을 중앙에서 관리하고, 
                사용자 인터랙션에 따른 동적 선택 및 조작 기능을 체험해보세요.
              </p>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">주요 기능</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span>
                    <span>폼 필드 선택</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span>
                    <span>다중 선택</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span>
                    <span>일괄 삭제</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span>
                    <span>상태 모니터링</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span>
                    <span>키보드 단축키</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span>
                    <span>포커스 관리</span>
                  </div>
                </div>
              </div>
              
              <a 
                href="/examples/element-management/form-builder"
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                Form Builder 체험하기 →
              </a>
            </div>
          </div>

          {/* Canvas Demo Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🎨</div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Canvas Demo</h3>
                  <p className="text-purple-100">고급 Canvas 그래픽 에디터에서의 element 관리</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-6 leading-relaxed">
                Canvas를 활용한 그래픽 에디터에서 도형 생성, 선택, 조작 과정을 통해 
                고급 element 관리 기능을 체험해보세요.
              </p>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">주요 기능</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-purple-500">✓</span>
                    <span>도형 그리기</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-purple-500">✓</span>
                    <span>실시간 선택</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-purple-500">✓</span>
                    <span>드래그 조작</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-purple-500">✓</span>
                    <span>스타일 제어</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-purple-500">✓</span>
                    <span>도구 전환</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-purple-500">✓</span>
                    <span>성능 최적화</span>
                  </div>
                </div>
              </div>
              
              <a 
                href="/examples/element-management/canvas"
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                Canvas 에디터 체험하기 →
              </a>
            </div>
          </div>
        </div>

        {/* Technical Architecture */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-3xl">🏗️</span>
            시스템 아키텍처
          </h2>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-50 p-6 rounded-lg mb-4">
                <div className="text-3xl mb-3">📦</div>
                <h3 className="font-semibold text-lg text-blue-900">Core Package</h3>
              </div>
              <ul className="text-sm text-gray-700 space-y-2 text-left">
                <li>• ElementManager: 중앙 관리자</li>
                <li>• Action Pipeline: 작업 처리</li>
                <li>• Auto Cleanup: 자동 정리</li>
                <li>• Metadata: 확장 정보</li>
              </ul>
            </div>
            
            <div className="text-center">
              <div className="bg-green-50 p-6 rounded-lg mb-4">
                <div className="text-3xl mb-3">⚛️</div>
                <h3 className="font-semibold text-lg text-green-900">React Integration</h3>
              </div>
              <ul className="text-sm text-gray-700 space-y-2 text-left">
                <li>• useElementRef: 자동 등록</li>
                <li>• useFocusedElement: 포커스 관리</li>
                <li>• useElementSelection: 선택 관리</li>
                <li>• Managed Components: 래퍼 컴포넌트</li>
              </ul>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-50 p-6 rounded-lg mb-4">
                <div className="text-3xl mb-3">🔧</div>
                <h3 className="font-semibold text-lg text-purple-900">Developer Tools</h3>
              </div>
              <ul className="text-sm text-gray-700 space-y-2 text-left">
                <li>• 실시간 모니터링</li>
                <li>• 디버깅 패널</li>
                <li>• 상태 인스펙터</li>
                <li>• 성능 분석 도구</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-lg border border-red-200">
            <div className="text-2xl mb-3">🎯</div>
            <h3 className="font-semibold text-lg mb-2 text-red-600">중앙화된 관리</h3>
            <p className="text-red-700 text-sm">
              모든 DOM element가 중앙에서 관리되어 일관성과 추적성을 보장합니다.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
            <div className="text-2xl mb-3">🛡️</div>
            <h3 className="font-semibold text-lg mb-2 text-blue-600">타입 안전성</h3>
            <p className="text-blue-700 text-sm">
              TypeScript 기반의 완전한 타입 체킹으로 런타임 오류를 방지합니다.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="font-semibold text-lg mb-2 text-green-600">자동 최적화</h3>
            <p className="text-green-700 text-sm">
              메모리 누수 방지를 위한 자동 정리 및 최적화 기능을 제공합니다.
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
            <div className="text-2xl mb-3">🔍</div>
            <h3 className="font-semibold text-lg mb-2 text-yellow-600">개발자 도구</h3>
            <p className="text-yellow-700 text-sm">
              실시간 모니터링과 디버깅을 위한 종합적인 개발자 도구를 제공합니다.
            </p>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-3xl">🚀</span>
            시작하기
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-3">📁 소스 코드 위치</h3>
              <div className="bg-white p-4 rounded-lg border border-gray-200 font-mono text-sm">
                <div className="text-gray-800 mb-2">📂 /example/src/examples/element-management/</div>
                <div className="ml-4 space-y-1 text-gray-600">
                  <div>├── core-element-registry.ts</div>
                  <div>├── react-element-hooks.tsx</div>
                  <div>├── integration-example.tsx</div>
                  <div>├── advanced-canvas-example.tsx</div>
                  <div>└── README.md</div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-3">📚 추천 학습 순서</h3>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</span>
                  <div>
                    <div className="font-medium">Form Builder Demo</div>
                    <div className="text-sm text-gray-600">기본적인 element 관리 개념 학습</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">2</span>
                  <div>
                    <div className="font-medium">Canvas Demo</div>
                    <div className="text-sm text-gray-600">고급 기능과 성능 최적화 기법 체험</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">3</span>
                  <div>
                    <div className="font-medium">소스 코드 분석</div>
                    <div className="text-sm text-gray-600">실제 구현 방법과 패턴 학습</div>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}