import type { UseRefMountStateStores } from '../contexts/UseRefMountStateContexts';

export function incrementRenderCount(
  renderCounts: UseRefMountStateStores['renderCounts'],
  componentId: string
): UseRefMountStateStores['renderCounts'] {
  return {
    ...renderCounts,
    [componentId]: (renderCounts[componentId] ?? 0) + 1,
  };
}

export function toggleTest(
  activeTests: UseRefMountStateStores['activeTests'],
  testId: string
): UseRefMountStateStores['activeTests'] {
  return {
    ...activeTests,
    [testId]: !activeTests[testId],
  };
}

export function resetRenderCounts(): UseRefMountStateStores['renderCounts'] {
  return {};
}
