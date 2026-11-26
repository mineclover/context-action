import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import App from '../../../template-react/src/App';

async function flushFakeFrames(ms = 32) {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    jest.advanceTimersByTime(ms);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('@context-action/template-react integration', () => {
  afterEach(() => {
    cleanup();
    jest.useRealTimers();
    document.documentElement.removeAttribute('data-theme');
  });

  it('blocks invalid submit in Guard, dispatches Layout focusField, and records Observer event', async () => {
    render(<App />);

    const addressInput = screen.getByTestId(
      'shipping-address-input'
    ) as HTMLInputElement;
    fireEvent.change(addressInput, { target: { value: '' } });
    fireEvent.click(screen.getByTestId('submit-order-button'));

    await waitFor(() => {
      expect(
        screen.getByTestId('field-error-shippingAddress')
      ).toHaveTextContent('배송지 주소를 입력해 주세요.');
      expect(document.activeElement).toBe(addressInput);
      expect(screen.getByTestId('submission-phase-badge')).toHaveTextContent(
        'FSM: IDLE'
      );
      expect(screen.getByTestId('activity-log-list')).toHaveTextContent(
        '[검증 실패] 1건의 입력 오류가 발견되었습니다.'
      );
    });
  });

  it('transitions validating -> submitting -> success, records order_completed, and resets to idle on post-success draft edit', async () => {
    jest.useFakeTimers();
    render(<App />);
    await flushFakeFrames(32);

    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-order-button'));
    });
    await flushFakeFrames(32);

    expect(screen.getByTestId('submission-phase-badge')).toHaveTextContent(
      'FSM: SUBMITTING'
    );
    expect(screen.getByTestId('activity-log-list')).toHaveTextContent(
      '[서버 전송] 주문 요청을 처리 중입니다... (수량: 1)'
    );

    await flushFakeFrames(600);
    await flushFakeFrames(32);

    expect(screen.getByTestId('submission-phase-badge')).toHaveTextContent(
      'FSM: SUCCESS'
    );
    expect(screen.getByTestId('order-id-value').textContent).toMatch(/^ORD-/);
    expect(screen.getByTestId('activity-log-list')).toHaveTextContent(
      '[주문 성공] 주문이 체결되었습니다!'
    );
    expect(screen.getByTestId('submit-order-button')).toBeDisabled();

    // Post-success edit must transition FSM back to IDLE and clear stale order banner
    await act(async () => {
      fireEvent.change(screen.getByTestId('quantity-input'), {
        target: { value: '3' },
      });
    });
    await flushFakeFrames(32);

    expect(screen.getByTestId('submission-phase-badge')).toHaveTextContent(
      'FSM: IDLE'
    );
    expect(screen.queryByTestId('order-success-banner')).toBeNull();
    expect(screen.getByTestId('submit-order-button')).not.toBeDisabled();
  });

  it('settles mid-submission resetDraft immediately without leaking stale timer transitions', async () => {
    jest.useFakeTimers();
    render(<App />);
    await flushFakeFrames(32);

    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-order-button'));
    });
    await flushFakeFrames(32);

    expect(screen.getByTestId('submission-phase-badge')).toHaveTextContent(
      'FSM: SUBMITTING'
    );

    await flushFakeFrames(200);

    await act(async () => {
      fireEvent.click(screen.getByTestId('reset-draft-button'));
    });
    await flushFakeFrames(32);

    expect(screen.getByTestId('submission-phase-badge')).toHaveTextContent(
      'FSM: IDLE'
    );
    expect(screen.getByTestId('activity-log-list')).toHaveTextContent(
      '[입력] 주문서가 기본값으로 초기화되었습니다.'
    );

    // Advance well past original 600ms delay: stale timeout must not promote back to SUCCESS
    await flushFakeFrames(1000);

    expect(screen.getByTestId('submission-phase-badge')).toHaveTextContent(
      'FSM: IDLE'
    );
    expect(screen.queryByTestId('order-success-banner')).toBeNull();
  });

  it('returns to IDLE when retrySubmission is clicked after success and toggles Astryx theme tokens', async () => {
    jest.useFakeTimers();
    render(<App />);
    await flushFakeFrames(32);

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    await act(async () => {
      fireEvent.click(screen.getByTestId('theme-toggle-button'));
    });
    await flushFakeFrames(32);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(
      document.documentElement.style.getPropertyValue('--color-accent').length
    ).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(screen.getByTestId('theme-toggle-button'));
    });
    await flushFakeFrames(32);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-order-button'));
    });
    await flushFakeFrames(600);
    await flushFakeFrames(32);

    expect(screen.getByTestId('submission-phase-badge')).toHaveTextContent(
      'FSM: SUCCESS'
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('retry-submission-button'));
    });
    await flushFakeFrames(32);

    expect(screen.getByTestId('submission-phase-badge')).toHaveTextContent(
      'FSM: IDLE'
    );
    expect(screen.queryByTestId('order-success-banner')).toBeNull();
  });
});
