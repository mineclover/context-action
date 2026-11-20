import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { SourceLinkRegistryProvider } from '../../../stores/SourceLinkRegistry';
import CanonicalOrderExample from './CanonicalOrderExample';

function renderCanonicalOrderExample() {
  return render(
    <SourceLinkRegistryProvider>
      <CanonicalOrderExample />
    </SourceLinkRegistryProvider>
  );
}

describe('CanonicalOrderExample', () => {
  const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

  beforeAll(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  afterAll(() => {
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  });

  it('displays validation errors and blocked status on empty invalid submit with default activity log', async () => {
    const user = userEvent.setup();
    renderCanonicalOrderExample();

    expect(screen.getByTestId('activity-log')).toBeTruthy();
    expect(screen.queryByTestId('triad-contract-panel')).toBeNull();

    await user.click(screen.getByTestId('submit-order-button'));

    await waitFor(() => {
      expect(screen.getByTestId('customer-name-error').textContent).toBe(
        '담당자 이름을 입력해 주세요.'
      );
      expect(screen.getByTestId('email-error').textContent).toBe(
        '업무용 이메일을 입력해 주세요.'
      );
      expect(screen.getByTestId('submission-status').textContent).toContain(
        '강조된 항목을 수정한 뒤 다시 시도해 주세요.'
      );
    });
  });

  it('produces quote total and success status after prefill and valid submit', async () => {
    const user = userEvent.setup();
    renderCanonicalOrderExample();

    await user.click(screen.getByTestId('prefill-valid-order-button'));
    await user.click(screen.getByTestId('submit-order-button'));

    await waitFor(() => {
      expect(screen.getByTestId('quote-total').textContent).toMatch(/^\$\d+/);
      expect(screen.getByTestId('submission-status').textContent).toContain(
        '견적이 준비되었습니다.'
      );
    });
  });

  it('clears the active quote and returns to idle when draft changes after success', async () => {
    const user = userEvent.setup();
    renderCanonicalOrderExample();

    await user.click(screen.getByTestId('prefill-valid-order-button'));
    await user.click(screen.getByTestId('submit-order-button'));

    await waitFor(() => {
      expect(screen.getByTestId('quote-total')).toBeTruthy();
    });

    await user.type(screen.getByTestId('customer-name-input'), ' 팀');

    await waitFor(() => {
      expect(screen.queryByTestId('quote-total')).toBeNull();
      expect(screen.getByTestId('submission-status').textContent).toContain(
        '입력이 바뀌어 다시 제출 대기 상태로 돌아왔습니다.'
      );
    });
  });

  it('restores baseline empty draft state on reset', async () => {
    const user = userEvent.setup();
    renderCanonicalOrderExample();

    await user.click(screen.getByTestId('prefill-valid-order-button'));
    await user.click(screen.getByTestId('submit-order-button'));

    await waitFor(() => {
      expect(screen.getByTestId('quote-total')).toBeTruthy();
    });

    await user.click(screen.getByTestId('reset-order-demo-button'));

    await waitFor(() => {
      expect(
        (screen.getByTestId('customer-name-input') as HTMLInputElement).value
      ).toBe('');
      expect(screen.queryByTestId('quote-total')).toBeNull();
      expect(screen.getByTestId('submission-status').textContent).toContain(
        '입력을 기다리고 있습니다.'
      );
    });
  });

  it('isolates LayoutActionIntent inspector tabs without mutating draft or active quote', async () => {
    const user = userEvent.setup();
    renderCanonicalOrderExample();

    await user.click(screen.getByTestId('prefill-valid-order-button'));
    await user.click(screen.getByTestId('submit-order-button'));

    await waitFor(() => {
      expect(screen.getByTestId('quote-total')).toBeTruthy();
    });

    const initialCustomer = (
      screen.getByTestId('customer-name-input') as HTMLInputElement
    ).value;
    const initialQuote = screen.getByTestId('quote-total').textContent;

    await user.click(screen.getByTestId('inspector-tab-contract'));

    await waitFor(() => {
      expect(screen.getByTestId('triad-contract-panel')).toBeTruthy();
      expect(screen.queryByTestId('activity-log')).toBeNull();
    });

    expect(
      (screen.getByTestId('customer-name-input') as HTMLInputElement).value
    ).toBe(initialCustomer);
    expect(screen.getByTestId('quote-total').textContent).toBe(initialQuote);

    await user.click(screen.getByTestId('inspector-tab-activity'));

    await waitFor(() => {
      expect(screen.getByTestId('activity-log')).toBeTruthy();
      expect(screen.queryByTestId('triad-contract-panel')).toBeNull();
    });
  });
});
