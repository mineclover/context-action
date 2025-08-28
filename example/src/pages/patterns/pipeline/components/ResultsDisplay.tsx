import React from 'react';
import { Card } from '@/components/ui';

interface ResultsDisplayProps {
  executionResults: any[];
}

export function ResultsDisplay({ executionResults }: ResultsDisplayProps) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">📄 Results</h2>
      {executionResults.length > 0 ? (
        <div className="space-y-3">
          {executionResults.map((result, index) => (
            <pre 
              key={index}
              className="bg-gray-50 p-3 rounded text-xs font-mono overflow-x-auto"
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No results yet</div>
      )}
    </Card>
  );
}