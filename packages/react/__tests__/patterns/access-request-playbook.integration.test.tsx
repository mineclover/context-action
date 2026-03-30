import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { SourceLinkRegistryProvider } from '../../../../example/src/stores/SourceLinkRegistry';
import { AccessRequestExample } from '../../../../example/src/pages/patterns/implementation-playbook/access-request/AccessRequestExample';

function renderAccessRequestExample() {
  return render(
    <SourceLinkRegistryProvider>
      <AccessRequestExample />
    </SourceLinkRegistryProvider>
  );
}

describe('Access request playbook example', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('blocks short justification and focuses the justification field', async () => {
    const { getByTestId } = renderAccessRequestExample();

    fireEvent.change(getByTestId('requester-name-input'), {
      target: { value: 'Min Seo' },
    });
    fireEvent.change(getByTestId('access-email-input'), {
      target: { value: 'min.seo@example.com' },
    });
    fireEvent.change(getByTestId('justification-input'), {
      target: { value: '짧은 사유' },
    });
    fireEvent.click(getByTestId('submit-access-review-button'));

    await waitFor(() => {
      expect(getByTestId('justification-error')).toHaveTextContent(
        '접근 목적은 최소 24자 이상으로 적어 주세요.'
      );
      expect(getByTestId('access-review-status')).toHaveTextContent(
        '강조된 항목을 수정한 뒤 다시 시도해 주세요.'
      );
      expect(document.activeElement).toBe(getByTestId('justification-input'));
    });
  });

  it('builds the review packet for a valid request', async () => {
    const { getByTestId } = renderAccessRequestExample();

    fireEvent.click(getByTestId('prefill-access-request-button'));
    fireEvent.click(getByTestId('submit-access-review-button'));

    await waitFor(() => {
      expect(getByTestId('access-review-status')).toHaveTextContent(
        'Min Seo님의 admin 접근 요청 리뷰 패키지가 준비되었습니다.'
      );
      expect(getByTestId('review-packet-summary')).toHaveTextContent(
        'Min Seo님의 admin 접근 요청 검토 패키지'
      );
      expect(getByTestId('access-activity-log')).toHaveTextContent(
        '패키지 준비 완료'
      );
    });
  });

  it('returns to idle after the draft changes post-success', async () => {
    const { getByTestId, queryByTestId } = renderAccessRequestExample();

    fireEvent.click(getByTestId('prefill-access-request-button'));
    fireEvent.click(getByTestId('submit-access-review-button'));

    await waitFor(() => {
      expect(getByTestId('review-packet-summary')).toBeInTheDocument();
    });

    fireEvent.change(getByTestId('access-scope-select'), {
      target: { value: 'editor' },
    });

    await waitFor(() => {
      expect(getByTestId('access-review-status')).toHaveTextContent(
        '입력이 바뀌어 리뷰 준비 상태로 돌아왔습니다.'
      );
      expect(queryByTestId('review-packet-summary')).not.toBeInTheDocument();
    });
  });

  it('resets back to the baseline state', async () => {
    const { getByTestId } = renderAccessRequestExample();

    fireEvent.click(getByTestId('prefill-access-request-button'));
    fireEvent.click(getByTestId('reset-access-request-button'));

    await waitFor(() => {
      expect(getByTestId('requester-name-input')).toHaveValue('');
      expect(getByTestId('access-email-input')).toHaveValue('');
      expect(getByTestId('access-scope-select')).toHaveValue('viewer');
      expect(getByTestId('access-review-status')).toHaveTextContent(
        '입력을 기다리고 있습니다.'
      );
    });
  });
});
