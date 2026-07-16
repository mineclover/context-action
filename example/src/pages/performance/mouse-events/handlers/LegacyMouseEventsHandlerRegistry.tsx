import React, { useCallback } from 'react';
import {
  appendMouseEventLog,
  createMouseEventLogEntry,
  incrementClickCount,
  setHoverZone,
} from '../business/legacy-mouse-event-rules';
import {
  useBasicMouseActionHandler,
  useBasicMouseStore,
} from '../contexts/LegacyMouseEventsContexts';

export function LegacyMouseEventsHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const eventLogStore = useBasicMouseStore('eventLog');
  const mousePositionStore = useBasicMouseStore('mousePosition');
  const hoverZonesStore = useBasicMouseStore('hoverZones');
  const clickCountStore = useBasicMouseStore('clickCount');

  const appendLog = useCallback(
    (entry: Parameters<typeof appendMouseEventLog>[1], maxEntries?: number) => {
      eventLogStore.setValue(
        appendMouseEventLog(eventLogStore.getValue(), entry, { maxEntries })
      );
    },
    [eventLogStore]
  );

  useBasicMouseActionHandler(
    'handleMouseClick',
    useCallback(
      async (payload) => {
        const timestamp = Date.now();
        appendLog(
          createMouseEventLogEntry({
            id: `click_${timestamp}`,
            type: 'Click',
            details: `${payload.button} at (${payload.x}, ${payload.y}) on ${payload.target}`,
            timestamp,
          })
        );
        clickCountStore.setValue(
          incrementClickCount(clickCountStore.getValue())
        );
      },
      [appendLog, clickCountStore]
    )
  );

  useBasicMouseActionHandler(
    'handleMouseMove',
    useCallback(
      async (payload) => {
        mousePositionStore.setValue({ x: payload.x, y: payload.y });

        if (Math.random() < 0.1) {
          const timestamp = Date.now();
          appendLog(
            createMouseEventLogEntry({
              id: `move_${timestamp}`,
              type: 'Move',
              details: `to (${payload.x}, ${payload.y})`,
              timestamp,
            }),
            20
          );
        }
      },
      [appendLog, mousePositionStore]
    )
  );

  useBasicMouseActionHandler(
    'handleMouseEnter',
    useCallback(
      async (payload) => {
        hoverZonesStore.setValue(
          setHoverZone(hoverZonesStore.getValue(), payload.target, true)
        );
        appendLog(
          createMouseEventLogEntry({
            id: `enter_${payload.timestamp}`,
            type: 'Enter',
            details: `entered ${payload.target}`,
            timestamp: payload.timestamp,
          })
        );
      },
      [appendLog, hoverZonesStore]
    )
  );

  useBasicMouseActionHandler(
    'handleMouseLeave',
    useCallback(
      async (payload) => {
        hoverZonesStore.setValue(
          setHoverZone(hoverZonesStore.getValue(), payload.target, false)
        );
        appendLog(
          createMouseEventLogEntry({
            id: `leave_${payload.timestamp}`,
            type: 'Leave',
            details: `left ${payload.target}`,
            timestamp: payload.timestamp,
          })
        );
      },
      [appendLog, hoverZonesStore]
    )
  );

  useBasicMouseActionHandler(
    'clearEventLog',
    useCallback(async () => {
      eventLogStore.setValue([]);
      clickCountStore.setValue(0);
    }, [clickCountStore, eventLogStore])
  );

  return <>{children}</>;
}
