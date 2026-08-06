/**
 * Simple tests for actions and actionsWithResult getters
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface SimpleTestActions extends ActionPayloadMap {
  testAction: { value: string };
  voidAction: void;
}

describe('ActionRegister - Simple Actions Tests', () => {
  let actionRegister: ActionRegister<SimpleTestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<SimpleTestActions>({
      name: 'SimpleTestRegister',
      registry: { debug: false }
    });
  });

  afterEach(() => {
    actionRegister.destroy();
  });

  it('should provide actions getter', () => {
    expect(typeof actionRegister.actions).toBe('object');
    expect(actionRegister.actions).toBeDefined();
  });

  it('should provide actionsWithResult getter', () => {
    expect(typeof actionRegister.actionsWithResult).toBe('object');
    expect(actionRegister.actionsWithResult).toBeDefined();
  });

  it('should cache dispatchers after handler registration', async () => {
    actionRegister.register('testAction', () => 'registered', { id: 'test-handler' });
    const dispatcher = actionRegister.actions.testAction;
    const resultDispatcher = actionRegister.actionsWithResult.testAction;

    expect(typeof dispatcher).toBe('function');
    expect(dispatcher).toBe(actionRegister.actions.testAction);
    expect(resultDispatcher).toBe(actionRegister.actionsWithResult.testAction);

    await expect(dispatcher({ value: 'ignored' })).resolves.toBeUndefined();
    await expect(resultDispatcher({ value: 'ignored' })).resolves.toMatchObject({
      success: true,
      execution: { handlersExecuted: 1 },
    });
  });

  it('should work with registered actions', async () => {
    // Register a simple handler
    actionRegister.register('testAction', (payload) => {
      return { success: true, value: payload.value };
    }, { id: 'test-handler', priority: 100 });

    // Test actions
    expect(typeof actionRegister.actions.testAction).toBe('function');
    expect(typeof actionRegister.actionsWithResult.testAction).toBe('function');

    // Test void action
    actionRegister.register('voidAction', () => {
      return { success: true };
    }, { id: 'void-handler', priority: 100 });

    expect(typeof actionRegister.actions.voidAction).toBe('function');
    expect(typeof actionRegister.actionsWithResult.voidAction).toBe('function');
  });

  it('should execute actions correctly', async () => {
    // Register handler
    actionRegister.register('testAction', (payload) => {
      return { success: true, value: payload.value };
    }, { id: 'test-handler', priority: 100 });

    // Test actions execution
    await expect(
      actionRegister.actions.testAction({ value: 'test' })
    ).resolves.toBeUndefined();

    // Test actionsWithResult execution
    const result = await actionRegister.actionsWithResult.testAction({ value: 'test' });
    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({ success: true, value: 'test' });
  });

  it('should execute void actions correctly', async () => {
    // Register void handler
    actionRegister.register('voidAction', () => {
      return { success: true };
    }, { id: 'void-handler', priority: 100 });

    // Test void actions execution
    await expect(
      actionRegister.actions.voidAction()
    ).resolves.toBeUndefined();

    // Test void actionsWithResult execution
    const result = await actionRegister.actionsWithResult.voidAction();
    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({ success: true });
  });
});
