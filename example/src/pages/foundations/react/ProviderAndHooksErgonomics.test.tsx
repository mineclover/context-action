import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { ToastSystemProvider } from '@/components/ToastSystem';
import { SourceLinkRegistryProvider } from '@/stores/SourceLinkRegistry';
import { RefsIndexPage } from '../../patterns/refs/RefsIndexPage';
import ReactHooksPage from './HooksPage';
import ReactProviderPage from './ProviderPage';

function renderWithAppShell(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <SourceLinkRegistryProvider>
        <ToastSystemProvider>{ui}</ToastSystemProvider>
      </SourceLinkRegistryProvider>
    </MemoryRouter>
  );
}

describe('DX ergonomics showcase pages (Provider, Hooks, Refs)', () => {
  afterEach(() => {
    cleanup();
  });

  it('exercises ScopedNoteContext (createScopedContext + inline latest-ref guard + useRefRegistry) on ReactProviderPage', async () => {
    const user = userEvent.setup();
    renderWithAppShell(<ReactProviderPage />);

    const input = screen.getByLabelText(
      'Scoped note input'
    ) as HTMLInputElement;
    expect(screen.getByTestId('scoped-note-count').textContent).toContain(
      'Saves: 0'
    );
    expect(screen.getByTestId('scoped-has-saved').textContent).toContain(
      'Status: Draft'
    );

    // Too short (2 chars < minLength=3) -> aborted by guard, count stays 0
    await user.clear(input);
    await user.type(input, 'hi');
    await user.click(screen.getByRole('button', { name: 'Save Note' }));

    await waitFor(() => {
      expect(screen.getByTestId('scoped-blocked-reason').textContent).toContain(
        'at least 3 characters'
      );
    });
    expect(screen.getByTestId('scoped-note-count').textContent).toContain(
      'Saves: 0'
    );

    // Valid length -> commits, increments savedCount, flips hasSaved, fires onSaved observer
    await user.clear(input);
    await user.type(input, 'Clean DX');
    await user.click(screen.getByRole('button', { name: 'Save Note' }));

    await waitFor(() => {
      expect(screen.getByTestId('scoped-note-value').textContent).toContain(
        'Saved Note: Clean DX'
      );
    });
    expect(screen.getByTestId('scoped-note-count').textContent).toContain(
      'Saves: 1'
    );
    expect(screen.getByTestId('scoped-has-saved').textContent).toContain(
      'Status: Saved'
    );
    expect(screen.getByTestId('scoped-last-callback').textContent).toContain(
      'Clean DX'
    );

    // Raise minLength prop -> inline latest-ref guard reads updated minLength=10 immediately
    await user.click(screen.getByRole('button', { name: 'minLength: 10' }));
    await user.clear(input);
    await user.type(input, 'Hello');
    await user.click(screen.getByRole('button', { name: 'Save Note' }));

    await waitFor(() => {
      expect(screen.getByTestId('scoped-blocked-reason').textContent).toContain(
        'at least 10 characters'
      );
    });
    expect(screen.getByTestId('scoped-note-count').textContent).toContain(
      'Saves: 1'
    );

    // Reset & Focus -> resets note and moves focus into the RefRegistry-managed input
    await user.click(screen.getByRole('button', { name: 'Reset & Focus' }));
    await waitFor(() => {
      expect(screen.getByTestId('scoped-note-value').textContent).toContain(
        'Saved Note: Context-Action'
      );
    });
    expect(document.activeElement).toBe(input);
  });

  it('exercises derived useStorePath({ select }) isolation on ReactHooksPage', async () => {
    const user = userEvent.setup();
    renderWithAppShell(<ReactHooksPage />);

    const derivedUpdates = screen.getByTestId('derived-path-updates');
    const derivedValue = screen.getByTestId('derived-path-value');
    const initialUpdatesText = derivedUpdates.textContent;
    expect(derivedValue.textContent).toContain('isAlice: true');

    // Unrelated updates must NOT re-render the derived user.name subscriber
    await user.click(
      screen.getByRole('button', {
        name: 'Increment Clicks (Value + Selector)',
      })
    );
    await user.click(
      screen.getByRole('button', {
        name: 'Background Metric Update (Value Only)',
      })
    );
    expect(derivedUpdates.textContent).toBe(initialUpdatesText);

    // Toggling user.name changes `name === 'Alice'` and updates the derived card
    await user.click(
      screen.getByRole('button', { name: 'Toggle User Name (Value + Path)' })
    );
    await waitFor(() => {
      expect(derivedValue.textContent).toContain('isAlice: false');
    });
    expect(derivedUpdates.textContent).not.toBe(initialUpdatesText);
  });

  it('exercises RefRegistryQuickDemo imperative focus and box highlight on RefsIndexPage', async () => {
    const user = userEvent.setup();
    renderWithAppShell(<RefsIndexPage />);

    const input = screen.getByLabelText('RefRegistry demo input');
    const box = screen.getByTestId('ref-registry-box');
    expect(box.getAttribute('data-highlighted')).toBe('false');

    await user.click(screen.getByRole('button', { name: 'Focus Input' }));
    expect(document.activeElement).toBe(input);

    await user.click(screen.getByRole('button', { name: 'Toggle Highlight' }));
    expect(box.getAttribute('data-highlighted')).toBe('true');
  });
});
