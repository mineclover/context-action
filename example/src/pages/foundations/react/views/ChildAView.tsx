import { useCallback, useEffect } from 'react';
import { Badge, Button, Card, CardContent } from '@/components/ui';
import {
  useChildACounterActions,
  useChildARemoteControlActions,
} from '../actions/useChildAActions';
import {
  useParentCounterActions,
  useParentDataActions,
} from '../actions/useParentActions';
import { useChildACounter } from '../hooks/useChildAData';

// ==============================================
// CHILD A DOMAIN - View Component
// ==============================================

/**
 * 독립적인 Child A 컴포넌트 - 자체적으로 상위에 등록됨
 */
export function ChildAView() {
  // 🗄️ Model Layer - 데이터 구독
  const { isZero, isPositive, displayValue, status } = useChildACounter();

  // ⚙️ ViewModel Layer - 액션 함수들
  const { incrementCounter, resetCounter } = useChildACounterActions();
  const { childId } = useChildARemoteControlActions();
  const { registerChild } = useParentDataActions();
  const { incrementParentCounter } = useParentCounterActions();

  // 🖼️ View Layer - 이벤트 핸들러들
  const handleIncrement1 = useCallback(() => {
    incrementCounter(1);
  }, [incrementCounter]);

  const handleIncrement5 = useCallback(() => {
    incrementCounter(5);
  }, [incrementCounter]);

  const handleReset = useCallback(() => {
    resetCounter();
  }, [resetCounter]);

  const handleIncrementParent = useCallback(() => {
    incrementParentCounter();
  }, [incrementParentCounter]);

  // 컴포넌트 마운트 시 상위에 등록
  useEffect(() => {
    registerChild(childId, 'Counter Component');
  }, [registerChild, childId]);

  return (
    <Card className="border-l-4 border-l-green-500 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-bold text-green-900 flex items-center gap-2">
            🏠 Independent Child A
            <Badge
              variant="outline"
              className="bg-green-100 text-green-800 text-xs"
            >
              독립 컴포넌트
            </Badge>
          </h4>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-white rounded border">
            <p className="text-sm font-semibold">{displayValue}</p>
            <p className="text-xs text-gray-500 mt-1">
              상태: {status} {isPositive && '(양수)'} {isZero && '(0)'}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="success" onClick={handleIncrement1}>
              🔢 +1
            </Button>
            <Button size="sm" variant="success" onClick={handleIncrement5}>
              🔢 +5
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleReset}
              disabled={isZero}
            >
              🔄 리셋
            </Button>
            <Button size="sm" variant="primary" onClick={handleIncrementParent}>
              🔼 상위 카운터 +1
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
