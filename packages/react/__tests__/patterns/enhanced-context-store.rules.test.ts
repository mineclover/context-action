import {
  activityAfterClick,
  activityAfterMovement,
  calculateMovement,
  clicksAfterClick,
  computedMetricsFromState,
} from '../../../../example/src/pages/performance/mouse-events/enhanced-context-store/business/enhanced-mouse-event-rules';
import type {
  ActivityStatus,
  ComputedMetrics,
  MouseClicks,
  MouseMovement,
  MousePosition,
} from '../../../../example/src/pages/performance/mouse-events/enhanced-context-store/contexts/EnhancedContextStoreContexts';

describe('Enhanced context-store mouse business rules', () => {
  it('calculates movement without mutating the previous store snapshot', () => {
    const previousPosition: MousePosition = { x: 0, y: 0, timestamp: 100 };
    const currentMovement: MouseMovement = {
      velocity: 0,
      distance: 10,
      isMoving: false,
      path: [{ x: 0, y: 0, timestamp: 100 }],
      moveCount: 2,
    };
    const nextPosition: MousePosition = { x: 3, y: 4, timestamp: 110 };

    expect(
      calculateMovement(previousPosition, currentMovement, nextPosition)
    ).toEqual({
      velocity: 0.5,
      distance: 15,
      isMoving: true,
      path: [
        { x: 0, y: 0, timestamp: 100 },
        { x: 3, y: 4, timestamp: 110 },
      ],
      moveCount: 3,
    });
    expect(currentMovement.distance).toBe(10);
    expect(
      calculateMovement(
        { x: -999, y: -999, timestamp: 0 },
        currentMovement,
        nextPosition
      )
    ).toBeNull();
  });

  it('keeps click history bounded and filters recent activity by time', () => {
    const clicks: MouseClicks = {
      total: 2,
      history: [],
      recent: [
        { x: 1, y: 1, button: 0, timestamp: 1000 },
        { x: 2, y: 2, button: 0, timestamp: 2500 },
      ],
    };
    const click = { x: 3, y: 3, button: 0, timestamp: 4000 };

    expect(clicksAfterClick(clicks, click)).toEqual({
      total: 3,
      history: [click],
      recent: [click, { x: 2, y: 2, button: 0, timestamp: 2500 }],
    });
    expect(clicks.total).toBe(2);
  });

  it('derives activity and metrics deterministically from store snapshots', () => {
    const activity: ActivityStatus = {
      current: 'idle',
      lastActivity: 0,
      isInsideArea: false,
      sessionStartTime: 0,
    };
    const movement: MouseMovement = {
      velocity: 0.5,
      distance: 5,
      isMoving: true,
      path: [
        { x: 0, y: 0, timestamp: 0 },
        { x: 3, y: 4, timestamp: 10 },
      ],
      moveCount: 1,
    };
    const clicks: MouseClicks = {
      total: 2,
      history: [],
      recent: [],
    };
    const computed: ComputedMetrics = {
      averageVelocity: 0,
      maxVelocity: 0.25,
      totalDistance: 0,
      sessionDuration: 0,
      eventsPerSecond: 0,
    };

    expect(activityAfterMovement(activity, 10, movement.velocity)).toEqual({
      ...activity,
      current: 'moving',
      lastActivity: 10,
      isInsideArea: true,
    });
    expect(activityAfterClick(activity, 20)).toEqual({
      ...activity,
      current: 'clicking',
      lastActivity: 20,
    });
    expect(
      computedMetricsFromState(movement, activity, clicks, computed, 1000)
    ).toEqual({
      averageVelocity: 0.5,
      maxVelocity: 0.5,
      totalDistance: 5,
      sessionDuration: 1,
      eventsPerSecond: 3,
    });
  });
});
