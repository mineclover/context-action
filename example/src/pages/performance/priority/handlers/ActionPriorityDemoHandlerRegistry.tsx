import React, { useCallback } from 'react';
import {
  appendExecutionResult,
  createHandlerResult,
  isValidCredentials,
  resetExecutionResults,
} from '../business/action-priority-demo-rules';
import {
  useActionPriorityDemoActionHandler,
  useActionPriorityDemoStore,
} from '../contexts/ActionPriorityDemoContexts';

export function ActionPriorityDemoHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const executionResultsStore = useActionPriorityDemoStore('executionResults');
  const isExecutingStore = useActionPriorityDemoStore('isExecuting');

  const recordResult = useCallback(
    (result: Parameters<typeof appendExecutionResult>[1]) => {
      executionResultsStore.setValue(
        appendExecutionResult(executionResultsStore.getValue(), result)
      );
    },
    [executionResultsStore]
  );

  useActionPriorityDemoActionHandler(
    'authenticate',
    useCallback(
      (payload, controller) => {
        const startedAt = Date.now();

        if (!payload.username || !payload.password) {
          controller.abort('Missing credentials');
          return;
        }

        recordResult(
          createHandlerResult({
            id: 'input-validator',
            priority: 100,
            step: 'Input Validation',
            result: {
              step: 'input-validation',
              success: true,
              valid: true,
            },
            startedAt,
            finishedAt: Date.now(),
          })
        );
      },
      [recordResult]
    ),
    { priority: 100, id: 'input-validator' }
  );

  useActionPriorityDemoActionHandler(
    'authenticate',
    useCallback(
      async (payload, controller) => {
        const startedAt = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 50));

        if (payload.username === 'hacker') {
          controller.abort('Suspicious activity detected');
          return;
        }

        recordResult(
          createHandlerResult({
            id: 'security-checker',
            priority: 95,
            step: 'Security Check',
            result: {
              step: 'security-check',
              success: true,
              cleared: true,
            },
            startedAt,
            finishedAt: Date.now(),
          })
        );
      },
      [recordResult]
    ),
    { priority: 95, id: 'security-checker' }
  );

  useActionPriorityDemoActionHandler(
    'authenticate',
    useCallback(
      (payload, controller) => {
        const startedAt = Date.now();
        const isRateLimited = Math.random() < 0.1;

        if (isRateLimited) {
          controller.abort('Rate limit exceeded');
          return;
        }

        recordResult(
          createHandlerResult({
            id: 'rate-limiter',
            priority: 90,
            step: 'Rate Limiting',
            result: {
              step: 'rate-limiting',
              success: true,
              consumed: true,
              username: payload.username,
            },
            startedAt,
            finishedAt: Date.now(),
          })
        );
      },
      [recordResult]
    ),
    { priority: 90, id: 'rate-limiter' }
  );

  useActionPriorityDemoActionHandler(
    'authenticate',
    useCallback(
      async (payload) => {
        const startedAt = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 100));
        const valid = isValidCredentials(payload.username, payload.password);

        recordResult(
          createHandlerResult({
            id: 'authenticator',
            priority: 80,
            step: 'Authentication',
            result: {
              step: 'authentication',
              success: valid,
              user: valid ? { id: '123', username: payload.username } : null,
              token: valid ? 'jwt-token-example' : null,
            },
            startedAt,
            finishedAt: Date.now(),
          })
        );
      },
      [recordResult]
    ),
    { priority: 80, id: 'authenticator' }
  );

  useActionPriorityDemoActionHandler(
    'authenticate',
    useCallback(
      (payload) => {
        const startedAt = Date.now();

        recordResult(
          createHandlerResult({
            id: 'analytics-tracker',
            priority: 30,
            step: 'Analytics Tracking',
            result: {
              step: 'analytics',
              tracked: true,
              event: 'login_attempt',
              username: payload.username,
            },
            startedAt,
            finishedAt: Date.now(),
          })
        );
      },
      [recordResult]
    ),
    { priority: 30, id: 'analytics-tracker' }
  );

  useActionPriorityDemoActionHandler(
    'authenticate',
    useCallback(
      (payload) => {
        const startedAt = Date.now();

        recordResult(
          createHandlerResult({
            id: 'audit-logger',
            priority: 10,
            step: 'Audit Logging',
            result: {
              step: 'audit',
              logged: true,
              action: 'login',
              username: payload.username,
              success: true,
            },
            startedAt,
            finishedAt: Date.now(),
          })
        );
      },
      [recordResult]
    ),
    { priority: 10, id: 'audit-logger' }
  );

  useActionPriorityDemoActionHandler(
    'resetResults',
    useCallback(() => {
      executionResultsStore.setValue(resetExecutionResults());
    }, [executionResultsStore]),
    { priority: 50, id: 'reset-results' }
  );

  useActionPriorityDemoActionHandler(
    'setExecutionStatus',
    useCallback(
      (payload) => {
        isExecutingStore.setValue(payload.isExecuting);
      },
      [isExecutingStore]
    ),
    { priority: 50, id: 'set-execution-status' }
  );

  return <>{children}</>;
}
