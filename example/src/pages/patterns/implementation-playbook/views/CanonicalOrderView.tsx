import { SourceLink } from '../../../../components/ui/SourceLink';
import { GITHUB_CONFIG } from '../../../../constants/github';
import { useCanonicalOrderActions } from '../actions/useCanonicalOrderActions';
import { buildOrderQuote } from '../business/orderBusiness';
import {
  useCanonicalOrderData,
  useCanonicalOrderRefs,
} from '../hooks/useCanonicalOrderData';

const readingOrder = [
  'contexts/CanonicalOrderContexts.tsx',
  'business/orderDraft.ts',
  'business/orderValidation.ts',
  'business/orderQuote.ts',
  'business/submissionStateMachine.ts',
  'handlers/useCanonicalOrderSubmissionHandlers.tsx',
  'actions/useCanonicalOrderActions.ts',
  'hooks/useCanonicalOrderData.ts',
  'views/CanonicalOrderView.tsx',
  'CanonicalOrderExample.tsx',
] as const;

const specSections = [
  ['개요', '이 예제가 무엇을 증명하는지 한 문장으로 적습니다.'],
  ['목표', '반드시 보여줘야 하는 동작과 구조를 고정합니다.'],
  ['품질 게이트', '머지 전 통과할 명령과 검증 기준을 적습니다.'],
  ['사용자 시나리오', '입력, 실패, 성공, 리셋 흐름을 나눕니다.'],
  ['비범위', '하지 않을 것을 명확히 적어 과설계를 막습니다.'],
] as const;

const codeLayers = [
  ['contexts/', 'Action, Store, Ref 경계를 정의합니다.'],
  [
    'business/',
    'draft 기본값, validation, quote, state machine을 순수 함수로 둡니다.',
  ],
  ['handlers/', '최신 상태 읽기, 상태 전이, side effect를 조율합니다.'],
  ['actions/', 'view가 쓰는 dispatch helper를 제공합니다.'],
  ['hooks/', '구독과 파생 값을 화면용으로 정리합니다.'],
  ['views/', '렌더링과 입력 전달만 담당합니다.'],
] as const;

const quickSourceFiles = [
  'pages/patterns/implementation-playbook/CanonicalOrderExample.tsx',
  'pages/patterns/implementation-playbook/contexts/CanonicalOrderContexts.tsx',
  'pages/patterns/implementation-playbook/business/submissionStateMachine.ts',
  'pages/patterns/implementation-playbook/handlers/useCanonicalOrderSubmissionHandlers.tsx',
  'pages/patterns/implementation-playbook/views/CanonicalOrderView.tsx',
] as const;

const docsLinks = [
  {
    label: '예제 설명 문서',
    href: 'https://mineclover.github.io/context-action/ko/examples/canonical-order-form',
  },
  {
    label: '명시적 상태 전이',
    href: 'https://mineclover.github.io/context-action/ko/context-layered/patterns/explicit-state-machine',
  },
] as const;

function statusTone(status: string) {
  switch (status) {
    case 'success':
      return 'border-green-300 bg-green-50 text-green-900';
    case 'blocked':
      return 'border-red-300 bg-red-50 text-red-900';
    case 'validating':
    case 'calculating':
      return 'border-blue-300 bg-blue-50 text-blue-900';
    default:
      return 'border-gray-300 bg-gray-50 text-gray-800';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'validating':
      return '검증';
    case 'calculating':
      return '계산';
    case 'success':
      return '완료';
    case 'blocked':
      return '수정 필요';
    default:
      return '대기';
  }
}

