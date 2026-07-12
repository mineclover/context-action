
import { SourceLink } from '../../../../../components/ui/SourceLink';
import { GITHUB_CONFIG } from '../../../../../constants/github';
import { buildAccessReviewPacket } from '../business/accessBusiness';
import { useAccessRequestActions } from '../actions/useAccessRequestActions';
import {
  useAccessRequestData,
  useAccessRequestRefs,
} from '../hooks/useAccessRequestData';

const quickSourceFiles = [
  'pages/patterns/implementation-playbook/access-request/contexts/AccessRequestContexts.tsx',
  'pages/patterns/implementation-playbook/access-request/business/accessStateMachine.ts',
  'pages/patterns/implementation-playbook/access-request/handlers/useAccessSubmissionHandlers.tsx',
  'pages/patterns/implementation-playbook/access-request/views/AccessRequestView.tsx',
] as const;

function toneClass(phase: string) {
  switch (phase) {
    case 'ready':
      return 'border-green-300 bg-green-50 text-green-900';
    case 'blocked':
      return 'border-red-300 bg-red-50 text-red-900';
    case 'validating':
    case 'packaging':
      return 'border-blue-300 bg-blue-50 text-blue-900';
    default:
      return 'border-gray-300 bg-gray-50 text-gray-800';
  }
}

