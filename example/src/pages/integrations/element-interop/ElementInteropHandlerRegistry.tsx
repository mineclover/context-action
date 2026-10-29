/** @evidenceExclude Tier 3 imperative-handle test fixture, not a durable domain model. */

import { createActionContext, createRefContext } from '@context-action/react';
import { type ReactNode, useCallback } from 'react';

export interface CounterInput {
  readonly count: number;
}
export interface CounterRequestDetail {
  readonly next: number;
}
export interface CounterHandle {
  input: CounterInput | undefined;
  getSnapshot(): CounterInput;
  requestIncrement(): void;
}
export interface CounterBridgeProps {
  input?: CounterInput | undefined;
  onCountRequest?:
    | ((event: CustomEvent<CounterRequestDetail>) => void)
    | undefined;
}

export const counterRefs = createRefContext<{ counter: CounterHandle }>(
  'InteropRefs'
);
export const counterActions = createActionContext<{ increment: void }>(
  'InteropActions'
);

/** Same orchestration for either renderer; registration stays out of the view. */
export function ElementInteropHandlerRegistry({
  children,
}: {
  children: ReactNode;
}) {
  const target = counterRefs.useRefHandler('counter');
  counterActions.useActionHandler(
    'increment',
    useCallback(async () => {
      await target.withTarget((handle) => handle.requestIncrement());
    }, [target])
  );
  return <>{children}</>;
}
