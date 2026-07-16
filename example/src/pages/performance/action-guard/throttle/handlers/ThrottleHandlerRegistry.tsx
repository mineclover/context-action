import { useCallback, useEffect, useRef } from 'react';
import {
  appendEventLog,
  appendPerformanceHistory,
  createInitialPerformanceMetrics,
  recordProcessedEvent,
  type ThrottleEventType,
} from '../business/throttle-rules';
import {
  useThrottleAction,
  useThrottleActionHandler,
  useThrottleStore,
} from '../contexts/ThrottleContexts';

interface SchedulerState {
  latestValue: string;
  lastExecuted: number;
  timeout: ReturnType<typeof setTimeout> | null;
}

const createSchedulerState = (): SchedulerState => ({
  latestValue: '',
  lastExecuted: 0,
  timeout: null,
});

export function ThrottleHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useThrottleAction();
  const autoTestIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const schedulerRef = useRef<Record<ThrottleEventType, SchedulerState>>({
    normal: createSchedulerState(),
    throttle: createSchedulerState(),
    debounce: createSchedulerState(),
    leading: createSchedulerState(),
    trailing: createSchedulerState(),
  });

  const eventLogsStore = useThrottleStore('eventLogs');
  const isAutoTestingStore = useThrottleStore('isAutoTesting');
  const configStore = useThrottleStore('config');
  const metricsStore = useThrottleStore('metrics');
  const performanceHistoryStore = useThrottleStore('performanceHistory');

  const emitProcessEvent = useCallback(
    (type: ThrottleEventType, value: string, delay?: number) => {
      dispatch('processEvent', {
        type,
        value,
        timestamp: Date.now(),
        delay,
      });
    },
    [dispatch]
  );

  const clearSchedulers = useCallback(() => {
    Object.values(schedulerRef.current).forEach((scheduler) => {
      if (scheduler.timeout) {
        clearTimeout(scheduler.timeout);
        scheduler.timeout = null;
      }
      scheduler.latestValue = '';
      scheduler.lastExecuted = 0;
    });
  }, []);

  const scheduleTimedEvent = useCallback(
    (
      type: ThrottleEventType,
      value: string,
      delay: number,
      options: { leading: boolean; trailing: boolean }
    ) => {
      const scheduler = schedulerRef.current[type];
      const now = Date.now();
      scheduler.latestValue = value;

      if (options.leading && now - scheduler.lastExecuted >= delay) {
        emitProcessEvent(type, value, delay);
        scheduler.lastExecuted = now;
        return;
      }

      if (!options.trailing) return;

      if (scheduler.timeout) {
        clearTimeout(scheduler.timeout);
      }

      const wait = options.leading
        ? Math.max(delay - (now - scheduler.lastExecuted), 0)
        : delay;

      scheduler.timeout = setTimeout(() => {
        emitProcessEvent(type, scheduler.latestValue, delay);
        scheduler.lastExecuted = Date.now();
        scheduler.timeout = null;
      }, wait);
    },
    [emitProcessEvent]
  );

  useThrottleActionHandler(
    'inputEvent',
    useCallback(
      async (payload) => {
        const config = configStore.getValue();

        emitProcessEvent('normal', payload.value);
        scheduleTimedEvent('throttle', payload.value, config.throttleDelay, {
          leading: true,
          trailing: true,
        });
        scheduleTimedEvent('debounce', payload.value, config.debounceDelay, {
          leading: false,
          trailing: true,
        });
        scheduleTimedEvent('leading', payload.value, config.leadingDelay, {
          leading: true,
          trailing: false,
        });
        scheduleTimedEvent('trailing', payload.value, config.trailingDelay, {
          leading: false,
          trailing: true,
        });
      },
      [configStore, emitProcessEvent, scheduleTimedEvent]
    )
  );

  useThrottleActionHandler(
    'processEvent',
    useCallback(
      async (payload) => {
        const startTime = performance.now();
        const processingTime = Math.random() * 10 + 5;
        await new Promise((resolve) => setTimeout(resolve, processingTime));
        const executionTime = performance.now() - startTime;
        const eventLog = {
          id: `${payload.type}-${payload.timestamp}-${Math.random()}`,
          type: payload.type,
          timestamp: payload.timestamp,
          value: payload.value,
          delay: payload.delay,
          executionTime,
        };

        eventLogsStore.setValue(
          appendEventLog(eventLogsStore.getValue(), eventLog)
        );
        metricsStore.setValue(
          recordProcessedEvent(
            metricsStore.getValue(),
            payload.type,
            executionTime
          )
        );
      },
      [eventLogsStore, metricsStore]
    )
  );

  useThrottleActionHandler(
    'clearLogs',
    useCallback(async () => {
      eventLogsStore.setValue([]);
      metricsStore.setValue(createInitialPerformanceMetrics());
      performanceHistoryStore.setValue([]);
    }, [eventLogsStore, metricsStore, performanceHistoryStore])
  );

  useThrottleActionHandler(
    'updateConfig',
    useCallback(
      async (payload) => {
        configStore.setValue(payload);
      },
      [configStore]
    )
  );

  useThrottleActionHandler(
    'runPerformanceTest',
    useCallback(
      async (payload) => {
        const startTime = performance.now();

        for (let index = 0; index < payload.iterations; index += 1) {
          emitProcessEvent(
            payload.type,
            `Test Event ${index}`,
            payload.interval
          );

          if (payload.interval > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, payload.interval)
            );
          }
        }

        const totalDuration = performance.now() - startTime;
        performanceHistoryStore.setValue(
          appendPerformanceHistory(performanceHistoryStore.getValue(), {
            timestamp: Date.now(),
            type: payload.type,
            duration: totalDuration,
            operations: payload.iterations,
            efficiency: (payload.iterations / totalDuration) * 1000,
          })
        );
      },
      [emitProcessEvent, performanceHistoryStore]
    )
  );

  useThrottleActionHandler(
    'startAutoTest',
    useCallback(
      async (payload) => {
        if (autoTestIntervalRef.current) {
          clearInterval(autoTestIntervalRef.current);
        }

        isAutoTestingStore.setValue(true);
        let eventCount = 0;
        autoTestIntervalRef.current = setInterval(() => {
          dispatch('inputEvent', { value: `Auto Event ${eventCount}` });
          eventCount += 1;

          if (eventCount >= payload.duration) {
            dispatch('stopAutoTest');
          }
        }, payload.frequency);
      },
      [dispatch, isAutoTestingStore]
    )
  );

  useThrottleActionHandler(
    'stopAutoTest',
    useCallback(async () => {
      isAutoTestingStore.setValue(false);
      if (autoTestIntervalRef.current) {
        clearInterval(autoTestIntervalRef.current);
        autoTestIntervalRef.current = null;
      }
    }, [isAutoTestingStore])
  );

  useEffect(
    () => () => {
      if (autoTestIntervalRef.current) {
        clearInterval(autoTestIntervalRef.current);
      }
      clearSchedulers();
    },
    [clearSchedulers]
  );

  return <>{children}</>;
}
