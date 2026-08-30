import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdvancedFilteringPage from './AdvancedFilteringPage';

describe('AdvancedFilteringPage', () => {
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    cleanup();
  });

  it('runs filtered handlers through the page-scoped action registry', async () => {
    const user = userEvent.setup();
    render(<AdvancedFilteringPage />);

    await user.click(screen.getByRole('button', { name: /Run All Handlers/ }));
    expect(await screen.findByText(/5 handlers executed/)).not.toBeNull();
    expect(screen.getByText('✅ 5')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: /Critical Only/ }));
    expect(await screen.findByText(/2 handlers executed/)).not.toBeNull();
    expect(screen.getByText('✅ 2')).not.toBeNull();
  });

  it('clears result and visualization state through the action facade', async () => {
    const user = userEvent.setup();
    render(<AdvancedFilteringPage />);

    await user.click(screen.getByRole('button', { name: /Critical Only/ }));
    expect(await screen.findByText(/2 handlers executed/)).not.toBeNull();

    await user.click(screen.getByRole('button', { name: /Clear Results/ }));
    await waitFor(() => {
      expect(screen.queryByText(/2 handlers executed/)).toBeNull();
      expect(screen.queryByText('Execution Summary')).toBeNull();
      expect(screen.getByText('✅ 0')).not.toBeNull();
    });
  });
});
