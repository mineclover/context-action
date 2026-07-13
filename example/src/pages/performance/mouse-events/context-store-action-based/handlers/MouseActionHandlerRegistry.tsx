/**
 * @fileoverview Context Store mouse action handler registry
 * @module MouseActionHandlerRegistry
 */

import type { Store } from '@context-action/react';
import {
  createMouseClickHandler,
  createMouseEnterHandler,
  createMouseLeaveHandler,
  createMouseMoveHandler,
  createMoveEndHandler,
  createResetHandler,
} from '../actions/MouseActionHandlers';
import {
  type MouseStateData,
  useMouseActionHandler,
} from '../stores/MouseStoreSchema';

export function MouseActionHandlerRegistry({
  mouseStateStore,
}: {
  mouseStateStore: Store<MouseStateData>;
}) {
  useMouseActionHandler('mouseMove', createMouseMoveHandler(mouseStateStore));
  useMouseActionHandler('mouseClick', createMouseClickHandler(mouseStateStore));
  useMouseActionHandler('mouseEnter', createMouseEnterHandler(mouseStateStore));
  useMouseActionHandler('mouseLeave', createMouseLeaveHandler(mouseStateStore));
  useMouseActionHandler('moveEnd', createMoveEndHandler(mouseStateStore));
  useMouseActionHandler('reset', createResetHandler(mouseStateStore));

  return null;
}
