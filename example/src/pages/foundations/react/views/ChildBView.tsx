import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent } from '@/components/ui';
import { useChildBText } from '../hooks/useChildBData';
import { useChildBTextActions } from '../actions/useChildBActions';
import { useParentDataActions, useParentCounterActions } from '../actions/useParentActions';

// ==============================================
// CHILD B DOMAIN - View Component
// ==============================================

/**
 * 독립적인 Child B 컴포넌트 - 자체적으로 상위에 등록됨
 */
export function ChildBView() {
  // 🗄️ Model Layer - 데이터 구독
  const { text, isEmpty, length, displayValue, status } = useChildBText();
  
  // ⚙️ ViewModel Layer - 액션 함수들
  const { updateText, clearText } = useChildBTextActions();
  const { registerChild } = useParentDataActions();
  const { incrementParentCounter } = useParentCounterActions();

  // 🖼️ View Layer - 로컬 상태
  const [inputValue, setInputValue] = useState('');

  // 🖼️ View Layer - 이벤트 핸들러들
  const handleUpdateText = useCallback(() => {
    if (inputValue.trim()) {
      updateText(inputValue.trim());
      setInputValue('');
    }
  }, [updateText, inputValue]);

  const handleClearText = useCallback(() => {
    clearText();
  }, [clearText]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUpdateText();
    }
  }, [handleUpdateText]);

  const handleIncrementParent = useCallback(() => {
    incrementParentCounter();
  }, [incrementParentCounter]);

  // 컴포넌트 마운트 시 상위에 등록
  useEffect(() => {
    registerChild('child-b-text', 'Text Component');
  }, [registerChild]);

  return (
    <Card className="border-l-4 border-l-purple-500 bg-purple-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-bold text-purple-900 flex items-center gap-2">
            🏠 Independent Child B
            <Badge
              variant="outline"
              className="bg-purple-100 text-purple-800 text-xs"
            >
              독립 컴포넌트
            </Badge>
          </h4>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-white rounded border">
            <p className="text-sm font-semibold">{displayValue}</p>
            <p className="text-xs text-gray-500 mt-1">
              길이: {length} | 상태: {status} {isEmpty && '(비어있음)'}
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="새 텍스트 입력..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Button
              size="sm"
              variant="success"
              onClick={handleUpdateText}
              disabled={!inputValue.trim()}
            >
              📝 업데이트
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleClearText}
              disabled={isEmpty}
            >
              🗑️ 클리어
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleIncrementParent}
            >
              🔼 상위 카운터 +1
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
