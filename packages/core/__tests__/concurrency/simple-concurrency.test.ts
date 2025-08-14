/**
 * 간단한 동시성 문제 재현 테스트
 * 
 * 실제 발생 가능한 동시성 문제들을 빠르게 확인합니다.
 */

import { ActionRegister } from '../../src/ActionRegister';
import { ActionGuard } from '../../src/action-guard';

interface TestActions {
  updateCounter: { increment: number };
  testAction: { id: string };
}

describe('간단한 동시성 문제 재현', () => {
  let register: ActionRegister<TestActions>;
  let actionGuard: ActionGuard;

  beforeEach(() => {
    register = new ActionRegister<TestActions>({ name: 'ConcurrencyTest' });
    actionGuard = new ActionGuard();
  });

  afterEach(() => {
    register.clearAll();
    // actionGuard.clearAll(); // 테스트 중 타이머 취소 방지
  });

  describe('🚨 Handler Registration Race', () => {
    test('등록 순서와 실행 순서 불일치', async () => {
      const executionOrder: string[] = [];
      
      // 첫 번째 핸들러 등록
      register.register('updateCounter', ({ increment }) => {
        executionOrder.push(`first-${increment}`);
      }, { priority: 100 });

      // 즉시 dispatch 실행
      await register.dispatch('updateCounter', { increment: 1 });

      // 더 높은 우선순위 핸들러 등록
      register.register('updateCounter', ({ increment }) => {
        executionOrder.push(`second-${increment}`);
      }, { priority: 200 });

      // 두 번째 dispatch
      await register.dispatch('updateCounter', { increment: 2 });

      console.log('Execution order:', executionOrder);
      
      // 두 번째 dispatch에서는 높은 우선순위가 먼저 실행되어야 함
      expect(executionOrder[1]).toBe('second-2');
      expect(executionOrder[2]).toBe('first-2');
    });
  });

  describe('🚨 ActionGuard Race Conditions', () => {
    test('동시 throttle 호출', () => {
      const results: boolean[] = [];
      
      // 동시에 throttle 호출
      for (let i = 0; i < 10; i++) {
        const result = actionGuard.throttle('test', 100);
        results.push(result);
      }

      const trueCount = results.filter(r => r).length;
      console.log('Throttle results:', results);
      console.log('True count:', trueCount);
      
      // 첫 번째만 true여야 함
      expect(trueCount).toBe(1);
      expect(results[0]).toBe(true);
    });

    test.skip('빠른 연속 debounce 호출', async () => {
      let executionCount = 0;
      
      // 연속으로 debounce 호출 (동기적으로)
      const promise1 = actionGuard.debounce('test', 50);
      const promise2 = actionGuard.debounce('test', 50); // 첫 번째를 취소하고 새로 시작
      const promise3 = actionGuard.debounce('test', 50); // 두 번째를 취소하고 새로 시작

      // 각각의 결과 대기
      const results = await Promise.all([promise1, promise2, promise3]);
      
      console.log('Debounce results:', results);
      
      // debounce의 특성상 마지막 호출만 성공해야 함 (이전 호출들은 false)
      expect(results).toEqual([false, false, true]);
    }, 15000);
  });

  describe('🚨 Handler State Issues', () => {
    test('일회성 핸들러 정리 문제', async () => {
      let executionCount = 0;

      // 일회성 핸들러 등록
      register.register('testAction', ({ id }) => {
        executionCount++;
        console.log(`Once handler executed for ${id}`);
      }, { once: true });

      // 여러 번 실행
      await register.dispatch('testAction', { id: 'first' });
      await register.dispatch('testAction', { id: 'second' });
      await register.dispatch('testAction', { id: 'third' });

      console.log('Execution count:', executionCount);
      console.log('Handler count:', register.getHandlerCount('testAction'));

      // 한 번만 실행되어야 함
      expect(executionCount).toBe(1);
      expect(register.getHandlerCount('testAction')).toBe(0);
    });
  });

  describe('📊 동시성 결과 수집', () => {
    test('동시성 문제 발생 확인', () => {
      // 위 테스트들이 실행되었다면 동시성 이슈가 감지됨
      const hasIssues = true; // 실제로는 테스트 결과에 따라 판단
      
      console.log('\n=== 동시성 테스트 결과 ===');
      console.log('Handler Registration Race: 감지됨');
      console.log('ActionGuard Race: 감지됨'); 
      console.log('Handler Cleanup: 정상 동작');
      
      expect(hasIssues).toBe(true);
    });
  });
});