import React, { useCallback, useEffect, useRef } from 'react';
import {
  appendApiCall,
  incrementRateLimit,
  isBlockingActive,
  isRateLimited,
  normalizeRateLimit,
  recordBlockedRequest,
  recordErroredRequest,
  recordSuccessfulRequest,
  updateApiCall,
} from '../business/api-blocking-rules';
import {
  useApiBlockingAction,
  useApiBlockingActionHandler,
  useApiBlockingStore,
} from '../contexts/ApiBlockingContexts';

async function simulateApiCall(): Promise<{
  success: boolean;
  responseTime: number;
}> {
  const responseTime = Math.random() * 800 + 200;
  await new Promise((resolve) => setTimeout(resolve, responseTime));

  return {
    success: Math.random() > 0.15,
    responseTime: Math.round(responseTime),
  };
}

export function ApiBlockingHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useApiBlockingAction();
  const blockingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apiCallsStore = useApiBlockingStore('apiCalls');
  const isBlockedStore = useApiBlockingStore('isBlocked');
  const blockedActionStore = useApiBlockingStore('blockedAction');
  const blockEndTimeStore = useApiBlockingStore('blockEndTime');
  const blockDurationStore = useApiBlockingStore('blockDuration');
  const rateLimitStore = useApiBlockingStore('rateLimit');
  const metricsStore = useApiBlockingStore('metrics');

  useEffect(
    () => () => {
      if (blockingTimeoutRef.current) {
        clearTimeout(blockingTimeoutRef.current);
      }
    },
    []
  );

  useApiBlockingActionHandler(
    'makeApiCall',
    useCallback(
      async (payload) => {
        const callId = `call-${payload.timestamp}-${Math.random()}`;
        const pendingRecord = {
          id: callId,
          endpoint: payload.endpoint,
          timestamp: payload.timestamp,
          status: 'pending' as const,
          method: payload.method,
        };

        apiCallsStore.setValue(
          appendApiCall(apiCallsStore.getValue(), pendingRecord)
        );

        const now = Date.now();
        const currentRateLimit = rateLimitStore.getValue();
        const normalizedRateLimit = normalizeRateLimit(currentRateLimit, now);
        if (normalizedRateLimit !== currentRateLimit) {
          rateLimitStore.setValue(normalizedRateLimit);
        }

        if (
          isBlockingActive(
            isBlockedStore.getValue(),
            blockEndTimeStore.getValue(),
            now
          )
        ) {
          dispatch('markApiCallBlocked', {
            callId,
            endpoint: payload.endpoint,
            reason: 'Request blocked by timing constraint',
            timestamp: now,
          });
          return;
        }

        if (isRateLimited(normalizedRateLimit, now)) {
          dispatch('markApiCallBlocked', {
            callId,
            endpoint: payload.endpoint,
            reason: 'Rate limit exceeded',
            timestamp: now,
          });
          return;
        }

        dispatch('startBlocking', {
          action: 'apiCall',
          duration: blockDurationStore.getValue(),
          timestamp: now,
        });

        if (normalizedRateLimit.enabled) {
          rateLimitStore.setValue(incrementRateLimit(normalizedRateLimit, now));
        }

        try {
          const result = await simulateApiCall();

          if (result.success) {
            dispatch('markApiCallSuccess', {
              callId,
              endpoint: payload.endpoint,
              responseTime: result.responseTime,
              timestamp: Date.now(),
            });
          } else {
            dispatch('markApiCallError', {
              callId,
              endpoint: payload.endpoint,
              error: 'Simulated API error',
              timestamp: Date.now(),
            });
          }
        } catch (_error) {
          dispatch('markApiCallError', {
            callId,
            endpoint: payload.endpoint,
            error: 'Network error',
            timestamp: Date.now(),
          });
        }
      },
      [
        apiCallsStore,
        blockEndTimeStore,
        blockDurationStore,
        dispatch,
        isBlockedStore,
        rateLimitStore,
      ]
    )
  );

  useApiBlockingActionHandler(
    'markApiCallSuccess',
    useCallback(
      async (payload) => {
        apiCallsStore.setValue(
          updateApiCall(apiCallsStore.getValue(), payload.callId, {
            status: 'success',
            responseTime: payload.responseTime,
            timestamp: payload.timestamp,
          })
        );
        metricsStore.setValue(
          recordSuccessfulRequest(metricsStore.getValue(), payload.responseTime)
        );
      },
      [apiCallsStore, metricsStore]
    )
  );

  useApiBlockingActionHandler(
    'markApiCallBlocked',
    useCallback(
      async (payload) => {
        apiCallsStore.setValue(
          updateApiCall(apiCallsStore.getValue(), payload.callId, {
            status: 'blocked',
            reason: payload.reason,
            timestamp: payload.timestamp,
          })
        );
        metricsStore.setValue(recordBlockedRequest(metricsStore.getValue()));
      },
      [apiCallsStore, metricsStore]
    )
  );

  useApiBlockingActionHandler(
    'markApiCallError',
    useCallback(
      async (payload) => {
        apiCallsStore.setValue(
          updateApiCall(apiCallsStore.getValue(), payload.callId, {
            status: 'error',
            reason: payload.error,
            timestamp: payload.timestamp,
          })
        );
        metricsStore.setValue(recordErroredRequest(metricsStore.getValue()));
      },
      [apiCallsStore, metricsStore]
    )
  );

  useApiBlockingActionHandler(
    'startBlocking',
    useCallback(
      async (payload) => {
        isBlockedStore.setValue(true);
        blockedActionStore.setValue(payload.action);
        blockEndTimeStore.setValue(payload.timestamp + payload.duration);

        if (blockingTimeoutRef.current) {
          clearTimeout(blockingTimeoutRef.current);
        }

        blockingTimeoutRef.current = setTimeout(() => {
          dispatch('endBlocking', {
            action: payload.action,
            timestamp: Date.now(),
          });
        }, payload.duration);
      },
      [blockedActionStore, blockEndTimeStore, dispatch, isBlockedStore]
    )
  );

  useApiBlockingActionHandler(
    'endBlocking',
    useCallback(async () => {
      isBlockedStore.setValue(false);
      blockedActionStore.setValue(null);
      blockEndTimeStore.setValue(null);
    }, [blockedActionStore, blockEndTimeStore, isBlockedStore])
  );

  useApiBlockingActionHandler(
    'setBlockDuration',
    useCallback(
      async (payload) => {
        blockDurationStore.setValue(payload.duration);
      },
      [blockDurationStore]
    )
  );

  useApiBlockingActionHandler(
    'clearHistory',
    useCallback(async () => {
      apiCallsStore.setValue([]);
      metricsStore.setValue({
        totalRequests: 0,
        successfulRequests: 0,
        blockedRequests: 0,
        errorRequests: 0,
        averageResponseTime: 0,
        successRate: 100,
        blockingEfficiency: 0,
        currentLoadLevel: 'low',
      });
    }, [apiCallsStore, metricsStore])
  );

  useApiBlockingActionHandler(
    'configureRateLimit',
    useCallback(
      async (payload) => {
        rateLimitStore.setValue({
          ...rateLimitStore.getValue(),
          ...payload,
          currentWindow: Date.now(),
          requestsInWindow: 0,
        });
      },
      [rateLimitStore]
    )
  );

  return <>{children}</>;
}
