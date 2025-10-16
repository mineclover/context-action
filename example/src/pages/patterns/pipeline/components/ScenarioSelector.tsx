// import React from 'react';
import { Card } from '@/components/ui';
import type { ScenarioKey, ScenarioRegistry } from '../scenarios/types';

interface ScenarioSelectorProps {
  scenarios: ScenarioRegistry;
  selectedScenario: ScenarioKey;
  onScenarioSelect: (scenario: ScenarioKey) => void;
}

export function ScenarioSelector({ 
  scenarios, 
  selectedScenario, 
  onScenarioSelect 
}: ScenarioSelectorProps) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">🎯 Test Scenarios</h2>
      <div className="space-y-3">
        {Object.entries(scenarios).map(([key, scenario]) => (
          <div key={key}>
            <button
              onClick={() => onScenarioSelect(key as ScenarioKey)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedScenario === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{scenario.title}</div>
              <div className="text-sm text-gray-600 mt-1">{scenario.description}</div>
              <div className="text-xs text-gray-500 mt-2 font-mono">
                {scenario.expectedFlow}
              </div>
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}