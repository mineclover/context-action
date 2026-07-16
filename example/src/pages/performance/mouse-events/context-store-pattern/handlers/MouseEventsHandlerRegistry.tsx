import React from 'react';
import {
  computeActivityStatus,
  computeAverageVelocity,
  computeHasActivity,
  computeRecentClickCount,
  computeValidPath,
  updateComputedValuesFromStores,
  useMouseEventsActionHandler,
  useMouseEventsStore,
} from '../context/MouseEventsContext';

export function MouseEventsHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const positionStore = useMouseEventsStore('position');
  const movementStore = useMouseEventsStore('movement');
  const clicksStore = useMouseEventsStore('clicks');
  const computedStore = useMouseEventsStore('computed');
  const performanceStore = useMouseEventsStore('performance');

  useMouseEventsActionHandler('mouseMove', async (payload) => {
    const currentPosition = positionStore.getValue();
    positionStore.setValue({
      current: { x: payload.x, y: payload.y },
      previous: currentPosition.current,
      isInsideArea: true,
    });

    const currentMovement = movementStore.getValue();
    const nextPath = [
      ...currentMovement.path.slice(-19),
      { x: payload.x, y: payload.y },
    ];
    const deltaTime = currentMovement.lastMoveTime
      ? payload.timestamp - currentMovement.lastMoveTime
      : 0;
    const deltaX = payload.x - currentPosition.current.x;
    const deltaY = payload.y - currentPosition.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = deltaTime > 0 ? distance / deltaTime : 0;
    const nextMovement = {
      moveCount: currentMovement.moveCount + 1,
      isMoving: true,
      velocity,
      lastMoveTime: payload.timestamp,
      path: nextPath,
    };

    movementStore.setValue(nextMovement);

    const currentClicks = clicksStore.getValue();
    const validPath = computeValidPath(nextMovement.path);
    const recentClickCount = computeRecentClickCount(currentClicks.history);
    const averageVelocity = computeAverageVelocity(validPath);
    const lastClickTime = currentClicks.history[0]?.timestamp || null;

    computedStore.setValue({
      validPath,
      recentClickCount,
      averageVelocity,
      totalEvents: nextMovement.moveCount + currentClicks.count,
      activityStatus: computeActivityStatus(
        nextMovement.isMoving,
        recentClickCount,
        nextMovement.velocity,
        lastClickTime
      ),
      hasActivity: computeHasActivity(
        nextMovement.moveCount,
        currentClicks.count
      ),
    });
  });

  useMouseEventsActionHandler('mouseClick', async (payload) => {
    const currentClicks = clicksStore.getValue();
    const nextClicks = {
      count: currentClicks.count + 1,
      history: [
        { x: payload.x, y: payload.y, timestamp: payload.timestamp },
        ...currentClicks.history.slice(0, 9),
      ],
    };

    clicksStore.setValue(nextClicks);
    computedStore.setValue(
      updateComputedValuesFromStores(movementStore.getValue(), nextClicks)
    );
  });

  useMouseEventsActionHandler('mouseEnter', async () => {
    positionStore.setValue({
      ...positionStore.getValue(),
      isInsideArea: true,
    });
  });

  useMouseEventsActionHandler('mouseLeave', async () => {
    positionStore.setValue({
      ...positionStore.getValue(),
      isInsideArea: false,
    });

    const currentMovement = movementStore.getValue();
    movementStore.setValue({
      ...currentMovement,
      isMoving: false,
      velocity: 0,
    });

    const currentClicks = clicksStore.getValue();
    const recentClickCount = computeRecentClickCount(currentClicks.history);
    const lastClickTime = currentClicks.history[0]?.timestamp || null;
    computedStore.setValue({
      ...computedStore.getValue(),
      activityStatus: computeActivityStatus(
        false,
        recentClickCount,
        0,
        lastClickTime
      ),
    });
  });

  useMouseEventsActionHandler('moveEnd', async () => {
    const currentMovement = movementStore.getValue();
    if (!currentMovement.isMoving) return;

    movementStore.setValue({
      ...currentMovement,
      isMoving: false,
      velocity: 0,
    });

    const currentClicks = clicksStore.getValue();
    const recentClickCount = computeRecentClickCount(currentClicks.history);
    const lastClickTime = currentClicks.history[0]?.timestamp || null;
    computedStore.setValue({
      ...computedStore.getValue(),
      activityStatus: computeActivityStatus(
        false,
        recentClickCount,
        0,
        lastClickTime
      ),
    });
  });

  useMouseEventsActionHandler('resetMouseState', async () => {
    positionStore.setValue({
      current: { x: -999, y: -999 },
      previous: { x: -999, y: -999 },
      isInsideArea: false,
    });
    movementStore.setValue({
      moveCount: 0,
      isMoving: false,
      velocity: 0,
      lastMoveTime: null,
      path: [],
    });
    clicksStore.setValue({ count: 0, history: [] });
    computedStore.setValue({
      validPath: [],
      recentClickCount: 0,
      averageVelocity: 0,
      totalEvents: 0,
      activityStatus: 'idle',
      hasActivity: false,
    });
    performanceStore.setValue({
      containerRenderCount: 0,
      totalRenderCount: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      sessionStartTime: Date.now(),
    });
  });

  return <>{children}</>;
}
