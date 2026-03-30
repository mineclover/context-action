import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { SourceLinkRegistryProvider } from '../../../../example/src/stores/SourceLinkRegistry';
import { RenewalRiskReviewExample } from '../../../../example/src/pages/patterns/implementation-playbook/renewal-risk-review/RenewalRiskReviewExample';

function renderRenewalRiskReviewExample() {
  return render(
    <SourceLinkRegistryProvider>
      <RenewalRiskReviewExample />
    </SourceLinkRegistryProvider>
  );
}

describe('Renewal risk review playbook example', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('blocks short-window reviews without an executive sponsor', async () => {
    const { getByTestId } = renderRenewalRiskReviewExample();

    fireEvent.change(getByTestId('renewal-account-name-input'), {
      target: { value: 'Northstar Commerce' },
    });
    fireEvent.change(getByTestId('renewal-window-select'), {
      target: { value: '30d' },
    });
    fireEvent.change(getByTestId('usage-score-input'), {
      target: { value: '42' },
    });
    fireEvent.change(getByTestId('risk-notes-input'), {
      target: {
        value:
          '사용량 하락이 계속되어 renewal 리스크가 커지고 있습니다.',
      },
    });
    fireEvent.click(getByTestId('submit-renewal-review-button'));

    await waitFor(() => {
      expect(getByTestId('renewal-window-error')).toHaveTextContent(
        '30일 이내 갱신은 executive sponsor가 필요합니다.'
      );
      expect(getByTestId('renewal-review-status')).toHaveTextContent(
        '강조된 항목을 수정한 뒤 다시 시도해 주세요.'
      );
      expect(document.activeElement).toBe(getByTestId('renewal-window-select'));
    });
  });

  it('builds the review packet for a valid renewal review', async () => {
    const { getByTestId } = renderRenewalRiskReviewExample();

    fireEvent.click(getByTestId('prefill-renewal-review-button'));
    fireEvent.click(getByTestId('submit-renewal-review-button'));

    await waitFor(() => {
      expect(getByTestId('renewal-review-status')).toHaveTextContent(
        'Northstar Commerce renewal review packet이 준비되었습니다.'
      );
      expect(getByTestId('renewal-packet-summary')).toHaveTextContent(
        'Northstar Commerce account renewal review packet'
      );
      expect(getByTestId('renewal-activity-log')).toHaveTextContent(
        '리뷰 패킷 준비 완료'
      );
    });
  });

  it('returns to idle after the draft changes post-success', async () => {
    const { getByTestId, queryByTestId } = renderRenewalRiskReviewExample();

    fireEvent.click(getByTestId('prefill-renewal-review-button'));
    fireEvent.click(getByTestId('submit-renewal-review-button'));

    await waitFor(() => {
      expect(getByTestId('renewal-packet-summary')).toBeInTheDocument();
    });

    fireEvent.change(getByTestId('usage-score-input'), {
      target: { value: '78' },
    });

    await waitFor(() => {
      expect(getByTestId('renewal-review-status')).toHaveTextContent(
        '입력이 바뀌어 renewal review 준비 상태로 돌아왔습니다.'
      );
      expect(queryByTestId('renewal-packet-summary')).not.toBeInTheDocument();
    });
  });

  it('resets back to the baseline state', async () => {
    const { getByTestId } = renderRenewalRiskReviewExample();

    fireEvent.click(getByTestId('prefill-renewal-review-button'));
    fireEvent.click(getByTestId('reset-renewal-review-button'));

    await waitFor(() => {
      expect(getByTestId('renewal-account-name-input')).toHaveValue('');
      expect(getByTestId('renewal-window-select')).toHaveValue('90d');
      expect(getByTestId('usage-score-input')).toHaveValue(50);
      expect(getByTestId('renewal-review-status')).toHaveTextContent(
        '입력을 기다리고 있습니다.'
      );
    });
  });
});
