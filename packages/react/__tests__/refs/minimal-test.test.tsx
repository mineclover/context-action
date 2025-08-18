import React, { useEffect } from 'react';
import { render, cleanup } from '@testing-library/react';
import { createDeclarativeRefPattern } from '../../src/refs/declarative-ref-pattern';
import type { RefInitConfig } from '../../src/refs/types';

interface MockObject {
  type: 'MockObject';
  value: number;
  dispose(): Promise<void>;
}

describe('Minimal Infinite Loop Debug', () => {
  afterEach(() => {
    cleanup();
  });

  test('minimal reproduction of infinite loop', async () => {
    console.log('=== TEST START ===');
    const { Provider, useRef } = createDeclarativeRefPattern('MinimalTest', {
      testObject: {
        name: 'testObject',
        objectType: 'custom',
        validator: (target: unknown): target is MockObject =>
          typeof target === 'object' && 
          target !== null &&
          (target as MockObject).type === 'MockObject',
        cleanup: async (obj: MockObject) => {
          await obj.dispose();
        }
      } as RefInitConfig<MockObject>
    });

    function TestComponent() {
      const objectRef = useRef('testObject');

      useEffect(() => {
        console.log('TestComponent effect running');
        const mockObject: MockObject = {
          type: 'MockObject',
          value: 42,
          dispose: jest.fn().mockResolvedValue(undefined)
        };
        objectRef.setRef(mockObject);
        return () => {
          console.log('TestComponent effect cleanup');
          objectRef.setRef(null);
        };
      }, [objectRef]);

      console.log('TestComponent rendering, target:', objectRef.target);
      console.log('Component render count');

      return (
        <div data-testid="test-value">
          Value: {objectRef.target?.value || 'none'}
        </div>
      );
    }

    console.log('Starting render');
    const { getByTestId } = render(
      <Provider>
        <TestComponent />
      </Provider>
    );
    console.log('Render complete');
    
    // Wait a bit and check if the target got updated
    await new Promise(resolve => setTimeout(resolve, 50));
    console.log('=== AFTER WAIT ===');
  });
});