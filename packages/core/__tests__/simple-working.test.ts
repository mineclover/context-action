/**
 * Simple working test to verify Jest and TypeScript setup
 */

import { ActionRegister, type ActionPayloadMap } from '../src';

interface SimpleTestActions extends ActionPayloadMap {
  simpleAction: { message: string };
  voidAction: void;
  numberAction: number;
}

describe('Simple Working Test', () => {
  let actionRegister: ActionRegister<SimpleTestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<SimpleTestActions>();
  });

  afterEach(() => {
    actionRegister.clearAll();
  });

  it('should create ActionRegister instance', () => {
    expect(actionRegister).toBeInstanceOf(ActionRegister);
  });

  it('should register and dispatch simple action', async () => {
    const mockHandler = jest.fn();
    
    actionRegister.register('simpleAction', mockHandler);
    
    await actionRegister.dispatch('simpleAction', { message: 'test' });
    
    expect(mockHandler).toHaveBeenCalledWith(
      { message: 'test' },
      expect.any(Object) // PipelineController
    );
  });

  it('should handle void action', async () => {
    const mockHandler = jest.fn();
    
    actionRegister.register('voidAction', mockHandler);
    
    await actionRegister.dispatch('voidAction');
    
    expect(mockHandler).toHaveBeenCalledWith(
      undefined,
      expect.any(Object)
    );
  });

  it('should handle number payload', async () => {
    const mockHandler = jest.fn();
    
    actionRegister.register('numberAction', mockHandler);
    
    await actionRegister.dispatch('numberAction', 42);
    
    expect(mockHandler).toHaveBeenCalledWith(
      42,
      expect.any(Object)
    );
  });

  it('should handle handler with return value', async () => {
    actionRegister.register('simpleAction', () => {
      return { processed: true };
    });

    const result = await actionRegister.dispatchWithResult('simpleAction', { message: 'test' }, {
      result: { collect: true }
    });

    expect(result.success).toBe(true);
    expect(result.results).toContainEqual({ processed: true });
  });
});