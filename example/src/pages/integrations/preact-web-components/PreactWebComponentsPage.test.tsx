import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import PreactWebComponentsPage from './PreactWebComponentsPage';

async function actUserInteraction(interaction: () => Promise<void>) {
  await act(async () => {
    await interaction();
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

describe('Preact Web Components Integration showcase', () => {
  afterEach(() => {
    cleanup();
  });
  it('renders the showcase page with bridged custom elements', async () => {
    await actUserInteraction(async () => {
      render(<PreactWebComponentsPage />);
    });

    expect(
      screen.getByText('React 19 Host ↔ Preact Web Components Integration')
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        name: /Section 1: React 19 ↔ Preact Stepper Bridge/,
      })
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        name: /Section 2: Form-Associated Custom Elements/,
      })
    ).toBeTruthy();
  });

  it('toggles VIP discount and recalculates order summary', async () => {
    const user = userEvent.setup();
    await actUserInteraction(async () => {
      render(<PreactWebComponentsPage />);
    });

    const discountBtn = screen.getByRole('button', {
      name: /\+ 10% VIP 할인 쿠폰 적용/,
    });
    await actUserInteraction(async () => {
      await user.click(discountBtn);
    });

    expect(screen.getByText('✓ 10% VIP 할인 적용 중')).toBeTruthy();
    expect(screen.getByText('VIP 할인 (10%):')).toBeTruthy();
  });

  it('handles custom event dispatched from bridged stepper', async () => {
    await actUserInteraction(async () => {
      render(<PreactWebComponentsPage />);
    });

    const steppers = document.querySelectorAll('preact-wc-stepper');
    expect(steppers.length).toBeGreaterThan(0);

    const firstStepper = steppers[0];
    expect(firstStepper).toBeDefined();
    if (!firstStepper) throw new Error('Expected at least one stepper element');

    await actUserInteraction(async () => {
      firstStepper.dispatchEvent(
        new CustomEvent('quantity-change', {
          detail: { value: 3 },
          bubbles: true,
          composed: true,
        })
      );
    });

    expect(
      screen.getByText(/Quantity updated: prod-react-book → 3 ea/)
    ).toBeTruthy();
  });

  it('submits Form-Associated Custom Element within a native form', async () => {
    await actUserInteraction(async () => {
      render(<PreactWebComponentsPage />);
    });

    const form = document.querySelector('form')!;
    expect(form).toBeTruthy();

    await actUserInteraction(async () => {
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
    });

    expect(screen.getByText(/예약 완료! 김개발님에게/)).toBeTruthy();
    expect(
      screen.getByText(
        /Form-Associated Custom Element submission received: 김개발 reserved/
      )
    ).toBeTruthy();
  });

  it('resets cart and form to baseline upon reset action', async () => {
    const user = userEvent.setup();
    await actUserInteraction(async () => {
      render(<PreactWebComponentsPage />);
    });

    // Toggle discount first
    const discountBtn = screen.getByRole('button', {
      name: /\+ 10% VIP 할인 쿠폰 적용/,
    });
    await actUserInteraction(async () => {
      await user.click(discountBtn);
    });
    expect(screen.getByText('✓ 10% VIP 할인 적용 중')).toBeTruthy();

    // Reset
    const resetBtn = screen.getByRole('button', { name: '초기화' });
    await actUserInteraction(async () => {
      await user.click(resetBtn);
    });

    expect(screen.getByText(/\+ 10% VIP 할인 쿠폰 적용/)).toBeTruthy();
    expect(
      screen.getByText('Cart & Form restored to initial state.')
    ).toBeTruthy();
  });
});
