import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { CanonicalOrderExample } from '../../../../example/src/pages/patterns/implementation-playbook/CanonicalOrderExample';
import { SourceLinkRegistryProvider } from '../../../../example/src/stores/SourceLinkRegistry';

function renderCanonicalExample() {
  return render(
    <SourceLinkRegistryProvider>
      <CanonicalOrderExample />
    </SourceLinkRegistryProvider>
  );
}

describe('Implementation Playbook canonical example', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('focuses the invalid email field and renders validation feedback', async () => {
    const { getByTestId } = renderCanonicalExample();

    fireEvent.change(getByTestId('customer-name-input'), {
      target: { value: 'Jordan Lee' },
    });
    fireEvent.change(getByTestId('email-input'), {
      target: { value: 'invalid-email' },
    });
    fireEvent.click(getByTestId('submit-order-button'));

    await waitFor(() => {
      expect(getByTestId('email-error')).toHaveTextContent(
        'Enter a valid work email address.'
      );
      expect(getByTestId('submission-status')).toHaveTextContent(
        'Please fix the highlighted fields before submitting.'
      );
      expect(document.activeElement).toBe(getByTestId('email-input'));
    });
  });

  it('submits a valid order and calculates the quote through the real example component', async () => {
    const { getByTestId } = renderCanonicalExample();

    fireEvent.click(getByTestId('prefill-valid-order-button'));
    fireEvent.click(getByTestId('submit-order-button'));

    await waitFor(() => {
      expect(getByTestId('submission-status')).toHaveTextContent(
        'Prepared quote for Avery Kim.'
      );
      expect(getByTestId('quote-total')).toHaveTextContent('$425.80');
      expect(getByTestId('activity-log')).toHaveTextContent('Submission ready');
    });
  });

  it('resets the example back to a known baseline state', async () => {
    const { getByTestId } = renderCanonicalExample();

    fireEvent.click(getByTestId('prefill-valid-order-button'));
    fireEvent.click(getByTestId('reset-order-demo-button'));

    await waitFor(() => {
      expect(getByTestId('customer-name-input')).toHaveValue('');
      expect(getByTestId('email-input')).toHaveValue('');
      expect(getByTestId('quantity-input')).toHaveValue(1);
      expect(getByTestId('submission-status')).toHaveTextContent(
        'Waiting for input.'
      );
    });
  });
});
