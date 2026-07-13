import React from 'react';
import {
  useChildACounterActions,
  useChildARemoteControlActions,
} from './useChildAHandlers';
import { useChildBTextActions } from './useChildBHandlers';
import {
  type ParentHandlerProps,
  useParentControlHandlers,
  useParentCounterHandlers,
  useParentDataHandlers,
} from './useParentHandlers';

/**
 * Registers every parent and child action handler for the foundation demo.
 * Keeping the parent and child registrations in one boundary makes the
 * page-level provider composition independent from handler orchestration.
 */
export function FoundationHandlerRegistry({
  children,
  moduleId = 'main',
}: {
  children: React.ReactNode;
  moduleId?: string;
}) {
  const parentHandlerProps: ParentHandlerProps = {
    moduleId,
    enableLogging: true,
    onCounterChange: (newValue: number) => {
      console.log(`🔄 [${moduleId}] Counter changed to:`, newValue);
    },
    onChildRegistered: (childId: string, childType: string) => {
      console.log(`🔄 [${moduleId}] Child registered:`, { childId, childType });
    },
  };

  useParentCounterHandlers(parentHandlerProps);
  useParentControlHandlers(parentHandlerProps);
  useParentDataHandlers(parentHandlerProps);

  useChildACounterActions();
  useChildARemoteControlActions();
  useChildBTextActions();

  return <>{children}</>;
}
