import React from 'react';
import {
  useChildACounterActions,
  useChildARemoteControlActions,
} from './useChildAHandlers';
import { useChildBTextActions } from './useChildBHandlers';

/** Registers all Child A and Child B action handlers for the foundation demo. */
export function ChildHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  useChildACounterActions();
  useChildARemoteControlActions();
  useChildBTextActions();

  return <>{children}</>;
}

