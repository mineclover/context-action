import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PageWithLogMonitor } from '@/components/LogMonitor';
import { BasicActionsDemo } from '@/pages/foundations/core/components/BasicActionsDemo';
import { toastActionRegister } from './actions';
import { toastStackIndexStore, toastsStore } from './store';
import { ToastContainer } from './ToastContainer';

async function clearToasts() {
  await act(async () => {
    await toastActionRegister.dispatch('clearAllToasts', {});
  });
  toastStackIndexStore.setValue(0);
}

describe('ToastSystem', () => {
  beforeEach(async () => {
    await clearToasts();
  });

  afterEach(async () => {
    await clearToasts();
  });

  it('keeps phase animation in CSS instead of overriding it with stack styles', async () => {
    render(<ToastContainer />);

    await act(async () => {
      await toastActionRegister.dispatch('addToast', {
        type: 'success',
        title: 'Saved',
        message: 'Toast phase test',
      });
      await toastActionRegister.dispatch('addToast', {
        type: 'info',
        title: 'Queued',
        message: 'Toast stack test',
      });
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
        toastsStore.getValue().every((toast) => toast.phase === 'visible')
      ).toBe(true);
    });
  });

  it('shows one error toast for the advanced demo error action', async () => {
    const user = userEvent.setup();
    render(
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
      expect(toastsStore.getValue()).toHaveLength(1);
    });
    expect(toastsStore.getValue()[0]).toMatchObject({
      type: 'error',
      message: 'Action handler error',
    });
  });

  it('does not revive an exiting toast when a queued entry frame runs', async () => {
    render(<ToastContainer />);

    await act(async () => {
      await toastActionRegister.dispatch('addToast', {
        type: 'info',
        title: 'Short lived',
        message: 'Exit phase test',
        duration: 1,
      });
    });

    const toastId = toastsStore.getValue()[0]?.id;
    expect(toastId).toBeTruthy();
    if (!toastId) throw new Error('Expected the toast to be stored.');

    await act(async () => {
      await toastActionRegister.dispatch('updateToastPhase', {
        toastId,
        phase: 'exiting',
      });
      await toastActionRegister.dispatch('updateToastPhase', {
        toastId,
        phase: 'visible',
      });
    });

    expect(toastsStore.getValue()[0]?.phase).toBe('exiting');
  });
});
