import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createStoreContext } from '@context-action/react';

export interface ProviderActions extends ActionPayloadMap {
  updateCounter: { value: number };
  resetCounter: void;
  updateMessage: { text: string };
  resetMessage: void;
  logActivity: { activity: string };
}

export interface ProviderStores {
  counter: number;
  message: string;
  activities: string[];
}

export const ProviderActionContext = createActionContext<ProviderActions>(
  'ReactProviderDemo-actions'
);
export const ProviderStoreContext = createStoreContext<ProviderStores>(
  'ReactProviderDemo-stores',
  {
    counter: { initialValue: 0 },
    message: { initialValue: 'Hello from Provider!' },
    activities: { initialValue: [] as string[], strategy: 'reference' },
  }
);
