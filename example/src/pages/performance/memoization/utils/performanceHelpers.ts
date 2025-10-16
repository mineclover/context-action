import type { MemoryLeakItem } from '../types';

// 성능 문제를 위한 헬퍼 함수들 (브라우저 안전)
export const performHeavyCalculation = (size: number): number[] => {
  const safeSize = Math.min(size, 100); // 최대 100개로 제한
  const result: number[] = [];
  for (let i = 0; i < safeSize; i++) {
    // 의도적으로 무거운 계산 (하지만 안전한 수준)
    let value = i;
    for (let j = 0; j < 500; j++) {
      // 1000에서 500으로 감소
      value = Math.sqrt(value * Math.PI) + Math.sin(value);
    }
    result.push(value);
  }
  return result;
};

export const createMemoryLeakData = (): MemoryLeakItem[] => {
  // 적당한 크기의 객체들 생성 (브라우저 안전)
  return Array.from({ length: 100 }, (_, i) => ({
    id: i,
    data: new Array(100).fill(0).map(() => Math.random()),
    timestamp: Date.now(),
    largeString: 'x'.repeat(1000), // 10KB에서 1KB로 감소
  }));
};

export const processLargeDataSet = (
  data: number[]
): { id: number; value: number; timestamp: number }[] => {
  return data.map((value, index) => ({
    id: index,
    value: value * Math.PI + Math.sqrt(value),
    timestamp: Date.now(),
  }));
};

// 공통 계산 로직
export const createExpensiveCalculation = (baseValue: number): number[] => {
  return Array.from(
    { length: baseValue * 100 },
    (_, i) => (i + baseValue) ** 2 + Math.sqrt(baseValue)
  );
};

// 결과 변환 유틸리티
export const convertToProcessedResults = (
  result: number[]
): { id: number; value: number; timestamp: number }[] => {
  return result.map((v, i) => ({
    id: i,
    value: v,
    timestamp: Date.now(),
  }));
};
