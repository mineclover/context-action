import { SourceLink } from '../../../../../components/ui/SourceLink';
import { GITHUB_CONFIG } from '../../../../../constants/github';
import { useIncidentEscalationActions } from '../actions/useIncidentEscalationActions';
import { buildIncidentEscalationPacket } from '../business/incidentBusiness';
import {
  useIncidentEscalationData,
  useIncidentEscalationRefs,
} from '../hooks/useIncidentEscalationData';

const quickSourceFiles = [
  'pages/patterns/implementation-playbook/incident-escalation/contexts/IncidentEscalationContexts.tsx',
  'pages/patterns/implementation-playbook/incident-escalation/business/incidentStateMachine.ts',
  'pages/patterns/implementation-playbook/incident-escalation/handlers/useIncidentSubmissionHandlers.tsx',
  'pages/patterns/implementation-playbook/incident-escalation/views/IncidentEscalationView.tsx',
] as const;

function toneClass(phase: string) {
  switch (phase) {
    case 'ready':
      return 'border-green-300 bg-green-50 text-green-900';
    case 'blocked':
      return 'border-red-300 bg-red-50 text-red-900';
    case 'validating':
    case 'assembling':
      return 'border-blue-300 bg-blue-50 text-blue-900';
    default:
      return 'border-gray-300 bg-gray-50 text-gray-800';
  }
}

