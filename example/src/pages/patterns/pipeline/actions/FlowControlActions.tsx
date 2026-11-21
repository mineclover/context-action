import { useCallback } from 'react';
import { useFlowControlDemoAction } from '../contexts/FlowControlContexts';
import type { ScenarioKey } from '../scenarios/types';

export function useFlowControlActions() {
  const demoDispatch = useFlowControlDemoAction();

  const clearCache = useCallback(() => {
    void demoDispatch('clearCache');
  }, [demoDispatch]);

  const toggleBusinessHours = useCallback(() => {
    void demoDispatch('toggleBusinessHours');
  }, [demoDispatch]);

  const adjustSystemLoad = useCallback(
    (load: number) => {
      void demoDispatch('adjustSystemLoad', { load });
    },
    [demoDispatch]
  );

  const setSelectedScenario = useCallback(
    (scenario: ScenarioKey) => {
      void demoDispatch('setSelectedScenario', { scenario });
    },
    [demoDispatch]
  );

  const onExecutionStep = useCallback(
    (step: string) => {
      void demoDispatch('recordExecutionStep', { step }, { immediate: true });
    },
    [demoDispatch]
  );

  const onHandlerExecution = useCallback(() => {
    void demoDispatch('recordHandlerExecution', undefined, { immediate: true });
  }, [demoDispatch]);

  const executeScenario = useCallback(
    async (scenario: ScenarioKey, payload: any) => {
      await demoDispatch('executeScenario', { scenario, payload });
    },
    [demoDispatch]
  );

  return {
    clearCache,
    toggleBusinessHours,
    adjustSystemLoad,
    setSelectedScenario,
    executeScenario,
    onExecutionStep,
    onHandlerExecution,
  };
}
