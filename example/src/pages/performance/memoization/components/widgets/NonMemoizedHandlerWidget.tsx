import { useNonMemoizedAutoUpdateEffect } from '../../hooks/useAutoUpdateEffect';
import { useNonMemoizedActions } from '../../hooks/useComparisonActions';
import { useNonMemoizedViewState } from '../../hooks/useComparisonViewState';
import { SafeModeWrapper } from '../SafeModeWrapper';
import { ActionButtons } from '../shared/ActionButtons';
import { MetricsDisplay } from '../shared/MetricsDisplay';

/**
 * Widget Component - Non-Memoized Handler
 * 복잡한 로직을 가진 컴포넌트를 context-action으로 구현
 * ViewModel hooks를 조합해서 완전한 기능을 제공
 */
export function NonMemoizedHandlerWidget() {
  // ViewModel hooks 조합
  useNonMemoizedAutoUpdateEffect(); // 자동 업데이트 효과 (non-memoized context 전용)
  const viewState = useNonMemoizedViewState(); // View state 획득
  const actions = useNonMemoizedActions(); // Action functions 획득

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
      componentName="NonMemoizedHandler"
      maxRenderRate={15}
      checkInterval={1000}
    >
      <div className="space-y-4">
        <MetricsDisplay
          title="Non-Memoized Handlers"
          variant="non-memoized"
          metrics={metricsData}
          dataStatus={dataStatus}
        />
        <ActionButtons variant="non-memoized" actions={actions} />
      </div>
    </SafeModeWrapper>
  );
}