export function IncidentEscalationView() {
  const {
    draft,
    validation,
    escalation,
    escalationView,
    activity,
    isBusy,
    hasErrors,
  } = useIncidentEscalationData();
  const {
    updateTextField,
    updateSeverity,
    updateAffectedUsers,
    setRollbackReady,
    updateCommunicationChannel,
    submitEscalation,
    prefillExample,
    resetDemo,
  } = useIncidentEscalationActions();
  const {
    incidentTitleRef,
    severityRef,
    affectedUsersRef,
    communicationChannelRef,
    summaryRef,
    statusPanelRef,
  } = useIncidentEscalationRefs();

  const livePacket = buildIncidentEscalationPacket(draft);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <section className="rounded-[28px] border border-[#d9ddd2] bg-[linear-gradient(135deg,#fff1ec_0%,#f6f4ea_55%,#edf4ff_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-slate-300/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              Incident Escalation Playbook
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              incident escalation 흐름을 implementation-playbook으로 푼 예제
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              severity, 영향 범위, rollback readiness, 공지 채널을 기준으로
              escalation packet을 조립하는 incident workflow 예제입니다.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              data-testid="prefill-incident-button"
              onClick={prefillExample}
              type="button"
            >
              샘플 incident
            </button>
            <button
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              data-testid="reset-incident-button"
              onClick={resetDemo}
              type="button"
            >
              초기화
            </button>
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100"
              href="https://mineclover.github.io/context-action/ko/examples/incident-escalation-playbook"
              rel="noopener noreferrer"
              target="_blank"
            >
              문서 보기
            </a>
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              href={GITHUB_CONFIG.getSourceUrl(
                'packages/react/__tests__/patterns/incident-escalation-playbook.integration.test.tsx'
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
                Incident Escalation
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                validation, severity 정책, communication rule, escalation packet
                조립, success 이후 draft 변경 무효화까지 한 흐름으로 보여줍니다.
              </p>
            </div>
            <div className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {escalationView.label}
            </div>
          </div>

          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitEscalation();
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  장애 제목
                </span>
                <input
                  ref={incidentTitleRef.setRef}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
                  data-testid="incident-title-input"
                  onChange={(event) =>
                    void updateTextField('incidentTitle', event.target.value)
                  }
                  placeholder="API gateway latency spike"
                  value={draft.incidentTitle}
                />
                {validation.fieldErrors.incidentTitle && (
                  <p
                    className="text-sm text-red-600"
                    data-testid="incident-title-error"
                  >
                    {validation.fieldErrors.incidentTitle}
                  </p>
                )}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  심각도
                </span>
                <select
                  ref={severityRef.setRef}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
                  data-testid="incident-severity-select"
                  onChange={(event) =>
                    void updateSeverity(
                      event.target.value as 'sev3' | 'sev2' | 'sev1'
                    )
                  }
                  value={draft.severity}
                >
                  <option value="sev3">sev3</option>
                  <option value="sev2">sev2</option>
                  <option value="sev1">sev1</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  영향 사용자 수
                </span>
                <input
                  ref={affectedUsersRef.setRef}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
                  data-testid="affected-users-input"
                  min={1}
                  onChange={(event) =>
                    void updateAffectedUsers(Number(event.target.value || 0))
                  }
                  type="number"
                  value={draft.affectedUsers}
                />
                {validation.fieldErrors.affectedUsers && (
                  <p
                    className="text-sm text-red-600"
                    data-testid="affected-users-error"
                  >
                    {validation.fieldErrors.affectedUsers}
                  </p>
                )}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  공지 채널
                </span>
                <select
                  ref={communicationChannelRef.setRef}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
                  data-testid="communication-channel-select"
                  onChange={(event) =>
                    void updateCommunicationChannel(
                      event.target.value as 'slack' | 'email' | 'statuspage'
                    )
                  }
                  value={draft.communicationChannel}
                >
                  <option value="slack">slack</option>
                  <option value="email">email</option>
                  <option value="statuspage">statuspage</option>
                </select>
                {validation.fieldErrors.communicationChannel && (
                  <p
                    className="text-sm text-red-600"
                    data-testid="communication-channel-error"
                  >
                    {validation.fieldErrors.communicationChannel}
                  </p>
                )}
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-white">
              <input
                checked={draft.rollbackReady}
                data-testid="rollback-ready-checkbox"
                onChange={(event) =>
                  void setRollbackReady(event.target.checked)
                }
                type="checkbox"
              />
              rollback 준비 완료
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                장애 요약
              </span>
              <textarea
                ref={summaryRef.setRef}
                className="min-h-28 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
                data-testid="incident-summary-input"
                onChange={(event) =>
                  void updateTextField('summary', event.target.value)
                }
                placeholder="영향 범위, 현재 상태, 즉시 필요한 대응을 적어 주세요."
                value={draft.summary}
              />
              {validation.fieldErrors.summary && (
                <p
                  className="text-sm text-red-600"
                  data-testid="incident-summary-error"
                >
                  {validation.fieldErrors.summary}
                </p>
              )}
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                data-testid="submit-incident-escalation-button"
                disabled={isBusy}
                type="submit"
              >
                {isBusy
                  ? 'escalation packet 생성 중...'
                  : 'escalation packet 생성'}
              </button>
              <div className="self-center text-sm text-slate-500">
                {hasErrors
                  ? '현재 검증 오류가 있어 escalation packet 생성이 막혀 있습니다.'
                  : '현재 입력 상태로 바로 escalation packet을 만들 수 있습니다.'}
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
                  {draft.severity} · targets{' '}
                  {livePacket.escalationTargets.length}명
                </p>
              </div>
              <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                즉시 계산
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-3">
                <dt className="text-slate-500">Severity</dt>
                <dd className="mt-2 font-semibold text-slate-900">
                  {draft.severity}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <dt className="text-slate-500">영향 사용자</dt>
                <dd className="mt-2 font-semibold text-slate-900">
                  {draft.affectedUsers.toLocaleString()}명
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <dt className="text-slate-500">Targets</dt>
                <dd className="mt-2 font-semibold text-slate-900">
                  {livePacket.escalationTargets.join(', ')}
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
              escalation.phase
            )}`}
            data-testid="incident-escalation-status"
            ref={statusPanelRef.setRef}
            tabIndex={-1}
          >
            <div className="text-sm font-semibold uppercase tracking-[0.16em]">
              escalation 상태
            </div>
            <p className="mt-3 text-lg font-semibold">
              {escalationView.message}
            </p>
            <p
              className="mt-2 text-sm opacity-80"
              data-testid="incident-validation-summary"
            >
              {validation.summary}
            </p>

            {escalation.packet && (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-white/70 p-4">
                  <div className="text-sm text-slate-500">요약</div>
                  <div
                    className="mt-2 text-xl font-semibold text-slate-950"
                    data-testid="incident-packet-summary"
                  >
                    {escalation.packet.summary}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/70 p-3">
                    <div className="text-sm text-slate-500">우선순위</div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {escalation.packet.priority}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-3">
                    <div className="text-sm text-slate-500">Targets</div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {escalation.packet.escalationTargets.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                실행 로그
              </h2>
              <a
                className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
                href="https://mineclover.github.io/context-action/ko/context-layered/patterns/explicit-state-machine"
                rel="noopener noreferrer"
                target="_blank"
              >
                상태 머신 설명 ↗
              </a>
            </div>
            <ul className="mt-3 space-y-2" data-testid="incident-activity-log">
              {activity.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-900">
                      {entry.step}
                    </div>
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
