import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { isSortColumn } from './hooks/useReactAriaReferenceViewModel';
import ReactAriaReferencePage from './ReactAriaReferencePage';

describe('React Aria integration reference', () => {
  it('narrows only documented sortable columns', () => {
    expect(isSortColumn('owner')).toBe(true);
    expect(isSortColumn('unknown-column')).toBe(false);
  });

  it('records keyboard table selection, sorting, calendar selection, and scheduling', async () => {
    const user = userEvent.setup();
    render(<ReactAriaReferencePage />);

    const table = screen.getByRole('grid', { name: 'Release review queue' });
    const firstDataRow = screen.getByRole('row', {
      name: /Core public contract/,
    });
    firstDataRow.focus();
    expect(table.contains(document.activeElement)).toBe(true);
    await user.keyboard('[Space]');
    expect(await screen.findByText('1개 행 선택됨')).toBeTruthy();
    expect(
      await screen.findByText(/Table selection committed: 1 row/)
    ).toBeTruthy();

    await user.click(screen.getByRole('columnheader', { name: 'Owner' }));
    expect(await screen.findByText(/Table sort committed: owner/)).toBeTruthy();

    const calendar = screen.getByRole('grid', { name: /Review schedule date/ });
    const selectedCalendarCell = screen.getByRole('button', {
      name: /August 12, 2026/,
    });
    selectedCalendarCell.focus();
    expect(calendar.contains(document.activeElement)).toBe(true);
    await user.keyboard('[ArrowRight][Enter]');
    expect(await screen.findByText(/Calendar date committed/)).toBeTruthy();

    await user.click(
      screen.getByRole('button', { name: '선택한 행에 리뷰 일정 적용' })
    );
    expect(await screen.findByText(/Scheduled 1 selected review/)).toBeTruthy();
  });
});
