import { useMemoizedAutoUpdateEffect } from '../../hooks/useAutoUpdateEffect';
import { useMemoizedActions } from '../../hooks/useComparisonActions';
import { useMemoizedViewState } from '../../hooks/useComparisonViewState';
import { useMemoizedHandlers } from '../../hooks/useMemoizedHandlers';
import { SafeModeWrapper } from '../SafeModeWrapper';
import { ActionButtons } from '../shared/ActionButtons';
import { MetricsDisplay } from '../shared/MetricsDisplay';

/**
 * Widget Component - Memoized Handler
 * 복잡한 로직을 가진 컴포넌트를 context-action으로 구현
 * ViewModel hooks를 조합해서 완전한 기능을 제공
 */
export function MemoizedHandlerWidget() {
  // ViewModel hooks 조합
  useMemoizedHandlers(); // 비즈니스 로직 등록
  useMemoizedAutoUpdateEffect(); // 자동 업데이트 효과 (memoized context 전용)
  const viewState = useMemoizedViewState(); // View state 획득
  const actions = useMemoizedActions(); // Action functions 획득

  // View state 변환
  const metricsData = {
    counter: viewState.counter,
    calcResult: viewState.calcResult,
    renderCount: viewState.renderMetrics.count,
    renderRate: viewState.renderMetrics.rate,
    renderRateStatus: viewState.renderMetrics.status,
  };

  const dataStatus = {
    heavyData: viewState.heavyData,
    memoryData: viewState.memoryData,
    processedResults: viewState.processedResults,
  };

  return (
    <SafeModeWrapper
      componentName="MemoizedHandler"
      maxRenderRate={15}
      checkInterval={1000}
    >
      <div className="space-y-4">
        <MetricsDisplay
          title="Memoized Handlers"
          variant="memoized"
          metrics={metricsData}
          dataStatus={dataStatus}
        />
        <ActionButtons variant="memoized" actions={actions} />
      </div>
    </SafeModeWrapper>
  );
}
