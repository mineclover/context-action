import { useCallback } from 'react';
import { Badge, Button, Card, CardContent } from '@/components/ui';
import { useParentState } from '../hooks/useParentData';
import { useParentCounterActions, useParentControlActions, useParentDataActions } from '../actions/useParentActions';

// ==============================================
// PARENT DOMAIN - View Component
// ==============================================

/**
 * 상위 컨텍스트 UI - 하위 컴포넌트들을 모름
 */
export function ParentView() {
  // 🗄️ Model Layer - 데이터 구독
  const { registeredChildren, childrenCount, parentCounter, isZero } = useParentState();
  
  // ⚙️ ViewModel Layer - 액션 함수들
  const { incrementParentCounter, resetParentCounter } = useParentCounterActions();
  const { requestChildControl } = useParentControlActions();
  const { logUserInteraction } = useParentDataActions();

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

  const handleUserInteraction = useCallback(() => {
    logUserInteraction('button-click', { 
      component: 'parent', 
      button: 'custom-action' 
    });
  }, [logUserInteraction]);

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            🌍 Parent Context (Interface Only)
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              상위 컨텍스트
            </Badge>
          </h3>
        </div>

        <div className="space-y-4">
          {/* 상위 컨텍스트 자체 카운터 */}
          <div className="p-4 bg-white rounded-lg border border-blue-200">
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
                  🔼 +1
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
          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <h4 className="font-semibold mb-3 text-blue-900">
              🎮 하위 컴포넌트 제어 요청
            </h4>
            <div className="flex gap-2 flex-wrap">
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
              <Button
                size="sm"
                variant="info"
                onClick={handleUserInteraction}
              >
                📤 상호작용 로그
              </Button>
            </div>
          </div>

          {/* 등록된 하위 컴포넌트들 */}
          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <h4 className="font-semibold mb-3 text-blue-900">
              📋 등록된 하위 컴포넌트들 ({childrenCount})
            </h4>
            {childrenCount > 0 ? (
              <div className="space-y-2">
                {registeredChildren.map((child, index) => (
                  <div
                    key={child.childId}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {index + 1}. {child.childType}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {child.childId}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">등록된 하위 컴포넌트가 없습니다.</p>
            )}
          </div>


        </div>
      </CardContent>
    </Card>
  );
}
