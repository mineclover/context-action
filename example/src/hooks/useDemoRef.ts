import { createRefContext } from '@context-action/react';

// RefContext for DOM elements
type DemoRefs = {
  interactive: HTMLDivElement;
  conditional: HTMLDivElement;
  delayedElement: HTMLDivElement;
  memoTest: HTMLDivElement;
  onMountElement: HTMLDivElement;
  conditionalElement: HTMLDivElement;
};

const {
  Provider: DemoRefsProvider,
  useRefHandler: useDemoRef,
  useWaitForRefs: useWaitForDemoRefs
} = createRefContext<DemoRefs>('Demo');

export { DemoRefsProvider, useDemoRef, useWaitForDemoRefs };