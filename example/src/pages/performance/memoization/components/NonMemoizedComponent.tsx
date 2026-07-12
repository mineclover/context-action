import React from 'react';

interface NonMemoizedComponentProps {
  data: any[];
  onRender?: () => void;
}

const NonMemoizedComponent: React.FC<NonMemoizedComponentProps> = ({
  data,
  onRender,
}) => {
  // 렌더링 시마다 실행되는 복잡한 계산
  const processedData = data.map((item, index) => ({
    ...item,
    processed: item.value * 2 + Math.sqrt(item.value),
    timestamp: Date.now(),
    renderCount: index + 1,
  }));

  // 렌더링 알림
  React.useEffect(() => {
    onRender?.();
  });

  return (
    <div className="bg-white rounded-lg p-4 border-2 border-red-200">
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        메모이제이션 미사용
      </h3>
      <div className="text-sm text-gray-600 mb-2">
        렌더링 시간: {new Date().toLocaleTimeString()}
      </div>
      <div className="space-y-1">
        {processedData.slice(0, 3).map((item, index) => (
          <div key={index} className="text-xs bg-gray-50 p-1 rounded">
            Item {index + 1}: {item.processed.toFixed(2)}
          </div>
        ))}
        {processedData.length > 3 && (
          <div className="text-xs text-gray-500">
            ... 및 {processedData.length - 3}개 더
          </div>
        )}
      </div>
    </div>
  );
};

export default NonMemoizedComponent;
