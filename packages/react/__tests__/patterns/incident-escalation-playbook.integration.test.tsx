import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { SourceLinkRegistryProvider } from '../../../../example/src/stores/SourceLinkRegistry';
import { IncidentEscalationExample } from '../../../../example/src/pages/patterns/implementation-playbook/incident-escalation/IncidentEscalationExample';

function renderIncidentEscalationExample() {
  return render(
    <SourceLinkRegistryProvider>
      <IncidentEscalationExample />
    </SourceLinkRegistryProvider>
  );
}

describe('Incident escalation playbook example', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('blocks sev1 incidents without statuspage and focuses the communication channel', async () => {
    const { getByTestId } = renderIncidentEscalationExample();

    fireEvent.change(getByTestId('incident-title-input'), {
      target: { value: 'Checkout outage' },
    });
    fireEvent.change(getByTestId('incident-severity-select'), {
      target: { value: 'sev1' },
    });
    fireEvent.change(getByTestId('affected-users-input'), {
      target: { value: '5000' },
    });
    fireEvent.change(getByTestId('incident-summary-input'), {
      target: {
        value:
          '결제 흐름 전반에 영향을 주는 심각한 장애로 escalation bridge가 필요합니다.',
      },
    });
    fireEvent.change(getByTestId('communication-channel-select'), {
      target: { value: 'slack' },
    });
    fireEvent.click(getByTestId('submit-incident-escalation-button'));

    await waitFor(() => {
      expect(getByTestId('communication-channel-error')).toHaveTextContent(
        'sev1 장애는 statuspage 공지 채널이 필요합니다.'
      );
      expect(getByTestId('incident-escalation-status')).toHaveTextContent(
        '강조된 항목을 수정한 뒤 다시 시도해 주세요.'
      );
      expect(document.activeElement).toBe(
        getByTestId('communication-channel-select')
      );
    });
  });

  it('builds the escalation packet for a valid incident', async () => {
    const { getByTestId } = renderIncidentEscalationExample();

    fireEvent.click(getByTestId('prefill-incident-button'));
    fireEvent.click(getByTestId('submit-incident-escalation-button'));

    await waitFor(() => {
      expect(getByTestId('incident-escalation-status')).toHaveTextContent(
        'SEV1 incident escalation packet이 준비되었습니다.'
      );
      expect(getByTestId('incident-packet-summary')).toHaveTextContent(
        'SEV1 incident escalation packet for API gateway latency spike'
      );
      expect(getByTestId('incident-activity-log')).toHaveTextContent(
        '패킷 준비 완료'
      );
    });
  });

  it('returns to idle after the draft changes post-success', async () => {
    const { getByTestId, queryByTestId } = renderIncidentEscalationExample();

    fireEvent.click(getByTestId('prefill-incident-button'));
    fireEvent.click(getByTestId('submit-incident-escalation-button'));

    await waitFor(() => {
      expect(getByTestId('incident-packet-summary')).toBeInTheDocument();
    });

    fireEvent.change(getByTestId('incident-severity-select'), {
      target: { value: 'sev2' },
    });

    await waitFor(() => {
      expect(getByTestId('incident-escalation-status')).toHaveTextContent(
        '입력이 바뀌어 escalation 준비 상태로 돌아왔습니다.'
      );
      expect(queryByTestId('incident-packet-summary')).not.toBeInTheDocument();
    });
  });

  it('resets back to the baseline state', async () => {
    const { getByTestId } = renderIncidentEscalationExample();

    fireEvent.click(getByTestId('prefill-incident-button'));
    fireEvent.click(getByTestId('reset-incident-button'));

    await waitFor(() => {
      expect(getByTestId('incident-title-input')).toHaveValue('');
      expect(getByTestId('incident-severity-select')).toHaveValue('sev3');
      expect(getByTestId('affected-users-input')).toHaveValue(1);
      expect(getByTestId('incident-escalation-status')).toHaveTextContent(
        '입력을 기다리고 있습니다.'
      );
    });
  });
});
