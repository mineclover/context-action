import { Link } from 'react-router-dom';

export default function IntegrationsOverview() {
  return (
    <div className="catalog-overview p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">🧩 Integrations</h1>
        <p className="text-xl text-gray-700 mb-6">
          실제 애플리케이션 구현 사례와 복잡한 통합 패턴을 학습합니다.
        </p>
      </div>

      <div className="learning-path bg-green-50 p-6 rounded-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">🚀 실무 적용 경로</h2>
        <ol className="space-y-3">
          <li className="flex items-center">
            <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">
              1
            </span>
            <div>
              <Link
                to="/integrations/business/todo-list"
                className="text-green-600 hover:text-green-800 font-medium text-lg"
              >
                Business Applications
              </Link>
              <p className="text-gray-600">
                실제 비즈니스 로직이 적용된 애플리케이션
              </p>
            </div>
          </li>
        </ol>
      </div>

      <div className="categories grid md:grid-cols-2 gap-6">
        <div className="category-card bg-white border border-violet-200 p-6 rounded-lg shadow-sm md:col-span-2">
          <div className="inline-flex rounded-md border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-violet-800">
            Accessibility state boundary
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-3">
            🗓️ React Aria Table + Calendar Reference
          </h3>
          <p className="text-sm text-slate-700 mb-4">
            React Aria가 키보드, 포커스, 컬렉션 동작을 맡고 Context-Action이
            선택·정렬·일정 확정 같은 도메인 action을 기록하는 레퍼런스입니다.
          </p>
          <Link
            to="/integrations/react-aria-reference"
            className="inline-flex items-center rounded-md bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800"
          >
            Reference 열기 →
          </Link>
        </div>

        <div className="category-card bg-indigo-50 border border-indigo-200 p-6 rounded-lg shadow-sm md:col-span-2">
          <h3 className="text-xl font-semibold mb-4">
            🧩 MCP / Function Calling Catalog
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            MCP 도구 발견, 모델 function calling, ToolContext 실행 체인을
            명령문과 예상 호출 순서로 검증하는 전용 레퍼런스입니다.
          </p>
          <Link
            to="/catalog/integrations/mcp-function-calling"
            className="inline-flex items-center rounded-full bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
          >
            카탈로그 열기 →
          </Link>
        </div>

        <div className="category-card bg-white border border-slate-200 p-6 rounded-lg shadow-sm md:col-span-2">
          <div className="inline-flex rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-800">
            Usecase + Recipe profile
          </div>
          <h3 className="text-xl font-semibold mb-3 mt-3">
            🧭 Usecase Boundary Lab
          </h3>
          <p className="text-sm text-slate-700 mb-4">
            Context-Layered Runtime을 Facade와 Astryx-style Recipe에 연결합니다.
            코드를 편집하고 validation abort, handler trace, controlled UI
            상태를 같은 화면에서 확인합니다.
          </p>
          <Link
            to="/integrations/live-code-editor"
            className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Lab 열기 →
          </Link>
        </div>

        <div className="category-card bg-white border border-cyan-200 p-6 rounded-lg shadow-sm md:col-span-2">
          <div className="inline-flex rounded-md border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800">
            AI chat + web tools
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-3">
            ⚡ Realtime Web Coding
          </h3>
          <p className="text-sm text-slate-700 mb-4">
            채팅이 web tool을 호출해 HTML/CSS/JS workspace를 수정하고 sandbox
            iframe에 즉시 반영하는 작은 Bolt.diy-inspired 흐름입니다.
          </p>
          <Link
            to="/integrations/live-web-coding"
            className="inline-flex items-center rounded-md bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-800"
          >
            Web coding 열기 →
          </Link>
          <a
            href="https://mineclover.github.io/context-action/web-coding/"
            target="_blank"
            rel="noreferrer"
            className="ml-2 inline-flex items-center rounded-md border border-cyan-300 px-4 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-50"
          >
            Standalone Studio ↗
          </a>
        </div>

        <div className="category-card bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4">
            🏢 Business Applications
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            실제 비즈니스 시나리오에서 사용할 수 있는 완성된 애플리케이션들
          </p>
          <ul className="space-y-2">
            <li>
              <Link
                to="/integrations/business/todo-list"
                className="text-green-600 hover:underline"
              >
                📝 Todo List
              </Link>
              <span className="text-xs text-gray-500 ml-2">
                CRUD, State Management
              </span>
            </li>
            <li>
              <Link
                to="/integrations/business/shopping-cart"
                className="text-green-600 hover:underline"
              >
                🛒 Shopping Cart
              </Link>
              <span className="text-xs text-gray-500 ml-2">
                E-commerce Logic
              </span>
            </li>
            <li>
              <Link
                to="/integrations/business/chat"
                className="text-green-600 hover:underline"
              >
                💬 Chat Application
              </Link>
              <span className="text-xs text-gray-500 ml-2">
                Real-time Communication
              </span>
            </li>
            <li>
              <Link
                to="/integrations/business/user-profile"
                className="text-green-600 hover:underline"
              >
                👤 User Profile
              </Link>
              <span className="text-xs text-gray-500 ml-2">
                User Management
              </span>
            </li>
          </ul>
        </div>

        <div className="category-card bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4">🔬 Advanced Examples</h3>
          <p className="text-sm text-gray-600 mb-4">
            고급 기능과 복잡한 상호작용을 보여주는 실험적 구현들
          </p>
          <ul className="space-y-2">
            <li>
              <Link
                to="/integrations/advanced/form-builder"
                className="text-green-600 hover:underline"
              >
                📋 Form Builder
              </Link>
              <span className="text-xs text-gray-500 ml-2">Dynamic Forms</span>
            </li>
            <li>
              <Link
                to="/integrations/advanced/canvas"
                className="text-green-600 hover:underline"
              >
                🎨 Canvas Integration
              </Link>
              <span className="text-xs text-gray-500 ml-2">
                Graphics & Animation
              </span>
            </li>
            <li>
              <Link
                to="/integrations/advanced/concurrent-actions"
                className="text-green-600 hover:underline"
              >
                ⚡ Concurrent Actions
              </Link>
              <span className="text-xs text-gray-500 ml-2">
                Parallel Processing
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="integration-features bg-gradient-to-r from-green-100 to-blue-100 p-6 rounded-lg mt-8">
        <h3 className="text-lg font-semibold mb-4">🌟 통합의 장점</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              완성된 솔루션
            </h4>
            <p className="text-sm text-gray-600">
              실제 프로덕션 환경에서 사용할 수 있는 완성도 높은 구현
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              모범 사례
            </h4>
            <p className="text-sm text-gray-600">
              Context-Action 프레임워크의 모범 사례와 권장 패턴
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              확장 가능성
            </h4>
            <p className="text-sm text-gray-600">
              기존 코드를 기반으로 새로운 기능을 쉽게 추가할 수 있는 구조
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2 flex items-center">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
              학습 효과
            </h4>
            <p className="text-sm text-gray-600">
              실제 사용 사례를 통한 효과적인 학습과 이해도 향상
            </p>
          </div>
        </div>
      </div>

      <div className="use-cases bg-white border border-gray-200 p-6 rounded-lg mt-8">
        <h3 className="text-lg font-semibold mb-4">📚 활용 시나리오</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-green-600 mb-2">
              🏢 엔터프라이즈 애플리케이션
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• CRM 시스템의 고객 관리</li>
              <li>• ERP 시스템의 업무 프로세스</li>
              <li>• 프로젝트 관리 도구</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-green-600 mb-2">🚀 스타트업 MVP</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 빠른 프로토타입 구현</li>
              <li>• 최소 기능 제품 개발</li>
              <li>• 사용자 피드백 반영</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">💡 통합 가이드</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>비즈니스 요구사항을 분석하고 적합한 예제를 선택하세요</li>
          <li>예제 코드를 기반으로 필요한 기능을 확장하세요</li>
          <li>성능과 사용자 경험을 동시에 고려하여 구현하세요</li>
          <li>테스트 코드를 작성하여 안정성을 보장하세요</li>
        </ul>
      </div>
    </div>
  );
}
