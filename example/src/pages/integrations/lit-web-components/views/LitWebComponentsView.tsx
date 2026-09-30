import { type FormEvent, useState } from 'react';
import { useLitWebComponentsViewModel } from '../hooks/useLitWebComponentsViewModel';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

export function LitWebComponentsView() {
  const {
    items,
    discountEnabled,
    submittedTicket,
    auditLog,
    summary,
    updateQuantity,
    toggleDiscount,
    resetCart,
    submitTicketForm,
    LitQuantityStepperBridge,
    LitCartBadgeBridge,
  } = useLitWebComponentsViewModel();

  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const attendeeName =
      (formData.get('attendeeName') as string)?.trim() || '익명 참가자';
    const ticketTier = (formData.get('ticketTier') as string) || '일반 패스';

    // In a real browser supporting FACE, formData.get('ticketCount') captures the custom element.
    // In JSDOM fallback, query DOM property directly.
    const stepperEl = form.querySelector(
      'lit-quantity-stepper[name="ticketCount"]'
    ) as any;
    const rawVal =
      formData.get('ticketCount') ??
      (stepperEl?.value != null ? String(stepperEl.value) : '2');
    const ticketCount = parseInt(rawVal as string, 10) || 1;
    const notes = (formData.get('notes') as string)?.trim() || '없음';

    submitTicketForm(attendeeName, ticketTier, ticketCount, notes);
    setFormFeedback(
      `예약 성공! [${ticketTier}] ${ticketCount}매가 ${attendeeName}님 앞으로 배정되었습니다.`
    );
  };

  const handleFormReset = () => {
    setFormFeedback(null);
  };

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-6">
      {/* 1. Architecture Overview Banner */}
      <section className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-indigo-50 p-7 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-800">
              W3C Lit Custom Elements & Context Protocol
            </span>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              React 19 Host ↔ Lit Web Components Integration
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              Google Lit 3 기반의 커스텀 엘리먼트를 Context-Action의{' '}
              <strong>StoreController</strong> 및
              <strong> ActionController</strong>로 반응형 연동합니다. VDOM 없는
              초경량 브라우저 템플릿 렌더링,{' '}
              <strong>Form-Associated Custom Elements (FACE)</strong> 표준,
              그리고 W3C Context Protocol 의존성 주입을 실증합니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LitCartBadgeBridge
              count={summary.itemCount}
              label="Lit Cart"
              variant="primary"
              onCartBadgeClick={(e) => {
                alert(
                  `Lit Cart Badge 클릭: 현재 담긴 수량은 ${e.detail.count}개입니다.`
                );
              }}
            />
          </div>
        </div>
      </section>

      {/* 2. Interactive Micro-Frontend Table with Lit Steppers */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              🛒 Section 1: React 19 ↔ &lt;lit-quantity-stepper&gt; Bridge
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              LitElement Shadow DOM 캡슐화, 부동소수점 오차 없는 정수 스케일링
              스텝퍼, 양방향 프로퍼티 동기화 및 <code>quantity-change</code>{' '}
              커스텀 이벤트를 Action Pipeline으로 중계합니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleDiscount(!discountEnabled)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                discountEnabled
                  ? 'bg-sky-600 text-white hover:bg-sky-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {discountEnabled
                ? '✓ 10% VIP 할인 적용 중'
                : '+ 10% VIP 할인 쿠폰 적용'}
            </button>
            <button
              type="button"
              onClick={resetCart}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              초기화
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
                <th className="py-3 px-4">상품명</th>
                <th className="py-3 px-4">단가</th>
                <th className="py-3 px-4 text-center">
                  Lit Web Component Stepper
                </th>
                <th className="py-3 px-4 text-right">소계</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {item.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <LitQuantityStepperBridge
                      value={item.quantity}
                      min={1}
                      max={15}
                      step={1}
                      onQuantityChange={(e) => {
                        updateQuantity(item.id, e.detail.value);
                      }}
                    />
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50/50">
                <td
                  colSpan={3}
                  className="py-3 px-4 text-right font-semibold text-slate-600"
                >
                  주문 금액 합계:
                </td>
                <td className="py-3 px-4 text-right font-medium text-slate-800">
                  {formatCurrency(summary.subtotal)}
                </td>
              </tr>
              {discountEnabled && (
                <tr className="text-sky-700 bg-sky-50/40">
                  <td
                    colSpan={3}
                    className="py-2 px-4 text-right font-semibold text-xs"
                  >
                    VIP 할인 (10%):
                  </td>
                  <td className="py-2 px-4 text-right font-bold text-xs">
                    -{formatCurrency(summary.discountAmount)}
                  </td>
                </tr>
              )}
              <tr className="border-t-2 border-slate-300 font-extrabold text-base bg-slate-100/50">
                <td
                  colSpan={3}
                  className="py-3.5 px-4 text-right text-slate-900"
                >
                  최종 결제 금액:
                </td>
                <td className="py-3.5 px-4 text-right text-sky-600 text-lg">
                  {formatCurrency(summary.grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* 3. Form-Associated Custom Element (FACE) Native Form Workshop */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-900">
            📝 Section 2: Form-Associated Lit Element (FACE) Workshop
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            W3C <code>ElementInternals</code> 표준을 구현하여, 표준 HTML{' '}
            <code>&lt;form&gt;</code> 내부의{' '}
            <code>&lt;lit-quantity-stepper&gt;</code>가{' '}
            <code>new FormData(form)</code>에 값을 자동 주입하고{' '}
            <code>form.reset()</code> 시 초기값으로 완벽 복구됩니다.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
          <form
            onSubmit={handleFormSubmit}
            onReset={handleFormReset}
            className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5"
          >
            <h3 className="font-semibold text-slate-800 text-sm">
              개발자 컨퍼런스 사전 예약
            </h3>

            <div>
              <label
                htmlFor="litAttendeeName"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                신청자 성명
              </label>
              <input
                id="litAttendeeName"
                name="attendeeName"
                type="text"
                defaultValue="이서연"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="litTicketTier"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                티켓 구분
              </label>
              <select
                id="litTicketTier"
                name="ticketTier"
                defaultValue="Early Bird"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="Early Bird">얼리버드 패스 (Early Bird)</option>
                <option value="Regular Pass">일반 패스 (Regular)</option>
                <option value="All-Access VIP">올액세스 VIP 패스</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="litTicketStepper"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                예약 티켓 매수 (Form-Associated Custom Element)
              </label>
              <LitQuantityStepperBridge
                id="litTicketStepper"
                name="ticketCount"
                value={2}
                min={1}
                max={5}
                step={1}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                name="ticketCount" 속성으로 지정된 값이 네이티브 FormData에 직할
                등록됩니다.
              </p>
            </div>

            <div>
              <label
                htmlFor="litNotes"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                비고 (요청사항)
              </label>
              <textarea
                id="litNotes"
                name="notes"
                rows={2}
                defaultValue="핸즈온 실습 코드랩 세션 좌석 예약"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="rounded-lg bg-sky-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-700 transition"
              >
                폼 제출 (new FormData)
              </button>
              <button
                type="reset"
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                폼 초기화 (form.reset())
              </button>
            </div>
          </form>

          {/* Submission Result Feedback */}
          <div className="flex flex-col justify-between rounded-xl border border-sky-100 bg-sky-50/40 p-5">
            <div>
              <h3 className="font-semibold text-sky-950 text-sm">
                폼 제출 및 복원 모니터링
              </h3>
              {formFeedback && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  {formFeedback}
                </div>
              )}

              {submittedTicket ? (
                <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-xs shadow-sm">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800">예약자:</span>
                    <span className="text-slate-600">
                      {submittedTicket.attendeeName}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800">패스 종류:</span>
                    <span className="text-slate-600">
                      {submittedTicket.ticketTier}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800">
                      신청 수량 (FACE):
                    </span>
                    <span className="font-bold text-sky-600">
                      {submittedTicket.ticketCount}매
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800">요청사항:</span>
                    <span className="text-slate-600">
                      {submittedTicket.notes}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 text-slate-400">
                    <span>수신 시각:</span>
                    <span>{submittedTicket.submittedAt}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <p className="text-sm font-medium">
                    아직 제출된 예약 폼 데이터가 없습니다.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    왼쪽의 폼에서 [폼 제출] 버튼을 눌러보세요.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-lg bg-white/80 p-3 text-[11px] text-slate-500 border border-slate-200">
              💡 <strong>Lit FACE 검증:</strong>{' '}
              <code>&lt;lit-quantity-stepper&gt;</code>는 React State와 별개로{' '}
              <code>FormAssociatedLitElement</code>를 통해 네이티브 브라우저
              폼과 직결되어 동작합니다.
            </div>
          </div>
        </div>
      </section>

      {/* 4. Cross-Framework Audit Trail */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          📜 Section 3: Lit StoreController & ActionController Audit Trail
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          React 호스트에서 발생한 액션 및 Lit Web Component의{' '}
          <code>quantity-change</code> 커스텀 이벤트가 Context-Action 중앙
          Store에 기록되는 실시간 감사 로그입니다.
        </p>

        <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50">
          {auditLog.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3 text-xs"
            >
              <span className="font-medium text-slate-700">{log.message}</span>
              <span className="font-mono text-[11px] text-slate-400">
                {log.timestamp}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
