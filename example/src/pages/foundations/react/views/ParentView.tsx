import { useCallback } from 'react';
import { Badge, Button, Card, CardContent } from '@/components/ui';
import { useParentState } from '../hooks/useParentData';
import { useParentCounterActions, useParentControlActions } from '../actions/useParentActions';

// ==============================================
// PARENT DOMAIN - View Component
// ==============================================

/**
 * 상위 컨텍스트 UI - 하위 컴포넌트들을 모름
 */
export function ParentView() {
  // 🗄️ Model Layer - 데이터 구독
  const { parentCounter, isZero } = useParentState();
  
  // ⚙️ ViewModel Layer - 액션 함수들
  const { incrementParentCounter, resetParentCounter } = useParentCounterActions();
  const { requestChildControl } = useParentControlActions();

  // 🖼️ View Layer - 이벤트 핸들러들
  const handleIncrementParent = useCallback(() => {
    incrementParentCounter();
  }, [incrementParentCounter]);

  const handleResetParent = useCallback(() => {
    resetParentCounter();
  }, [resetParentCounter]);

  const handleRequestChildAIncrement = useCallback(() => {
    requestChildControl('child-a-counter', 'increment', 5);
  }, [requestChildControl]);

  const handleRequestChildAReset = useCallback(() => {
    requestChildControl('child-a-counter', 'reset');
  }, [requestChildControl]);

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            🌍 Parent Context (Interface Only)
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              상위 컨텍스트
            </Badge>
          </h3>
        </div>

        {/* Main Content - Single Column Layout */}
        <div className="space-y-4">
          {/* 상위 컨텍스트 자체 카운터 */}
          <div className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
            <h4 className="font-semibold mb-3 text-blue-900">
              🏠 상위 컨텍스트 카운터
            </h4>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-700">
                카운터: {parentCounter}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleIncrementParent}
                >
                  🔼 +1 증가
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleResetParent}
                  disabled={isZero}
                >
                  🔄 리셋
                </Button>
              </div>
            </div>
          </div>

          {/* 하위 컴포넌트 제어 */}
          <div className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
            <h4 className="font-semibold mb-3 text-blue-900">
              🎮 하위 컴포넌트 제어
            </h4>
            <p className="text-gray-600 text-sm mb-3">
              Context-Layered 아키텍처를 통한 하위 컴포넌트 제어
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="success"
                onClick={handleRequestChildAIncrement}
              >
                🎯 Child A +5 요청
              </Button>
              <Button
                size="sm"
                variant="warning"
                onClick={handleRequestChildAReset}
              >
                🎯 Child A 리셋 요청
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}