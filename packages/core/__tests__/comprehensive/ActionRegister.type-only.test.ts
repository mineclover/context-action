/**
 * Tests for type-only declared actions (no actual handlers registered)
 * This tests the scenario where actions are declared in TypeScript interface
 * but no actual handlers are registered at runtime
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface TestActions extends ActionPayloadMap {
  userLogin: { userId: string; email: string };
  userLogout: void;
  processData: { data: any; type: string };
  // 타입으로만 선언된 액션들
  typeOnlyAction: { value: string };
  anotherTypeOnly: void;
}

describe('ActionRegister - Type-Only Actions Tests', () => {
  let actionRegister: ActionRegister<TestActions>;
  let consoleSpy: jest.SpyInstance;

  const enableDebugDiagnostics = () => {
    actionRegister.destroy();
    actionRegister = new ActionRegister<TestActions>({
      name: 'TypeOnlyTestRegister',
      registry: { debug: true },
    });
  };

  beforeEach(() => {
    actionRegister = new ActionRegister<TestActions>({
      name: 'TypeOnlyTestRegister',
      registry: { debug: false }
    });

    // Mock console.warn to capture warnings
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    actionRegister.destroy();
    consoleSpy.mockRestore();
  });

  describe('type-only actions (no handlers registered)', () => {
    beforeEach(() => {
      enableDebugDiagnostics();
    });

    it('should show warning for type-only actions with payload', async () => {
      // 타입으로만 선언된 액션 실행 (핸들러 없음)
      await actionRegister.dispatch('typeOnlyAction', { value: 'test' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("⚠️ Action 'typeOnlyAction' has no registered handlers")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('💡 Tip: Register a handler using registry.register()')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '📋 Available actions:',
        [] // 실제로 등록된 핸들러가 없으므로 빈 배열
      );
    });

    it('should show warning for type-only void actions', async () => {
      // 타입으로만 선언된 void 액션 실행 (핸들러 없음)
      await actionRegister.dispatch('anotherTypeOnly');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("⚠️ Action 'anotherTypeOnly' has no registered handlers")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '📋 Available actions:',
        [] // 실제로 등록된 핸들러가 없으므로 빈 배열
      );
    });

    it('should show empty available actions when no handlers are registered', async () => {
      // 아무 핸들러도 등록하지 않은 상태에서 액션 실행
      await actionRegister.dispatch('userLogin', { userId: '123', email: 'user@example.com' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '📋 Available actions:',
        [] // 핸들러가 등록되지 않았으므로 빈 배열
      );
    });

    it('should show only actually registered actions in available list', async () => {
      // 일부 액션만 핸들러 등록
      actionRegister.register('userLogin', (payload) => {
        return { success: true, userId: payload.userId };
      }, { id: 'login-handler', priority: 100 });

      actionRegister.register('userLogout', () => {
        return { success: true };
      }, { id: 'logout-handler', priority: 100 });

      // 등록되지 않은 액션 실행
      await actionRegister.dispatch('processData', { data: { name: 'test' }, type: 'json' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '📋 Available actions:',
        ['userLogin', 'userLogout'] // 실제로 등록된 핸들러만 표시
      );
    });
  });

  describe('mixed scenario (some handlers registered, some not)', () => {
    beforeEach(() => {
      enableDebugDiagnostics();
    });

    it('should show warning for unregistered actions even when others are registered', async () => {
      // 일부 액션만 핸들러 등록
      actionRegister.register('userLogin', (payload) => {
        return { success: true, userId: payload.userId };
      }, { id: 'login-handler', priority: 100 });

      // 등록되지 않은 액션 실행
      await actionRegister.dispatch('processData', { data: { name: 'test' }, type: 'json' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("⚠️ Action 'processData' has no registered handlers")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '📋 Available actions:',
        ['userLogin'] // 실제로 등록된 핸들러만 표시
      );
    });

    it('should not show warning for registered actions', async () => {
      // 핸들러 등록
      actionRegister.register('userLogin', (payload) => {
        return { success: true, userId: payload.userId };
      }, { id: 'login-handler', priority: 100 });

      // 등록된 액션 실행 (경고 없어야 함)
      await actionRegister.dispatch('userLogin', { userId: '123', email: 'user@example.com' });

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('actions getter with type-only actions', () => {
    beforeEach(() => {
      enableDebugDiagnostics();
    });

    it('should return undefined for type-only actions in actions getter', () => {
      // 타입으로만 선언된 액션들은 실제 핸들러가 없으므로 undefined 반환
      expect(typeof actionRegister.actions.typeOnlyAction).toBe('function');
      expect(typeof actionRegister.actions.anotherTypeOnly).toBe('function');
    });

    it('should show warning when calling type-only actions through actions getter', async () => {
      if (actionRegister.actions.typeOnlyAction) {
        await actionRegister.actions.typeOnlyAction({ value: 'test' });
        
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("⚠️ Action 'typeOnlyAction' has no registered handlers")
        );
      }
    });

    it('should return undefined for type-only actions in actionsWithResult getter', () => {
      // 타입으로만 선언된 액션들은 실제 핸들러가 없으므로 undefined 반환
      expect(typeof actionRegister.actionsWithResult.anotherTypeOnly).toBe('function');
    });
  });

  describe('production mode behavior with type-only actions', () => {
    it('does not show warnings for type-only actions when diagnostics are disabled', async () => {
      await actionRegister.dispatch('typeOnlyAction', { value: 'test' });
      await actionRegister.dispatch('anotherTypeOnly');

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should execute successfully for type-only actions in production', async () => {
      await expect(
        actionRegister.dispatch('typeOnlyAction', { value: 'test' })
      ).resolves.toBeUndefined();

      const result = await actionRegister.dispatchWithResult('anotherTypeOnly');
      expect(result.success).toBe(true);
    });
  });
});
