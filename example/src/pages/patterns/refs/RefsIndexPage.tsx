/**
 * @fileoverview Refs Index Page - createRefContext 데모 홈페이지
 * Context-Action 프레임워크의 ref 관리 시스템 종합 가이드
 */

// TODO: PageLayout component needs to be restored or created
// import { PageLayout } from '../../components/layout/PageLayout';
import { PageWithLogMonitor } from '@/components/LogMonitor';
// import { Card, CardContent, Badge } from '@/components/ui';
import { CodeBlock } from '@/components/ui';

export function RefsIndexPage() {
  return (
    <PageWithLogMonitor
      pageId="refs-index"
      title="Refs Management"
      initialConfig={{ enableToast: true, maxLogs: 100 }}
    >
      <div className="page-container">
        <div className="max-w-6xl mx-auto p-6">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl mb-8 border border-blue-200">
            <div className="flex items-start gap-6">
              <div className="text-4xl">🎯</div>
              <div>
                <h1 className="text-3xl font-bold text-blue-900 mb-4">
                  createRefContext로 DOM Element 관리
                </h1>
                <p className="text-blue-800 text-lg mb-6">
                  Context-Action 프레임워크의{' '}
                  <code className="bg-blue-200 px-2 py-1 rounded">
                    createRefContext
                  </code>
                  를 활용하여 React 애플리케이션에서 DOM elements를 효과적으로
                  관리하는 방법을 학습하세요.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-3">
                      🚀 주요 특징
                    </h3>
                    <ul className="text-blue-700 space-y-2 text-sm">
                      <li>
                        • <strong>타입 안전성</strong>: 완전한 TypeScript 지원
                      </li>
                      <li>
                        • <strong>두 가지 사용법</strong>: 간단한 타입과 선언적
                        정의 지원
                      </li>
                      <li>
                        • <strong>자동 정리</strong>: 메모리 누수 방지
                      </li>
                      <li>
                        • <strong>성능 최적화</strong>: React 18
                        useSyncExternalStore 활용
                      </li>
                      <li>
                        • <strong>Context 분리</strong>: 도메인별 ref 관리
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-blue-900 mb-3">
                      📋 데모 시나리오
                    </h3>
                    <ul className="text-blue-700 space-y-2 text-sm">
                      <li>
                        • <strong>Canvas 그래픽</strong>: 실시간 그리기 도구
                      </li>
                      <li>
                        • <strong>Mouse Events</strong>: 고성능 마우스 인터랙션
                      </li>
                      <li>
                        • <strong>Form Builder</strong>: 동적 폼 요소 관리
                      </li>
                      <li>
                        • <strong>Element Registry</strong>: 체계적인 DOM 요소
                        추적
                      </li>
                      <li>
                        • <strong>Selection System</strong>: 다중 선택과 포커스
                        관리
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Start */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">🔥 빠른 시작</h2>
            <div className="bg-gray-50 p-6 rounded-lg border">
              <div className="grid lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-gray-800">
                    Method 1: 간단한 타입 사용
                  </h3>
                  <CodeBlock size="sm" className="text-green-400">
                    {`import { createRefContext } from '@context-action/react';

// 간단한 타입 정의
const { Provider, useRefContext } = createRefContext<{
  canvas: HTMLCanvasElement;
  button: HTMLButtonElement;
}>('MyRefs');

function App() {
  return (
    <Provider>
      <CanvasComponent />
    </Provider>
  );
}

function CanvasComponent() {
  const { getRef, setRef } = useRefContext();
  
  return (
    <canvas 
      ref={(el) => setRef('canvas', el)}
      onClick={() => {
        const canvas = getRef('canvas');
        // canvas 사용
      }}
    />
  );
}`}
                  </CodeBlock>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3 text-gray-800">
                    Method 2: 선언적 정의
                  </h3>
                  <CodeBlock size="sm" className="text-green-400">
                    {`import { createRefContext } from '@context-action/react';

// 선언적 정의 (고급 기능)
const refDefinitions = {
  canvas: {
    cleanup: (el) => {
      const ctx = el.getContext('2d');
      ctx?.clearRect(0, 0, el.width, el.height);
    }
  },
  button: {
    initializer: (el) => {
      el.setAttribute('data-initialized', 'true');
    }
  }
};

const { Provider, useRefContext } = createRefContext(
  'AdvancedRefs', 
  refDefinitions
);

function Component() {
  const { refs, setRef } = useRefContext();
  
  return (
    <canvas ref={(el) => setRef('canvas', el)} />
  );
}`}
                  </CodeBlock>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Cards */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">🎮 실시간 데모</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Canvas Demo */}
              <a
                href="/refs/canvas"
                className="group bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-purple-300"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl group-hover:scale-110 transition-transform">
                    🎨
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2 text-gray-800 group-hover:text-purple-600">
                      Canvas Drawing Demo
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Canvas 기반 실시간 그리기 도구. Rectangle, Circle, Line,
                      Freehand 도구로 그래픽을 생성하고 DOM element를 체계적으로
                      관리하는 고급 예제입니다.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        Canvas API
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        Real-time
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        Interactive
                      </span>
                    </div>
                    <div className="mt-3 text-purple-500 text-sm font-medium group-hover:underline">
                      데모 체험하기 →
                    </div>
                  </div>
                </div>
              </a>

              {/* Mouse Events Demo */}
              <a
                href="/actionguard/mouse-events"
                className="group bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl group-hover:scale-110 transition-transform">
                    🖱️
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2 text-gray-800 group-hover:text-blue-600">
                      Mouse Events Demo
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      실시간 마우스 이벤트 처리와 시각적 피드백. Canvas와 유사한
                      DOM 요소 조작 및 고성능 인터랙션 패턴을 보여주는
                      예제입니다.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Mouse Events
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Real-time
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Visual Feedback
                      </span>
                    </div>
                    <div className="mt-3 text-blue-500 text-sm font-medium group-hover:underline">
                      데모 체험하기 →
                    </div>
                  </div>
                </div>
              </a>

              {/* Form Builder Demo */}
              <a
                href="/refs/form-builder"
                className="group bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-green-300"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl group-hover:scale-110 transition-transform">
                    📝
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2 text-gray-800 group-hover:text-green-600">
                      Form Builder Demo
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      동적 폼 빌더에서의 DOM element 관리. 필드 추가/제거,
                      선택/포커스 시스템, 키보드 단축키 등 실제 애플리케이션
                      시나리오를 구현합니다.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Dynamic Forms
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Multi-select
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Keyboard
                      </span>
                    </div>
                    <div className="mt-3 text-green-500 text-sm font-medium group-hover:underline">
                      데모 체험하기 →
                    </div>
                  </div>
                </div>
              </a>

              {/* useWaitForRefs Performance Demo */}
              <a
                href="/refs/waitforrefs-performance"
                className="group bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-orange-300"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl group-hover:scale-110 transition-transform">
                    ⚡
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2 text-gray-800 group-hover:text-orange-600">
                      useWaitForRefs Performance Demo
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      useWaitForRefs의 성능 최적화 동작을 검증합니다. 이미
                      존재하는 target은 즉시 반환하고, 존재하지 않는 target은
                      실제 마운트까지 대기하는 것을 실시간으로 확인할 수
                      있습니다.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                        Performance
                      </span>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                        Async
                      </span>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                        Optimization
                      </span>
                    </div>
                    <div className="mt-3 text-orange-500 text-sm font-medium group-hover:underline">
                      성능 테스트하기 →
                    </div>
                  </div>
                </div>
              </a>

              {/* useRefMountState Test Demo */}
              <a
                href="/refs/use-ref-mount-state-test"
                className="group bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl group-hover:scale-110 transition-transform">
                    🎯
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2 text-gray-800 group-hover:text-blue-600">
                      useRefMountState Test Demo
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      useRefMountState 훅의 리액티브 구독 기능을 격리된 환경에서
                      테스트합니다. useSyncExternalStore 기반의 실시간 상태
                      감지와 자동 리렌더링을 검증할 수 있습니다.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Reactive
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Isolated Test
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        useSyncExternalStore
                      </span>
                    </div>
                    <div className="mt-3 text-blue-500 text-sm font-medium group-hover:underline">
                      리액티브 테스트하기 →
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Core Concepts */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">💡 핵심 개념</h2>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-2xl mb-3">🎯</div>
                <h3 className="font-semibold text-lg mb-3 text-gray-800">
                  RefDefinitions
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  ref 관리 전략을 정의하는 설정 객체. cleanup, initializer 등의
                  라이프사이클 hook을 제공합니다.
                </p>
                <ul className="text-gray-600 text-xs space-y-1">
                  <li>• cleanup: element 제거 시 정리 작업</li>
                  <li>• initializer: element 등록 시 초기화</li>
                  <li>• validator: ref 유효성 검사</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-2xl mb-3">🔄</div>
                <h3 className="font-semibold text-lg mb-3 text-gray-800">
                  Context 분리
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  각 도메인별로 독립적인 ref context를 생성하여 관심사 분리와
                  타입 안전성을 보장합니다.
                </p>
                <ul className="text-gray-600 text-xs space-y-1">
                  <li>• 도메인별 독립 관리</li>
                  <li>• 타입 안전성 보장</li>
                  <li>• 메모리 누수 방지</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-2xl mb-3">⚡</div>
                <h3 className="font-semibold text-lg mb-3 text-gray-800">
                  성능 최적화
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  React 18의 useSyncExternalStore를 활용하여 최적화된 ref 상태
                  구독을 제공합니다.
                </p>
                <ul className="text-gray-600 text-xs space-y-1">
                  <li>• 불필요한 리렌더링 방지</li>
                  <li>• 메모리 효율성</li>
                  <li>• 동시성 모드 지원</li>
                </ul>
              </div>
            </div>
          </div>

          {/* API Reference */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">📚 API 레퍼런스</h2>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-gray-800">
                    createRefContext
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        Method 1: 간단한 타입
                      </h4>
                      <CodeBlock size="xs">
                        {`createRefContext<T>(contextName: string)`}
                      </CodeBlock>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        Method 2: RefDefinitions
                      </h4>
                      <CodeBlock size="xs">
                        {`createRefContext<T>(
  contextName: string,
  refDefinitions: RefDefinitions<T>
)`}
                      </CodeBlock>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-4 text-gray-800">
                    useRefContext
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        반환 값
                      </h4>
                      <CodeBlock size="xs">
                        {`{
  refs: RefStore<T>,
  getRef: (key: keyof T) => T[key] | null,
  setRef: (key: keyof T, element: T[key] | null) => void,
  clearRef: (key: keyof T) => void,
  clearAllRefs: () => void
}`}
                      </CodeBlock>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">✨ 모범 사례</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="font-semibold text-lg mb-3 text-green-800">
                  ✅ 권장사항
                </h3>
                <ul className="text-green-700 space-y-2 text-sm">
                  <li>• 도메인별로 별도의 ref context 생성</li>
                  <li>• cleanup 함수로 메모리 누수 방지</li>
                  <li>• TypeScript 타입 정의 활용</li>
                  <li>• RefDefinitions로 고급 기능 활용</li>
                  <li>• null 체크로 안전한 ref 접근</li>
                </ul>
              </div>

              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <h3 className="font-semibold text-lg mb-3 text-red-800">
                  ❌ 주의사항
                </h3>
                <ul className="text-red-700 space-y-2 text-sm">
                  <li>• 전역 ref context 남용 금지</li>
                  <li>• ref 접근 전 null 체크 필수</li>
                  <li>• 불필요한 ref 저장 지양</li>
                  <li>• cleanup 없는 리소스 사용 금지</li>
                  <li>• context 중첩으로 인한 복잡성 증가</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold mb-4">🔗 추가 자료</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <a
                href="/docs"
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                📖 공식 문서
              </a>
              <a
                href="/examples"
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                🎮 더 많은 예제
              </a>
              <a
                href="/api"
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                📚 API 문서
              </a>
            </div>
          </div>
        </div>
      </div>
    </PageWithLogMonitor>
  );
}
