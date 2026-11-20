import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import AISDKToolsPage from './AISDKToolsPage';

describe('AISDKToolsPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('executes safe read tools immediately and records redacted observations', async () => {
    const user = userEvent.setup();
    render(<AISDKToolsPage />);

    expect(screen.getByTestId('aisdk-active-tools').textContent).toBe(
      'get_account_summary, freeze_account'
    );
    expect(screen.getByTestId('account-status').textContent).toBe('active');

    await user.click(
      screen.getByRole('button', {
        name: 'Simulate Model Call: get_account_summary',
      })
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('aisdk-execution-output').textContent
      ).toContain('Grace Hopper');
      const observationsText =
        screen.getByTestId('aisdk-observations').textContent ?? '';
      expect(observationsText).toContain('get_account_summary');
      expect(observationsText).toContain('[secretToken redacted]');
      expect(observationsText).not.toContain('should-be-redacted');
    });
  });

  it('pauses approval-gated tools in the queue until approved or rejected', async () => {
    const user = userEvent.setup();
    render(<AISDKToolsPage />);

    // First reject
    await user.click(
      screen.getByRole('button', {
        name: 'Simulate Model Call: freeze_account',
      })
    );
    await waitFor(() => {
      expect(screen.getByTestId('pending-approvals').textContent).toContain(
        'freeze_account'
      );
    });
    await user.click(screen.getByRole('button', { name: 'Reject' }));
    await waitFor(() => {
      expect(
        screen.getByTestId('aisdk-execution-output').textContent
      ).toContain('Rejected by user approval queue');
    });
    expect(screen.getByTestId('account-status').textContent).toBe('active');

    // Now approve & execute
    await user.click(
      screen.getByRole('button', {
        name: 'Simulate Model Call: freeze_account',
      })
    );
    await waitFor(() => {
      expect(screen.getByTestId('pending-approvals').textContent).toContain(
        'freeze_account'
      );
    });
    await user.click(screen.getByRole('button', { name: 'Approve & Execute' }));

    await waitFor(() => {
      expect(screen.getByTestId('account-status').textContent).toBe('frozen');
      expect(
        screen.getByTestId('aisdk-execution-output').textContent
      ).toContain('frozen');
    });
  });
});