function formatOccurredAt(occurredAt: string) {
  const date = new Date(occurredAt);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${hours}시 ${minutes}분 ${seconds}초`;
}

export function CanonicalOrderView() {
  const {
    draft,
    validation,
    submission,
    submissionView,
    activity,
    isBusy,
    hasErrors,
  } = useCanonicalOrderData();
  const {
    updatePlan,
    updateQuantity,
    updateTextField,
    setOnboarding,
    submitOrder,
    prefillExample,
    resetDemo,
  } = useCanonicalOrderActions();
  const { customerNameRef, emailRef, quantityRef, statusPanelRef } =
    useCanonicalOrderRefs();

  const liveQuote = buildOrderQuote(draft);
  const planLabel = draft.plan === 'starter' ? '스타터' : '팀';

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <section className="rounded-[28px] border border-[#d9ddd2] bg-[linear-gradient(135deg,#f7f1e6_0%,#f4f6ef_60%,#eef4f7_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-slate-300/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              팀 도입 견적 예제
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              팀 도입 견적을 입력하고, 아래에서 구조를 확인하는 예제
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              위에서는 실제 입력과 견적 결과를 보고, 아래에서는 이 기능을 스펙과
              코드로 어떻게 나누는지 짧게 확인합니다.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              data-testid="prefill-valid-order-button"
              onClick={prefillExample}
              type="button"
            >
              샘플 입력
            </button>
            <button
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              data-testid="reset-order-demo-button"
              onClick={resetDemo}
              type="button"
            >
              초기화
            </button>
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100"
              href={docsLinks[0].href}
              rel="noopener noreferrer"
              target="_blank"
            >
              문서 보기
            </a>
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              href={GITHUB_CONFIG.getSourceUrl(
                'packages/react/__tests__/patterns/implementation-playbook.integration.test.tsx'
              )}
              rel="noopener noreferrer"
              target="_blank"
            >
              테스트 보기
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                제품 프리뷰
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                팀 도입 견적 입력
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                화면은 입력과 견적 확인에만 집중하고, 검증과 상태 전이는 하위
                구조에서 처리됩니다.
              </p>
            </div>
            <div className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {submissionView.label ?? statusLabel(submission.phase)}
            </div>
          </div>

          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitOrder();
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  담당자 이름
                </span>
                <input
                  ref={customerNameRef.setRef}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
                  data-testid="customer-name-input"
                  onChange={(event) =>
                    void updateTextField('customerName', event.target.value)
                  }
                  placeholder="홍길동"
                  value={draft.customerName}
                />
                {validation.fieldErrors.customerName && (
                  <p
                    className="text-sm text-red-600"
                    data-testid="customer-name-error"
                  >
                    {validation.fieldErrors.customerName}
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
                  data-testid="email-input"
                  onChange={(event) =>
                    void updateTextField('email', event.target.value)
                  }
                  placeholder="team@example.com"
                  value={draft.email}
                />
                {validation.fieldErrors.email && (
                  <p className="text-sm text-red-600" data-testid="email-error">
                    {validation.fieldErrors.email}
                  </p>
                )}
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[0.78fr_1.22fr]">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  좌석 수
                </span>
                <input
                  ref={quantityRef.setRef}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
                  data-testid="quantity-input"
                  min={1}
                  onChange={(event) =>
                    void updateQuantity(Number(event.target.value || 0))
                  }
                  type="number"
                  value={draft.quantity}
                />
                {validation.fieldErrors.quantity && (
                  <p
                    className="text-sm text-red-600"
                    data-testid="quantity-error"
                  >
                    {validation.fieldErrors.quantity}
                  </p>
                )}
              </label>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-slate-700">
                  플랜 선택
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="rounded-2xl border border-slate-300 bg-slate-50 p-4 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-white">
                    <div className="flex items-center gap-3">
                      <input
                        checked={draft.plan === 'starter'}
                        data-testid="starter-plan-radio"
                        name="plan"
                        onChange={() => void updatePlan('starter')}
                        type="radio"
                      />
                      <div>
                        <div className="font-medium text-slate-900">스타터</div>
                        <div>좌석당 $24 · 소규모 팀용</div>
                      </div>
                    </div>
                  </label>
                  <label className="rounded-2xl border border-slate-300 bg-slate-50 p-4 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-white">
                    <div className="flex items-center gap-3">
                      <input
                        checked={draft.plan === 'team'}
                        data-testid="team-plan-radio"
                        name="plan"
                        onChange={() => void updatePlan('team')}
                        type="radio"
                      />
                      <div>
                        <div className="font-medium text-slate-900">팀</div>
                        <div>좌석당 $42 · 협업 제어 포함</div>
                      </div>
                    </div>
                  </label>
                </div>
              </fieldset>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-white">
              <input
                checked={draft.onboarding}
                data-testid="onboarding-checkbox"
                onChange={(event) => void setOnboarding(event.target.checked)}
                type="checkbox"
              />
              도입 워크숍과 롤아웃 가이드 추가 ($199 1회)
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                도입 메모
              </span>
              <textarea
                className="min-h-20 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white"
                data-testid="notes-input"
                onChange={(event) =>
                  void updateTextField('notes', event.target.value)
                }
                placeholder="런칭 일정, 교육 필요 사항, 마이그레이션 제약을 적어주세요."
                value={draft.notes}
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                data-testid="submit-order-button"
                disabled={isBusy}
                type="submit"
              >
                {isBusy ? '견적 계산 중...' : '견적 생성'}
              </button>
              <div className="self-center text-sm text-slate-500">
                {hasErrors
                  ? '현재 검증 오류가 있어 제출이 막혀 있습니다.'
                  : '현재 입력 상태로 바로 견적을 만들 수 있습니다.'}
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
                  ${liveQuote.total.toFixed(2)}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {planLabel} 플랜 · {liveQuote.seats}석
                </p>
              </div>
              <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                즉시 계산
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-3">
                <dt className="text-slate-500">기본 금액</dt>
                <dd className="mt-2 font-semibold text-slate-900">
                  ${liveQuote.subtotal.toFixed(2)}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <dt className="text-slate-500">할인</dt>
                <dd className="mt-2 font-semibold text-slate-900">
                  ${liveQuote.discount.toFixed(2)}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <dt className="text-slate-500">온보딩</dt>
                <dd className="mt-2 font-semibold text-slate-900">
                  ${liveQuote.onboardingFee.toFixed(2)}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <dt className="text-slate-500">메모</dt>
                <dd className="mt-2 font-semibold text-slate-900">
                  {draft.notes.trim() ? '있음' : '없음'}
                </dd>
              </div>
            </dl>
          </article>

          <article
            className={`rounded-[28px] border p-5 shadow-sm ${statusTone(
              submission.phase
            )}`}
            data-testid="submission-status"
            ref={statusPanelRef.setRef}
            tabIndex={-1}
          >
            <div className="text-sm font-semibold uppercase tracking-[0.16em]">
              제출 상태
            </div>
            <p className="mt-3 text-lg font-semibold">
              {submissionView.message}
            </p>
            <p
              className="mt-2 text-sm opacity-80"
              data-testid="validation-summary"
            >
              {validation.summary}
            </p>

            {submission.quote && (
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/70 p-3">
                  <dt className="text-slate-500">플랜</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {submission.quote.plan === 'starter' ? '스타터' : '팀'}
                  </dd>
                </div>
                <div className="rounded-2xl bg-white/70 p-3">
                  <dt className="text-slate-500">좌석</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {submission.quote.seats}
                  </dd>
                </div>
                <div className="rounded-2xl bg-white/70 p-3">
                  <dt className="text-slate-500">기본 금액</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    ${submission.quote.subtotal.toFixed(2)}
                  </dd>
                </div>
                <div className="rounded-2xl bg-white/70 p-3">
                  <dt className="text-slate-500">할인</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    ${submission.quote.discount.toFixed(2)}
                  </dd>
                </div>
                <div className="col-span-2 rounded-2xl bg-white/90 p-4">
                  <dt className="text-slate-500">최종 견적</dt>
                  <dd
                    className="mt-2 text-2xl font-semibold text-slate-950"
                    data-testid="quote-total"
                  >
                    ${submission.quote.total.toFixed(2)}
                  </dd>
                </div>
              </dl>
            )}
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                실행 로그
              </h2>
              <a
                className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
                href={docsLinks[1].href}
                rel="noopener noreferrer"
                target="_blank"
              >
                안정성 설명 ↗
              </a>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              상태 머신 이벤트를 사람이 읽기 쉬운 로그로 바꿔서 보여줍니다.
            </p>
            <ul className="mt-3 space-y-2" data-testid="activity-log">
              {activity.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900">
                        {entry.step}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatOccurredAt(entry.occurredAt)}
                      </div>
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

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              스펙 문서 구조
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              이 기능을 문서로 정리하면
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              구현 전에 아래 다섯 항목만 정리해도 범위와 검증 기준이 크게
              흔들리지 않습니다.
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {specSections.map(([name, detail], index) => (
              <div
                key={name}
                className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {index + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {name}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {docsLinks.map((link) => (
              <a
                key={link.href}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100"
                href={link.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                {link.label}
              </a>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              코드 구조
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              이 기능을 코드로 나누면
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              각 레이어가 무엇을 맡는지 보고, 아래 파일 순서를 따라가면 구조를
              빠르게 이해할 수 있습니다.
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {codeLayers.map(([name, detail]) => (
              <div
                key={name}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="font-mono text-sm font-semibold text-slate-900">
                  {name}
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {detail}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">
              읽는 순서
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {readingOrder.map((filePath, index) => (
                <span
                  key={filePath}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                    {index + 1}
                  </span>
                  {filePath}
                </span>
              ))}
            </div>
          </div>

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

          <a
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
            href={GITHUB_CONFIG.getSourceUrl(
              'packages/react/__tests__/patterns/implementation-playbook.integration.test.tsx'
            )}
            rel="noopener noreferrer"
            target="_blank"
          >
            통합 테스트 열기
          </a>
        </article>
      </section>
    </div>
  );
}
