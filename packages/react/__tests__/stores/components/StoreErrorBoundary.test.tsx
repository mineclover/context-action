import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  ContextActionError,
  ContextActionErrorType,
} from '../../../src/stores/utils/error-handling';
import {
  StoreErrorBoundary,
  withStoreErrorBoundary,
} from '../../../src/stores/components/StoreErrorBoundary';

describe('StoreErrorBoundary', () => {
  it('preserves ContextActionError identity in derived state', () => {
    const error = new ContextActionError(
      ContextActionErrorType.STORE_ERROR,
      'store failed',
    );

    const state = StoreErrorBoundary.getDerivedStateFromError(error);

    expect(state.hasError).toBe(true);
    expect(state.error).toBe(error);
    expect(state.errorId).toMatch(/^error_/);
  });

  it('marks ordinary errors for conversion during the catch lifecycle', () => {
    const error = new Error('render failed');
    const state = StoreErrorBoundary.getDerivedStateFromError(error);

    expect(state.hasError).toBe(true);
    expect(state.error).toBeNull();
  });

  it('renders the supplied fallback and reports converted errors', () => {
    const onError = jest.fn();
    const ThrowingComponent = (): React.ReactElement => {
      throw new Error('render failed');
    };

    render(
      <StoreErrorBoundary
        fallback={<div data-testid="store-fallback">fallback</div>}
        onError={onError}
      >
        <ThrowingComponent />
      </StoreErrorBoundary>,
    );

    expect(screen.getByTestId('store-fallback')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(ContextActionError);
    expect(onError.mock.calls[0]?.[0].message).toContain('Unhandled error in Store component');
  });

  it('resets only when reset key values change', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const MaybeThrow = ({ shouldThrow }: { shouldThrow: boolean }): React.ReactElement => {
      if (shouldThrow) throw new Error('render failed');
      return <div data-testid="healthy-store">healthy</div>;
    };

    const renderBoundary = (version: number, shouldThrow: boolean) => (
      <StoreErrorBoundary
        fallback={<div data-testid="reset-fallback">fallback</div>}
        resetOnPropsChange
        resetKeys={[version]}
      >
        <MaybeThrow shouldThrow={shouldThrow} />
      </StoreErrorBoundary>
    );

    const { rerender } = render(renderBoundary(1, true));
    expect(screen.getByTestId('reset-fallback')).toBeInTheDocument();

    rerender(renderBoundary(1, false));
    expect(screen.getByTestId('reset-fallback')).toBeInTheDocument();

    rerender(renderBoundary(2, false));
    expect(screen.getByTestId('healthy-store')).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('isolates errors when used as a higher-order component', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const ThrowingComponent = (): React.ReactElement => {
      throw new Error('wrapped render failed');
    };
    const EnhancedComponent = withStoreErrorBoundary(ThrowingComponent, {
      fallback: <div data-testid="hoc-fallback">wrapped fallback</div>,
    });

    render(<EnhancedComponent />);

    expect(screen.getByTestId('hoc-fallback')).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
