import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import StoreBackendTransactionsPage from './StoreBackendTransactionsPage';

describe('StoreBackendTransactionsPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('updates React subscribers through createBackendStore when the StateStore mutates', async () => {
    const user = userEvent.setup();
    render(<StoreBackendTransactionsPage />);

    expect(screen.getByTestId('pricing-currency').textContent).toBe('USD');
    expect(screen.getByTestId('backend-version').textContent).toBe('0');

    await user.click(screen.getByRole('button', { name: 'Cycle Currency' }));
    expect(screen.getByTestId('pricing-currency').textContent).toBe('EUR');
    expect(screen.getByTestId('backend-version').textContent).toBe('1');
  });

  it('commits, rolls back, and undoes/redoes multi-store atomic transactions', async () => {
    const user = userEvent.setup();
    render(<StoreBackendTransactionsPage />);

    expect(screen.getByTestId('inventory-stock').textContent).toBe('10');
    expect(screen.getByTestId('cart-items').textContent).toBe('0');
    expect(screen.getByTestId('tx-history-length').textContent).toBe('0');

    // Valid reserve commits both stores under one transaction entry
    await user.click(
      screen.getByRole('button', { name: 'Reserve 2 Items ($45 each)' })
    );
    await waitFor(() => {
      expect(screen.getByTestId('inventory-stock').textContent).toBe('8');
      expect(screen.getByTestId('cart-items').textContent).toBe('2');
      expect(screen.getByTestId('tx-history-length').textContent).toBe('1');
      expect(screen.getByTestId('tx-position').textContent).toBe('1');
    });

    // Over-reserve mutates inventory first then aborts -> both stores revert cleanly
    await user.click(
      screen.getByRole('button', {
        name: 'Attempt Over-Reserve (Triggers Rollback)',
      })
    );
    await waitFor(() => {
      expect(screen.getByTestId('transaction-status').textContent).toContain(
        'Rolled back'
      );
    });
    expect(screen.getByTestId('inventory-stock').textContent).toBe('8');
    expect(screen.getByTestId('cart-items').textContent).toBe('2');
    expect(screen.getByTestId('tx-history-length').textContent).toBe('1');

    // Undo reverts both stores atomically
    await user.click(screen.getByRole('button', { name: 'Undo Transaction' }));
    expect(screen.getByTestId('inventory-stock').textContent).toBe('10');
    expect(screen.getByTestId('cart-items').textContent).toBe('0');
    expect(screen.getByTestId('tx-position').textContent).toBe('0');

    // Redo reapplies both stores atomically
    await user.click(screen.getByRole('button', { name: 'Redo Transaction' }));
    expect(screen.getByTestId('inventory-stock').textContent).toBe('8');
    expect(screen.getByTestId('cart-items').textContent).toBe('2');
    expect(screen.getByTestId('tx-position').textContent).toBe('1');
  });
});
