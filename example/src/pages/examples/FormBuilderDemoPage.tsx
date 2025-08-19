/**
 * @fileoverview Form Builder Demo Page
 * Context-Action framework를 활용한 동적 폼 빌더 데모
 */

import React from 'react';
import { PageWithLogMonitor } from '../../components/LogMonitor';
import { ElementManagementProvider } from './ReactElementHooks';
import { FormBuilderExample } from './FormBuilderIntegrationExample';
import {
  Badge,
  Card,
  CardContent,
} from '../../components/ui';

export function FormBuilderDemoPage() {
  return (
    <PageWithLogMonitor
      pageId="form-builder-demo"
      title="Form Builder Demo"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>📝 Dynamic Form Builder Demo</h1>
          <p className="page-description">
            Context-Action 프레임워크를 활용한 <strong>동적 폼 빌더 시스템</strong>입니다.
            실시간으로 폼 요소를 추가/제거하며, DOM Element를 효과적으로 관리하는 실용적인 구현 예제입니다.
          </p>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="bg-green-50 text-green-800">
              📋 동적 폼 생성
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-800">
              🔧 실시간 편집
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-800">
              ✅ 유효성 검사
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-800">
              💾 데이터 관리
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
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">➕</span>
                  <h4 className="font-medium text-green-900">필드 추가</h4>
                </div>
                <p className="text-sm text-green-700">
                  텍스트, 이메일, 번호, 체크박스 등 다양한 입력 필드
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🎛️</span>
                  <h4 className="font-medium text-blue-900">드래그 정렬</h4>
                </div>
                <p className="text-sm text-blue-700">
                  직관적인 드래그 앤 드롭으로 필드 순서 변경
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⚙️</span>
                  <h4 className="font-medium text-purple-900">속성 편집</h4>
                </div>
                <p className="text-sm text-purple-700">
                  라벨, placeholder, 필수값 등 속성 실시간 편집
                </p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🔍</span>
                  <h4 className="font-medium text-orange-900">미리보기</h4>
                </div>
                <p className="text-sm text-orange-700">
                  실시간 폼 미리보기 및 데이터 입력 테스트
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
                  🚀 실시간 폼 빌더
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Live Demo
                  </Badge>
                </div>
              </div>
              
              <FormBuilderExample />
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
                <h4 className="font-semibold text-blue-600 mb-3">DOM Element 관리</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>Dynamic Creation</strong>: 런타임 폼 요소 생성</li>
                  <li>• <strong>Ref Management</strong>: createRefContext로 참조 관리</li>
                  <li>• <strong>Event Handling</strong>: 통합 이벤트 처리 시스템</li>
                  <li>• <strong>Memory Cleanup</strong>: 자동 메모리 정리 및 최적화</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-green-600 mb-3">Context-Action 통합</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• <strong>Action Pipeline</strong>: 폼 조작 액션 중앙 관리</li>
                  <li>• <strong>Store Sync</strong>: 폼 상태와 UI 실시간 동기화</li>
                  <li>• <strong>Validation Engine</strong>: 통합 유효성 검사 시스템</li>
                  <li>• <strong>Type Safety</strong>: TypeScript 완전 지원</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Field Types */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📝 지원되는 폼 필드 타입
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-1">📝 Text Input</h4>
                <p className="text-xs text-blue-700">일반 텍스트 입력 필드</p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-1">📧 Email</h4>
                <p className="text-xs text-green-700">이메일 형식 검증 포함</p>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-1">🔢 Number</h4>
                <p className="text-xs text-purple-700">숫자 입력 및 범위 설정</p>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-900 mb-1">☑️ Checkbox</h4>
                <p className="text-xs text-orange-700">단일/다중 선택 옵션</p>
              </div>

              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-900 mb-1">📻 Radio</h4>
                <p className="text-xs text-red-700">단일 선택 라디오 버튼</p>
              </div>

              <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                <h4 className="font-medium text-teal-900 mb-1">📋 Select</h4>
                <p className="text-xs text-teal-700">드롭다운 선택 메뉴</p>
              </div>

              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <h4 className="font-medium text-indigo-900 mb-1">📄 Textarea</h4>
                <p className="text-xs text-indigo-700">여러 줄 텍스트 입력</p>
              </div>

              <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                <h4 className="font-medium text-pink-900 mb-1">📅 Date</h4>
                <p className="text-xs text-pink-700">날짜 선택 입력 필드</p>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-900 mb-1">📂 File</h4>
                <p className="text-xs text-yellow-700">파일 업로드 입력</p>
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
                <h4 className="font-semibold text-green-600 mb-3">🎯 폼 빌드 과정</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>1단계</strong>: 좌측 도구 팔레트에서 필드 선택</p>
                  <p><strong>2단계</strong>: 드래그하여 폼 영역에 필드 추가</p>
                  <p><strong>3단계</strong>: 속성 패널에서 필드 설정 편집</p>
                  <p><strong>4단계</strong>: 미리보기로 폼 동작 확인</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-orange-600 mb-3">⚡ 고급 기능</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>조건부 표시</strong>: 다른 필드 값에 따른 필드 표시/숨김</p>
                  <p><strong>커스텀 검증</strong>: JavaScript 기반 사용자 정의 검증</p>
                  <p><strong>템플릿 저장</strong>: 자주 사용하는 폼 템플릿 저장</p>
                  <p><strong>JSON 내보내기</strong>: 폼 구조를 JSON으로 내보내기</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWithLogMonitor>
  );
}

export default FormBuilderDemoPage;