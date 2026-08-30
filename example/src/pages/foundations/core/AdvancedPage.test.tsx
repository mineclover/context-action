import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { ToastContainer, ToastSystemProvider } from '@/components/ToastSystem';
import { SourceLinkRegistryProvider } from '@/stores/SourceLinkRegistry';
import CoreAdvancedPage from './AdvancedPage';

async function renderAdvancedPage() {
  await act(async () => {
    render(
      <SourceLinkRegistryProvider>
        <ToastSystemProvider>
          <CoreAdvancedPage />
          <ToastContainer />
        </ToastSystemProvider>
      </SourceLinkRegistryProvider>
    );
    await Promise.resolve();
  });
}

describe('CoreAdvancedPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('routes basic and priority interactions through the page-scoped handlers', async () => {
    const user = userEvent.setup();
    await renderAdvancedPage();

    const countCard = screen.getByText('Current Count').parentElement;
    expect(countCard?.textContent).toContain('0');

    await user.click(screen.getByRole('button', { name: '증가 (+1)' }));
    await waitFor(() => {
      expect(countCard?.textContent).toContain('1');
    });

    await user.click(
      screen.getByRole('button', { name: '우선순위 테스트 실행' })
    );
    const priorityList = await screen.findByRole('list');
    await waitFor(() => {
      expect(priorityList.textContent).toMatch(/High Priority \(3\): 테스트/);
      expect(priorityList.textContent).toMatch(/Mid Priority \(2\): 테스트/);
      expect(priorityList.textContent).toMatch(/Low Priority \(1\): 테스트/);
    });

    const priorityItems = Array.from(priorityList.querySelectorAll('li')).map(
      (item) => item.textContent
    );
    expect(priorityItems[0]).toMatch(/High Priority \(3\): 테스트/);
    expect(priorityItems[1]).toMatch(/Mid Priority \(2\): 테스트/);
    expect(priorityItems[2]).toMatch(/Low Priority \(1\): 테스트/);
  });

  it('keeps the deliberate error action to one error toast', async () => {
    const user = userEvent.setup();
    await renderAdvancedPage();

    await user.click(screen.getByRole('button', { name: '에러 액션' }));

    await waitFor(() => {
      const stack = document.querySelector('.fixed.z-50 > .space-y-2');
      expect(stack?.children).toHaveLength(1);
      expect(stack?.textContent).toContain('Action handler error');
    });
  });
});
