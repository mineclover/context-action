/**
 * @fileoverview Context Store Mouse Events Wrapper - Provider 래퍼
 *
 * Context Store 패턴을 위한 Provider 래퍼 컴포넌트
 */

import { memo } from 'react';
import { ContextStoreMouseEventsContainer } from './containers/ContextStoreMouseEventsContainer';
import { MouseActionProvider } from './stores/MouseStoreSchema';

/**
 * Context Store Provider들과 함께 마우스 이벤트 컴포넌트를 래핑
 */
const ContextStoreMouseEventsWrapperComponent = () => {
  console.log(
    '🏪 ContextStoreMouseEventsWrapper render at',
    new Date().toISOString()
  );

  return (
    <MouseActionProvider registryId="context-store-mouse-events">
      <ContextStoreMouseEventsContainer />
    </MouseActionProvider>
  );
};

export const ContextStoreMouseEventsWrapper = memo(
  ContextStoreMouseEventsWrapperComponent
);
