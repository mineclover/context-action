import type {
  ActionGuardMouseClick,
  ActionGuardMousePoint,
} from '../contexts/ActionGuardMouseEventsContexts';

export function appendMouseClick(
  clicks: ActionGuardMouseClick[],
  click: ActionGuardMouseClick
): ActionGuardMouseClick[] {
  return [...clicks, click].slice(-20);
}

export function appendMousePathPoint(
  path: ActionGuardMousePoint[],
  point: ActionGuardMousePoint
): ActionGuardMousePoint[] {
  return [...path, point].slice(-100);
}

export function resetMouseClicks(): ActionGuardMouseClick[] {
  return [];
}

export function resetMousePath(): ActionGuardMousePoint[] {
  return [];
}
