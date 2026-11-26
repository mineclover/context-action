import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastSystemProvider } from '@/components/ToastSystem';
import { SourceLinkRegistryProvider } from '@/stores/SourceLinkRegistry';
import HeadlessInteractionsPage from './HeadlessInteractionsPage';

function renderPage(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <SourceLinkRegistryProvider>
        <ToastSystemProvider>{ui}</ToastSystemProvider>
      </SourceLinkRegistryProvider>
    </MemoryRouter>
  );
}

describe('HeadlessInteractionsPage (v5 + @context-action/interactions)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('supports keyboard roving focus (skipping disabled tab) and controlled prop sync', async () => {
    const user = userEvent.setup();
    renderPage(<HeadlessInteractionsPage />);

    const overviewTab = screen.getByTestId('tab-overview');
    const architectureTab = screen.getByTestId('tab-architecture');
    const migrationTab = screen.getByTestId('tab-migration');
    const tablist = screen.getByRole('tablist', { name: 'v5 Headless Tabs' });

    overviewTab.focus();
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(architectureTab);
    expect(screen.getByTestId('tabs-focused-badge').textContent).toContain(
      'Focused: architecture'
    );

    fireEvent.keyDown(tablist, { key: 'End' });
    expect(document.activeElement).toBe(migrationTab);

    fireEvent.keyDown(tablist, { key: 'Home' });
    expect(document.activeElement).toBe(overviewTab);

    await user.click(
      screen.getByRole('button', { name: 'External: migration' })
    );
    await waitFor(() => {
      expect(screen.getByTestId('tabs-selected-badge').textContent).toContain(
        'Selected: migration'
      );
    });
    expect(screen.getByTestId('tabs-active-panel').textContent).toContain(
      'Migration v5'
    );
  });

  it('enforces LIFO Escape dismissal and blocks outer close when unsaved-changes guard is active', async () => {
    const user = userEvent.setup();
    renderPage(<HeadlessInteractionsPage />);

    await user.click(screen.getByRole('button', { name: 'Open Outer Dialog' }));
    expect(screen.getByTestId('outer-dialog')).toBeTruthy();

    await user.click(
      screen.getByRole('button', { name: 'Open Nested Popover' })
    );
    expect(screen.getByTestId('nested-popover')).toBeTruthy();

    // First Escape closes only the top-most nested popover
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByTestId('nested-popover')).toBeNull();
    });
    expect(screen.getByTestId('outer-dialog')).toBeTruthy();

    // Enable guard -> Escape must be aborted with guard message
    await user.click(
      screen.getByLabelText('Block outer dialog close (unsaved changes guard)')
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.getByTestId('dismiss-guard-reason').textContent).toContain(
        'Unsaved changes'
      );
    });
    expect(screen.getByTestId('outer-dialog')).toBeTruthy();

    // Disable guard -> Escape now dismisses outer dialog
    await user.click(
      screen.getByLabelText('Block outer dialog close (unsaved changes guard)')
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByTestId('outer-dialog')).toBeNull();
    });
  });

  it('keeps committed React renders at zero during fast-lane pointer drag until orchestrated commit', async () => {
    renderPage(<HeadlessInteractionsPage />);

    const track = screen.getByTestId('gesture-slider-track');
    const thumb = screen.getByTestId('gesture-slider-thumb');
    const rendersBadge = screen.getByTestId('slider-commit-renders');

    vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 200,
      bottom: 32,
      width: 200,
      height: 32,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const initialRenderText = rendersBadge.textContent;
    expect(screen.getByTestId('slider-committed-value').textContent).toContain(
      '40%'
    );

    // Drag along the track (25% -> 80%): preview DOM updates via fast lane with 0 committed React renders
    fireEvent.pointerDown(track, { pointerId: 1, button: 0, clientX: 50 });
    fireEvent.pointerMove(track, { pointerId: 1, clientX: 160 });

    await waitFor(() => {
      expect(thumb.getAttribute('data-preview-value')).toBe('80');
    });
    expect(screen.getByTestId('slider-preview-badge').textContent).toContain(
      'Fast Preview: 80%'
    );
    expect(rendersBadge.textContent).toBe(initialRenderText);
    expect(screen.getByTestId('slider-committed-value').textContent).toContain(
      '40%'
    );

    // Pointer up triggers orchestrated commitValue
    fireEvent.pointerUp(track, { pointerId: 1, clientX: 160 });
    await waitFor(() => {
      expect(
        screen.getByTestId('slider-committed-value').textContent
      ).toContain('80%');
    });
    expect(rendersBadge.textContent).not.toBe(initialRenderText);

    // Keyboard End jumps cleanly to 100%
    fireEvent.keyDown(thumb, { key: 'End' });
    await waitFor(() => {
      expect(
        screen.getByTestId('slider-committed-value').textContent
      ).toContain('100%');
    });
  });
});
