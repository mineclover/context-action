import { useCallback, useRef, useState } from 'react';
import type { ToolCall } from '../local-agent-plan';
import type { ToolChainSimulationSnapshot } from '../tool-chain-simulation-catalog';
import type {
  ToolExecutionOptions,
  ToolExecutionOutcome,
} from './use-tool-execution';

export type ToolChainSimulationStatus =
  | 'idle'
  | 'running'
  | 'completed'
  | 'failed';

export type ToolChainSimulationState = {
  status: ToolChainSimulationStatus;
  activeStepId: string | null;
  completedStepIds: readonly string[];
  error: string | null;
};

const initialSimulationState: ToolChainSimulationState = {
  status: 'idle',
  activeStepId: null,
  completedStepIds: [],
  error: null,
};

type ExecuteQuickTool = (
  call: ToolCall,
  options?: ToolExecutionOptions
) => Promise<ToolExecutionOutcome>;

/**
 * Orchestrates a captured tool-chain without putting execution logic in the
 * reference view. Each step uses the same direct tools/call action used by
 * the editor palette, so results remain visible in the shared trace/preview.
 */
export function useToolChainSimulation({
  executeQuickTool,
  running,
}: {
  executeQuickTool: ExecuteQuickTool;
  running: boolean;
}) {
  const [state, setState] = useState<ToolChainSimulationState>(
    initialSimulationState
  );
  const inFlightRef = useRef(false);

  const resetSimulation = useCallback(() => {
    if (inFlightRef.current) return;
    setState(initialSimulationState);
  }, []);

  const runSnapshot = useCallback(
    async (snapshot: ToolChainSimulationSnapshot) => {
      if (running || inFlightRef.current || snapshot.steps.length === 0) {
        return;
      }
      inFlightRef.current = true;
      const completedStepIds: string[] = [];
      setState({
        status: 'running',
        activeStepId: snapshot.steps[0]?.id ?? null,
        completedStepIds,
        error: null,
      });

      try {
        for (const step of snapshot.steps) {
          setState({
            status: 'running',
            activeStepId: step.id,
            completedStepIds: [...completedStepIds],
            error: null,
          });
          const outcome = await executeQuickTool(step.call, {
            announce: false,
          });
          if (!outcome.ok) {
            setState({
              status: 'failed',
              activeStepId: step.id,
              completedStepIds: [...completedStepIds],
              error: outcome.message ?? `${step.call.name} failed.`,
            });
            return;
          }
          completedStepIds.push(step.id);
        }
        setState({
          status: 'completed',
          activeStepId: null,
          completedStepIds: [...completedStepIds],
          error: null,
        });
      } finally {
        inFlightRef.current = false;
      }
    },
    [executeQuickTool, running]
  );

  return {
    state,
    runSnapshot,
    resetSimulation,
  };
}
