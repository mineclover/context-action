import type { ActionPayloadMap, ActionResultMap } from '@context-action/core';
import { createActionContext } from '@context-action/react';

export type RunMode = 'success' | 'invalid' | 'blocked';

export interface LifecycleActions extends ActionPayloadMap {
  run: { mode: RunMode };
}

export interface HandlerOutput {
  handler: string;
  status: 'passed' | 'rejected' | 'blocked' | 'completed';
  detail: string;
}

export interface LifecycleResults extends ActionResultMap<LifecycleActions> {
  run: HandlerOutput;
}

export interface TraceEntry extends HandlerOutput {
  priority: number;
  elapsedMs: number;
}

export const LifecycleContext = createActionContext<
  LifecycleActions,
  LifecycleResults
>('ActionLifecycleWorkbench');
