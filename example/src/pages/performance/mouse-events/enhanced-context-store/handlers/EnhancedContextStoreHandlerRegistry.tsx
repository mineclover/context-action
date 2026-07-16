import React from 'react';
import { useMouseActionHandler } from '../contexts/EnhancedContextStoreContexts';
import { useMouseEventsLogic } from '../hooks/useMouseEventsLogic';

/**
 * Enhanced Context Store 도메인의 handler 등록 경계.
 *
 * ViewModel hook은 handler 구현과 mount 상태를 제공하고, 이 Registry가
 * Context-Action pipeline에 semantic action을 등록한다.
 */
export function EnhancedContextStoreHandlerRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const { handlers } = useMouseEventsLogic();

  useMouseActionHandler('updatePosition', handlers.updatePosition);
  useMouseActionHandler('recordClick', handlers.recordClick);
  useMouseActionHandler('enterArea', handlers.enterArea);
  useMouseActionHandler('leaveArea', handlers.leaveArea);
  useMouseActionHandler('reset', handlers.reset);

  return <>{children}</>;
}
