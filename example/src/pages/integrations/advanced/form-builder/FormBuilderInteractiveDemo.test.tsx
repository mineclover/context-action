import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { FormBuilderInteractiveDemo } from './FormBuilderInteractiveDemo';

describe('FormBuilderInteractiveDemo', () => {
  afterEach(() => cleanup());

  it('adds a field, reports required validation, and resets to the baseline', async () => {
    const user = userEvent.setup();
    render(<FormBuilderInteractiveDemo />);

    expect(screen.getByText(/^2 fields$/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '+ number' }));
    await waitFor(() => expect(screen.getByText(/^3 fields$/)).toBeTruthy());

    await user.click(screen.getByRole('button', { name: '검증 및 제출' }));
    await waitFor(() =>
      expect(
        screen.getAllByText('필수 입력 항목입니다.').length
      ).toBeGreaterThan(0)
    );

    await user.click(screen.getByRole('button', { name: '초기화' }));
    await waitFor(() => expect(screen.getByText(/^2 fields$/)).toBeTruthy());
    expect(screen.queryByText('모든 필드가 유효합니다.')).toBeNull();
  });

  it('shows an email validation error and a success state for valid input', async () => {
    const user = userEvent.setup();
    render(<FormBuilderInteractiveDemo />);

    const emailInput = document.querySelector('input[type="email"]');
    expect(emailInput).toBeTruthy();
    if (!emailInput) throw new Error('Expected email preview input');
    await user.type(emailInput, 'invalid');
    const previewForm = screen
      .getByRole('button', { name: '검증 및 제출' })
      .closest('form');
    expect(previewForm).toBeTruthy();
    fireEvent.submit(previewForm as HTMLFormElement);
    await waitFor(() =>
      expect(screen.getByText('올바른 이메일 형식을 입력하세요.')).toBeTruthy()
    );

    fireEvent.change(emailInput, { target: { value: 'team@example.com' } });
    const nameInput = screen.getByPlaceholderText('홍길동');
    fireEvent.change(nameInput, { target: { value: 'Context Action' } });
    await waitFor(() => {
      expect((emailInput as HTMLInputElement).value).toBe('team@example.com');
      expect((nameInput as HTMLInputElement).value).toBe('Context Action');
    });
    fireEvent.submit(previewForm as HTMLFormElement);
    await waitFor(() =>
      expect(screen.getByText('모든 필드가 유효합니다.')).toBeTruthy()
    );
  });
});
