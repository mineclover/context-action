import type { CoreBasicsAsyncStatus } from '../contexts/CoreBasicsContexts';

export function updateCount(current: number, delta: number): number {
  return current + delta;
}

export function createRandomLogMessage(random = Math.random): string {
  const adjectives = ['Amazing', 'Brilliant', 'Creative', 'Dynamic', 'Elegant'];
  const nouns = ['Action', 'Event', 'Process', 'Operation', 'Task'];
  const colors = ['Red', 'Blue', 'Green', 'Purple', 'Orange'];
  const randomAdjective =
    adjectives[Math.floor(random() * adjectives.length)] ?? adjectives[0];
  const randomNoun = nouns[Math.floor(random() * nouns.length)] ?? nouns[0];
  const randomColor = colors[Math.floor(random() * colors.length)] ?? colors[0];
  const randomNumber = Math.floor(random() * 1000) + 1;

  return `${randomAdjective} ${randomColor} ${randomNoun} #${randomNumber}`;
}

export function markAsyncStarted(
  status: CoreBasicsAsyncStatus
): CoreBasicsAsyncStatus {
  return {
    isRunning: true,
    runningCount: status.runningCount + 1,
  };
}

export function markAsyncFinished(
  status: CoreBasicsAsyncStatus
): CoreBasicsAsyncStatus {
  const runningCount = Math.max(0, status.runningCount - 1);
  return { isRunning: runningCount > 0, runningCount };
}
