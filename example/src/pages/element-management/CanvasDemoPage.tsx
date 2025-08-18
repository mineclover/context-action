/**
 * @fileoverview Canvas Demo Page
 * Canvas 기반 그래픽 에디터에서의 DOM element 관리 데모
 */

import React from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { AdvancedCanvasExample } from '../../examples/element-management/advanced-canvas-example';

export function CanvasDemoPage() {
  return (
    <PageLayout
      title="Canvas Demo"
      description="Canvas 기반 그래픽 에디터에서의 고급 DOM element 관리를 보여주는 데모"
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Demo Description */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl mb-8 border border-purple-200">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🎨</div>
            <div>
              <h2 className="text-2xl font-bold text-purple-900 mb-3">Canvas Management Demo</h2>
              <p className="text-purple-800 mb-4 text-lg">
                Canvas 기반 그래픽 에디터에서의 고급 DOM element 관리를 보여주는 실시간 데모입니다.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-purple-900 mb-2">🎯 핵심 기능</h3>
                  <ul className="text-purple-700 space-y-1 text-sm">
                    <li>• Rectangle, Circle, Line, Freehand 그리기</li>
                    <li>• 실시간 도형 선택 및 조작</li>
                    <li>• 드래그 앤 드롭 도형 이동</li>
                    <li>• 색상 및 스타일 커스터마이징</li>
                    <li>• Canvas element 상태 관리</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-purple-900 mb-2">⌨️ 키보드 단축키</h3>
                  <ul className="text-purple-700 space-y-1 text-sm">
                    <li>• <code className="bg-purple-200 px-1 rounded">Delete/Backspace</code>: 선택된 도형 삭제</li>
                    <li>• <code className="bg-purple-200 px-1 rounded">Escape</code>: 선택 해제 및 Draw 모드</li>
                    <li>• <code className="bg-purple-200 px-1 rounded">Mouse Drag</code>: 도형 생성 및 이동</li>
                    <li>• <code className="bg-purple-200 px-1 rounded">Click</code>: 도형 선택</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Content */}
        <div className="min-h-screen">
          <AdvancedCanvasExample />
        </div>

        {/* Technical Implementation */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6">🔧 기술적 구현</h2>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 text-purple-600">🎨 Canvas 렌더링</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <div>
                    <strong>Dual Canvas</strong>: 메인 + 오버레이 캔버스를 활용한 성능 최적화
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <div>
                    <strong>실시간 렌더링</strong>: Shape 상태 변경 시 즉각적인 Canvas 다시 그리기
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <div>
                    <strong>충돌 감지</strong>: 정밀한 도형 선택을 위한 collision detection 알고리즘
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <div>
                    <strong>선택 시각화</strong>: 선택된 도형에 대한 핸들과 경계선 표시
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 text-green-600">⚛️ Element 관리</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <strong>Canvas 등록</strong>: Context-Action 시스템에 Canvas element 자동 등록
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <strong>Shape 메타데이터</strong>: 각 도형의 위치, 크기, 색상 정보 관리
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <strong>상태 추적</strong>: 포커스 및 선택 상태 실시간 모니터링
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <strong>자동 정리</strong>: 삭제된 도형들의 element 참조 자동 해제
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Drawing Tools */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6">🛠️ 그리기 도구</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
              <div className="text-2xl mb-3">⬜</div>
              <h3 className="font-semibold text-lg mb-2 text-blue-600">Rectangle</h3>
              <p className="text-blue-700 text-sm">
                클릭 드래그로 사각형을 그립니다. 정확한 좌표와 크기 제어가 가능합니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-lg border border-red-200">
              <div className="text-2xl mb-3">⭕</div>
              <h3 className="font-semibold text-lg mb-2 text-red-600">Circle</h3>
              <p className="text-red-700 text-sm">
                원형 도형을 생성합니다. 드래그 영역에 따라 반지름이 자동 계산됩니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
              <div className="text-2xl mb-3">📏</div>
              <h3 className="font-semibold text-lg mb-2 text-green-600">Line</h3>
              <p className="text-green-700 text-sm">
                직선을 그립니다. 시작점과 끝점을 정확히 제어할 수 있습니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
              <div className="text-2xl mb-3">✍️</div>
              <h3 className="font-semibold text-lg mb-2 text-yellow-600">Freehand</h3>
              <p className="text-yellow-700 text-sm">
                자유형 그리기 도구입니다. 마우스 움직임을 따라 자연스러운 선을 그립니다.
              </p>
            </div>
          </div>
        </div>

        {/* Canvas Features */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6">🌟 Canvas 특징</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-lg border border-indigo-200">
              <div className="text-2xl mb-3">🎯</div>
              <h3 className="font-semibold text-lg mb-2 text-indigo-600">정밀한 제어</h3>
              <p className="text-indigo-700 text-sm">
                픽셀 단위의 정확한 도형 배치와 크기 조정이 가능합니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-lg border border-purple-200">
              <div className="text-2xl mb-3">🔄</div>
              <h3 className="font-semibold text-lg mb-2 text-purple-600">실시간 반응</h3>
              <p className="text-purple-700 text-sm">
                도형 생성, 선택, 이동에 대한 즉각적인 시각적 피드백을 제공합니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-lg border border-pink-200">
              <div className="text-2xl mb-3">🎨</div>
              <h3 className="font-semibold text-lg mb-2 text-pink-600">스타일 커스터마이징</h3>
              <p className="text-pink-700 text-sm">
                색상, 선 두께 등 다양한 스타일 옵션을 실시간으로 적용할 수 있습니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-teal-50 p-6 rounded-lg border border-cyan-200">
              <div className="text-2xl mb-3">📱</div>
              <h3 className="font-semibold text-lg mb-2 text-cyan-600">반응형 디자인</h3>
              <p className="text-cyan-700 text-sm">
                화면 크기에 따라 Canvas와 도구 패널이 적응적으로 조정됩니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-lg border border-emerald-200">
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="font-semibold text-lg mb-2 text-emerald-600">고성능 렌더링</h3>
              <p className="text-emerald-700 text-sm">
                이중 Canvas 구조로 렌더링 성능을 최적화하였습니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-lg border border-orange-200">
              <div className="text-2xl mb-3">🔍</div>
              <h3 className="font-semibold text-lg mb-2 text-orange-600">고급 선택 시스템</h3>
              <p className="text-orange-700 text-sm">
                정확한 충돌 감지로 복잡한 도형도 쉽게 선택할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6">🔗 관련 데모</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <a 
              href="/examples/element-management/form-builder"
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl group-hover:scale-110 transition-transform">📝</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-800 group-hover:text-blue-600">
                    Form Builder Demo
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    동적 폼 빌더에서의 DOM element 관리를 체험해보세요.
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