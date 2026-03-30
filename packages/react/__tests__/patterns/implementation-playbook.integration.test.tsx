import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { CanonicalOrderExample } from '../../../../example/src/pages/patterns/implementation-playbook/CanonicalOrderExample';
import { SourceLinkRegistryProvider } from '../../../../example/src/stores/SourceLinkRegistry';

function renderCanonicalExample() {
  return render(
    <SourceLinkRegistryProvider>
      <CanonicalOrderExample />
    </SourceLinkRegistryProvider>
  );
}

describe('Implementation Playbook canonical example', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('focuses the invalid email field and renders validation feedback', async () => {
    const { getByTestId } = renderCanonicalExample();

    fireEvent.change(getByTestId('customer-name-input'), {
      target: { value: 'Jordan Lee' },
    });
    fireEvent.change(getByTestId('email-input'), {
      target: { value: 'invalid-email' },
    });
    fireEvent.click(getByTestId('submit-order-button'));

    await waitFor(() => {
      expect(getByTestId('email-error')).toHaveTextContent(
        '올바른 업무용 이메일 형식으로 입력해 주세요.'
      );
      expect(getByTestId('submission-status')).toHaveTextContent(
        '강조된 항목을 수정한 뒤 다시 시도해 주세요.'
      );
      expect(document.activeElement).toBe(getByTestId('email-input'));
    });
  });

  it('submits a valid order and calculates the quote through the real example component', async () => {
    const { getByTestId } = renderCanonicalExample();

    fireEvent.click(getByTestId('prefill-valid-order-button'));
    fireEvent.click(getByTestId('submit-order-button'));

    await waitFor(() => {
      expect(getByTestId('submission-status')).toHaveTextContent(
        'Avery Kim님 팀 견적이 준비되었습니다.'
      );
      expect(getByTestId('quote-total')).toHaveTextContent('$425.80');
      expect(getByTestId('activity-log')).toHaveTextContent('견적 준비 완료');
    });
  });

  it('returns to idle when the draft changes after a successful submission', async () => {
    const { getByTestId, queryByTestId } = renderCanonicalExample();

    fireEvent.click(getByTestId('prefill-valid-order-button'));
    fireEvent.click(getByTestId('submit-order-button'));

    await waitFor(() => {
      expect(getByTestId('quote-total')).toHaveTextContent('$425.80');
    });

    fireEvent.change(getByTestId('quantity-input'), {
      target: { value: '8' },
    });

    await waitFor(() => {
      expect(getByTestId('submission-status')).toHaveTextContent(
        '입력이 바뀌어 다시 제출 대기 상태로 돌아왔습니다.'
      );
      expect(queryByTestId('quote-total')).not.toBeInTheDocument();
      expect(getByTestId('activity-log')).toHaveTextContent('입력값 갱신');
    });
  });

  it('resets the example back to a known baseline state', async () => {
    const { getByTestId } = renderCanonicalExample();

    fireEvent.click(getByTestId('prefill-valid-order-button'));
    fireEvent.click(getByTestId('reset-order-demo-button'));

    await waitFor(() => {
      expect(getByTestId('customer-name-input')).toHaveValue('');
      expect(getByTestId('email-input')).toHaveValue('');
      expect(getByTestId('quantity-input')).toHaveValue(1);
      expect(getByTestId('submission-status')).toHaveTextContent(
        '입력을 기다리고 있습니다.'
      );
    });
  });
});
