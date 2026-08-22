import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { describe, expect, it } from 'vitest';
import { isSortColumn } from './hooks/useReactAriaReferenceViewModel';
import ReactAriaReferencePage from './ReactAriaReferencePage';

async function actUserInteraction(interaction: () => Promise<void>) {
  await act(async () => {
    await interaction();
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

describe('React Aria integration reference', () => {
  it('enables React act() support for example tests', () => {
    expect(
      (
        globalThis as typeof globalThis & {
          IS_REACT_ACT_ENVIRONMENT?: boolean;
        }
      ).IS_REACT_ACT_ENVIRONMENT
    ).toBe(true);
  });

  it('narrows only documented sortable columns', () => {
    expect(isSortColumn('owner')).toBe(true);
    expect(isSortColumn('unknown-column')).toBe(false);
  });

  it('records keyboard table selection, sorting, calendar selection, and scheduling', async () => {
    const user = userEvent.setup();
    await actUserInteraction(async () => {
      render(<ReactAriaReferencePage />);
    });

    const table = screen.getByRole('grid', { name: 'Release review queue' });
    const firstDataRow = screen.getByRole('row', {
      name: /Core public contract/,
    });
    await actUserInteraction(async () => {
      firstDataRow.focus();
      await user.keyboard('[Space]');
    });
    expect(table.contains(document.activeElement)).toBe(true);
    expect(screen.getByText('1개 행 선택됨')).toBeTruthy();
    expect(screen.getByText(/Table selection committed: 1 row/)).toBeTruthy();

    await actUserInteraction(async () => {
      await user.click(screen.getByRole('columnheader', { name: 'Owner' }));
    });
    expect(screen.getByText(/Table sort committed: owner/)).toBeTruthy();

    const calendar = screen.getByRole('grid', { name: /Review schedule date/ });
    const selectedCalendarGridCell = calendar.querySelector(
      '[aria-selected="true"]'
    );
    const selectedCalendarCell =
      selectedCalendarGridCell?.querySelector('[role="button"]');
    if (!(selectedCalendarCell instanceof HTMLElement)) {
      throw new Error('Expected an initially selected calendar cell.');
    }
    await actUserInteraction(async () => {
      selectedCalendarCell.focus();
      await user.keyboard('[ArrowRight][Enter]');
    });
    expect(calendar.contains(document.activeElement)).toBe(true);
    expect(screen.getByText(/Calendar date committed/)).toBeTruthy();

    await actUserInteraction(async () => {
      await user.click(
        screen.getByRole('button', { name: '선택한 행에 리뷰 일정 적용' })
      );
    });
    expect(screen.getByText(/Scheduled 1 selected review/)).toBeTruthy();
  });
});
