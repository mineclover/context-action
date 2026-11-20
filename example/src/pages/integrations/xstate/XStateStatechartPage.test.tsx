import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import XStateStatechartPage from './XStateStatechartPage';

describe('XStateStatechartPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('rejects invalid input via Standard Schema and blocks illegal transitions via enforceCanGuard', async () => {
    const user = userEvent.setup();
    render(<XStateStatechartPage />);

    expect(screen.getByTestId('actor-state').textContent).toBe('idle');

    // Attempt illegal transition while idle
    await user.click(screen.getByRole('button', { name: 'Ship Order' }));
    await waitFor(() => {
      expect(screen.getByTestId('xstate-trace-log').textContent).toContain(
        'BLOCKED (shipOrder)'
      );
    });
    expect(screen.getByTestId('actor-state').textContent).toBe('idle');

    // Invalid SKU blocked by registerStandardSchemaGuard
    const skuInput = screen.getByLabelText('SKU (min 3 chars)');
    await user.clear(skuInput);
    await user.type(skuInput, 'AB');
    await user.click(screen.getByRole('button', { name: 'Submit Order' }));
    await waitFor(() => {
      expect(screen.getByTestId('xstate-trace-log').textContent).toContain(
        'BLOCKED (submitOrder)'
      );
    });
    expect(screen.getByTestId('actor-state').textContent).toBe('idle');
  });

  it('advances statechart transitions and ignores unrelated telemetry updates in ActorStateReader', async () => {
    const user = userEvent.setup();
    render(<XStateStatechartPage />);

    const initialVersion = screen.getByTestId('reader-version').textContent;

    // Telemetry updates actor.context.telemetryTicks without changing projected slice
    await user.click(
      screen.getByRole('button', { name: 'Send Unrelated Telemetry Tick' })
    );
    expect(screen.getByTestId('telemetry-ticks').textContent).toBe('1');
    expect(screen.getByTestId('reader-version').textContent).toBe(
      initialVersion
    );

    // Valid order sequence advances statechart
    await user.click(screen.getByRole('button', { name: 'Submit Order' }));
    await waitFor(() => {
      expect(screen.getByTestId('actor-state').textContent).toBe('reserved');
    });

    await user.click(screen.getByRole('button', { name: 'Ship Order' }));
    await waitFor(() => {
      expect(screen.getByTestId('actor-state').textContent).toBe('shipped');
    });

    await user.click(screen.getByRole('button', { name: 'Complete Order' }));
    await waitFor(() => {
      expect(screen.getByTestId('actor-state').textContent).toBe('completed');
    });
  });
});
