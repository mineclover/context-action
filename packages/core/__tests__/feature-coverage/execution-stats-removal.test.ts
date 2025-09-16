/**
 * ExecutionStats Removal Tests
 * Verifies that v0.4.1 successfully removed the ExecutionStats system
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface StatsTestActions extends ActionPayloadMap {
  testAction: { value: string };
  performanceAction: { iterations: number };
}

describe('ExecutionStats Removal Tests - v0.4.1', () => {
  let actionRegister: ActionRegister<StatsTestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<StatsTestActions>({
      name: 'StatsRemovalTestRegistry',
      registry: { debug: false }
    });
  });

  afterEach(() => {
    actionRegister.destroy();
  });

  describe('🗑️ Removed APIs', () => {
    it('should not have clearExecutionStats method', () => {
      const actionRegister = new ActionRegister<StatsTestActions>();

      // 메서드가 존재하지 않음
      expect((actionRegister as any).clearExecutionStats).toBeUndefined();
      expect((actionRegister as any).clearActionExecutionStats).toBeUndefined();

      actionRegister.destroy();
    });

    it('should not have updateExecutionStats method', () => {
      const actionRegister = new ActionRegister<StatsTestActions>();

      // 내부 메서드도 존재하지 않아야 함
      expect((actionRegister as any).updateExecutionStats).toBeUndefined();

      actionRegister.destroy();
    });

    it('should not have executionStats property', () => {
      const actionRegister = new ActionRegister<StatsTestActions>();

      // 내부 executionStats Map이 존재하지 않아야 함
      expect((actionRegister as any).executionStats).toBeUndefined();

      actionRegister.destroy();
    });

    it('should return undefined for executionStats in getActionStats', () => {
      const actionRegister = new ActionRegister<StatsTestActions>();
      actionRegister.register('testAction', jest.fn());

      const stats = actionRegister.getActionStats('testAction');
      expect(stats?.executionStats).toBeUndefined();

      actionRegister.destroy();
    });
  });

  describe('📊 ActionStats Structure Changes', () => {
    it('should provide basic stats without execution tracking', () => {
      actionRegister.register('testAction', jest.fn(), { id: 'handler1', priority: 10 });
      actionRegister.register('testAction', jest.fn(), { id: 'handler2', priority: 20 });
      
      const stats = actionRegister.getActionStats('testAction');
      
      // 기본 통계는 여전히 제공
      expect(stats).toBeDefined();
      expect(stats?.action).toBe('testAction');
      expect(stats?.handlerCount).toBe(2);
      expect(stats?.handlersByPriority).toHaveLength(2);
      
      // ExecutionStats는 제거됨
      expect(stats?.executionStats).toBeUndefined();
      expect((stats as any)?.totalExecutions).toBeUndefined();
      expect((stats as any)?.totalDuration).toBeUndefined();
      expect((stats as any)?.successCount).toBeUndefined();
      expect((stats as any)?.errorCount).toBeUndefined();
    });

    it('should maintain handler information without execution history', () => {
      actionRegister.register('testAction', jest.fn(), { 
        id: 'test-handler',
        priority: 15,
        metadata: { version: '1.0.0' }
      });
      
      const stats = actionRegister.getActionStats('testAction');
      
      // 핸들러 정보는 유지
      expect(stats?.handlersByPriority[0].priority).toBe(15);
      expect(stats?.handlersByPriority[0].handlers).toHaveLength(1);
      expect(stats?.handlersByPriority[0].handlers[0].id).toBe('test-handler');
      
      // 실행 통계는 없음
      expect((stats?.handlersByPriority[0] as any).executionCount).toBeUndefined();
      expect((stats?.handlersByPriority[0] as any).averageDuration).toBeUndefined();
    });
  });

  describe('⚡ Performance Impact of Removal', () => {
    it('should not track execution statistics during dispatch', async () => {
      const handler = jest.fn(() => ({ processed: true }));
      actionRegister.register('testAction', handler);
      
      // 여러 번 실행
      for (let i = 0; i < 10; i++) {
        await actionRegister.dispatch('testAction', { value: `test-${i}` });
      }
      
      const stats = actionRegister.getActionStats('testAction');
      
      // 기본 구조 정보만 있고 실행 통계는 없음
      expect(stats?.handlerCount).toBe(1);
      expect(stats?.executionStats).toBeUndefined();
      expect((stats as any)?.totalExecutions).toBeUndefined();
    });

    it('should not accumulate execution data in memory', async () => {
      const handler = jest.fn(() => ({ result: Math.random() }));
      actionRegister.register('performanceAction', handler);
      
      // 많은 실행을 통해 메모리 누적이 없는지 확인
      const executionCount = 100;
      for (let i = 0; i < executionCount; i++) {
        await actionRegister.dispatch('performanceAction', { iterations: i });
      }
      
      expect(handler).toHaveBeenCalledTimes(executionCount);
      
      const stats = actionRegister.getActionStats('performanceAction');
      
      // 실행 통계 누적이 없어야 함
      expect(stats?.executionStats).toBeUndefined();
      expect((stats as any)?.totalExecutions).toBeUndefined();
      expect((stats as any)?.averageDuration).toBeUndefined();
    });

    it('should have faster dispatch without stats overhead', async () => {
      const handler = jest.fn();
      actionRegister.register('testAction', handler);
      
      const iterations = 50;
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        await actionRegister.dispatch('testAction', { value: `test-${i}` });
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / iterations;
      
      // ExecutionStats 제거로 인한 성능 향상 검증
      expect(averageTime).toBeLessThan(5); // 매우 빠른 실행
      expect(handler).toHaveBeenCalledTimes(iterations);
    });
  });

  describe('🧹 Code Simplification Verification', () => {
    it('should not have timing overhead in dispatchWithResult', async () => {
      const handler = jest.fn(() => ({ success: true }));
      actionRegister.register('testAction', handler);
      
      const result = await actionRegister.dispatchWithResult('testAction', { value: 'test' });
      
      // 기본 실행 정보는 여전히 제공 (execution 객체)
      expect(result.execution).toBeDefined();
      expect(result.execution.handlersExecuted).toBe(1);
      expect(result.execution.duration).toBeGreaterThanOrEqual(0);
      
      // ExecutionStats 관련 필드는 없음
      expect((result as any).executionStats).toBeUndefined();
      expect((result as any).statisticsUpdated).toBeUndefined();
    });

    it('should maintain registry information without execution tracking', () => {
      actionRegister.register('testAction', jest.fn());
      actionRegister.register('performanceAction', jest.fn());
      
      const registryInfo = actionRegister.getRegistryInfo();
      
      // 기본 레지스트리 정보는 유지
      expect(registryInfo.name).toBe('StatsRemovalTestRegistry');
      expect(registryInfo.totalActions).toBe(2);
      expect(registryInfo.totalHandlers).toBe(2);
      
      // ExecutionStats 관련 정보는 없음
      expect((registryInfo as any).totalExecutions).toBeUndefined();
      expect((registryInfo as any).averageExecutionTime).toBeUndefined();
    });

    it('should not have debug overhead from stats tracking', async () => {
      // Debug 모드에서도 stats 추적이 없어야 함
      const debugRegister = new ActionRegister<StatsTestActions>({
        registry: { debug: true }
      });
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const handler = jest.fn();
      
      debugRegister.register('testAction', handler);
      await debugRegister.dispatch('testAction', { value: 'debug-test' });
      
      // Debug 로그가 있을 수 있지만 stats 관련 로그는 없어야 함
      const debugLogs = consoleSpy.mock.calls.map(call => call.join(' '));
      const statsLogs = debugLogs.filter(log => 
        log.includes('execution stats') || 
        log.includes('totalExecutions') ||
        log.includes('averageDuration')
      );
      
      expect(statsLogs).toHaveLength(0);
      
      consoleSpy.mockRestore();
      debugRegister.destroy();
    });
  });

  describe('🔄 Backward Compatibility', () => {
    it('should maintain existing API surface without stats methods', () => {
      const actionRegister = new ActionRegister<StatsTestActions>();

      // 존재해야 하는 메서드들
      expect(typeof actionRegister.register).toBe('function');
      expect(typeof actionRegister.dispatch).toBe('function');
      expect(typeof actionRegister.dispatchWithResult).toBe('function');
      expect(typeof actionRegister.getActionStats).toBe('function');
      expect(typeof actionRegister.getRegistryInfo).toBe('function');
      expect(typeof actionRegister.clearAll).toBe('function');
      expect(typeof actionRegister.destroy).toBe('function');

      // 제거된 메서드들
      expect((actionRegister as any).clearExecutionStats).toBeUndefined();
      expect((actionRegister as any).clearActionExecutionStats).toBeUndefined();
      expect((actionRegister as any).updateExecutionStats).toBeUndefined();

      actionRegister.destroy();
    });

    it('should handle getActionStats calls without breaking', () => {
      actionRegister.register('testAction', jest.fn());
      
      // getActionStats는 여전히 작동하지만 executionStats는 undefined
      expect(() => {
        const stats = actionRegister.getActionStats('testAction');
        expect(stats).toBeDefined();
        expect(stats?.executionStats).toBeUndefined();
      }).not.toThrow();
    });
  });
});