import { Link } from 'react-router-dom';

export default function PatternsOverview() {
  return (
    <div className="catalog-overview p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">🎛️ Patterns</h1>
        <p className="text-xl text-gray-700 mb-6">
          고급 사용 패턴과 복잡한 워크플로우 구현 방법을 학습합니다.
        </p>
      </div>

      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 p-6 rounded-lg mb-8 border border-emerald-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
              First Stop
            </div>
            <h2 className="text-2xl font-semibold mt-4 text-gray-900">
              Implementation Playbook is the recommended starting pattern
            </h2>
            <p className="text-gray-700 mt-2 max-w-3xl">
              이 예제는 설계 문서, 실제 구현, 테스트 사이클이 한 번에 연결된
              canonical example입니다. 패턴을 하나만 먼저 본다면 여기서 시작하는
              것이 가장 빠릅니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/patterns/implementation-playbook"
              className="inline-flex items-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
            >
              Open example →
            </Link>
            <a
              href="https://mineclover.github.io/context-action/ko/examples/canonical-order-form"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            >
              Read docs ↗
            </a>
          </div>
        </div>
      </div>

      <div className="learning-path bg-purple-50 p-6 rounded-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">🎨 패턴 학습 경로</h2>
        <ol className="space-y-3">
          <li className="flex items-center">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">
              1
            </span>
            <div>
              <Link
                to="/patterns/implementation-playbook"
                className="text-purple-600 hover:text-purple-800 font-medium text-lg"
              >
                Implementation Playbook
              </Link>
              <p className="text-gray-600">
                설계와 구현, 테스트를 한 번에 연결해서 보는 canonical example
              </p>
            </div>
          </li>
          <li className="flex items-center">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">
              2
            </span>
            <div>
              <Link
                to="/patterns/implementation-playbook/scenarios"
                className="text-purple-600 hover:text-purple-800 font-medium text-lg"
              >
                Scenario Library
              </Link>
              <p className="text-gray-600">
                같은 컨벤션과 skill을 다른 도메인에 적용하는 예제 모음
              </p>
            </div>
          </li>
          <li className="flex items-center">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">
              3
            </span>
            <div>
              <Link
                to="/patterns/implementation-playbook/access-request"
                className="text-purple-600 hover:text-purple-800 font-medium text-lg"
              >
                Access Request Playbook
              </Link>
              <p className="text-gray-600">
                같은 skill을 approval/review workflow에 적용한 interactive demo
              </p>
            </div>
          </li>
          <li className="flex items-center">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">
              4
            </span>
            <div>
              <Link
                to="/patterns/implementation-playbook/incident-escalation"
                className="text-purple-600 hover:text-purple-800 font-medium text-lg"
              >
                Incident Escalation Playbook
              </Link>
              <p className="text-gray-600">
                같은 skill을 incident/escalation workflow에 적용한 interactive
                demo
              </p>
            </div>
          </li>
          <li className="flex items-center">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">
              5
            </span>
            <div>
              <Link
                to="/patterns/implementation-playbook/renewal-risk-review"
                className="text-purple-600 hover:text-purple-800 font-medium text-lg"
              >
                Renewal Risk Review Playbook
              </Link>
              <p className="text-gray-600">
                같은 skill을 renewal/customer-success workflow에 적용한
                interactive demo
              </p>
            </div>
          </li>
          <li className="flex items-center">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">
              6
            </span>
            <div>
              <Link
                to="/patterns/conditional"
                className="text-purple-600 hover:text-purple-800 font-medium text-lg"
              >
                Conditional Patterns
              </Link>
              <p className="text-gray-600">조건부 실행 패턴과 비즈니스 로직</p>
            </div>
          </li>
          <li className="flex items-center">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">
              7
            </span>
            <div>
              <Link
                to="/patterns/pipeline/flow-control"
                className="text-purple-600 hover:text-purple-800 font-medium text-lg"
              >
                Pipeline Patterns
              </Link>
              <p className="text-gray-600">플로우 제어와 파이프라인 구성</p>
            </div>
          </li>
          <li className="flex items-center">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">
              8
            </span>
            <div>
              <Link
                to="/patterns/refs"
                className="text-purple-600 hover:text-purple-800 font-medium text-lg"
              >
                Ref Patterns
              </Link>
              <p className="text-gray-600">Ref 기반 상호작용 패턴</p>
            </div>
          </li>
          <li className="flex items-center">
            <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">
              9
            </span>
            <div>
              <Link
                to="/patterns/business-logic"
                className="text-purple-600 hover:text-purple-800 font-medium text-lg"
              >
                Business Logic Separation
              </Link>
              <p className="text-gray-600">
                비즈니스 로직 분리와 비동기 프로세스 상태 관리
              </p>
            </div>
          </li>
        </ol>
      </div>

      <div className="categories grid md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="category-card bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4">🏗️ Architecture</h3>
          <ul className="space-y-2">
            <li>
              <Link
                to="/patterns/layered-architecture"
                className="text-purple-600 hover:underline"
              >
                Layered Architecture
              </Link>
            </li>
            <li>
              <Link
                to="/patterns/implementation-playbook"
                className="text-purple-600 hover:underline"
              >
                Implementation Playbook
              </Link>
            </li>
            <li>
              <Link
                to="/patterns/implementation-playbook/scenarios"
                className="text-purple-600 hover:underline"
              >
                Scenario Library
              </Link>
            </li>
            <li>
              <Link
                to="/patterns/implementation-playbook/access-request"
                className="text-purple-600 hover:underline"
              >
                Access Request Playbook
              </Link>
            </li>
            <li>
              <Link
                to="/patterns/implementation-playbook/incident-escalation"
                className="text-purple-600 hover:underline"
              >
                Incident Escalation Playbook
              </Link>
            </li>
            <li>
              <Link
                to="/patterns/implementation-playbook/renewal-risk-review"
                className="text-purple-600 hover:underline"
              >
                Renewal Risk Review Playbook
              </Link>
            </li>
            <li className="text-sm text-gray-600">
              • Store + Action + Ref interplay
            </li>
            <li className="text-sm text-gray-600">
              • Canonical example structure
            </li>
            <li className="text-sm text-gray-600">
              • Stability-oriented testing flow
            </li>
            <li className="text-sm text-gray-600">
              • Reusable skill and domain scenario mapping
            </li>
          </ul>
        </div>

        <div className="category-card bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4">🔀 Conditional</h3>
          <ul className="space-y-2">
            <li>
              <Link
                to="/patterns/conditional"
                className="text-purple-600 hover:underline"
              >
                Overview
              </Link>
            </li>
            <li>
              <Link
                to="/patterns/conditional/permissions"
                className="text-purple-600 hover:underline"
              >
                Permission-based
              </Link>
            </li>
            <li>
              <Link
                to="/patterns/conditional/form-validation"
                className="text-purple-600 hover:underline"
              >
                Form Validation
              </Link>
            </li>
            <li>
              <Link
                to="/patterns/conditional/workflow-steps"
                className="text-purple-600 hover:underline"
              >
                Workflow Steps
              </Link>
            </li>
            <li>
              <Link
                to="/patterns/conditional/feature-toggle"
                className="text-purple-600 hover:underline"
              >
                Feature Toggle
              </Link>
            </li>
          </ul>
        </div>

        <div className="category-card bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4">🔄 Pipeline</h3>
          <ul className="space-y-2">
            <li>
              <Link
                to="/patterns/pipeline/flow-control"
                className="text-purple-600 hover:underline"
              >
                Flow Control
              </Link>
            </li>
          </ul>
        </div>

        <div className="category-card bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4">📎 Refs</h3>
          <ul className="space-y-2">
            <li>
              <Link
                to="/patterns/refs"
                className="text-purple-600 hover:underline"
              >
                Refs Index
              </Link>
            </li>
            <li>
              <Link
                to="/patterns/refs/form-builder"
                className="text-purple-600 hover:underline"
              >
                Form Builder
              </Link>
            </li>
            <li>
              <Link
                to="/patterns/refs/waitforrefs-performance"
                className="text-purple-600 hover:underline"
              >
                Performance Test
              </Link>
            </li>
            <li>
              <Link
                to="/patterns/refs/canvas"
                className="text-purple-600 hover:underline"
              >
                Canvas Integration
              </Link>
            </li>
          </ul>
        </div>

        <div className="category-card bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4">🏗️ Business Logic</h3>
          <ul className="space-y-2">
            <li>
              <Link
                to="/patterns/business-logic"
                className="text-purple-600 hover:underline"
              >
                Business Logic Separation
              </Link>
            </li>
            <li className="text-sm text-gray-600">• FileUpload Service</li>
            <li className="text-sm text-gray-600">• State Machine Pattern</li>
            <li className="text-sm text-gray-600">• Progress-Only Updates</li>
            <li className="text-sm text-gray-600">• Modular Integration</li>
          </ul>
        </div>
      </div>

      <div className="pattern-highlights bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-lg mt-8">
        <h3 className="text-lg font-semibold mb-4">✨ 패턴의 특징</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">🎯 재사용성</h4>
            <p className="text-sm text-gray-600">
              검증된 패턴을 통해 코드 재사용성을 높이고 개발 시간을 단축합니다.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">🏗️ 확장성</h4>
            <p className="text-sm text-gray-600">
              모듈화된 패턴으로 복잡한 비즈니스 로직을 체계적으로 구성합니다.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">🔒 안정성</h4>
            <p className="text-sm text-gray-600">
              검증된 패턴을 사용하여 예측 가능한 동작과 안정성을 보장합니다.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">📚 학습성</h4>
            <p className="text-sm text-gray-600">
              일관된 패턴을 통해 팀 내 코드 이해도와 학습 효율성을 향상시킵니다.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">💡 패턴 활용 가이드</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>비즈니스 요구사항에 맞는 패턴을 선택하세요</li>
          <li>패턴을 조합하여 복잡한 워크플로우를 구성하세요</li>
          <li>팀 내에서 패턴을 문서화하고 공유하세요</li>
          <li>패턴의 성능 특성을 이해하고 적절히 활용하세요</li>
        </ul>
      </div>
    </div>
  );
}
