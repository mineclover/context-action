import React from 'react';
import { SourceLink } from '../../../../components/ui/SourceLink';
import { GITHUB_CONFIG } from '../../../../constants/github';
import { useCanonicalOrderActions } from '../actions/useCanonicalOrderActions';
import { useCanonicalOrderData, useCanonicalOrderRefs } from '../hooks/useCanonicalOrderData';

const layers = [
  ['contexts', 'Boundary definitions for Action, Store, and Ref contexts.'],
  ['business', 'Pure validation and quote calculation functions.'],
  ['handlers', 'Runtime orchestration, status transitions, and focus side effects.'],
  ['actions', 'Dispatch helpers for the view layer.'],
  ['hooks', 'Reactive data access for UI-friendly state.'],
  ['views', 'Rendering and event wiring only.'],
] as const;

const readingOrder = [
  'contexts/CanonicalOrderContexts.tsx',
  'business/orderBusiness.ts',
  'handlers/CanonicalOrderHandlers.tsx',
  'actions/useCanonicalOrderActions.ts',
  'hooks/useCanonicalOrderData.ts',
  'views/CanonicalOrderView.tsx',
  'CanonicalOrderExample.tsx',
] as const;

const verificationLoop = [
  {
    title: 'Scenario test',
    path:
      'packages/react/__tests__/patterns/implementation-playbook.integration.test.tsx',
    detail:
      'Imports the real example component and verifies validation focus, quote generation, and reset.',
  },
  {
    title: 'Example route',
    path: '/patterns/implementation-playbook',
    detail:
      'Use the live route to trace the same flow visually in the example app.',
  },
  {
    title: 'Source Directory',
    path: '/utilities/source-directory',
    detail:
      'Mounted example files are registered so you can jump to concrete source files quickly.',
  },
] as const;

const quickSourceFiles = [
  'pages/patterns/implementation-playbook/CanonicalOrderExample.tsx',
  'pages/patterns/implementation-playbook/contexts/CanonicalOrderContexts.tsx',
  'pages/patterns/implementation-playbook/business/orderBusiness.ts',
  'pages/patterns/implementation-playbook/handlers/CanonicalOrderHandlers.tsx',
  'pages/patterns/implementation-playbook/views/CanonicalOrderView.tsx',
] as const;

const docsLinks = [
  {
    label: 'Read Korean example guide',
    href: 'https://mineclover.github.io/context-action/ko/examples/canonical-order-form',
  },
  {
    label: 'Read stability test cycle',
    href: 'https://mineclover.github.io/context-action/ko/context-layered/stability-test-cycle',
  },
] as const;

function statusTone(status: string) {
  switch (status) {
    case 'success':
      return 'border-green-300 bg-green-50 text-green-900';
    case 'error':
      return 'border-red-300 bg-red-50 text-red-900';
    case 'submitting':
    case 'validating':
      return 'border-blue-300 bg-blue-50 text-blue-900';
    default:
      return 'border-gray-300 bg-gray-50 text-gray-800';
  }
}

