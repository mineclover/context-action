import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createRefContext,
  createStoreContext,
} from '@context-action/react';

export interface UseRefMountStateStores {
  renderCounts: Record<string, number>;
  activeTests: Record<string, boolean>;
}

export interface UseRefMountStateActions extends ActionPayloadMap {
  incrementRenderCount: { componentId: string };
  toggleTest: { testId: string };
  resetRenderCounts: void;
}

export type UseRefMountStateRefs = {
  dynamicElement: HTMLDivElement;
  conditionalElement: HTMLDivElement;
  delayedElement: HTMLDivElement;
  toggleElement: HTMLDivElement;
};

export const { Provider: TestStoreProvider, useStore: useTestStore } =
  createStoreContext<UseRefMountStateStores>('UseRefMountStateTest-stores', {
    renderCounts: {
      initialValue: {},
      description: 'Render counts keyed by the registered ref name.',
    },
    activeTests: {
      initialValue: {
        dynamic: false,
        conditional: false,
        delayed: false,
        toggle: true,
      },
      description: 'Visibility state for each ref mount test.',
    },
  });

export const {
  Provider: TestActionProvider,
  useActionDispatch: useTestAction,
  useActionHandler: useTestActionHandler,
} = createActionContext<UseRefMountStateActions>(
  'UseRefMountStateTest-actions'
);

export const {
  Provider: TestRefsProvider,
  useRefHandler: useTestRef,
  useRefMountState: useTestRefMountState,
  useOnMountStateChange: useTestOnMountStateChange,
  useRefMountChecker: useTestRefMountChecker,
} = createRefContext<UseRefMountStateRefs>('UseRefMountStateTest-refs');
