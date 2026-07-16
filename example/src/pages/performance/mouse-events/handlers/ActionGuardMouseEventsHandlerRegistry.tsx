import React, { useCallback } from 'react';
import {
  appendMouseClick,
  appendMousePathPoint,
  resetMouseClicks,
  resetMousePath,
} from '../business/action-guard-mouse-event-rules';
import {
  useActionGuardMouseEventsActionHandler,
  useActionGuardMouseEventsStore,
} from '../contexts/ActionGuardMouseEventsContexts';

export function ActionGuardMouseEventsHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const mousePositionStore = useActionGuardMouseEventsStore('mousePosition');
  const mouseClicksStore = useActionGuardMouseEventsStore('mouseClicks');
  const mousePathStore = useActionGuardMouseEventsStore('mousePath');
  const trackingEnabledStore =
    useActionGuardMouseEventsStore('trackingEnabled');
  const pathRecordingStore = useActionGuardMouseEventsStore('pathRecording');

  useActionGuardMouseEventsActionHandler(
    'updateMousePosition',
    useCallback(
      async (payload) => {
        mousePositionStore.setValue(payload);
      },
      [mousePositionStore]
    )
  );

  useActionGuardMouseEventsActionHandler(
    'recordMouseClick',
    useCallback(
      async (payload) => {
        mouseClicksStore.setValue(
          appendMouseClick(mouseClicksStore.getValue(), payload)
        );
      },
      [mouseClicksStore]
    )
  );

  useActionGuardMouseEventsActionHandler(
    'recordMousePathPoint',
    useCallback(
      async (payload) => {
        mousePathStore.setValue(
          appendMousePathPoint(mousePathStore.getValue(), payload.point)
        );
      },
      [mousePathStore]
    )
  );

  useActionGuardMouseEventsActionHandler(
    'clearMouseData',
    useCallback(async () => {
      mouseClicksStore.setValue(resetMouseClicks());
      mousePathStore.setValue(resetMousePath());
    }, [mouseClicksStore, mousePathStore])
  );

  useActionGuardMouseEventsActionHandler(
    'clearMousePath',
    useCallback(async () => {
      mousePathStore.setValue(resetMousePath());
    }, [mousePathStore])
  );

  useActionGuardMouseEventsActionHandler(
    'setTrackingMode',
    useCallback(
      async (payload) => {
        trackingEnabledStore.setValue(payload.enabled);
      },
      [trackingEnabledStore]
    )
  );

  useActionGuardMouseEventsActionHandler(
    'setPathRecording',
    useCallback(
      async (payload) => {
        pathRecordingStore.setValue(payload.enabled);
      },
      [pathRecordingStore]
    )
  );

  return <>{children}</>;
}
