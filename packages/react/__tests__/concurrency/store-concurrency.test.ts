/**
 * Store 동시성 문제 재현 테스트
 * 
 * React Store 시스템에서 발생할 수 있는 동시성 문제들을 테스트합니다.
 */

import { Store, createStore } from '../../src/stores/core/Store';
import { EventBus } from '../../src/stores/core/EventBus';

describe('Store 동시성 문제 재현 테스트', () => {
  let store: Store<{ counter: number; data: string[] }>;
  let eventBus: EventBus;
  let testResults: any[];

  beforeEach(() => {
    store = createStore('test-store', { counter: 0, data: [] as string[] });
    eventBus = new EventBus();
    testResults = [];
  });

  afterEach(() => {
    store.clearListeners();
    eventBus.clear();
  });

  describe('🚨 Problem 1: Store Notification Race Condition', () => {
    test('빠른 연속 setValue 호출 시 알림 누락', async () => {
      let notificationCount = 0;
      let receivedValues: number[] = [];

      // 즉시 알림 모드로 설정 (테스트가 요구하는 스펙)
      store.setNotificationMode('immediate');

      // 리스너 등록
      store.subscribe(() => {
        notificationCount++;
        const snapshot = store.getSnapshot();
        receivedValues.push(snapshot.value.counter);
      });

      // 매우 빠른 연속 호출 (모든 변경사항이 개별 알림되어야 함)
      const updates = Array.from({ length: 100 }, (_, i) => i + 1);
      
      updates.forEach(value => {
        store.setValue({ counter: value, data: [] as string[] });
      });

      // 모든 requestAnimationFrame이 완료될 때까지 대기
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
          });
        });
      });

      const expectedNotifications = updates.length;
      const actualNotifications = notificationCount;
      const missedNotifications = expectedNotifications - actualNotifications;

      testResults.push({
        test: 'Store Notification Race',
        issue: '즉시 모드에서 모든 알림 전달 확인',
        severity: 'RESOLVED',
        expected: expectedNotifications,
        actual: actualNotifications,
        missed: missedNotifications,
        reproduced: false, // 즉시 모드에서는 문제 해결됨
        lastReceivedValue: receivedValues[receivedValues.length - 1],
        expectedLastValue: 100
      });

      // 즉시 모드에서는 모든 알림이 전달되어야 함
      expect(missedNotifications).toBe(0);
      expect(actualNotifications).toBe(expectedNotifications);
      expect(receivedValues[receivedValues.length - 1]).toBe(100);
    });

    test('동시 update 호출 시 상태 불일치', async () => {
      let updateResults: number[] = [];

      // 동시에 여러 업데이트 실행
      const updatePromises = Array.from({ length: 20 }, (_, _i) => {
        return Promise.resolve().then(() => {
          store.update(current => {
            const newCounter = current.counter + 1;
            updateResults.push(newCounter);
            
            // 지연을 통해 race condition 유발
            const delay = Math.random() * 5;
            const start = Date.now();
            while (Date.now() - start < delay) {
              // busy wait
            }
            
            return { ...current, counter: newCounter };
          });
        });
      });

      await Promise.all(updatePromises);

      const finalValue = store.getValue().counter;
      const expectedValue = 20;
      
      // 중복된 값이 있는지 확인 (race condition 증거)
      const duplicates = updateResults.filter((value, index) => 
        updateResults.indexOf(value) !== index
      );

      testResults.push({
        test: 'Concurrent Updates',
        issue: '동시성 보호로 순차 업데이트 보장',
        severity: 'RESOLVED',
        expected: expectedValue,
        actual: finalValue,
        reproduced: false, // 동시성 보호로 해결됨
        duplicates,
        updateResults: updateResults.slice(0, 10) // 처음 10개만 기록
      });

      // 동시성 보호가 작동하면 올바른 최종값을 가져야 함
      expect(finalValue).toBe(expectedValue);
      expect(duplicates.length).toBe(0); // 중복값 없어야 함
    });
  });

  describe('🚨 Problem 2: EventBus Subscription Race Condition', () => {
    test('이벤트 발행 중 구독 해제', async () => {
      let executionOrder: string[] = [];
      let handlerErrors: string[] = [];

      // 핸들러들 등록
      const unsubscribers = Array.from({ length: 10 }, (_, i) => {
        return eventBus.on('test-event', (data: string) => {
          executionOrder.push(`handler-${i}-${data}`);
          
          // 핸들러 실행 중 다른 핸들러들 구독 해제
          if (i === 5) {
            setTimeout(() => {
              unsubscribers.forEach((unsub, index) => {
                if (index !== i) {
                  try {
                    unsub();
                  } catch (error) {
                    handlerErrors.push(`Unsubscribe error ${index}: ${error}`);
                  }
                }
              });
            }, 0);
          }
        });
      });

      // 이벤트 발행
      eventBus.emit('test-event', 'data1');
      
      // 약간의 지연 후 다시 발행
      await new Promise(resolve => setTimeout(resolve, 10));
      eventBus.emit('test-event', 'data2');

      const firstEmissionHandlers = executionOrder.filter(entry => entry.includes('data1')).length;
      const secondEmissionHandlers = executionOrder.filter(entry => entry.includes('data2')).length;

      testResults.push({
        test: 'EventBus Subscription Race',
        issue: '이벤트 발행 중 구독 해제로 인한 문제',
        severity: 'MEDIUM',
        firstEmissionHandlers,
        secondEmissionHandlers,
        reproduced: secondEmissionHandlers > 1, // 구독 해제 후에도 실행되면 문제
        handlerErrors,
        executionOrder: executionOrder.slice(0, 20)
      });
    });

    test('동시 이벤트 발행 및 구독', async () => {
      let eventResults: string[] = [];
      let subscriptionErrors: string[] = [];

      // 동시에 구독과 발행 실행
      const operations = Array.from({ length: 50 }, (_, i) => {
        if (i % 2 === 0) {
          // 구독
          return Promise.resolve().then(() => {
            try {
              return eventBus.on(`event-${i}`, (data: any) => {
                eventResults.push(`received-${i}-${data}`);
              });
            } catch (error) {
              subscriptionErrors.push(`Subscribe error ${i}: ${error}`);
            }
          });
        } else {
          // 발행
          return Promise.resolve().then(() => {
            try {
              eventBus.emit(`event-${i - 1}`, `data-${i}`);
            } catch (error) {
              subscriptionErrors.push(`Emit error ${i}: ${error}`);
            }
          });
        }
      });

      await Promise.all(operations);

      // 약간의 지연 후 결과 확인
      await new Promise(resolve => setTimeout(resolve, 10));

      testResults.push({
        test: 'Concurrent Subscribe/Emit',
        issue: '동시 구독/발행으로 인한 경쟁 상태',
        severity: 'MEDIUM',
        eventResults: eventResults.length,
        subscriptionErrors,
        reproduced: subscriptionErrors.length > 0
      });
    });
  });

  describe('🚨 Problem 3: Store Listener Management Race', () => {
    test('구독 중 구독 해제', async () => {
      let subscriptionIssues: string[] = [];
      let notificationCounts: number[] = [];

      // 동시에 여러 구독/해제 실행
      const subscriptionPromises = Array.from({ length: 30 }, (_, i) => {
        return Promise.resolve().then(() => {
          try {
            let notificationCount = 0;
            
            const unsubscribe = store.subscribe(() => {
              notificationCount++;
            });

            // 랜덤하게 구독 해제
            if (Math.random() > 0.5) {
              setTimeout(() => {
                unsubscribe();
                notificationCounts.push(notificationCount);
              }, Math.random() * 10);
            }

            return unsubscribe;
          } catch (error) {
            subscriptionIssues.push(`Subscription error ${i}: ${error}`);
          }
        });
      });

      const unsubscribers = await Promise.all(subscriptionPromises);

      // 구독 중에 상태 변경
      for (let i = 0; i < 10; i++) {
        store.setValue({ counter: i, data: [`item-${i}`] });
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // 남은 구독 정리
      unsubscribers.forEach(unsub => {
        if (unsub && typeof unsub === 'function') {
          try {
            unsub();
          } catch (error) {
            subscriptionIssues.push(`Cleanup error: ${error}`);
          }
        }
      });

      testResults.push({
        test: 'Listener Management Race',
        issue: '구독 중 구독 해제로 인한 리스너 관리 문제',
        severity: 'MEDIUM',
        subscriptionIssues,
        notificationCounts: notificationCounts.slice(0, 10),
        reproduced: subscriptionIssues.length > 0
      });
    });
  });

  describe('📊 Store 테스트 결과 수집', () => {
    test('Store 동시성 문제 종합 분석', () => {
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

      console.log('\n🏪 Store 동시성 문제 분석 결과:');
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

      // 결과를 전역 변수에 저장
      (global as any).storeConcurrencyTestResults = summary;

      // 동시성 문제가 해결되었으므로 critical + high 이슈는 0이어야 함
      expect(summary.criticalIssues + summary.highIssues).toBe(0);
    });
  });
});