import React from 'react';
import { Card, Badge } from '../../../components/ui';
import type { ScenarioConfig } from '../scenarios/types';

interface ScenarioDetailsProps {
  scenario: ScenarioConfig;
}

export function ScenarioDetails({ scenario }: ScenarioDetailsProps) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">📋 Current Scenario</h2>
      <div className="space-y-3">
        <div>
          <Badge variant="primary">{scenario.title}</Badge>
        </div>
        <p className="text-sm text-gray-600">
          {scenario.description}
        </p>
        
        <div>
          <h3 className="font-medium text-sm mb-2">Payload:</h3>
          <pre className="bg-gray-50 p-3 rounded text-xs font-mono overflow-x-auto">
            {JSON.stringify(scenario.payload, null, 2)}
          </pre>
        </div>
        
        <div>
          <h3 className="font-medium text-sm mb-2">Expected Flow:</h3>
          <div className="text-xs font-mono bg-gray-50 p-2 rounded">
            {scenario.expectedFlow}
          </div>
        </div>
      </div>
    </Card>
  );
}