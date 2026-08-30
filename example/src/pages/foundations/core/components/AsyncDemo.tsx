import { Button, DemoCard } from '@/components/ui';
import type { AsyncDemoResult } from '../contexts/CoreAdvancedContexts';

interface AsyncDemoProps {
  results: AsyncDemoResult[];
  onRunSingle: () => void;
  onRunMultiple: () => void;
  onClear: () => void;
}

function getStatusColor(status: AsyncDemoResult['status']) {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'completed':
      return 'text-green-600 bg-green-100';
    case 'error':
      return 'text-red-600 bg-red-100';
  }
}

/** Pure async-status view; result creation and transitions stay in handlers. */
export function AsyncDemo({
  results,
  onRunSingle,
  onRunMultiple,
  onClear,
}: AsyncDemoProps) {
  return (
    <DemoCard title="비동기 액션 처리">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={onRunSingle}>단일 비동기 작업</Button>
          <Button variant="secondary" onClick={onRunMultiple}>
            다중 비동기 작업
          </Button>
          <Button variant="outline" onClick={onClear}>
            결과 초기화
          </Button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
          <h4 className="font-semibold mb-3">비동기 작업 상태:</h4>
          {results.length === 0 ? (
            <p className="text-gray-500 italic">비동기 작업을 실행해보세요.</p>
          ) : (
            <div className="space-y-2">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{result.message}</div>
                    <div className="text-xs text-gray-500">
                      {result.timestamp}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getStatusColor(result.status)}`}
                  >
                    {result.status === 'pending'
                      ? '진행중...'
                      : result.status === 'completed'
                        ? '완료'
                        : '에러'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600">
          여러 비동기 작업은 서로 독립적으로 실행되고, page-scoped store가 상태
          전이를 추적합니다.
        </p>
      </div>
    </DemoCard>
  );
}
