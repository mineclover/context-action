import {
  usePerformanceControlActions,
  usePerformanceControlState,
} from '../../hooks/usePerformanceControl';
import { PerformanceControlPanel } from '../shared/PerformanceControlPanel';

/**
 * Widget Component - Performance Control
 * 자동 업데이트 제어를 위한 위젯
 * 단순한 상태 제어만 담당 (auto update 실행 로직은 각 위젯에서 처리)
 */
export function PerformanceControlWidget() {
  const { autoUpdate, updateInterval } = usePerformanceControlState();
  const { toggleAutoUpdate, setUpdateInterval } =
    usePerformanceControlActions();

  return (
    <PerformanceControlPanel
      autoUpdate={autoUpdate}
      updateInterval={updateInterval}
      onToggleAutoUpdate={toggleAutoUpdate}
      onIntervalChange={setUpdateInterval}
    />
  );
}
