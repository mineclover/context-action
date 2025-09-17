import React, { createContext, useContext } from 'react';
import { render, screen } from '@testing-library/react';
import { composeProviders } from '../../../src/stores/utils/provider-composition';

describe('composeProviders', () => {
  // Create test contexts
  const Context1 = createContext<string>('default1');
  const Context2 = createContext<string>('default2');
  const Context3 = createContext<string>('default3');

  // Create test providers
  const Provider1: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Context1.Provider value="value1">{children}</Context1.Provider>
  );

  const Provider2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Context2.Provider value="value2">{children}</Context2.Provider>
  );

  const Provider3: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Context3.Provider value="value3">{children}</Context3.Provider>
  );

  // Test component that consumes all contexts
  const TestConsumer = () => {
    const value1 = useContext(Context1);
    const value2 = useContext(Context2);
    const value3 = useContext(Context3);

    return (
      <div>
        <div data-testid="value1">{value1}</div>
        <div data-testid="value2">{value2}</div>
        <div data-testid="value3">{value3}</div>
      </div>
    );
  };

  it('should compose multiple providers correctly', () => {
    const ComposedProviders = composeProviders(Provider1, Provider2, Provider3);

    render(
      <ComposedProviders>
        <TestConsumer />
      </ComposedProviders>
    );

    expect(screen.getByTestId('value1')).toHaveTextContent('value1');
    expect(screen.getByTestId('value2')).toHaveTextContent('value2');
    expect(screen.getByTestId('value3')).toHaveTextContent('value3');
  });

  it('should handle single provider', () => {
    const ComposedProviders = composeProviders(Provider1);

    render(
      <ComposedProviders>
        <TestConsumer />
      </ComposedProviders>
    );

    expect(screen.getByTestId('value1')).toHaveTextContent('value1');
    expect(screen.getByTestId('value2')).toHaveTextContent('default2');
    expect(screen.getByTestId('value3')).toHaveTextContent('default3');
  });

  it('should handle empty provider list', () => {
    const ComposedProviders = composeProviders();

    render(
      <ComposedProviders>
        <TestConsumer />
      </ComposedProviders>
    );

    expect(screen.getByTestId('value1')).toHaveTextContent('default1');
    expect(screen.getByTestId('value2')).toHaveTextContent('default2');
    expect(screen.getByTestId('value3')).toHaveTextContent('default3');
  });

  it('should maintain correct provider order (outermost to innermost)', () => {
    // Create a provider that depends on another context
    const DependentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      const value1 = useContext(Context1);
      return (
        <Context2.Provider value={`dependent-${value1}`}>
          {children}
        </Context2.Provider>
      );
    };

    // Provider1 should wrap DependentProvider so DependentProvider can access Context1
    const ComposedProviders = composeProviders(Provider1, DependentProvider);

    render(
      <ComposedProviders>
        <TestConsumer />
      </ComposedProviders>
    );

    expect(screen.getByTestId('value1')).toHaveTextContent('value1');
    expect(screen.getByTestId('value2')).toHaveTextContent('dependent-value1');
  });

  it('should work with conditional composition', () => {
    const featureFlags = {
      feature1: true,
      feature2: false,
      feature3: true
    };

    const providers = [
      featureFlags.feature1 && Provider1,
      featureFlags.feature2 && Provider2,
      featureFlags.feature3 && Provider3
    ].filter(Boolean) as React.ComponentType<{ children: React.ReactNode }>[];

    const ComposedProviders = composeProviders(...providers);

    render(
      <ComposedProviders>
        <TestConsumer />
      </ComposedProviders>
    );

    expect(screen.getByTestId('value1')).toHaveTextContent('value1');
    expect(screen.getByTestId('value2')).toHaveTextContent('default2'); // Not included
    expect(screen.getByTestId('value3')).toHaveTextContent('value3');
  });

  it('should support nested composition', () => {
    const GroupA = composeProviders(Provider1, Provider2);
    const GroupB = composeProviders(Provider3);
    const AllProviders = composeProviders(GroupA, GroupB);

    render(
      <AllProviders>
        <TestConsumer />
      </AllProviders>
    );

    expect(screen.getByTestId('value1')).toHaveTextContent('value1');
    expect(screen.getByTestId('value2')).toHaveTextContent('value2');
    expect(screen.getByTestId('value3')).toHaveTextContent('value3');
  });

  it('should render children correctly', () => {
    const ComposedProviders = composeProviders(Provider1, Provider2);

    render(
      <ComposedProviders>
        <div data-testid="child">Child Content</div>
      </ComposedProviders>
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Child Content');
  });

  it('should handle complex provider with props', () => {
    // Create a provider that accepts additional props
    const ConfigurableProvider: React.FC<{
      children: React.ReactNode;
      config?: string;
    }> = ({ children, config = 'default-config' }) => (
      <Context1.Provider value={config}>
        {children}
      </Context1.Provider>
    );

    // Wrap it to make it compatible with composeProviders
    const WrappedConfigurableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <ConfigurableProvider config="custom-config">
        {children}
      </ConfigurableProvider>
    );

    const ComposedProviders = composeProviders(WrappedConfigurableProvider, Provider2);

    render(
      <ComposedProviders>
        <TestConsumer />
      </ComposedProviders>
    );

    expect(screen.getByTestId('value1')).toHaveTextContent('custom-config');
    expect(screen.getByTestId('value2')).toHaveTextContent('value2');
  });
});