import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import WebMCPScopePage from './WebMCPScopePage';

describe('WebMCPScopePage', () => {
  afterEach(() => {
    cleanup();
  });

  it('registers explicit toolNames on mount and clears them when the scope unmounts', async () => {
    const user = userEvent.setup();
    render(<WebMCPScopePage />);

    await waitFor(() => {
      expect(screen.getByTestId('webmcp-supported').textContent).toBe('true');
      expect(screen.getByTestId('webmcp-active-tools').textContent).toBe(
        'lookup_order, issue_refund'
      );
      expect(screen.getByTestId('registered-tool-count').textContent).toBe('2');
    });

    await user.click(
      screen.getByRole('button', { name: 'Unmount WebMCP Scope' })
    );

    await waitFor(() => {
      expect(screen.getByTestId('registered-tool-count').textContent).toBe('0');
    });
  });

  it('executes registered WebMCP tools and preserves structured error envelopes', async () => {
    const user = userEvent.setup();
    render(<WebMCPScopePage />);

    await waitFor(() => {
      expect(screen.getByTestId('registered-tool-count').textContent).toBe('2');
    });

    await user.click(screen.getByRole('button', { name: 'Call lookup_order' }));
    await waitFor(() => {
      expect(screen.getByTestId('webmcp-agent-output').textContent).toContain(
        'Ada Lovelace'
      );
      expect(screen.getByTestId('webmcp-audit-log').textContent).toContain(
        'afterExecute(lookup_order) -> OK'
      );
    });

    await user.click(
      screen.getByRole('button', { name: 'Trigger Error (Missing Order)' })
    );
    await waitFor(() => {
      expect(screen.getByTestId('webmcp-agent-output').textContent).toContain(
        'TOOL_NOT_FOUND'
      );
      expect(screen.getByTestId('webmcp-audit-log').textContent).toContain(
        'afterExecute(issue_refund) -> ERROR(TOOL_NOT_FOUND)'
      );
    });
  });
});
