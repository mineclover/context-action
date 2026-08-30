import { Button, DemoCard } from '@/components/ui';

interface PriorityDemoProps {
  results: string[];
  onRun: () => void;
  onClear: () => void;
}

/** Pure priority-result view; execution order is owned by the handler registry. */
export function PriorityDemo({ results, onRun, onClear }: PriorityDemoProps) {
  return (
    <DemoCard title="우선순위 시스템 테스트">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={onRun}>우선순위 테스트 실행</Button>
          <Button variant="outline" onClick={onClear}>
            결과 초기화
          </Button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">실행 순서 (우선순위별):</h4>
          {results.length === 0 ? (
            <p className="text-gray-500 italic">
              테스트 버튼을 눌러서 우선순위 실행 순서를 확인해보세요.
            </p>
          ) : (
            <ol className="space-y-1">
              {results.map((result, index) => (
                <li key={`${index}-${result}`} className="text-sm font-mono">
                  {index + 1}. {result}
                </li>
              ))}
            </ol>
          )}
        </div>

        <p className="text-sm text-gray-600">
          하나의 액션에 여러 handler가 등록되어 있을 때, 우선순위가 높은
          handler부터 순차적으로 실행됩니다. (Priority 3 → 2 → 1 순서)
        </p>
      </div>
    </DemoCard>
  );
}
