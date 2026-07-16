import type {
  ActivityStatus,
  ComputedMetrics,
  MouseClick,
  MouseClicks,
  MouseMovement,
  MousePosition,
} from '../contexts/EnhancedContextStoreContexts';

export function hasMousePosition(position: MousePosition) {
  return position.x !== -999 && position.y !== -999;
}

export function calculateMovement(
  previousPosition: MousePosition,
  currentMovement: MouseMovement,
  nextPosition: MousePosition
): MouseMovement | null {
  if (!hasMousePosition(previousPosition)) return null;

  const deltaX = nextPosition.x - previousPosition.x;
  const deltaY = nextPosition.y - previousPosition.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const deltaTime = nextPosition.timestamp - previousPosition.timestamp;
  const velocity = deltaTime > 0 ? distance / deltaTime : 0;

  return {
    velocity,
    distance: currentMovement.distance + distance,
    isMoving: velocity > 0.1,
    path: [
      ...currentMovement.path,
      {
        x: nextPosition.x,
        y: nextPosition.y,
        timestamp: nextPosition.timestamp,
      },
    ].slice(-50),
    moveCount: currentMovement.moveCount + 1,
  };
}

export function activityAfterMovement(
  currentActivity: ActivityStatus,
  timestamp: number,
  velocity: number
): ActivityStatus {
  return {
    ...currentActivity,
    current: velocity > 0.1 ? 'moving' : 'idle',
    lastActivity: timestamp,
    isInsideArea: true,
  };
}

export function activityAfterClick(
  currentActivity: ActivityStatus,
  timestamp: number
): ActivityStatus {
  return {
    ...currentActivity,
    current: 'clicking',
    lastActivity: timestamp,
  };
}

export function clicksAfterClick(
  currentClicks: MouseClicks,
  click: MouseClick
): MouseClicks {
  return {
    total: currentClicks.total + 1,
    history: [click, ...currentClicks.history].slice(0, 100),
    recent: [
      click,
      ...currentClicks.recent.filter(
        (recentClick) => click.timestamp - recentClick.timestamp <= 2000
      ),
    ].slice(0, 10),
  };
}

export function computedMetricsFromState(
  movement: MouseMovement,
  activity: ActivityStatus,
  clicks: MouseClicks,
  currentComputed: ComputedMetrics,
  now: number
): ComputedMetrics {
  const sessionDuration = (now - activity.sessionStartTime) / 1000;
  const totalEvents = movement.moveCount + clicks.total;
  const averageVelocity =
    movement.path.length > 1
      ? movement.path.reduce((sum, point, index, path) => {
          if (index === 0) return sum;
          const previous = path[index - 1];
          const distance = Math.sqrt(
            (point.x - previous!.x) ** 2 + (point.y - previous!.y) ** 2
          );
          const deltaTime = point.timestamp - previous!.timestamp;
          return sum + (deltaTime > 0 ? distance / deltaTime : 0);
        }, 0) /
        (movement.path.length - 1)
      : 0;

  return {
    averageVelocity,
    maxVelocity: Math.max(currentComputed.maxVelocity, movement.velocity),
    totalDistance: movement.distance,
    sessionDuration,
    eventsPerSecond: sessionDuration > 0 ? totalEvents / sessionDuration : 0,
  };
}
