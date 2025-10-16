import React from 'react';

/**
 * Shared Component - 코드 비교 표시
 * 메모이제이션 패턴 비교를 위한 순수 UI 컴포넌트
 */
export function CodeComparison() {
  return (
    <div className="grid md:grid-cols-2 gap-4 text-sm">
      <div className="p-3 bg-green-50 rounded-lg">
        <h4 className="font-bold text-green-700 mb-2">
          ✅ 스마트 메모이제이션 패턴
        </h4>
        <pre className="text-xs overflow-x-auto">
          {`// ✅ 함수는 메모이제이션 + 데이터는 지연 평가
const handleIncrement = useCallback(async () => {
  const current = store.getValue(); // 🔄 항상 최신 값
  store.setValue({ ...current, counter: current.counter + 1 });
}, []); // 🎯 함수 자체는 재사용 (메모이제이션)

// 복잡한 계산과 메모리 작업 모두 메모이제이션
const expensiveCalculator = useCallback((baseValue) => {
  console.log('💰 Memoized: Expensive calculation');
  return Array.from({length: baseValue * 100}, (_, i) => 
    Math.pow(i + baseValue, 2) + Math.sqrt(baseValue)
  );
}, []); // 계산 로직은 메모이제이션

const memoryDataGenerator = useCallback(() => {
  console.log('💾 Memoized: Memory generator');
  return createMemoryLeakData(); // 동일한 원천 데이터
}, []); // 메모리 생성 함수도 메모이제이션

const handleHeavyOperation = useCallback(async (payload) => {
  const current = store.getValue(); // 🔄 최신 상태
  const result = expensiveCalculator(payload.dataSize); // 🎯 메모된 함수
  store.setValue({ ...current, 
    heavyData: [...current.heavyData, ...result] // 동일한 누적
  });
}, [expensiveCalculator]); // 의존성 명시

// 🚀 결과: 함수 생성 비용 0, 하지만 최신 데이터 접근!`}
        </pre>
      </div>

      <div className="p-3 bg-red-50 rounded-lg">
        <h4 className="font-bold text-red-700 mb-2">❌ 비효율적인 패턴</h4>
        <pre className="text-xs overflow-x-auto">
          {`// ❌ 렌더링마다 새로운 함수 생성 = 메모리 낭비
const handleIncrement = async () => {
  const current = store.getValue(); // ✓ 최신 값은 가져오지만
  store.setValue({ ...current, counter: current.counter + 1 });
}; // 💥 렌더링마다 새 함수 생성!

// 복잡한 계산과 메모리 작업 모두 매번 새로 정의 (동일한 로직)
const expensiveCalculator = (baseValue) => {
  console.log('💸 Non-Memoized: Expensive calculation EVERY RENDER!');
  return Array.from({length: baseValue * 100}, (_, i) => // 동일한 계산량
    Math.pow(i + baseValue, 2) + Math.sqrt(baseValue)
  );
}; // 💥 이 함수도 매번 새로 생성!

const memoryDataGenerator = () => {
  console.log('💸 Non-Memoized: Memory generator EVERY RENDER!');
  return createMemoryLeakData(); // 동일한 원천 데이터
}; // 💥 메모리 생성 함수도 매번 새로 생성!

const handleHeavyOperation = async (payload) => {
  const current = store.getValue();
  const result = expensiveCalculator(payload.dataSize); // 💸 계산 로직도 재생성
  store.setValue({ ...current, 
    heavyData: [...current.heavyData, ...result] // 동일한 누적
  });
}; // 💥 핸들러도 매번 재생성!

// 💸 결과: 함수 생성 비용 높음 + 핸들러 재등록 + 가비지컬렉션 부하`}
        </pre>
      </div>
    </div>
  );
}
