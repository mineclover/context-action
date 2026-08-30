import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PageWithLogMonitor } from '@/components/LogMonitor';
import { BasicActionsDemo } from '@/pages/foundations/core/components/BasicActionsDemo';
import { createToastSystem, type ToastSystemController } from './actions';
import { ToastContainer } from './ToastContainer';
import { ToastSystemProvider } from './ToastContext';
import type { Toast } from './types';

let toastSystem: ToastSystemController;

async function clearToasts() {
  await act(async () => {
    toastSystem.clearAllToasts();
  });
}

function renderWithToastSystem(children: React.ReactNode) {
  return render(
    <ToastSystemProvider system={toastSystem}>{children}</ToastSystemProvider>
  );
}

describe('ToastSystem', () => {
  beforeEach(async () => {
    toastSystem = createToastSystem();
    await clearToasts();
  });

  afterEach(async () => {
    await clearToasts();
  });

  it('keeps phase animation in CSS instead of overriding it with stack styles', async () => {
    renderWithToastSystem(<ToastContainer />);

    await act(async () => {
      toastSystem.showToast('success', 'Saved', 'Toast phase test');
      toastSystem.showToast('info', 'Queued', 'Toast stack test');
    });

    const messages = await Promise.all([
      screen.findByText('Toast phase test'),
      screen.findByText('Toast stack test'),
    ]);
    const toastItems = messages.map((message) =>
      message.closest('div[class*="transition-all"]')
    );
    expect(toastItems.every((toast) => toast !== null)).toBe(true);
    expect(
      toastItems.every((toast) => toast?.getAttribute('style') === null)
    ).toBe(true);

    await waitFor(() => {
      expect(
        toastSystem.stores.toasts
          .getValue()
          .every((toast) => toast.phase === 'visible')
      ).toBe(true);
    });
  });

  it('keeps separate provider roots isolated', async () => {
    const secondSystem = createToastSystem();
    render(
      <>
        <ToastSystemProvider system={toastSystem}>
          <ToastContainer />
        </ToastSystemProvider>
        <ToastSystemProvider system={secondSystem}>
          <ToastContainer />
        </ToastSystemProvider>
      </>
    );

    await act(async () => {
      toastSystem.showToast('success', 'First root', 'Provider one');
    });

    await waitFor(() => {
      expect(toastSystem.stores.toasts.getValue()).toHaveLength(1);
    });
    expect(secondSystem.stores.toasts.getValue()).toHaveLength(0);
  });

  it('shows one error toast for the advanced demo error action', async () => {
    const user = userEvent.setup();
    renderWithToastSystem(
      <>
        <PageWithLogMonitor
          pageId="toast-regression"
          initialConfig={{ enableToast: true }}
        >
          <BasicActionsDemo />
        </PageWithLogMonitor>
        <ToastContainer />
      </>
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: '에러 액션' }));
    });

    await waitFor(() => {
      expect(toastSystem.stores.toasts.getValue()).toHaveLength(1);
    });
    expect(toastSystem.stores.toasts.getValue()[0]).toMatchObject({
      type: 'error',
      message: 'Action handler error',
    });
  });

  it('does not revive an exiting toast when a queued entry frame runs', async () => {
    renderWithToastSystem(<ToastContainer />);

    await act(async () => {
      toastSystem.showToast('info', 'Short lived', 'Exit phase test');
    });

    const toastId = toastSystem.stores.toasts.getValue()[0]?.id;
    expect(toastId).toBeTruthy();
    if (!toastId) throw new Error('Expected the toast to be stored.');

    await act(async () => {
      toastSystem.updateToastPhase(toastId, 'exiting');
      toastSystem.updateToastPhase(toastId, 'visible');
    });

    expect(toastSystem.stores.toasts.getValue()[0]?.phase).toBe('exiting');
  });

  it('expires a visible toast recovered after a remount', async () => {
    const staleToast: Toast = {
      id: 'stale-toast',
      type: 'info',
      title: 'Recovered',
      message: 'Stale toast recovery',
      timestamp: new Date(Date.now() - 5_000),
      duration: 4_000,
      stackIndex: 0,
      isVisible: true,
      phase: 'visible',
    };

    await act(async () => {
      toastSystem.stores.toasts.setValue([staleToast]);
    });
    renderWithToastSystem(<ToastContainer />);

    await waitFor(() => {
      expect(toastSystem.stores.toasts.getValue()[0]?.phase).toBe('exiting');
    });
    await waitFor(() => {
      expect(toastSystem.stores.toasts.getValue()).toHaveLength(0);
    });
  });
});
