import React from 'react';
import { Card, Badge } from '../../../components/ui';

interface ExecutionPathProps {
  executionPath: string[];
}

export function ExecutionPath({ executionPath }: ExecutionPathProps) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">🛤️ Execution Path</h2>
      {executionPath.length > 0 ? (
        <div className="space-y-2">
          {executionPath.map((step, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Badge variant="default" className="text-xs">
                {index + 1}
              </Badge>
              <span className="text-sm font-mono">{step}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No execution yet</div>
      )}
    </Card>
  );
}