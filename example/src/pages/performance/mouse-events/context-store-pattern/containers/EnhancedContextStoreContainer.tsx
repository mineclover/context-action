/**
 * @fileoverview Enhanced Context Store Container - 향상된 Context Store 패턴
 *
 * 개별 stores를 최대한 활용하여 최적화된 Context Store 패턴을 구현
 */

import { EnhancedContextStoreView } from '../components/EnhancedContextStoreView';
import { MouseEventsProvider } from '../context/MouseEventsContext';

/**
 * 향상된 Context Store 기반 마우스 이벤트 Container - Simplified
 */
const EnhancedContextStoreContainerInner = () => {
  console.log(
    '🚀 EnhancedContextStoreContainer render at',
    new Date().toISOString()
  );

  return (
    <div>
      <EnhancedContextStoreView />
    </div>
  );
};

/**
 * 향상된 Context Store 기반 마우스 이벤트 컨테이너 (Provider 포함)
 */
export const EnhancedContextStoreContainer = () => {
  return (
    <MouseEventsProvider>
      <EnhancedContextStoreContainerInner />
    </MouseEventsProvider>
  );
};
