/**
 * @fileoverview Canvas Demo Page
 * Context-Action framework를 활용한 Canvas 기반 그래픽 에디터 데모
 */

import React from 'react';
import { PageWithLogMonitor } from '../../components/LogMonitor';
import { ElementManagementProvider } from './ReactElementHooks';
import { AdvancedCanvasExample } from './AdvancedCanvasExample';
import {
  Badge,
  Card,
  CardContent,
} from '../../components/ui';

export function CanvasDemoPage() {
  return (
    <PageWithLogMonitor
      pageId="canvas-demo"
      title="Canvas Graphics Demo"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>🎨 Canvas Graphics Editor Demo</h1>
          <p className="page-description">
            Context-Action 프레임워크를 활용한 <strong>실시간 Canvas 그래픽 에디터</strong>입니다.
            DOM Element 관리, Ref 시스템, Action Pipeline을 통합한 실용적인 구현 예제입니다.
          </p>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="bg-purple-50 text-purple-800">
              🎯 Canvas API 활용
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-800">
              🎮 실시간 상호작용
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-800">
              🔧 Element 관리 시스템
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-800">
              ⚡ Action Pipeline
            </Badge>
          </div>
        </header>

        {/* Core Features Overview */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🎯 핵심 기능
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">✏️</span>
                  <h4 className="font-medium text-purple-900">도형 그리기</h4>
                </div>
                <p className="text-sm text-purple-700">
                  사각형, 원형, 선 그리기 및 실시간 미리보기
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🎯</span>
                  <h4 className="font-medium text-blue-900">선택 & 편집</h4>
                </div>
                <p className="text-sm text-blue-700">
                  도형 선택, 이동, 크기 조절 및 삭제
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🎨</span>
                  <h4 className="font-medium text-green-900">스타일 편집</h4>
                </div>
                <p className="text-sm text-green-700">
                  색상, 투명도, 선 두께 실시간 조절
                </p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📱</span>
                  <h4 className="font-medium text-orange-900">반응형 UI</h4>
                </div>
                <p className="text-sm text-orange-700">
                  마우스 및 터치 입력 지원, 모바일 최적화
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Demo */}
        <ElementManagementProvider>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  🚀 실시간 Canvas 에디터
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Live Demo
                  </Badge>
                </div>
              </div>
              
              <AdvancedCanvasExample />
            </CardContent>
          </Card>
        </ElementManagementProvider>

        {/* Technical Implementation */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🛠️ 기술적 구현 세부사항
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-blue-600 mb-3">Canvas API 활용</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>2D Context</strong>: 고성능 그래픽 렌더링</li>
                  <li>• <strong>실시간 렌더링</strong>: requestAnimationFrame 최적화</li>
                  <li>• <strong>이벤트 처리</strong>: 마우스/터치 입력 통합 관리</li>
                  <li>• <strong>히트 테스팅</strong>: 정확한 객체 선택 알고리즘</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-green-600 mb-3">Context-Action 통합</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>Element Ref 관리</strong>: createRefContext 활용</li>
                  <li>• <strong>Action Pipeline</strong>: 사용자 액션 중앙 처리</li>
                  <li>• <strong>Store 동기화</strong>: 상태와 UI 자동 동기화</li>
                  <li>• <strong>이벤트 로깅</strong>: 모든 사용자 액션 추적</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Guide */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📋 사용 방법
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-purple-600 mb-3">🎨 그리기 도구</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Rectangle</strong>: 드래그하여 사각형 그리기</p>
                  <p><strong>Circle</strong>: 드래그하여 원형 그리기</p>
                  <p><strong>Line</strong>: 클릭하여 선 그리기</p>
                  <p><strong>Select</strong>: 객체 선택 및 편집 모드</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-orange-600 mb-3">⚡ 키보드 단축키</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Delete</strong>: 선택된 객체 삭제</p>
                  <p><strong>Ctrl+Z</strong>: 실행 취소</p>
                  <p><strong>Ctrl+A</strong>: 모든 객체 선택</p>
                  <p><strong>ESC</strong>: 선택 해제</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWithLogMonitor>
  );
}

export default CanvasDemoPage;