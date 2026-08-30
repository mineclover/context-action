import { Button, DemoCard } from '@/components/ui';

interface BasicActionsDemoProps {
  count: number;
  onIncrement: () => void;
  onMultiply: () => void;
  onDivide: () => void;
  onDivideByZero: () => void;
  onError: () => void;
}

/** Pure view for the page-scoped CoreAdvanced action commands. */
export function BasicActionsDemo({
  count,
  onIncrement,
  onMultiply,
  onDivide,
  onDivideByZero,
  onError,
}: BasicActionsDemoProps) {
  return (
    <div className="space-y-6">
      <DemoCard title="ActionRegister 상태">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-3xl font-bold text-blue-600 mb-2">{count}</div>
          <div className="text-sm text-gray-600">Current Count</div>
        </div>
      </DemoCard>

      <DemoCard title="ActionRegister 기본 액션">
        <div className="flex flex-wrap gap-2 mb-3">
          <Button onClick={onIncrement}>증가 (+1)</Button>
          <Button variant="secondary" onClick={onMultiply}>
            곱하기 (×2)
          </Button>
          <Button variant="outline" onClick={onDivide}>
            나누기 (÷2)
          </Button>
          <Button variant="danger" onClick={onDivideByZero}>
            0으로 나누기 (에러)
          </Button>
          <Button variant="warning" onClick={onError}>
            에러 액션
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          각 버튼은 page-scoped Action Context의 handler registry를 거쳐
          실행됩니다. 에러 처리와 abort 기능도 함께 테스트할 수 있습니다.
        </p>
      </DemoCard>
    </div>
  );
}
