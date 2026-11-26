import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { FlowControlPlaygroundPageV2 } from './FlowControlPlaygroundPageV2';

describe('FlowControlPlaygroundPageV2 (dispatchWithResult & immutable Map cache)', () => {
  afterEach(() => {
    cleanup();
  });

  it('captures memory-cache early return in ResultsDisplay and misses cleanly after Clear Cache', async () => {
    const user = userEvent.setup();
    render(<FlowControlPlaygroundPageV2 />);

    const cacheHitBtn = screen.getByRole('button', {
      name: /Cache Optimization \(Memory Hit\)/i,
    });
    await user.click(cacheHitBtn);
    await waitFor(() => {
      expect(cacheHitBtn.className).toContain('border-blue-500');
    });

    await user.click(screen.getByRole('button', { name: 'Execute Scenario' }));

    await waitFor(
      () => {
        const results = within(screen.getByTestId('results-display'));
        expect(results.getByText(/"source": "memory-cache"/)).toBeTruthy();
        expect(results.getByText(/"id": "cached-user-profile"/)).toBeTruthy();
        expect(
          screen.getByText('🎯 Memory Cache HIT - Early Return')
        ).toBeTruthy();
      },
      { timeout: 3000 }
    );

    await user.click(screen.getByRole('button', { name: 'Clear Cache' }));
    await user.click(screen.getByRole('button', { name: 'Execute Scenario' }));

    await waitFor(
      () => {
        const results = within(screen.getByTestId('results-display'));
        expect(results.getByText(/"source": "database"/)).toBeTruthy();
      },
      { timeout: 3000 }
    );
  });

  it('captures priority jump result when elevated security authorization is aborted', async () => {
    const user = userEvent.setup();
    render(<FlowControlPlaygroundPageV2 />);

    const securityBtn = screen.getByRole('button', {
      name: /Security Escalation \(Standard User - Should Fail\)/i,
    });
    await user.click(securityBtn);
    await waitFor(() => {
      expect(securityBtn.className).toContain('border-blue-500');
    });

    await user.click(screen.getByRole('button', { name: 'Execute Scenario' }));

    await waitFor(
      () => {
        const results = within(screen.getByTestId('results-display'));
        expect(results.getByText(/"authorized": false/)).toBeTruthy();
        expect(results.getByText(/"level": "elevated"/)).toBeTruthy();
        expect(
          screen.getByText('⬆️ Jump to Priority 50 (Elevated Handler)')
        ).toBeTruthy();
      },
      { timeout: 3000 }
    );
  });
});
