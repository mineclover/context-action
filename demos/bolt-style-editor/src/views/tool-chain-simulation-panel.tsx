import type { ToolChainSimulationState } from '../hooks/use-tool-chain-simulation';
import type { ToolChainSimulationSnapshot } from '../tool-chain-simulation-catalog';

export type ToolChainSimulationPanelProps = {
  snapshot: ToolChainSimulationSnapshot;
  state: ToolChainSimulationState;
  isStorageReady: boolean;
  workspaceRevision: number;
  onClose: () => void;
  onReset: () => void;
  onRun: () => void;
};

function statusLabel(status: ToolChainSimulationState['status']): string {
  switch (status) {
    case 'running':
      return 'Running snapshot';
    case 'completed':
      return 'Simulation completed';
    case 'failed':
      return 'Simulation failed';
    default:
      return 'Ready to simulate';
  }
}

export function ToolChainSimulationPanel({
  snapshot,
  state,
  isStorageReady,
  workspaceRevision,
  onClose,
  onReset,
  onRun,
}: ToolChainSimulationPanelProps) {
  const isRunning = state.status === 'running';
  const isCompleted = state.status === 'completed';

  return (
    <div className="simulation-backdrop" role="presentation">
      <section
        aria-describedby="tool-chain-simulation-description"
        aria-labelledby="tool-chain-simulation-title"
        aria-modal="true"
        className="simulation-dialog"
        role="dialog"
      >
        <div className="simulation-heading">
          <div>
            <span className="panel-label">Reference snapshot</span>
            <h2 id="tool-chain-simulation-title">Tool-chain simulation</h2>
          </div>
          <button
            aria-label="Close simulation reference"
            className="simulation-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <p id="tool-chain-simulation-description" className="simulation-copy">
          A captured recipe runs through the same Context-Action registry as the
          editor. Watch each result appear in the trace and preview.
        </p>
        <div
          aria-label="Tool calling lifecycle"
          className="simulation-protocol"
        >
          {snapshot.protocol.map((stage, index) => (
            <span key={stage}>
              {stage}
              {index < snapshot.protocol.length - 1 ? ' →' : ''}
            </span>
          ))}
        </div>
        <article className="simulation-snapshot-card">
          <div className="simulation-snapshot-meta">
            <span>Captured from {snapshot.sourceRecipeId}</span>
            <span>Revision {workspaceRevision}</span>
          </div>
          <h3>{snapshot.title}</h3>
          <p>{snapshot.description}</p>
          <ol className="simulation-step-list">
            {snapshot.steps.map((step, index) => {
              const isActive = state.activeStepId === step.id;
              const isStepComplete = state.completedStepIds.includes(step.id);
              return (
                <li
                  className={
                    isActive
                      ? 'simulation-step simulation-step-active'
                      : isStepComplete
                        ? 'simulation-step simulation-step-complete'
                        : 'simulation-step'
                  }
                  key={step.id}
                >
                  <span className="simulation-step-index">
                    {isStepComplete ? '✓' : index + 1}
                  </span>
                  <div>
                    <strong>{step.label}</strong>
                    <code>{step.call.name}</code>
                    <small>{step.description}</small>
                  </div>
                  <span className="simulation-step-state">
                    {isActive ? 'running' : isStepComplete ? 'done' : 'queued'}
                  </span>
                </li>
              );
            })}
          </ol>
        </article>
        {state.error ? (
          <p aria-live="assertive" className="simulation-error" role="alert">
            {state.error}
          </p>
        ) : null}
        <div aria-live="polite" className="simulation-footer" role="status">
          <span>{statusLabel(state.status)}</span>
          <div className="simulation-actions">
            {isCompleted || state.status === 'failed' ? (
              <button
                className="simulation-reset"
                disabled={isRunning}
                onClick={onReset}
                type="button"
              >
                Reset
              </button>
            ) : null}
            <button
              className="simulation-run"
              disabled={!isStorageReady || isRunning}
              onClick={onRun}
              type="button"
            >
              {isRunning ? 'Running…' : 'Run snapshot'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
