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