export function CanonicalOrderView() {
  const { draft, validation, submission, activity, isBusy, hasErrors } =
    useCanonicalOrderData();
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

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Implementation Playbook
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">
                Canonical Order Form
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                This example is intentionally small, but each layer has a real
                responsibility. Submit invalid data to see the Ref Context focus
                flow, then submit valid data to watch Action, Handler, Business,
                and Store layers settle into a predictable success path.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              data-testid="prefill-valid-order-button"
              onClick={prefillExample}
              type="button"
            >
              Prefill valid order
            </button>
            <button
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              data-testid="reset-order-demo-button"
              onClick={resetDemo}
              type="button"
            >
              Reset demo
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Quick source links
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickSourceFiles.map((filePath) => (
                <SourceLink
                  key={filePath}
                  className="shadow-sm"
                  filePath={filePath}
                  variant="badge"
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {docsLinks.map((link) => (
                <a
                  key={link.href}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100"
                  href={link.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {link.label}
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Test proof
            </div>
            <a
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
              href={GITHUB_CONFIG.getSourceUrl(
                'packages/react/__tests__/patterns/implementation-playbook.integration.test.tsx'
              )}
              rel="noopener noreferrer"
              target="_blank"
            >
              Open integration test
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              </svg>
            </a>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The same example is verified by a Jest scenario that checks field
              focus, quote calculation, and reset behavior.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Layer map
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {layers.map(([name, detail]) => (
                <div
                  key={name}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="font-mono text-sm font-semibold text-slate-900">
                    {name}/
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {detail}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Read this implementation in order
                </h2>
                <ol className="mt-4 space-y-3">
                  {readingOrder.map((filePath, index) => (
                    <li
                      key={filePath}
                      className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-mono text-sm font-medium text-slate-900">
                          {filePath}
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          Start with boundaries, then business rules, then
                          runtime orchestration, and only then the view.
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Verification loop
                </h2>
                <div className="mt-4 space-y-3">
                  {verificationLoop.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {item.title}
                      </div>
                      <div className="mt-2 font-mono text-sm text-slate-900">
                        {item.path}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Live implementation
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  The form writes intent through actions. Validation and quoting
                  happen outside the view.
                </p>
              </div>
              <div className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {submission.status}
              </div>
            </div>

            <form
              className="mt-6 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void submitOrder();
              }}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Customer name
                  </span>
                  <input
                    ref={customerNameRef.setRef}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                    data-testid="customer-name-input"
                    onChange={(event) =>
                      void updateTextField('customerName', event.target.value)
                    }
                    placeholder="Taylor Rivera"
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
                    Work email
                  </span>
                  <input
                    ref={emailRef.setRef}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
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

              <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Seats
                  </span>
                  <input
                    ref={quantityRef.setRef}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
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

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium text-slate-700">
                    Plan
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="rounded-2xl border border-slate-300 p-4 text-sm text-slate-700">
                      <div className="flex items-center gap-3">
                        <input
                          checked={draft.plan === 'starter'}
                          data-testid="starter-plan-radio"
                          name="plan"
                          onChange={() => void updatePlan('starter')}
                          type="radio"
                        />
                        <div>
                          <div className="font-medium text-slate-900">
                            Starter
                          </div>
                          <div>$24 per seat</div>
                        </div>
                      </div>
                    </label>
                    <label className="rounded-2xl border border-slate-300 p-4 text-sm text-slate-700">
                      <div className="flex items-center gap-3">
                        <input
                          checked={draft.plan === 'team'}
                          data-testid="team-plan-radio"
                          name="plan"
                          onChange={() => void updatePlan('team')}
                          type="radio"
                        />
                        <div>
                          <div className="font-medium text-slate-900">Team</div>
                          <div>$42 per seat</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </fieldset>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700">
                <input
                  checked={draft.onboarding}
                  data-testid="onboarding-checkbox"
                  onChange={(event) =>
                    void setOnboarding(event.target.checked)
                  }
                  type="checkbox"
                />
                Include onboarding workshop ($199 one-time fee)
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                  data-testid="notes-input"
                  onChange={(event) =>
                    void updateTextField('notes', event.target.value)
                  }
                  placeholder="Optional implementation notes for the team."
                  value={draft.notes}
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  data-testid="submit-order-button"
                  disabled={isBusy}
                  type="submit"
                >
                  {isBusy ? 'Running handler flow...' : 'Submit order'}
                </button>
                <div className="self-center text-sm text-slate-500">
                  {hasErrors
                    ? 'Validation errors are driven by Store Context.'
                    : 'No field errors currently stored.'}
                </div>
              </div>
            </form>
          </article>
        </div>

        <div className="space-y-6">
          <article
            className={`rounded-3xl border p-6 shadow-sm ${statusTone(
              submission.status
            )}`}
            data-testid="submission-status"
            ref={statusPanelRef.setRef}
            tabIndex={-1}
          >
            <div className="text-sm font-semibold uppercase tracking-[0.16em]">
              Submission status
            </div>
            <p className="mt-3 text-lg font-semibold">{submission.message}</p>
            <p className="mt-2 text-sm opacity-80" data-testid="validation-summary">
              {validation.summary}
            </p>

            {submission.quote && (
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/70 p-3">
                  <dt className="text-slate-500">Plan</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {submission.quote.plan}
                  </dd>
                </div>
                <div className="rounded-2xl bg-white/70 p-3">
                  <dt className="text-slate-500">Seats</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {submission.quote.seats}
                  </dd>
                </div>
                <div className="rounded-2xl bg-white/70 p-3">
                  <dt className="text-slate-500">Subtotal</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    ${submission.quote.subtotal.toFixed(2)}
                  </dd>
                </div>
                <div className="rounded-2xl bg-white/70 p-3">
                  <dt className="text-slate-500">Discount</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    ${submission.quote.discount.toFixed(2)}
                  </dd>
                </div>
                <div className="col-span-2 rounded-2xl bg-white/90 p-4">
                  <dt className="text-slate-500">Total</dt>
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

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Activity timeline
            </h2>
            <ul className="mt-4 space-y-3" data-testid="activity-log">
              {activity.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-900">{entry.step}</div>
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {entry.tone}
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {entry.detail}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
