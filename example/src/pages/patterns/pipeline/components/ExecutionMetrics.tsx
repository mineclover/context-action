// import React from 'react';
import { Card, Button } from '@/components/ui';

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
        <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
          <div className="font-medium mb-2">🎯 Priority Execution Order:</div>
          <div className="space-y-1 text-gray-600">
            <div>• High Priority (P:1000) → Low Priority (P:50)</div>
            <div>• jumpToPriority() changes execution flow dynamically</div>
            <div>• controller.return() exits pipeline early</div>
            <div>• controller.abort() stops execution with error</div>
          </div>
        </div>
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