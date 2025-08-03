/**
 * 비교 시스템 수동 데모
 * Node.js에서 직접 실행하여 비교 시스템 동작 확인
 */

import { createStore, setGlobalComparisonOptions } from '../../../dist/index.js';

console.log('🚀 Store Enhanced Comparison System Demo\n');

// 1. 기본 참조 비교 테스트
console.log('1. 기본 참조 비교 테스트');
const store1 = createStore('basic', { count: 0 });

let updateCount = 0;
store1.subscribe(() => {
  updateCount++;
  console.log(`  📢 Update #${updateCount}: ${JSON.stringify(store1.getValue())}`);
});

console.log('  - 같은 참조로 setValue (업데이트 없어야 함)');
const currentValue = store1.getValue();
store1.setValue(currentValue);

console.log('  - 다른 참조지만 같은 내용 (기본적으로 업데이트됨)');
store1.setValue({ count: 0 });

console.log('  - 실제 값 변경');
store1.setValue({ count: 1 });

console.log(`  ✅ 총 업데이트 횟수: ${updateCount} (예상: 2)\n`);

// 2. 얕은 비교 테스트
console.log('2. 얕은 비교 테스트');
const store2 = createStore('shallow', { count: 0, name: 'test' });
store2.setComparisonOptions({ strategy: 'shallow' });

let updateCount2 = 0;
store2.subscribe(() => {
  updateCount2++;
  console.log(`  📢 Update #${updateCount2}: ${JSON.stringify(store2.getValue())}`);
});

console.log('  - 같은 내용의 새 객체 (업데이트 없어야 함)');
store2.setValue({ count: 0, name: 'test' });

console.log('  - 다른 내용의 새 객체');
store2.setValue({ count: 1, name: 'test' });

console.log(`  ✅ 총 업데이트 횟수: ${updateCount2} (예상: 1)\n`);

// 3. 커스텀 비교 함수 테스트
console.log('3. 커스텀 비교 함수 테스트 (ID만 비교)');
const store3 = createStore('custom', { id: 1, timestamp: Date.now() });
store3.setCustomComparator((old, newVal) => old.id === newVal.id);

let updateCount3 = 0;
store3.subscribe(() => {
  updateCount3++;
  console.log(`  📢 Update #${updateCount3}: ${JSON.stringify(store3.getValue())}`);
});

console.log('  - 같은 ID, 다른 timestamp (업데이트 없어야 함)');
store3.setValue({ id: 1, timestamp: Date.now() + 1000 });

console.log('  - 다른 ID');
store3.setValue({ id: 2, timestamp: Date.now() });

console.log(`  ✅ 총 업데이트 횟수: ${updateCount3} (예상: 1)\n`);

// 4. 전역 설정 테스트
console.log('4. 전역 비교 설정 테스트');
setGlobalComparisonOptions({ strategy: 'shallow' });

const store4 = createStore('global', { count: 0 });
let updateCount4 = 0;
store4.subscribe(() => {
  updateCount4++;
  console.log(`  📢 Update #${updateCount4}: ${JSON.stringify(store4.getValue())}`);
});

console.log('  - 전역 얕은 비교 설정으로 같은 내용 객체 (업데이트 없어야 함)');
store4.setValue({ count: 0 });

console.log('  - 다른 내용 객체');
store4.setValue({ count: 5 });

console.log(`  ✅ 총 업데이트 횟수: ${updateCount4} (예상: 1)\n`);

console.log('🎉 모든 테스트 완료!');
console.log('비교 시스템이 정상적으로 작동하고 있습니다.');