import React from 'react';
import { Badge, Card } from '@/components/ui';
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
        <p className="text-sm text-gray-600">{scenario.description}</p>

        <div>
          <h3 className="font-medium text-sm mb-2">Payload:</h3>
          <pre className="bg-gray-50 p-3 rounded text-xs font-mono overflow-x-auto">
            {JSON.stringify(scenario.payload, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-medium text-sm mb-2">🔄 Expected Flow:</h3>
          <div className="text-xs font-mono bg-gradient-to-r from-blue-50 to-green-50 p-3 rounded border-l-4 border-blue-400">
            {scenario.expectedFlow.split(' → ').map((step, index, array) => (
              <React.Fragment key={index}>
                <span
                  className={
                    step.includes('(P:')
                      ? 'font-bold text-blue-600'
                      : step.includes('jumpToPriority')
                        ? 'font-bold text-orange-600'
                        : step.includes('Error') || step.includes('Failed')
                          ? 'font-bold text-red-600'
                          : step.includes('Success') || step.includes('Hit')
                            ? 'font-bold text-green-600'
                            : 'text-gray-700'
                  }
                >
                  {step}
                </span>
                {index < array.length - 1 && (
                  <span className="mx-1 text-gray-400">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            💡 P: = Priority (higher numbers execute first)
          </div>
        </div>
      </div>
    </Card>
  );
}
