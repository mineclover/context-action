import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { SourceLinkRegistryProvider } from '@/stores/SourceLinkRegistry';
import HeadlessDiPage from './HeadlessDiPage';

function renderHeadlessDiPage() {
  return render(
    <SourceLinkRegistryProvider>
      <HeadlessDiPage />
    </SourceLinkRegistryProvider>
  );
}

describe('HeadlessDiPage (Symmetric DI + shared ownership)', () => {
  afterEach(() => {
    cleanup();
  });

  it('keeps shared ActionRegister, Store, and TimeTravelStore state across view unmount/remount while resetting Provider-owned viewLocal', async () => {
    const user = userEvent.setup();
    renderHeadlessDiPage();

    // Headless guard (1) + command (1) + React observer (1) = 3 handlers while mounted
    await waitFor(() => {
      expect(screen.getByTestId('handler-count-badge').textContent).toContain(
        'appendBullet handlers: 3'
      );
    });

    // Invalid blank title is blocked by the headless guard
    const titleInput = screen.getByTestId('title-input');
    await user.clear(titleInput);
    await user.click(screen.getByTestId('apply-title-button'));
    await waitFor(() => {
      expect(screen.getByTestId('react-validation-error').textContent).toBe(
        'Title cannot be blank.'
      );
    });

    // Change Provider-owned viewLocal filter and append a note from React
    await user.click(screen.getByTestId('filter-tag-react'));
    await waitFor(() => {
      expect(screen.getByTestId('view-local-filter-badge').textContent).toBe(
        'filterTag: react'
      );
    });

    await user.type(screen.getByTestId('bullet-input'), 'Added inside React');
    await user.click(screen.getByTestId('append-bullet-button'));
    await waitFor(() => {
      expect(
        screen.getByTestId('headless-summary-readout').textContent
      ).toContain('2 note(s)');
    });

    // Unmount React view boundary: React observer detaches (3 -> 2), shared state stays live
    await user.click(screen.getByTestId('toggle-view-mount-button'));
    await waitFor(() => {
      expect(screen.getByTestId('unmounted-placeholder')).toBeTruthy();
      expect(screen.getByTestId('handler-count-badge').textContent).toContain(
        'appendBullet handlers: 2'
      );
    });

    // Dispatch headless action while React Providers are completely unmounted
    await user.click(screen.getByTestId('headless-append-button'));
    await waitFor(() => {
      expect(
        screen.getByTestId('headless-summary-readout').textContent
      ).toContain('3 note(s)');
      expect(
        screen.getByTestId('headless-history-readout').textContent
      ).toContain('pos 2 / 2');
    });

    // Headless undo while unmounted rolls back bullet count while keeping redo path
    await user.click(screen.getByTestId('headless-undo-button'));
    await waitFor(() => {
      expect(
        screen.getByTestId('headless-summary-readout').textContent
      ).toContain('2 note(s)');
      expect(
        screen.getByTestId('headless-history-readout').textContent
      ).toContain('pos 1 / 2');
    });

    // Remount React view: shared state + redo history survived, viewLocal reset to 'all'
    await user.click(screen.getByTestId('toggle-view-mount-button'));
    await waitFor(() => {
      expect(screen.getByTestId('mounted-react-boundary')).toBeTruthy();
      expect(screen.getByTestId('handler-count-badge').textContent).toContain(
        'appendBullet handlers: 3'
      );
      expect(screen.getByTestId('react-history-meta').textContent).toBe(
        'pos 1 / 2'
      );
      expect(screen.getByTestId('view-local-filter-badge').textContent).toBe(
        'filterTag: all'
      );
    });

    // Redo restores the headless bullet from inside the remounted React view
    await user.click(screen.getByTestId('react-redo-button'));
    await waitFor(() => {
      expect(screen.getByTestId('react-history-meta').textContent).toBe(
        'pos 2 / 2'
      );
      expect(screen.getByTestId('react-summary-badge').textContent).toContain(
        '3 note(s)'
      );
    });

    // Recreate runtime restores initial baseline
    await user.click(screen.getByTestId('recreate-runtime-button'));
    await waitFor(() => {
      expect(
        screen.getByTestId('headless-summary-readout').textContent
      ).toContain('1 note(s)');
      expect(
        screen.getByTestId('headless-history-readout').textContent
      ).toContain('pos 0 / 0');
    });
  });
});
