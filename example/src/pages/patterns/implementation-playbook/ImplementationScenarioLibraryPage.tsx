
import { Link } from 'react-router-dom';
import { GITHUB_CONFIG } from '../../../constants/github';
import { useRegisterSourceFile } from '../../../hooks/useRegisterSourceFile';

const scenarios = [
  {
    name: 'Workspace Access Request',
    summary:
      '접근 요청, justification 검증, review packet 생성을 다루는 approval 계열 예제입니다.',
    machine: ['idle', 'validating', 'blocked', 'packaging', 'ready'],
    business: [
      'accessDraft.ts',
      'accessValidation.ts',
      'accessReviewPacket.ts',
      'accessStateMachine.ts',
      'accessActivity.ts',
    ],
    tests: [
      '짧은 justification이면 submit 차단',
      'production access면 review note 강화',
      'success 이후 scope 변경 시 idle 복귀',
    ],
    route: '/patterns/implementation-playbook/access-request',
    promoted: true,
  },
  {
    name: 'Incident Escalation',
    summary:
      'severity와 영향 범위에 따라 escalation package를 조립하는 incident workflow 예제입니다.',
    machine: ['idle', 'validating', 'blocked', 'assembling', 'ready'],
    business: [
      'incidentDraft.ts',
      'incidentValidation.ts',
      'incidentEscalationPacket.ts',
      'incidentStateMachine.ts',
      'incidentActivity.ts',
    ],
    tests: [
      'severity가 escalation target 변경',
      'rollback readiness가 final packet 반영',
      'reset 후 baseline 복귀',
    ],
    route: '/patterns/implementation-playbook/incident-escalation',
    promoted: true,
  },
  {
    name: 'Renewal Risk Review',
    summary:
      'renewal scoring과 follow-up package 생성에 초점을 둔 review workflow 예제입니다.',
    machine: ['idle', 'validating', 'blocked', 'scoring', 'ready'],
    business: [
      'renewalDraft.ts',
      'renewalValidation.ts',
      'renewalRiskScore.ts',
      'renewalStateMachine.ts',
      'renewalActivity.ts',
    ],
    tests: [
      '필수값 누락 시 blocked 전이',
      'usage score와 sponsor 여부가 recommendation 반영',
      'success 후 draft 변경 시 review 결과 무효화',
    ],
    route: '/patterns/implementation-playbook/renewal-risk-review',
    promoted: true,
  },
] as const;

function useScenarioLibrarySourceRegistration() {
  useRegisterSourceFile(
    'pages/patterns/implementation-playbook/ImplementationScenarioLibraryPage.tsx',
    {
      name: 'ImplementationScenarioLibraryPage',
      description:
        'Scenario library showing how the implementation-playbook standard maps to other domains.',
      tags: ['patterns', 'implementation-playbook', 'scenario-library'],
      priority: 8,
    }
  );
}

export default function ImplementationScenarioLibraryPage() {
  useScenarioLibrarySourceRegistration();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <section className="rounded-[28px] border border-[#d9ddd2] bg-[linear-gradient(135deg,#eff4ff_0%,#f5f7ef_60%,#f9efe8_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-slate-300/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              Scenario Library
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              같은 스킬로 다른 도메인 예제를 설계하는 기준
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              canonical order form에서 정리한 표준 컨벤션과 skill을
              access request, incident escalation, renewal review 시나리오에
              어떻게 옮길지 한 화면에서 확인합니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              className="inline-flex items-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
              href="https://mineclover.github.io/context-action/ko/context-layered/implementation-convention"
              rel="noopener noreferrer"
              target="_blank"
            >
              표준 컨벤션 ↗
            </a>
            <a
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
              href="https://mineclover.github.io/context-action/ko/examples/implementation-playbook-scenarios"
              rel="noopener noreferrer"
              target="_blank"
            >
              시나리오 문서 ↗
            </a>
            <a
              className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100"
              href={GITHUB_CONFIG.getSourceUrl(
                'skills/context-action-implementation-playbook/SKILL.md'
              )}
              rel="noopener noreferrer"
              target="_blank"
            >
              repo-local skill 열기 ↗
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            표준 로직
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            skill이 강제하는 최소 구조
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ['contexts/', 'Action, Store, Ref 경계 정의'],
              ['business/', 'draft, validation, result, activity, state machine'],
              ['handlers/', 'draft 흐름과 submission 흐름 분리'],
              ['actions/', 'view-facing dispatch helper'],
              ['hooks/', '구독과 view용 파생값'],
              ['views/', '렌더링과 입력 전달만 담당'],
            ].map(([title, body]) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="font-mono text-sm font-semibold text-slate-900">
                  {title}
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">
              검증 체크리스트
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>invalid submit에서 field error와 focus 이동</li>
              <li>valid submit에서 결과 계산과 success 전이</li>
              <li>success 이후 draft 변경 시 idle 또는 fresh waiting 상태 복귀</li>
              <li>reset 시 baseline 상태 복원</li>
            </ul>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
              to="/patterns/implementation-playbook"
            >
              canonical example 보기
            </Link>
            <a
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
              href="https://mineclover.github.io/context-action/ko/context-layered/patterns/explicit-state-machine"
              rel="noopener noreferrer"
              target="_blank"
            >
              상태 머신 문서 ↗
            </a>
          </div>
        </article>

        <div className="space-y-4">
          {scenarios.map((scenario) => (
            <article
              key={scenario.name}
              className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {scenario.name}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    {scenario.summary}
                  </p>
                </div>
                <div className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {scenario.promoted ? 'interactive demo' : 'skill-aligned'}
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Suggested State Machine
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {scenario.machine.map((phase, index) => (
                    <span
                      key={phase}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                        {index + 1}
                      </span>
                      {phase}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">
                    business 모듈
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {scenario.business.map((fileName) => (
                      <li key={fileName} className="font-mono">
                        {fileName}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">
                    test 포인트
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {scenario.tests.map((testPoint) => (
                      <li key={testPoint}>{testPoint}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {scenario.route && (
                <div className="mt-4">
                  <Link
                    className="inline-flex items-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
                    to={scenario.route}
                  >
                    이 시나리오 열기
                  </Link>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
