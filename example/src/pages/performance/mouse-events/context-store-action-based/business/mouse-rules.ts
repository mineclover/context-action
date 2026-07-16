import type {
  ClickHistory,
  MousePosition,
} from '../contexts/MouseActionContexts';

export function computeValidPath(movePath: MousePosition[]): MousePosition[] {
  return movePath.filter((point) => point.x >= 0 && point.y >= 0);
}

export function computeRecentClickCount(clickHistory: ClickHistory[]): number {
  const fiveSecondsAgo = Date.now() - 5000;
  return clickHistory.filter((click) => click.timestamp > fiveSecondsAgo)
    .length;
}

export function computeAverageVelocity(validPath: MousePosition[]): number {
  if (validPath.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < Math.min(validPath.length, 10); i++) {
    const prev = validPath[i - 1];
    const curr = validPath[i];
    const distance = Math.sqrt(
      (curr!.x - prev!.x) ** 2 + (curr!.y - prev!.y) ** 2
    );
    totalDistance += distance;
  }

  return totalDistance / Math.min(validPath.length - 1, 9);
}

export function computeActivityStatus(
  isMoving: boolean,
  recentClickCount: number,
  velocity: number,
  lastClickTime: number | null
): 'idle' | 'moving' | 'clicking' {
  const recentClickThreshold = Date.now() - 500;

  if (lastClickTime && lastClickTime > recentClickThreshold) {
    return 'clicking';
  }

  if (isMoving && velocity > 0.1) {
    return 'moving';
  }

  return 'idle';
}

export function computeHasActivity(
  moveCount: number,
  clickCount: number
): boolean {
  return moveCount > 0 || clickCount > 0;
}
