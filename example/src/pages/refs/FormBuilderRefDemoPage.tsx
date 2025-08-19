/**
 * @fileoverview Form Builder Ref Demo Page  
 * createRefContext를 활용한 동적 폼 빌더 데모
 */

import React from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { FormBuilderExample } from '../examples/FormBuilderIntegrationExample';

export function FormBuilderRefDemoPage() {
  return (
    <PageLayout
      title="Form Builder Ref Demo"
      description="createRefContext를 활용한 동적 폼 빌더에서의 DOM element 관리"
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Demo Description */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl mb-8 border border-green-200">
          <div className="flex items-start gap-4">
            <div className="text-3xl">📝</div>
            <div>
              <h2 className="text-2xl font-bold text-green-900 mb-3">Form Builder Ref Demo</h2>
              <p className="text-green-800 mb-4 text-lg">
                <code className="bg-green-200 px-2 py-1 rounded">createRefContext</code>를 활용한 
                동적 폼 빌더 시스템입니다. 실시간으로 폼 요소를 추가/제거하며 DOM element를 효과적으로 관리합니다.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">🎯 핵심 기능</h3>
                  <ul className="text-green-700 space-y-1 text-sm">
                    <li>• 동적 폼 필드 추가/제거</li>
                    <li>• 다중 선택 시스템 (Cmd/Ctrl + Click)</li>
                    <li>• 키보드 단축키 지원</li>
                    <li>• 실시간 상태 추적</li>
                    <li>• Element 메타데이터 관리</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">⚡ Ref 관리 기술</h3>
                  <ul className="text-green-700 space-y-1 text-sm">
                    <li>• ManagedInput/Button 컴포넌트</li>
                    <li>• 자동 element 등록/해제</li>
                    <li>• 포커스/선택 상태 관리</li>
                    <li>• Context-Action 기반 상태 동기화</li>
                    <li>• 타입 안전한 element 접근</li>
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
              <h3 className="font-semibold text-lg mb-4 text-green-600">📝 폼 Element 관리</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <strong>ManagedInput 컴포넌트</strong>: 자동 element 등록이 내장된 입력 컴포넌트
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <strong>동적 필드 관리</strong>: 런타임에 폼 필드 추가/제거 시 자동 ref 관리
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <strong>메타데이터 저장</strong>: 필드 타입, 라벨, 필수 여부 등 정보 관리
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <div>
                    <strong>자동 정리</strong>: 필드 제거 시 element 참조 자동 해제
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 text-blue-600">🎮 상호작용 시스템</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <div>
                    <strong>다중 선택</strong>: Cmd/Ctrl + Click으로 여러 필드 동시 선택
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <div>
                    <strong>키보드 단축키</strong>: Ctrl+Home/End로 첫/마지막 필드 포커스
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <div>
                    <strong>실시간 피드백</strong>: 선택/포커스 상태 시각적 표시
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <div>
                    <strong>상태 동기화</strong>: Context-Action으로 컴포넌트 간 상태 공유
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6">💻 코드 예제</h2>
          
          <div className="bg-gray-50 p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-4">ManagedInput 컴포넌트 구현</h3>
            <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`import { useElementRef } from './react-element-hooks';

// 자동 element 등록이 내장된 Input 컴포넌트
export const ManagedInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { 
    elementId: string; 
    metadata?: Record<string, any>;
  }
>(({ elementId, metadata, ...inputProps }, forwardedRef) => {
  // element 등록을 위한 ref hook
  const elementRef = useElementRef(elementId, 'input', metadata);
  
  // ref 결합
  const combinedRef = useCallback((element: HTMLInputElement | null) => {
    elementRef(element);  // Context-Action 시스템에 등록
    
    if (typeof forwardedRef === 'function') {
      forwardedRef(element);
    } else if (forwardedRef) {
      forwardedRef.current = element;
    }
  }, [elementRef, forwardedRef]);

  return <input {...inputProps} ref={combinedRef} />;
});

// 사용 예제
function FormField({ field }: { field: FormFieldData }) {
  return (
    <div>
      <label>{field.label}</label>
      <ManagedInput
        elementId={field.id}
        metadata={{
          fieldType: field.type,
          required: field.required,
          label: field.label
        }}
        type={field.type}
        placeholder={\`Enter \${field.label.toLowerCase()}...\`}
        required={field.required}
      />
    </div>
  );
}`}
            </pre>
          </div>
        </div>

        {/* Form Field Types */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6">📋 폼 필드 타입</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
              <div className="text-2xl mb-3">📝</div>
              <h3 className="font-semibold text-lg mb-2 text-blue-600">Text Field</h3>
              <p className="text-blue-700 text-sm">
                기본 텍스트 입력 필드. 이름, 제목 등 일반적인 텍스트 입력에 사용됩니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-lg border border-red-200">
              <div className="text-2xl mb-3">✉️</div>
              <h3 className="font-semibold text-lg mb-2 text-red-600">Email Field</h3>
              <p className="text-red-700 text-sm">
                이메일 주소 입력 전용 필드. 자동 유효성 검사와 키보드 최적화가 제공됩니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
              <div className="text-2xl mb-3">🔒</div>
              <h3 className="font-semibold text-lg mb-2 text-green-600">Password Field</h3>
              <p className="text-green-700 text-sm">
                비밀번호 입력 필드. 입력 내용이 마스킹되어 보안을 제공합니다.
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
              <div className="text-2xl mb-3">📄</div>
              <h3 className="font-semibold text-lg mb-2 text-yellow-600">Textarea</h3>
              <p className="text-yellow-700 text-sm">
                멀티라인 텍스트 입력 영역. 긴 텍스트나 메시지 입력에 적합합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6">⌨️ 키보드 단축키</h2>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-4 text-gray-800">선택 및 네비게이션</h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex justify-between">
                    <span><strong>Click</strong></span>
                    <span>단일 요소 선택</span>
                  </li>
                  <li className="flex justify-between">
                    <span><strong>Cmd/Ctrl + Click</strong></span>
                    <span>다중 선택</span>
                  </li>
                  <li className="flex justify-between">
                    <span><strong>Ctrl + Home</strong></span>
                    <span>첫 번째 입력 필드로 포커스</span>
                  </li>
                  <li className="flex justify-between">
                    <span><strong>Ctrl + End</strong></span>
                    <span>마지막 입력 필드로 포커스</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4 text-gray-800">폼 관리</h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex justify-between">
                    <span><strong>Tab</strong></span>
                    <span>다음 필드로 이동</span>
                  </li>
                  <li className="flex justify-between">
                    <span><strong>Shift + Tab</strong></span>
                    <span>이전 필드로 이동</span>
                  </li>
                  <li className="flex justify-between">
                    <span><strong>Enter</strong></span>
                    <span>폼 제출 (submit 버튼에서)</span>
                  </li>
                  <li className="flex justify-between">
                    <span><strong>Escape</strong></span>
                    <span>선택 해제</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6">🔗 관련 데모</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <a 
              href="/refs/canvas"
              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl group-hover:scale-110 transition-transform">🎨</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-800 group-hover:text-blue-600">
                    Canvas Drawing Demo
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Canvas 기반 실시간 그래픽 에디터에서의 ref 관리를 체험해보세요.
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