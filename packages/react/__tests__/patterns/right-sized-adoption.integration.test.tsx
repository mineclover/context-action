import React, { useCallback } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createStore,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';

// Shared pure business rule (shared between Level 1 & Level 2 without duplication)
interface CouponQuote {
  readonly appliedCode: string | null;
  readonly discountPercent: number;
  readonly totalAmount: number;
  readonly errorCode: 'empty_code' | 'unknown_coupon' | null;
}

const VALID_COUPONS: Record<string, number> = {
  SAVE10: 10,
  TEAM25: 25,
};

function evaluateCoupon(rawCode: string, subtotal: number): CouponQuote {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return {
      appliedCode: null,
      discountPercent: 0,
      totalAmount: subtotal,
      errorCode: 'empty_code',
    };
  }
  const discountPercent = VALID_COUPONS[code];
  if (discountPercent === undefined) {
    return {
      appliedCode: null,
      discountPercent: 0,
      totalAmount: subtotal,
      errorCode: 'unknown_coupon',
    };
  }
  const discounted = Math.round(subtotal * (1 - discountPercent / 100));
  return {
    appliedCode: code,
    discountPercent,
    totalAmount: discounted,
    errorCode: null,
  };
}

describe('Right-Sized Progressive Adoption (Level 1 Lite & Level 2 Headless-First DI)', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Level 1 · Lite (Single-Domain Action + Store + Registry)', () => {
    interface LiteCouponActions extends ActionPayloadMap {
      applyCoupon: { code: string };
      clearCoupon: void;
    }

    const {
      Provider: LiteCouponActionProvider,
      useActionDispatch: useLiteCouponDispatch,
      useActionCommandHandler: useLiteCouponCommand,
    } = createActionContext<LiteCouponActions>('LiteCouponActions');

    const {
      Provider: LiteCouponStoreProvider,
      useStore: useLiteCouponStore,
    } = createStoreContext('LiteCouponStores', {
      subtotal: 100,
      quote: {
        appliedCode: null,
        discountPercent: 0,
        totalAmount: 100,
        errorCode: null,
      } as CouponQuote,
    });

    function LiteCouponRegistry() {
      const subtotalStore = useLiteCouponStore('subtotal');
      const quoteStore = useLiteCouponStore('quote');

      useLiteCouponCommand(
        'applyCoupon',
        useCallback(
          ({ code }) => {
            const subtotal = subtotalStore.getValue();
            quoteStore.setValue(evaluateCoupon(code, subtotal));
          },
          [quoteStore, subtotalStore]
        )
      );

      useLiteCouponCommand(
        'clearCoupon',
        useCallback(() => {
          quoteStore.setValue({
            appliedCode: null,
            discountPercent: 0,
            totalAmount: subtotalStore.getValue(),
            errorCode: null,
          });
        }, [quoteStore, subtotalStore])
      );

      return null;
    }

    function LiteCouponView() {
      const quote = useStoreValue(useLiteCouponStore('quote'));
      const dispatch = useLiteCouponDispatch();

      return (
        <div>
          <span data-testid="lite-total">{quote.totalAmount}</span>
          <span data-testid="lite-error">{quote.errorCode ?? 'none'}</span>
          <button
            type="button"
            data-testid="lite-apply-valid"
            onClick={() => void dispatch('applyCoupon', { code: 'save10' })}
          >
            Apply SAVE10
          </button>
          <button
            type="button"
            data-testid="lite-apply-invalid"
            onClick={() => void dispatch('applyCoupon', { code: 'nope' })}
          >
            Apply NOPE
          </button>
          <button
            type="button"
            data-testid="lite-clear"
            onClick={() => void dispatch('clearCoupon')}
          >
            Clear
          </button>
        </div>
      );
    }

    it('runs apply/error/clear cleanly without 6-layer boilerplate', async () => {
      render(
        <LiteCouponActionProvider>
          <LiteCouponStoreProvider>
            <LiteCouponRegistry />
            <LiteCouponView />
          </LiteCouponStoreProvider>
        </LiteCouponActionProvider>
      );

      expect(screen.getByTestId('lite-total')).toHaveTextContent('100');

      fireEvent.click(screen.getByTestId('lite-apply-valid'));
      await waitFor(() => {
        expect(screen.getByTestId('lite-total')).toHaveTextContent('90');
        expect(screen.getByTestId('lite-error')).toHaveTextContent('none');
      });

      fireEvent.click(screen.getByTestId('lite-apply-invalid'));
      await waitFor(() => {
        expect(screen.getByTestId('lite-total')).toHaveTextContent('100');
        expect(screen.getByTestId('lite-error')).toHaveTextContent(
          'unknown_coupon'
        );
      });

      fireEvent.click(screen.getByTestId('lite-clear'));
      await waitFor(() => {
        expect(screen.getByTestId('lite-error')).toHaveTextContent('none');
      });
    });
  });

  describe('Level 2 · Headless-First Symmetric DI (ActionRegister + createStore + shared Provider)', () => {
    interface HeadlessCouponActions extends ActionPayloadMap {
      applyCoupon: { code: string; subtotal: number };
    }
    interface HeadlessCouponResultMap {
      applyCoupon: CouponQuote;
    }

    function createCouponEngine() {
      const register = new ActionRegister<
        HeadlessCouponActions,
        HeadlessCouponResultMap
      >({
        name: 'CouponEngine',
      });
      const quoteStore = createStore<CouponQuote>('couponQuote', {
        appliedCode: null,
        discountPercent: 0,
        totalAmount: 200,
        errorCode: null,
      });
      const auditStore = createStore<string[]>('couponAudit', []);

      register.registerGuard(
        'applyCoupon',
        ({ code, subtotal }, controller) => {
          const preview = evaluateCoupon(code, subtotal);
          if (preview.errorCode) {
            quoteStore.setValue(preview);
            controller.abort(preview.errorCode);
          }
        },
        { id: 'coupon-guard', priority: 100 }
      );

      register.registerResult(
        'applyCoupon',
        ({ code, subtotal }) => {
          const result = evaluateCoupon(code, subtotal);
          quoteStore.setValue(result);
          return result;
        },
        { id: 'coupon-result', priority: 10 }
      );

      register.registerObserver(
        'applyCoupon',
        (event) => {
          auditStore.update((prev) => [
            ...prev,
            `${event.outcome}:${event.payload.code.toUpperCase()}`,
          ]);
        },
        { id: 'coupon-audit-observer', priority: 1, when: 'always' }
      );

      const CouponActions = createActionContext<
        HeadlessCouponActions,
        HeadlessCouponResultMap
      >('CouponActions');
      const CouponStores = createStoreContext('CouponStores', {
        couponQuote: {
          appliedCode: null,
          discountPercent: 0,
          totalAmount: 200,
          errorCode: null,
        } as CouponQuote,
      });

      return { register, quoteStore, auditStore, CouponActions, CouponStores };
    }

    it('executes 4-role pipeline headlessly and keeps shared state across React unmount/remount', async () => {
      const engine = createCouponEngine();

      // Part A: Pure Headless execution (zero React mounted)
      const invalidExec = await engine.register.dispatchWithResult(
        'applyCoupon',
        { code: 'expired', subtotal: 200 }
      );
      expect(invalidExec.outcome).toBe('cancelled');
      expect(invalidExec.abortReason).toBe('unknown_coupon');
      expect(engine.quoteStore.getValue().errorCode).toBe('unknown_coupon');
      expect(engine.auditStore.getValue()).toEqual(['cancelled:EXPIRED']);

      const validExec = await engine.register.dispatchWithResult(
        'applyCoupon',
        { code: 'team25', subtotal: 200 }
      );
      expect(validExec.outcome).toBe('completed');
      const quoteResult = Array.isArray(validExec.result)
        ? validExec.result[0]
        : validExec.result;
      expect(quoteResult?.totalAmount).toBe(150);
      expect(engine.auditStore.getValue()).toEqual([
        'cancelled:EXPIRED',
        'completed:TEAM25',
      ]);

      // Part B: React Symmetric DI (ownership="shared") with React-only telemetry observer
      const reactMountedEvents: string[] = [];

      function ReactTelemetryRegistry() {
        engine.CouponActions.useActionObserver(
          'applyCoupon',
          useCallback((event) => {
            reactMountedEvents.push(event.outcome);
          }, []),
          { id: 'react-ui-observer', when: 'always' }
        );
        return null;
      }

      function CouponPanel() {
        const dispatch = engine.CouponActions.useActionDispatch();
        const quote = useStoreValue(engine.CouponStores.useStore('couponQuote'));
        return (
          <div>
            <span data-testid="shared-total">{quote.totalAmount}</span>
            <button
              type="button"
              data-testid="shared-apply-save10"
              onClick={() =>
                void dispatch('applyCoupon', { code: 'SAVE10', subtotal: 200 })
              }
            >
              Apply
            </button>
          </div>
        );
      }

      const view = render(
        <engine.CouponActions.Provider
          register={engine.register}
          ownership="shared"
        >
          <engine.CouponStores.Provider
            stores={{ couponQuote: engine.quoteStore }}
            ownership="shared"
          >
            <ReactTelemetryRegistry />
            <CouponPanel />
          </engine.CouponStores.Provider>
        </engine.CouponActions.Provider>
      );

      expect(screen.getByTestId('shared-total')).toHaveTextContent('150');

      await act(async () => {
        fireEvent.click(screen.getByTestId('shared-apply-save10'));
      });
      await waitFor(() => {
        expect(screen.getByTestId('shared-total')).toHaveTextContent('180');
      });
      expect(reactMountedEvents).toEqual(['completed']);

      // Unmount React boundary: shared engine stays alive, React observer detaches
      view.unmount();
      await engine.register.dispatchWithResult('applyCoupon', {
        code: 'TEAM25',
        subtotal: 400,
      });

      expect(engine.quoteStore.getValue().totalAmount).toBe(300);
      expect(reactMountedEvents).toEqual(['completed']);
    });
  });
});
