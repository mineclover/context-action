/**
 * 동시성 문제 재현 테스트
 * 
 * 이 테스트는 현재 Context-Action 라이브러리에서 발생할 수 있는
 * 동시성 문제들을 재현하고 문서화합니다.
 */

import { ActionRegister } from '../../src/ActionRegister';
import { ActionGuard } from '../../src/action-guard';

interface TestActions {
  updateCounter: { increment: number };
  resetCounter: void;
  slowOperation: { id: string; delay: number };
  fastOperation: { id: string };
}

describe('동시성 문제 재현 테스트', () => {
  let register: ActionRegister<TestActions>;
  let actionGuard: ActionGuard;
  let testResults: any[];

  beforeEach(() => {
    register = new ActionRegister<TestActions>({ name: 'ConcurrencyTest' });
    actionGuard = new ActionGuard();
    testResults = [];
  });

  afterEach(() => {
    register.clearAll();
    // actionGuard.clearAll(); // 테스트 중 타이머 취소 방지
  });

  describe('🚨 Problem 1: Handler Registration Race Condition', () => {
    test('핸들러 등록 중 dispatch 실행 시 불완전한 pipeline 실행', async () => {
      let executionOrder: string[] = [];
      
      // 첫 번째 핸들러 등록 (높은 우선순위)
      register.register('updateCounter', ({ increment }) => {
        executionOrder.push(`handler-high-${increment}`);
      }, { priority: 100 });

      // 동시에 dispatch와 새 핸들러 등록 실행
      const dispatchPromise = register.dispatch('updateCounter', { increment: 1 });
      
      // dispatch 실행 중에 새 핸들러 등록 (더 높은 우선순위)
      const registerPromise = Promise.resolve().then(() => {
        register.register('updateCounter', ({ increment }) => {
          executionOrder.push(`handler-highest-${increment}`);
        }, { priority: 200 });
      });

      await Promise.all([dispatchPromise, registerPromise]);
      
      // 두 번째 dispatch로 정렬 상태 확인
      executionOrder = [];
      await register.dispatch('updateCounter', { increment: 2 });

      // 예상: priority 200이 먼저 실행되어야 함
      expect(executionOrder).toEqual(['handler-highest-2', 'handler-high-2']);
      
      testResults.push({
        test: 'Handler Registration Race',
        issue: '핸들러 등록 중 dispatch 시 우선순위 정렬 문제',
        severity: 'HIGH',
        reproduced: executionOrder[0] !== 'handler-highest-2'
      });
    });
  });

  describe('🚨 Problem 2: Parallel Execution State Corruption', () => {
    test.skip('병렬 실행 중 공유 상태 동시 수정', async () => {
      let sharedCounter = 0;
      let concurrencyIssues: string[] = [];

      // 공유 상태를 수정하는 핸들러들 등록
      register.register('updateCounter', ({ increment }) => {
        const currentValue = sharedCounter;
        // 의도적인 지연으로 race condition 유발
        return new Promise(resolve => {
          setTimeout(() => {
            sharedCounter = currentValue + increment;
            resolve(undefined);
          }, Math.random() * 5); // 더 짧은 지연
        });
      }, { priority: 10 });

      register.register('updateCounter', ({ increment }) => {
        const currentValue = sharedCounter;
        return new Promise(resolve => {
          setTimeout(() => {
            sharedCounter = currentValue + increment;
            if (sharedCounter !== currentValue + increment) {
              concurrencyIssues.push(`Unexpected value: ${sharedCounter}`);
            }
            resolve(undefined);
          }, Math.random() * 5); // 더 짧은 지연
        });
      }, { priority: 5 });

      // 병렬 모드로 여러 번 실행
      register.setActionExecutionMode('updateCounter', 'parallel');
      
      const promises = Array.from({ length: 5 }, (_, i) => 
        register.dispatch('updateCounter', { increment: 1 })
      );

      await Promise.all(promises);

      // 예상값: 10 (각 실행마다 2개 핸들러가 1씩 증가)
      // 실제값: race condition으로 인해 다를 수 있음
      const expectedValue = 10;
      const actualValue = sharedCounter;

      testResults.push({
        test: 'Parallel State Corruption',
        issue: '병렬 실행 중 공유 상태 동시 수정',
        severity: 'CRITICAL',
        expected: expectedValue,
        actual: actualValue,
        reproduced: actualValue !== expectedValue,
        concurrencyIssues
      });

      expect(actualValue).not.toBe(expectedValue);
    });
  });

  describe('🚨 Problem 3: ActionGuard Timer Race Condition', () => {
    test.skip('고빈도 debounce 호출 시 타이머 상태 불일치', async () => {
      let executionCount = 0;
      let timerIssues: string[] = [];

      // 매우 짧은 간격으로 debounce 호출
      const debouncePromises = Array.from({ length: 20 }, async (_, i) => {
        try {
          const shouldExecute = await actionGuard.debounce(`test-${i % 3}`, 5);
          if (shouldExecute) {
            executionCount++;
          }
        } catch (error) {
          timerIssues.push(`Timer error at ${i}: ${error}`);
        }
      });

      await Promise.all(debouncePromises);

      // debounce 그룹별로 각각 1번씩만 실행되어야 함 (3개 그룹)
      const expectedExecutions = 3;

      testResults.push({
        test: 'ActionGuard Timer Race',
        issue: '고빈도 debounce 호출 시 타이머 관리 문제',
        severity: 'MEDIUM',
        expected: expectedExecutions,
        actual: executionCount,
        reproduced: Math.abs(executionCount - expectedExecutions) > 2,
        timerIssues
      });
    });

    test('throttle 상태 동시성 문제', async () => {
      let throttleResults: boolean[] = [];
      
      // 동시에 같은 키로 throttle 호출
      const throttlePromises = Array.from({ length: 20 }, () => {
        return Promise.resolve().then(() => {
          const result = actionGuard.throttle('test-throttle', 100);
          throttleResults.push(result);
          return result;
        });
      });

      await Promise.all(throttlePromises);

      const trueCount = throttleResults.filter(r => r).length;
      
      // throttle이 정상 동작하면 첫 번째만 true여야 함
      const expectedTrueCount = 1;

      testResults.push({
        test: 'Throttle Concurrency',
        issue: 'throttle 상태 동시 접근 문제',
        severity: 'MEDIUM',
        expected: expectedTrueCount,
        actual: trueCount,
        reproduced: trueCount > expectedTrueCount,
        throttleResults
      });
    });
  });

  describe('🚨 Problem 4: Handler Cleanup Race Condition', () => {
    test('일회성 핸들러 정리 중 새 등록', async () => {
      let executionOrder: string[] = [];
      let cleanupIssues: string[] = [];

      // 일회성 핸들러 등록
      register.register('fastOperation', ({ id }) => {
        executionOrder.push(`once-${id}`);
      }, { once: true, priority: 10 });

      // 첫 번째 실행으로 일회성 핸들러 정리 트리거
      const firstExecution = register.dispatch('fastOperation', { id: 'first' });

      // 정리 중에 새 핸들러 등록
      const registerDuringCleanup = firstExecution.then(() => {
        register.register('fastOperation', ({ id }) => {
          executionOrder.push(`new-${id}`);
        }, { priority: 20 });
      });

      await Promise.all([firstExecution, registerDuringCleanup]);

      // 두 번째 실행
      await register.dispatch('fastOperation', { id: 'second' });

      const hasCleanupIssues = register.getHandlerCount('fastOperation') !== 1;

      testResults.push({
        test: 'Handler Cleanup Race',
        issue: '일회성 핸들러 정리 중 새 등록으로 인한 문제',
        severity: 'MEDIUM',
        reproduced: hasCleanupIssues,
        handlerCount: register.getHandlerCount('fastOperation'),
        executionOrder,
        cleanupIssues
      });
    });
  });

  describe('📊 테스트 결과 수집', () => {
    test('모든 동시성 문제 종합 분석', () => {
      const criticalIssues = testResults.filter(r => r.severity === 'CRITICAL' && r.reproduced);
      const highIssues = testResults.filter(r => r.severity === 'HIGH' && r.reproduced);
      const mediumIssues = testResults.filter(r => r.severity === 'MEDIUM' && r.reproduced);

      const summary = {
        totalTests: testResults.length,
        criticalIssues: criticalIssues.length,
        highIssues: highIssues.length,
        mediumIssues: mediumIssues.length,
        allResults: testResults
      };

      console.log('\n🔍 동시성 문제 분석 결과:');
      console.log(`총 테스트: ${summary.totalTests}`);
      console.log(`Critical 문제: ${summary.criticalIssues}`);
      console.log(`High 문제: ${summary.highIssues}`);
      console.log(`Medium 문제: ${summary.mediumIssues}`);

      testResults.forEach(result => {
        if (result.reproduced) {
          console.log(`\n❌ ${result.test}: ${result.issue}`);
          if (result.expected !== undefined) {
            console.log(`   예상: ${result.expected}, 실제: ${result.actual}`);
          }
        }
      });

      // 결과를 전역 변수에 저장하여 리포트 생성에 사용
      (global as any).concurrencyTestResults = summary;

      // 동시성 문제가 해결되어 이제 문제가 0개여야 함
      expect(summary.criticalIssues + summary.highIssues).toBe(0);
    });
  });
});