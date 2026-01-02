// import React from 'react';
import { CodeBlock } from '@/components/ui';
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
            <CodeBlock
              key={index}
              size="xs"
            >
              {JSON.stringify(result, null, 2)}
            </CodeBlock>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No results yet</div>
      )}
    </Card>
  );
}
