import { useCallback } from 'react';
import type { ScenarioKey, ScenarioRegistry } from '../scenarios/types';

interface UseScenarioExecutionProps {
  scenarios: ScenarioRegistry;
  selectedScenario: ScenarioKey;
  isExecuting: boolean;
  executeScenario: (scenario: ScenarioKey, payload: any) => Promise<void>;
}

export function useScenarioExecution({
  scenarios,
  selectedScenario,
  isExecuting,
  executeScenario,
}: UseScenarioExecutionProps) {
  const handleExecuteScenario = useCallback(async () => {
    if (isExecuting) return;

    const scenario = scenarios[selectedScenario];
    if (!scenario) {
      console.error(`Scenario not found: ${selectedScenario}`);
      return;
    }

    console.log(`📋 Description: ${scenario.description}`);
    await executeScenario(selectedScenario, scenario.payload);
  }, [scenarios, selectedScenario, isExecuting, executeScenario]);

  const getCurrentScenario = useCallback(() => {
    return scenarios[selectedScenario];
  }, [scenarios, selectedScenario]);

  return {
    handleExecuteScenario,
    getCurrentScenario,
    currentScenario: scenarios[selectedScenario],
  };
}
