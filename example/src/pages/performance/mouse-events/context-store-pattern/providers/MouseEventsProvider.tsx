import React from 'react';
import {
  MouseEventsActionProvider,
  MouseEventsStores,
} from '../contexts/MouseEventsContexts';
import { MouseEventsHandlerRegistry } from '../handlers/MouseEventsHandlerRegistry';

export function MouseEventsProvider({
  children,
  registryId,
}: {
  children: React.ReactNode;
  registryId?: string;
}) {
  return (
    <MouseEventsActionProvider>
      <MouseEventsStores.Provider registryId={registryId}>
        <MouseEventsHandlerRegistry>{children}</MouseEventsHandlerRegistry>
      </MouseEventsStores.Provider>
    </MouseEventsActionProvider>
  );
}
