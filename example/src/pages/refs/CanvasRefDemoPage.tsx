/**
 * @fileoverview Canvas Ref Demo Page
 * createRefContext를 활용한 Canvas 기반 그래픽 에디터 데모
 */

import React from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { AdvancedCanvasExample } from '../examples/AdvancedCanvasExample';
import { ElementManagementProvider } from '../examples/ReactElementHooks';

export function CanvasRefDemoPage() {
  return (
    <PageLayout
      title="Canvas Ref Demo"
      description="createRefContext를 활용한 Canvas 기반 실시간 그래픽 에디터"
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Demo Description */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl mb-8 border border-purple-200">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🎨</div>
            <div>
              <h2 className="text-2xl font-bold text-purple-900 mb-3">Canvas Ref Management Demo</h2>
              <p className="text-purple-800 mb-4 text-lg">
                <code className="bg-purple-200 px-2 py-1 rounded">createRefContext</code>를 활용한 
                Canvas 기반 실시간 그래픽 에디터입니다. DOM element 관리와 ref 시스템의 실제 활용 사례를 보여줍니다.
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
                  <h3 className="font-semibold text-purple-900 mb-2">⚡ Ref 관리 기술</h3>
                  <ul className="text-purple-700 space-y-1 text-sm">
                    <li>• createRefContext로 Canvas ref 관리</li>
                    <li>• 도형별 element 등록/해제</li>
                    <li>• 선택/포커스 상태 추적</li>
                    <li>• 메모리 누수 방지 자동 정리</li>
                    <li>• 타입 안전한 ref 접근</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Content */}
        <div className="min-h-screen">
          <ElementManagementProvider>
            <AdvancedCanvasExample />
          </ElementManagementProvider>
        </div>

        {/* Technical Implementation */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6">🔧 기술적 구현</h2>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 text-purple-600">🎨 Canvas Ref 관리</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <div>
                    <strong>createRefContext 활용</strong>: Canvas element를 타입 안전하게 관리
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <div>
                    <strong>이중 Canvas 구조</strong>: 메인 Canvas + 오버레이 Canvas로 성능 최적화
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <div>
                    <strong>실시간 렌더링</strong>: ref를 통한 직접 Canvas 조작으로 빠른 반응
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <div>
                    <strong>자동 정리</strong>: RefDefinitions cleanup으로 메모리 누수 방지
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 text-green-600">⚛️ Element 등록 시스템</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <strong>도형별 등록</strong>: 각 도형을 개별 element로 등록하여 추적
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <strong>메타데이터 관리</strong>: 도형의 타입, 위치, 색상 정보 저장
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <strong>선택 상태 추적</strong>: Context-Action으로 선택/포커스 상태 관리
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <strong>자동 해제</strong>: 도형 삭제 시 element 참조 자동 정리
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Ref Context Code Example */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6">💻 코드 예제</h2>
          
          <div className="bg-gray-50 p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-4">Canvas Ref Context 구현</h3>
            <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`import { createRefContext } from '@context-action/react';

// Canvas 관련 ref 타입 정의
interface CanvasRefs {
  mainCanvas: HTMLCanvasElement;
  overlayCanvas: HTMLCanvasElement;
  toolPanel: HTMLDivElement;
}

// RefDefinitions로 고급 기능 설정
const canvasRefDefinitions = {
  mainCanvas: {
    cleanup: (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  },
  overlayCanvas: {
    cleanup: (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }
};

// Canvas Ref Context 생성
const {
  Provider: CanvasRefProvider,
  useRefContext: useCanvasRef
} = createRefContext('CanvasRefs', canvasRefDefinitions);

// 컴포넌트에서 사용
function CanvasComponent() {
  const { getRef, setRef } = useCanvasRef();
  
  const handleDraw = useCallback(() => {
    const canvas = getRef('mainCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      // 그리기 작업...
    }
  }, [getRef]);
  
  return (
    <div>
      <canvas 
        ref={(el) => setRef('mainCanvas', el)}
        onMouseDown={handleDraw}
      />
      <canvas 
        ref={(el) => setRef('overlayCanvas', el)}
        style={{ position: 'absolute', pointerEvents: 'none' }}
      />
    </div>
  );
}`}
            </pre>
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

        {/* Related Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6">🔗 관련 데모</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <a 
              href="/refs/form-builder"
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
              href="/refs"
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl group-hover:scale-110 transition-transform">🏠</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-800 group-hover:text-blue-600">
                    Refs Management 홈
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    모든 ref 관리 데모와 기술 문서를 한 곳에서 확인하세요.
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