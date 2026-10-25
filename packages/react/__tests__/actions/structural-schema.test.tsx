import { act, renderHook } from '@testing-library/react';
import React, { useCallback } from 'react';
import { ActionValidationError } from '@context-action/core';
import { createActionContext } from '@context-action/react';

describe('ActionContext structural validation without tool or schema adapters', () => {
  it('accepts a plain safeParse validator and rejects invalid payloads before handlers', async () => {
    const Context = createActionContext<{ add: number }>('StructuralValidation', {
      schema: {
        add: {
          safeParse(value) {
            if (typeof value === 'number' && value >= 0) {
              return { success: true, data: value };
            }
            return {
              success: false,
              error: {
                message: 'Expected a non-negative number',
                issues: [{ message: 'Expected a non-negative number' }],
              },
            };
          },
        },
      },
    });
    const handler = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Context.Provider>{children}</Context.Provider>
    );
    const { result } = renderHook(() => {
      Context.useActionHandler('add', useCallback((value: number) => {
        handler(value);
      }, []));
      return Context.useActionDispatch();
    }, { wrapper });

    await act(async () => {
      await result.current('add', 3);
      await expect(result.current('add', -1)).rejects.toBeInstanceOf(ActionValidationError);
    });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(3);
  });
});
