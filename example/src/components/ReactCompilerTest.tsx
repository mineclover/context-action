import React, { useState } from 'react';

// React 컴파일러 테스트를 위한 컴포넌트
// 이 컴포넌트는 수동 메모이제이션 없이도 자동으로 최적화되어야 합니다
export function ReactCompilerTest() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  // React 컴파일러가 자동으로 메모이제이션할 수 있는 함수들
  const handleIncrement = () => {
    setCount((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setCount((prev) => prev - 1);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  // 비싼 계산 - React 컴파일러가 자동으로 메모이제이션해야 함
  const expensiveCalculation = () => {
    console.log('Expensive calculation running...');
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.random();
    }
    return result;
  };

  const calculationResult = expensiveCalculation();

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">
        React 컴파일러 테스트
      </h2>

      <div className="space-y-4">
        <div className="text-center">
          <p className="text-lg">
            카운트: <span className="font-bold text-blue-600">{count}</span>
          </p>
          <div className="flex gap-2 justify-center mt-2">
            <button
              onClick={handleIncrement}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              증가
            </button>
            <button
              onClick={handleDecrement}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              감소
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">이름:</label>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="이름을 입력하세요"
          />
          <p className="mt-2 text-sm text-gray-600">입력된 이름: {name}</p>
        </div>

        <div className="bg-gray-100 p-3 rounded">
          <p className="text-sm text-gray-700">
            계산 결과: {calculationResult.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            이 계산은 React 컴파일러에 의해 자동으로 메모이제이션되어야 합니다.
          </p>
        </div>

        <div className="text-xs text-gray-500 text-center">
          <p>React DevTools에서 "Memo ✨" 배지를 확인하세요!</p>
        </div>
      </div>
    </div>
  );
}

// React 컴파일러가 자동으로 메모이제이션할 수 있는 자식 컴포넌트
export function ChildComponent({
  value,
  onUpdate,
}: {
  value: number;
  onUpdate: (value: number) => void;
}) {
  // 이 컴포넌트는 React 컴파일러에 의해 자동으로 최적화되어야 합니다
  return (
    <div className="p-4 border border-gray-200 rounded">
      <p>자식 컴포넌트 값: {value}</p>
      <button
        onClick={() => onUpdate(value + 1)}
        className="mt-2 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
      >
        값 증가
      </button>
    </div>
  );
}

// 메인 테스트 컴포넌트
export function ReactCompilerDemo() {
  const [parentValue, setParentValue] = useState(0);

  return (
    <div className="space-y-6">
      <ReactCompilerTest />
      <ChildComponent value={parentValue} onUpdate={setParentValue} />
    </div>
  );
}
