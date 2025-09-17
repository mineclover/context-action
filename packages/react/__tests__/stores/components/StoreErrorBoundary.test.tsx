import React from 'react';
import { render, screen } from '@testing-library/react';
import { StoreErrorBoundary, withStoreErrorBoundary, createStoreErrorBoundary } from '../../../src/stores/components/StoreErrorBoundary';
import { ContextActionError } from '../../../src/stores/utils/error-handling';

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Component that throws a ContextActionError
const ThrowContextActionError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new ContextActionError('store', 'Test ContextAction error', { test: true });
  }
  return <div>No error</div>;
};

describe('StoreErrorBoundary', () => {
  // Suppress console errors during tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  describe('Basic error handling', () => {
    it('should render children when there is no error', () => {
      render(
        <StoreErrorBoundary>
          <div>Test content</div>
        </StoreErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should catch errors and display default fallback', () => {
      render(
        <StoreErrorBoundary>
          <ThrowError shouldThrow={true} />
        </StoreErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    it('should display custom fallback when provided', () => {
      render(
        <StoreErrorBoundary fallback={<div>Custom error message</div>}>
          <ThrowError shouldThrow={true} />
        </StoreErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('should use fallback function when provided', () => {
      render(
        <StoreErrorBoundary
          fallback={(error, errorInfo) => (
            <div>Error: {error?.message || 'Unknown'}</div>
          )}
        >
          <ThrowContextActionError shouldThrow={true} />
        </StoreErrorBoundary>
      );

      expect(screen.getByText(/Error: Test ContextAction error/)).toBeInTheDocument();
    });
  });

  describe('Error callbacks', () => {
    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();

      render(
        <StoreErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </StoreErrorBoundary>
      );

      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('should handle ContextActionError specifically', () => {
      const onError = jest.fn();

      render(
        <StoreErrorBoundary onError={onError}>
          <ThrowContextActionError shouldThrow={true} />
        </StoreErrorBoundary>
      );

      expect(onError).toHaveBeenCalled();
      const [error] = onError.mock.calls[0];
      expect(error).toBeInstanceOf(ContextActionError);
    });
  });

  describe('Error reset functionality', () => {
    it('should reset error state when resetKeys change', () => {
      const { rerender } = render(
        <StoreErrorBoundary resetKeys={['key1']}>
          <ThrowError shouldThrow={true} />
        </StoreErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

      // Change resetKeys to trigger reset
      rerender(
        <StoreErrorBoundary resetKeys={['key2']}>
          <ThrowError shouldThrow={false} />
        </StoreErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should reset when resetOnPropsChange is true and props change', () => {
      const { rerender } = render(
        <StoreErrorBoundary resetOnPropsChange={true}>
          <ThrowError shouldThrow={true} />
        </StoreErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

      // Re-render with different children (props change)
      rerender(
        <StoreErrorBoundary resetOnPropsChange={true}>
          <div>New content</div>
        </StoreErrorBoundary>
      );

      expect(screen.getByText('New content')).toBeInTheDocument();
    });
  });

  describe('withStoreErrorBoundary HOC', () => {
    it('should wrap component with error boundary', () => {
      const TestComponent: React.FC = () => <div>Test component</div>;
      const WrappedComponent = withStoreErrorBoundary(TestComponent);

      render(<WrappedComponent />);

      expect(screen.getByText('Test component')).toBeInTheDocument();
    });

    it('should pass props to wrapped component', () => {
      const TestComponent: React.FC<{ message: string }> = ({ message }) => (
        <div>{message}</div>
      );
      const WrappedComponent = withStoreErrorBoundary(TestComponent);

      render(<WrappedComponent message="Hello world" />);

      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('should use custom fallback in HOC', () => {
      const TestComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
        if (shouldThrow) throw new Error('HOC error');
        return <div>No error</div>;
      };

      const WrappedComponent = withStoreErrorBoundary(TestComponent, {
        fallback: <div>HOC Error Fallback</div>
      });

      render(<WrappedComponent shouldThrow={true} />);

      expect(screen.getByText('HOC Error Fallback')).toBeInTheDocument();
    });
  });

  describe('createStoreErrorBoundary factory', () => {
    it('should create error boundary with default config', () => {
      const CustomBoundary = createStoreErrorBoundary();

      render(
        <CustomBoundary>
          <div>Test content</div>
        </CustomBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should create error boundary with custom config', () => {
      const CustomBoundary = createStoreErrorBoundary({
        fallback: <div>Custom factory fallback</div>,
        onError: jest.fn()
      });

      render(
        <CustomBoundary>
          <ThrowError shouldThrow={true} />
        </CustomBoundary>
      );

      expect(screen.getByText('Custom factory fallback')).toBeInTheDocument();
    });

    it('should allow overriding config at usage time', () => {
      const CustomBoundary = createStoreErrorBoundary({
        fallback: <div>Default fallback</div>
      });

      render(
        <CustomBoundary fallback={<div>Override fallback</div>}>
          <ThrowError shouldThrow={true} />
        </CustomBoundary>
      );

      expect(screen.getByText('Override fallback')).toBeInTheDocument();
    });
  });

  describe('Development vs Production behavior', () => {
    it('should handle errors appropriately', () => {
      render(
        <StoreErrorBoundary>
          <ThrowError shouldThrow={true} />
        </StoreErrorBoundary>
      );

      // In test environment, should show error message
      expect(screen.queryByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });
});