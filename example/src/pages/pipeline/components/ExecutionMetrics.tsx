import React from 'react';
import { Card, Button } from '../../../components/ui';

interface ExecutionMetricsProps {
  handlerExecutions: number;
  executionSteps: number;
  isExecuting: boolean;
  onExecute: () => void;
}

export function ExecutionMetrics({
  handlerExecutions,
  executionSteps,
  isExecuting,
  onExecute
}: ExecutionMetricsProps) {
  return (
    <>
      {/* Execution Controls */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">🚀 Execution</h2>
        <Button
          onClick={onExecute}
          disabled={isExecuting}
          variant="primary"
          className="w-full"
        >
          {isExecuting ? 'Executing...' : 'Execute Scenario'}
        </Button>
      </Card>

      {/* Execution Metrics */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">📊 Execution Metrics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{handlerExecutions}</div>
            <div className="text-sm text-gray-600">Handlers Executed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{executionSteps}</div>
            <div className="text-sm text-gray-600">Execution Steps</div>
          </div>
        </div>
      </Card>
    </>
  );
}