export function AccessRequestView() {
  const { draft, validation, review, reviewView, activity, isBusy, hasErrors } =
    useAccessRequestData();
  const {
    updateTextField,
    updateScope,
    setProductionAccess,
    submitReview,
    prefillExample,
    resetDemo,
  } = useAccessRequestActions();
  const {
    requesterNameRef,
    emailRef,
    scopeRef,
    justificationRef,
    statusPanelRef,
  } = useAccessRequestRefs();

  const livePacket = buildAccessReviewPacket(draft);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <section className="rounded-[28px] border border-[#d9ddd2] bg-[linear-gradient(135deg,#edf7f2_0%,#f7f5ec_55%,#eef4ff_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-slate-300/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              Access Request Playbook
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              접근 요청 approval 흐름을 implementation-playbook으로 푼 예제
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              주문 견적 예제와 같은 skill을 access review 시나리오에 적용한
              인터랙티브 데모입니다. 위에서는 요청과 리뷰 패키지를 보고,
              아래쪽 링크로 구조와 테스트를 따라갈 수 있습니다.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              data-testid="prefill-access-request-button"
              onClick={prefillExample}
              type="button"
            >
              샘플 요청
            </button>
            <button
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              data-testid="reset-access-request-button"
              onClick={resetDemo}
              type="button"
            >
              초기화
            </button>
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100"
              href="https://mineclover.github.io/context-action/ko/examples/access-request-playbook"
              rel="noopener noreferrer"
              target="_blank"
            >
              문서 보기
            </a>
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              href={GITHUB_CONFIG.getSourceUrl(
                'packages/react/__tests__/patterns/access-request-playbook.integration.test.tsx'
              )}
              rel="noopener noreferrer"
              target="_blank"
            >
              테스트 보기
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                제품 프리뷰
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Workspace Access Request
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                입력 검증, 권한 범위 체크, review packet 조립, 성공 후 draft 변경
                무효화까지 한 흐름으로 보여줍니다.
              </p>
            </div>
            <div className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {reviewView.label}
            </div>
          </div>

          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitReview();
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  요청자 이름
                </span>
                <input
                  ref={requesterNameRef.setRef}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
                  data-testid="requester-name-input"
                  onChange={(event) =>
                    void updateTextField('requesterName', event.target.value)
                  }
                  placeholder="Min Seo"
                  value={draft.requesterName}
                />
                {validation.fieldErrors.requesterName && (
                  <p className="text-sm text-red-600" data-testid="requester-name-error">
                    {validation.fieldErrors.requesterName}
                  </p>
                )}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  업무용 이메일
                </span>
                <input
                  ref={emailRef.setRef}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
                  data-testid="access-email-input"
                  onChange={(event) =>
                    void updateTextField('email', event.target.value)
                  }
                  placeholder="min.seo@example.com"
                  value={draft.email}
                />
                {validation.fieldErrors.email && (
                  <p className="text-sm text-red-600" data-testid="access-email-error">
                    {validation.fieldErrors.email}
                  </p>
                )}
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  권한 범위
                </span>
                <select
                  ref={scopeRef.setRef}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
                  data-testid="access-scope-select"
                  onChange={(event) =>
                    void updateScope(event.target.value as 'viewer' | 'editor' | 'admin')
                  }
                  value={draft.scope}
                >
                  <option value="viewer">viewer</option>
                  <option value="editor">editor</option>
                  <option value="admin">admin</option>
                </select>
                {validation.fieldErrors.scope && (
                  <p className="text-sm text-red-600" data-testid="access-scope-error">
                    {validation.fieldErrors.scope}
                  </p>
                )}
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-white">
                <input
                  checked={draft.productionAccess}
                  data-testid="production-access-checkbox"
                  onChange={(event) =>
                    void setProductionAccess(event.target.checked)
                  }
                  type="checkbox"
                />
                프로덕션 접근 포함
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                접근 목적
              </span>
              <textarea
                ref={justificationRef.setRef}
                className="min-h-28 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
                data-testid="justification-input"
                onChange={(event) =>
                  void updateTextField('justification', event.target.value)
                }
                placeholder="왜 이 권한이 필요한지, 어느 작업에 쓰는지 적어 주세요."
                value={draft.justification}
              />
              {validation.fieldErrors.justification && (
                <p className="text-sm text-red-600" data-testid="justification-error">
                  {validation.fieldErrors.justification}
                </p>
              )}
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                data-testid="submit-access-review-button"
                disabled={isBusy}
                type="submit"
              >
                {isBusy ? '리뷰 패키지 생성 중...' : '리뷰 패키지 생성'}
              </button>
              <div className="self-center text-sm text-slate-500">
                {hasErrors
                  ? '현재 검증 오류가 있어 review packet 생성이 막혀 있습니다.'
                  : '현재 입력 상태로 바로 review packet을 만들 수 있습니다.'}
              </div>
            </div>
          </form>
        </article>

        <div className="space-y-4">
          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  실시간 프리뷰
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {livePacket.priority}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {draft.scope} 권한 · reviewers {livePacket.reviewers.length}명
                </p>
              </div>
              <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                즉시 계산
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-3">
                <dt className="text-slate-500">Scope</dt>
                <dd className="mt-2 font-semibold text-slate-900">{draft.scope}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <dt className="text-slate-500">프로덕션</dt>
                <dd className="mt-2 font-semibold text-slate-900">
                  {draft.productionAccess ? '포함' : '미포함'}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <dt className="text-slate-500">Reviewers</dt>
                <dd className="mt-2 font-semibold text-slate-900">
                  {livePacket.reviewers.join(', ')}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <dt className="text-slate-500">Checklist</dt>
                <dd className="mt-2 font-semibold text-slate-900">
                  {livePacket.checklist.length}개
                </dd>
              </div>
            </dl>
          </article>

          <article
            className={`rounded-[28px] border p-5 shadow-sm ${toneClass(
              review.phase
            )}`}
            data-testid="access-review-status"
            ref={statusPanelRef.setRef}
            tabIndex={-1}
          >
            <div className="text-sm font-semibold uppercase tracking-[0.16em]">
              리뷰 상태
            </div>
            <p className="mt-3 text-lg font-semibold">{reviewView.message}</p>
            <p className="mt-2 text-sm opacity-80" data-testid="access-validation-summary">
              {validation.summary}
            </p>

            {review.packet && (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-white/70 p-4">
                  <div className="text-sm text-slate-500">요약</div>
                  <div
                    className="mt-2 text-xl font-semibold text-slate-950"
                    data-testid="review-packet-summary"
                  >
                    {review.packet.summary}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/70 p-3">
                    <div className="text-sm text-slate-500">우선순위</div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {review.packet.priority}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-3">
                    <div className="text-sm text-slate-500">Reviewers</div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {review.packet.reviewers.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">실행 로그</h2>
              <a
                className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
                href="https://mineclover.github.io/context-action/ko/context-layered/patterns/explicit-state-machine"
                rel="noopener noreferrer"
                target="_blank"
              >
                상태 머신 설명 ↗
              </a>
            </div>
            <ul className="mt-3 space-y-2" data-testid="access-activity-log">
              {activity.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-900">{entry.step}</div>
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {entry.tone}
                    </div>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {entry.detail}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          코드 추적
        </div>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          이 시나리오를 읽는 핵심 파일
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {quickSourceFiles.map((filePath) => (
            <SourceLink
              key={filePath}
              className="shadow-sm"
              filePath={filePath}
              variant="badge"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
