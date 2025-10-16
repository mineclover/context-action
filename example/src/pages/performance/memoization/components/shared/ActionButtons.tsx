interface ActionButtonsProps {
  variant: 'memoized' | 'non-memoized';
  actions: {
    increment: () => void;
    decrement: () => void;
    calculate: () => void;
    performHeavyOperation: () => void;
    performMemoryTask: () => void;
    reset: () => void;
  };
}

/**
 * Shared Component - 액션 버튼들을 위한 순수 UI 컴포넌트
 * 비즈니스 로직은 포함하지 않고 함수를 주입받아 실행만 합니다.
 */
export function ActionButtons({ variant, actions }: ActionButtonsProps) {
  const baseColor = variant === 'memoized' ? 'green' : 'red';

  return (
    <div className="flex gap-2 flex-wrap text-sm">
      <button
        onClick={actions.increment}
        className={`px-2 py-1 bg-${baseColor}-600 text-white rounded hover:bg-${baseColor}-700`}
      >
        +1
      </button>

      <button
        onClick={actions.decrement}
        className={`px-2 py-1 bg-${baseColor}-600 text-white rounded hover:bg-${baseColor}-700`}
      >
        -1
      </button>

      <button
        onClick={actions.calculate}
        className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Calc
      </button>

      <button
        onClick={actions.performHeavyOperation}
        className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        Heavy
      </button>

      <button
        onClick={actions.performMemoryTask}
        className="px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
      >
        Memory
      </button>

      <button
        onClick={actions.reset}
        className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        Reset
      </button>
    </div>
  );
}
