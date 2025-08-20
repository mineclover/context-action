/**
 * @fileoverview Optimized Mouse Events Page Container
 */

import { PageWithLogMonitor } from '../../components/LogMonitor';
import { MouseEventsContainer } from './clean-architecture/containers/MouseEventsContainer';

export function OptimizedMouseEventsPage() {
  return (
    <PageWithLogMonitor
      pageId="optimized-mouse-events"
      title="Optimized Mouse Events"
      initialConfig={{ enableToast: false, maxLogs: 50 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>🚀 Optimized Mouse Events</h1>
          <p className="page-description">
            High-performance mouse event handling with{' '}
            <strong>Canvas-style isolated rendering</strong> and zero React re-renders.
            This demo showcases advanced optimization techniques for smooth 60fps tracking.
          </p>
        </header>

        <MouseEventsContainer />
      </div>
    </PageWithLogMonitor>
  );
}