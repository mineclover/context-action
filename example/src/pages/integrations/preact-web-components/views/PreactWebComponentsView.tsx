import { type FormEvent, useState } from 'react';
import { usePreactWebComponentsViewModel } from '../hooks/usePreactWebComponentsViewModel';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

export function PreactWebComponentsView() {
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
    PreactStepper,
    PreactBadge,
  } = usePreactWebComponentsViewModel();

  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const attendeeName =
      (formData.get('attendeeName') as string)?.trim() || '익명 참가자';
    const ticketType = (formData.get('ticketType') as string) || '일반 티켓';
    // Native FormData extracted directly from Form-Associated Custom Element <preact-wc-stepper>!
    const ticketCountStr = formData.get('ticketCount') as string;
    const count = parseInt(ticketCountStr, 10) || 1;
    const specialRequest =
      (formData.get('specialRequest') as string)?.trim() || '없음';

    submitTicketForm(attendeeName, ticketType, count, specialRequest);
    setFormFeedback(
      `예약 완료! ${attendeeName}님에게 ${count}매의 [${ticketType}] 발권 처리가 완료되었습니다.`
    );
  };

  const handleFormReset = () => {
    setFormFeedback(null);
  };

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-6">
      {/* 1. Architecture Overview Banner */}
      <section className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-sky-50 p-7 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-800">
              Micro-Frontend Architecture Bridge
            </span>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              React 19 Host ↔ Preact Web Components Integration
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              Context-Action 기반의 React 19 호스트 애플리케이션 내에서 Preact
              Signals로 구동되는 W3C 표준 Web Components를{' '}
              <strong>createCustomElementBridge</strong>로 연동합니다. Shadow
              DOM 캡슐화, 복합 프로퍼티 직할 전달, 커스텀 이벤트 양방향 바인딩,
              그리고
              <strong> Form-Associated Custom Elements (FACE)</strong> 표준을
              실증합니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PreactBadge
              count={summary.itemCount}
              onBadgeClick={(e) => {
                alert(`장바구니 총 수량: ${e.detail.count}개`);
              }}
            />
          </div>
        </div>
      </section>

      {/* 2. Interactive Micro-Frontend Cart */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              🛒 Section 1: React 19 ↔ Preact Stepper Bridge (Property & Event
              Binding)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              각 행의 수량 조절기는 Shadow DOM 기반의 Preact Web
              Component입니다. React의 상태가 프로퍼티로 전달되며, Web
              Component의 'quantity-change' 이벤트가 React Action Pipeline으로
              디스패치됩니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleDiscount(!discountEnabled)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                discountEnabled
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
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
                <th className="py-3 px-4 text-center">Web Component Stepper</th>
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
                    <PreactStepper
                      value={item.quantity}
                      min={1}
                      max={15}
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
                <tr className="text-emerald-700 bg-emerald-50/40">
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
                <td className="py-3.5 px-4 text-right text-indigo-600 text-lg">
                  {formatCurrency(summary.grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* 3. Form-Associated Custom Element (FACE) Native Workshop */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-900">
            📝 Section 2: Form-Associated Custom Elements (FACE) Native Form
            Workshop
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            브라우저 표준 <code>ElementInternals</code> API를 활용하여, 표준
            HTML <code>&lt;form&gt;</code> 내부의 커스텀 엘리먼트가{' '}
            <code>new FormData(form)</code>에 직접 값을 공급하고{' '}
            <code>form.reset()</code> 시 초기 상태로 복구됩니다.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
          <form
            onSubmit={handleFormSubmit}
            onReset={handleFormReset}
            className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5"
          >
            <h3 className="font-semibold text-slate-800 text-sm">
              컨퍼런스 티켓 예약 신청서
            </h3>

            <div>
              <label
                htmlFor="attendeeName"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                신청자 성명
              </label>
              <input
                id="attendeeName"
                name="attendeeName"
                type="text"
                defaultValue="김개발"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="ticketType"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                티켓 등급
              </label>
              <select
                id="ticketType"
                name="ticketType"
                defaultValue="VIP Pass"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="General Pass">일반 패스 (General)</option>
                <option value="VIP Pass">VIP 패스 (컨퍼런스 + 워크숍)</option>
                <option value="Online Pass">온라인 라이브 스트리밍</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="ticketStepper"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                예약 티켓 수량 (Form-Associated Custom Element)
              </label>
              {/* FACE Custom Element embedded inside native form */}
              <PreactStepper
                id="ticketStepper"
                name="ticketCount"
                value={2}
                min={1}
                max={5}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                이 컴포넌트는 name="ticketCount"를 통해 폼 제출 시 자동으로
                FormData에 주입됩니다.
              </p>
            </div>

            <div>
              <label
                htmlFor="specialRequest"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                특별 요청사항
              </label>
              <textarea
                id="specialRequest"
                name="specialRequest"
                rows={2}
                defaultValue="워크숍 실습 자료 사전 요청"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
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
          <div className="flex flex-col justify-between rounded-xl border border-indigo-100 bg-indigo-50/40 p-5">
            <div>
              <h3 className="font-semibold text-indigo-950 text-sm">
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
                    <span className="font-bold text-slate-800">신청자:</span>
                    <span className="text-slate-600">
                      {submittedTicket.attendeeName}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800">티켓 구분:</span>
                    <span className="text-slate-600">
                      {submittedTicket.ticketType}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800">
                      신청 수량 (FACE):
                    </span>
                    <span className="font-bold text-indigo-600">
                      {submittedTicket.count}매
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800">요청사항:</span>
                    <span className="text-slate-600">
                      {submittedTicket.specialRequest}
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
                    아직 제출된 티켓 폼 데이터가 없습니다.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    왼쪽의 폼에서 [폼 제출] 버튼을 눌러보세요.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-lg bg-white/80 p-3 text-[11px] text-slate-500 border border-slate-200">
              💡 <strong>FACE 검증 포인트:</strong> 폼의 [폼 초기화]를 누르면
              React가 아닌 브라우저의 <code>formResetCallback()</code>이
              호출되어 Preact 커스텀 엘리먼트의 수량이 즉시 초기값(2)으로
              재설정됩니다.
            </div>
          </div>
        </div>
      </section>

      {/* 4. Cross-Framework Audit Trail */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          📜 Section 3: Cross-Framework Observable Action & Event Audit Trail
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          React 호스트에서 발생한 액션 및 Preact Web Component가 방출한 커스텀
          이벤트가 Context-Action 중앙 Store에 기록되는 실시간 감사 로그입니다.
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
