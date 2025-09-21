import React, { useCallback } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { createActionContext } from '../src/actions/ActionContext';
import type { ActionPayloadMap } from '@context-action/core';

describe('createActionContext usage examples', () => {
  describe('Basic action dispatching and handling', () => {
    // @doc-extract: basic-usage
    // @doc-category: getting-started
    // @doc-priority: high
    // @doc-description: 기본 액션 컨텍스트 생성 및 사용법
    it('should create action context and dispatch actions with payload', async () => {
      // Define action types with proper payload mapping
      interface UserActions extends ActionPayloadMap {
        updateProfile: { name: string; email: string };
        logout: void;
      }

      // Create action context
      const {
        Provider: UserActionProvider,
        useActionDispatch: useUserAction,
        useActionHandler: useUserActionHandler
      } = createActionContext<UserActions>('UserActions');

      // Track handler calls for verification
      const handlerCalls: any[] = [];

      // Test component with action handlers
      function UserLogic({ children }: { children: React.ReactNode }) {
        useUserActionHandler('updateProfile', useCallback(async (payload) => {
          handlerCalls.push({ action: 'updateProfile', payload });
        }, []));

        useUserActionHandler('logout', useCallback(async () => {
          handlerCalls.push({ action: 'logout', payload: undefined });
        }, []));

        return <>{children}</>;
      }

      // Test component with action dispatch
      function UserProfile() {
        const dispatch = useUserAction();

        return (
          <div>
            <button
              data-testid="update-profile"
              onClick={() => dispatch('updateProfile', {
                name: 'John Doe',
                email: 'john@example.com'
              })}
            >
              Update Profile
            </button>
            <button
              data-testid="logout"
              onClick={() => dispatch('logout')}
            >
              Logout
            </button>
          </div>
        );
      }

      // App integration
      const TestApp = () => (
        <UserActionProvider>
          <UserLogic>
            <UserProfile />
          </UserLogic>
        </UserActionProvider>
      );

      const { getByTestId } = render(<TestApp />);

      // Test updateProfile action
      fireEvent.click(getByTestId('update-profile'));

      await waitFor(() => {
        expect(handlerCalls).toHaveLength(1);
        expect(handlerCalls[0]).toEqual({
          action: 'updateProfile',
          payload: { name: 'John Doe', email: 'john@example.com' }
        });
      });

      // Test logout action
      fireEvent.click(getByTestId('logout'));

      await waitFor(() => {
        expect(handlerCalls).toHaveLength(2);
        expect(handlerCalls[1]).toEqual({
          action: 'logout',
          payload: undefined
        });
      });
    });

    // @doc-extract: priority-handlers
    // @doc-category: advanced
    // @doc-priority: medium
    // @doc-description: 우선순위 기반 다중 핸들러 처리
    it('should handle multiple handlers for the same action with priority', async () => {
      interface AppActions extends ActionPayloadMap {
        initialize: { userId: string };
      }

      const {
        Provider: AppActionProvider,
        useActionDispatch: useAppAction,
        useActionHandler: useAppActionHandler
      } = createActionContext<AppActions>('AppActions');

      const executionOrder: string[] = [];

      function HighPriorityHandler() {
        useAppActionHandler('initialize', useCallback(async (payload) => {
          executionOrder.push(`high-priority: ${payload.userId}`);
        }, []), { priority: 100 });

        return null;
      }

      function LowPriorityHandler() {
        useAppActionHandler('initialize', useCallback(async (payload) => {
          executionOrder.push(`low-priority: ${payload.userId}`);
        }, []), { priority: 10 });

        return null;
      }

      function InitButton() {
        const dispatch = useAppAction();

        return (
          <button
            data-testid="init"
            onClick={() => dispatch('initialize', { userId: 'user123' })}
          >
            Initialize
          </button>
        );
      }

      const TestApp = () => (
        <AppActionProvider>
          <HighPriorityHandler />
          <LowPriorityHandler />
          <InitButton />
        </AppActionProvider>
      );

      const { getByTestId } = render(<TestApp />);
      fireEvent.click(getByTestId('init'));

      await waitFor(() => {
        expect(executionOrder).toEqual([
          'high-priority: user123',
          'low-priority: user123'
        ]);
      });
    });
  });

  describe('Complex real-world scenarios', () => {
    it('should handle form submission with validation and API calls', async () => {
      interface FormActions extends ActionPayloadMap {
        submitForm: { username: string; email: string };
        validateField: { field: string; value: string };
      }

      const {
        Provider: FormActionProvider,
        useActionDispatch: useFormAction,
        useActionHandler: useFormActionHandler
      } = createActionContext<FormActions>('FormActions');

      const mockApiCall = jest.fn().mockResolvedValue({ success: true });
      const validationResults: Array<{ field: string; isValid: boolean }> = [];
      const submissions: any[] = [];

      function FormLogic({ children }: { children: React.ReactNode }) {
        // Validation handler
        useFormActionHandler('validateField', useCallback(async (payload) => {
          const isValid = payload.value.length > 0;
          validationResults.push({ field: payload.field, isValid });
        }, []));

        // Submit handler with validation and API call
        useFormActionHandler('submitForm', useCallback(async (payload) => {
          // Simulate validation
          if (!payload.username || !payload.email) {
            throw new Error('Validation failed');
          }

          // Simulate API call
          const result = await mockApiCall(payload);
          submissions.push(result);
        }, []));

        return <>{children}</>;
      }

      function ContactForm() {
        const dispatch = useFormAction();

        const handleSubmit = () => {
          dispatch('submitForm', {
            username: 'testuser',
            email: 'test@example.com'
          });
        };

        const handleValidate = (field: string, value: string) => {
          dispatch('validateField', { field, value });
        };

        return (
          <div>
            <button
              data-testid="validate"
              onClick={() => handleValidate('username', 'testuser')}
            >
              Validate
            </button>
            <button
              data-testid="submit"
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>
        );
      }

      const TestApp = () => (
        <FormActionProvider>
          <FormLogic>
            <ContactForm />
          </FormLogic>
        </FormActionProvider>
      );

      const { getByTestId } = render(<TestApp />);

      // Test validation
      fireEvent.click(getByTestId('validate'));

      await waitFor(() => {
        expect(validationResults).toHaveLength(1);
        expect(validationResults[0]).toEqual({
          field: 'username',
          isValid: true
        });
      });

      // Test form submission
      fireEvent.click(getByTestId('submit'));

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledWith({
          username: 'testuser',
          email: 'test@example.com'
        });
        expect(submissions).toHaveLength(1);
        expect(submissions[0]).toEqual({ success: true });
      });
    });

    it('should handle async actions with error handling', async () => {
      interface DataActions extends ActionPayloadMap {
        loadData: { id: string };
        retryLoad: { id: string };
      }

      const {
        Provider: DataActionProvider,
        useActionDispatch: useDataAction,
        useActionHandler: useDataActionHandler
      } = createActionContext<DataActions>('DataActions');

      const mockFailingApi = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: 'success' });

      const results: any[] = [];
      const errors: any[] = [];

      function DataLogic({ children }: { children: React.ReactNode }) {
        useDataActionHandler('loadData', useCallback(async (payload, controller) => {
          try {
            const result = await mockFailingApi(payload.id);
            results.push(result);
          } catch (error) {
            errors.push(error);
            controller.abort('Loading failed');
          }
        }, []));

        useDataActionHandler('retryLoad', useCallback(async (payload) => {
          const result = await mockFailingApi(payload.id);
          results.push(result);
        }, []));

        return <>{children}</>;
      }

      function DataComponent() {
        const dispatch = useDataAction();

        return (
          <div>
            <button
              data-testid="load"
              onClick={() => dispatch('loadData', { id: 'test123' })}
            >
              Load Data
            </button>
            <button
              data-testid="retry"
              onClick={() => dispatch('retryLoad', { id: 'test123' })}
            >
              Retry
            </button>
          </div>
        );
      }

      const TestApp = () => (
        <DataActionProvider>
          <DataLogic>
            <DataComponent />
          </DataLogic>
        </DataActionProvider>
      );

      const { getByTestId } = render(<TestApp />);

      // Test initial load (should fail)
      fireEvent.click(getByTestId('load'));

      await waitFor(() => {
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toBe('Network error');
        expect(results).toHaveLength(0);
      });

      // Test retry (should succeed)
      fireEvent.click(getByTestId('retry'));

      await waitFor(() => {
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({ data: 'success' });
      });
    });
  });

  describe('Action context composition and integration', () => {
    it('should support multiple action contexts in the same app', async () => {
      // User actions
      interface UserActions extends ActionPayloadMap {
        login: { username: string };
      }

      // Settings actions
      interface SettingsActions extends ActionPayloadMap {
        updateTheme: { theme: 'light' | 'dark' };
      }

      const userContext = createActionContext<UserActions>('UserActions');
      const settingsContext = createActionContext<SettingsActions>('SettingsActions');

      const events: any[] = [];

      function UserLogic({ children }: { children: React.ReactNode }) {
        userContext.useActionHandler('login', useCallback(async (payload) => {
          events.push({ context: 'user', action: 'login', payload });
        }, []));

        return <>{children}</>;
      }

      function SettingsLogic({ children }: { children: React.ReactNode }) {
        settingsContext.useActionHandler('updateTheme', useCallback(async (payload) => {
          events.push({ context: 'settings', action: 'updateTheme', payload });
        }, []));

        return <>{children}</>;
      }

      function App() {
        const userDispatch = userContext.useActionDispatch();
        const settingsDispatch = settingsContext.useActionDispatch();

        return (
          <div>
            <button
              data-testid="login"
              onClick={() => userDispatch('login', { username: 'john' })}
            >
              Login
            </button>
            <button
              data-testid="theme"
              onClick={() => settingsDispatch('updateTheme', { theme: 'dark' })}
            >
              Change Theme
            </button>
          </div>
        );
      }

      const TestApp = () => (
        <userContext.Provider>
          <settingsContext.Provider>
            <UserLogic>
              <SettingsLogic>
                <App />
              </SettingsLogic>
            </UserLogic>
          </settingsContext.Provider>
        </userContext.Provider>
      );

      const { getByTestId } = render(<TestApp />);

      fireEvent.click(getByTestId('login'));
      fireEvent.click(getByTestId('theme'));

      await waitFor(() => {
        expect(events).toHaveLength(2);
        expect(events[0]).toEqual({
          context: 'user',
          action: 'login',
          payload: { username: 'john' }
        });
        expect(events[1]).toEqual({
          context: 'settings',
          action: 'updateTheme',
          payload: { theme: 'dark' }
        });
      });
    });

    it('should maintain type safety throughout the action pipeline', () => {
      interface TypedActions extends ActionPayloadMap {
        stringAction: string;
        numberAction: number;
        objectAction: { id: number; name: string };
        voidAction: void;
      }

      const {
        Provider,
        useActionDispatch,
        useActionHandler
      } = createActionContext<TypedActions>('TypedActions');

      // This test primarily validates TypeScript compilation
      function TypedComponent() {
        const dispatch = useActionDispatch();

        useActionHandler('stringAction', useCallback(async (payload: string) => {
          // TypeScript should infer payload as string
          expect(typeof payload).toBe('string');
        }, []));

        useActionHandler('objectAction', useCallback(async (payload: { id: number; name: string }) => {
          // TypeScript should infer correct object shape
          expect(typeof payload.id).toBe('number');
          expect(typeof payload.name).toBe('string');
        }, []));

        const handleClick = () => {
          // These should all type-check correctly
          dispatch('stringAction', 'test');
          dispatch('numberAction', 42);
          dispatch('objectAction', { id: 1, name: 'test' });
          dispatch('voidAction');

          // These would cause TypeScript errors if uncommented:
          // dispatch('stringAction', 123); // Error: number not assignable to string
          // dispatch('objectAction', 'wrong'); // Error: string not assignable to object
          // dispatch('voidAction', 'extra'); // Error: void action doesn't accept payload
        };

        return (
          <button data-testid="typed-button" onClick={handleClick}>
            Test Types
          </button>
        );
      }

      const TestApp = () => (
        <Provider>
          <TypedComponent />
        </Provider>
      );

      const { getByTestId } = render(<TestApp />);

      // If this renders without TypeScript errors, type safety is working
      expect(getByTestId('typed-button')).toBeInTheDocument();
    });
  });
});