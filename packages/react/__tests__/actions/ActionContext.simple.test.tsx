import React from 'react';
import { render, screen } from '@testing-library/react';
import { createActionContext } from '../../src/actions/ActionContext';
import type { ActionPayloadMap } from '@context-action/core';

interface TestActions extends ActionPayloadMap {
  testAction: { value: string };
  voidAction: void;
}

describe('ActionContext - Simple Tests', () => {
  const TestActionContext = createActionContext<TestActions>('TestActions');
  
  // 테스트 래퍼 컴포넌트
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <TestActionContext.Provider>
      {children}
    </TestActionContext.Provider>
  );

  describe('basic functionality', () => {
    it('should create ActionContext successfully', () => {
      expect(TestActionContext).toBeDefined();
      expect(TestActionContext.Provider).toBeDefined();
      expect(TestActionContext.useActionContext).toBeDefined();
      expect(TestActionContext.useActionDispatch).toBeDefined();
      expect(TestActionContext.useActionHandler).toBeDefined();
      expect(TestActionContext.useActionRegister).toBeDefined();
      expect(TestActionContext.useActionDispatchWithResult).toBeDefined();
    });

    it('should provide context within Provider', () => {
      const TestComponent = () => {
        const context = TestActionContext.useActionContext();
        return <div data-testid="context">{context ? 'Context Available' : 'No Context'}</div>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('context')).toHaveTextContent('Context Available');
    });

    it('should throw error when used outside Provider', () => {
      const TestComponent = () => {
        try {
          TestActionContext.useActionContext();
          return <div data-testid="error">No Error</div>;
        } catch (error) {
          return <div data-testid="error">Error Caught</div>;
        }
      };

      render(<TestComponent />);
      expect(screen.getByTestId('error')).toHaveTextContent('Error Caught');
    });
  });
});
