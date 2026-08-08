import {
  createActionHandler,
  isReactActionError,
  ReactActionError,
  ReactDevUtils,
} from '../../src/actions/react-helpers';
import { ActionRegister, type ActionHandler, type ActionPayloadMap } from '@context-action/core';

interface TestActions extends ActionPayloadMap {
  updateUser: { id: string; name: string };
  resetApp: void;
}

describe('React action helpers', () => {
  let registry: ActionRegister<TestActions>;

  beforeEach(() => {
    registry = new ActionRegister<TestActions>({ name: 'ReactHelperTest' });
    (window as typeof window & { __CONTEXT_ACTION_REACT_DEBUG__?: boolean })
      .__CONTEXT_ACTION_REACT_DEBUG__ = false;
  });

  afterEach(() => {
    registry.destroy();
    delete (window as typeof window & { __CONTEXT_ACTION_REACT_DEBUG__?: boolean })
      .__CONTEXT_ACTION_REACT_DEBUG__;
  });

  it('registers a React lifecycle handler with replacement semantics', () => {
    const handler: ActionHandler<TestActions['updateUser']> = jest.fn();
    const manager = createActionHandler(registry, 'updateUser', handler, { id: 'profile-handler' });

    const first = manager.register();
    const second = manager.register();

    expect(manager.config).toMatchObject({ id: 'profile-handler', replaceExisting: true });
    expect(manager.config.cleanup).toBeUndefined();
    expect(registry.getHandlerCount('updateUser')).toBe(1);
    first();
    expect(registry.getHandlerCount('updateUser')).toBe(1);
    second();
    expect(registry.getHandlerCount('updateUser')).toBe(0);
  });

  it('returns a useEffect-compatible cleanup', () => {
    const manager = createActionHandler(registry, 'resetApp', jest.fn());
    const cleanup = manager.registerWithCleanup();

    expect(registry.getHandlerCount('resetApp')).toBe(1);
    cleanup();
    expect(registry.getHandlerCount('resetApp')).toBe(0);
  });

  it('preserves Core legacy blocking semantics and registration metadata', async () => {
    const cleanup = jest.fn();
    const condition = jest.fn(() => true);
    const manager = createActionHandler(registry, 'updateUser', () => {
      throw new Error('fatal React helper failure');
    }, {
      blocking: true,
      cleanup,
      condition,
      metadata: { source: 'react-helper' },
    });

    manager.register();
    await expect(registry.dispatch('updateUser', { id: 'u1', name: 'Ada' }))
      .rejects.toThrow('fatal React helper failure');
    expect(condition).toHaveBeenCalledWith({ id: 'u1', name: 'Ada' });
    expect(manager.config).toMatchObject({
      blocking: true,
      scheduling: 'await-before-next',
      errorPolicy: 'fatal',
      metadata: { source: 'react-helper' },
    });
    manager.unregister();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('keeps legacy non-blocking handlers start-and-continue', async () => {
    let release: (() => void) | undefined;
    const pending = new Promise<void>(resolve => { release = resolve; });
    const manager = createActionHandler(registry, 'updateUser', async () => {
      await pending;
    }, { blocking: false });
    const next = jest.fn();
    manager.register();
    registry.register('updateUser', next, { priority: -1 });

    const dispatch = registry.dispatch('updateUser', { id: 'u1', name: 'Ada' });
    expect(next).toHaveBeenCalledTimes(1);
    release?.();
    await dispatch;
    expect(manager.config).toMatchObject({
      scheduling: 'start-and-continue',
      errorPolicy: 'collect',
    });
  });

  it('keeps React diagnostics in the React adapter', () => {
    const logger = jest.spyOn(console, 'log').mockImplementation();
    ReactDevUtils.enableDebugMode();
    ReactDevUtils.log('Profile', 'save', 'registered');

    expect(logger).toHaveBeenCalledWith(
      '🎯 [React-ActionRegister] [Profile] save: registered',
      '',
    );
    expect(ReactDevUtils.getStats(registry).totalHandlers).toBe(0);
    logger.mockRestore();
  });

  it('retains the React error helper contract', () => {
    const error = ReactActionError.fromActionError(new Error('failed'), 'save', { id: 'u1' });
    expect(isReactActionError(error)).toBe(true);
    expect(error.action).toBe('save');
    expect(error.message).toBe("Action 'save' failed: failed");
  });
});
