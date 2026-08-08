/**
 * React-oriented lifecycle helpers for ActionRegister.
 *
 * They are intentionally owned by @context-action/react: core remains a
 * framework-neutral action runtime with no React terminology in its API.
 */
import type {
  ActionHandler,
  ActionNames,
  ActionPayloadMap,
  ActionRegister,
  HandlerConfig,
  ResolvedHandlerConfig,
  UnregisterFunction,
} from '@context-action/core';
import { resolveHandlerConfig } from '@context-action/core';

export function createActionHandler<T extends ActionPayloadMap, K extends ActionNames<T>>(
  registry: ActionRegister<T>,
  action: K,
  handler: ActionHandler<T[K]>,
  config?: HandlerConfig<T[K]>,
): {
  register: () => UnregisterFunction;
  unregister: () => void;
  registerWithCleanup: () => () => void;
  config: ResolvedHandlerConfig<T[K]>;
} {
  const handlerId = config?.id
    ?? `react_${String(action)}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const registrationConfig: HandlerConfig<T[K]> = { ...config, id: handlerId };
  const finalConfig: ResolvedHandlerConfig<T[K]> = resolveHandlerConfig(
    registrationConfig,
    handlerId,
  );
  let unregister: UnregisterFunction | undefined;

  const unregisterCurrent = (): void => {
    unregister?.();
    unregister = undefined;
  };

  return {
    register: () => {
      unregisterCurrent();
      unregister = registry.register(action, handler, registrationConfig);
      return unregister;
    },
    unregister: unregisterCurrent,
    registerWithCleanup: () => {
      unregisterCurrent();
      unregister = registry.register(action, handler, registrationConfig);
      return unregisterCurrent;
    },
    config: finalConfig,
  };
}

export const ReactDevUtils = {
  enableDebugMode(): void {
    if (typeof window !== 'undefined') {
      (window as typeof window & { __CONTEXT_ACTION_REACT_DEBUG__?: boolean })
        .__CONTEXT_ACTION_REACT_DEBUG__ = true;
    }
  },
  disableDebugMode(): void {
    if (typeof window !== 'undefined') {
      (window as typeof window & { __CONTEXT_ACTION_REACT_DEBUG__?: boolean })
        .__CONTEXT_ACTION_REACT_DEBUG__ = false;
    }
  },
  isDebugMode(): boolean {
    return typeof window !== 'undefined'
      && Boolean((window as typeof window & { __CONTEXT_ACTION_REACT_DEBUG__?: boolean })
        .__CONTEXT_ACTION_REACT_DEBUG__);
  },
  log(component: string, action: string, message: string, data?: unknown): void {
    if (this.isDebugMode()) console.log(`🎯 [React-ActionRegister] [${component}] ${action}: ${message}`, data ?? '');
  },
  getStats<T extends ActionPayloadMap>(registry: ActionRegister<T>): {
    totalHandlers: number;
    reactHandlers: number;
    registryInfo: ReturnType<ActionRegister<T>['getRegistryInfo']>;
  } {
    const registryInfo = registry.getRegistryInfo();
    let reactHandlers = 0;
    registry.getRegisteredActions().forEach((action) => {
      registry.getActionStats(action as ActionNames<T>)?.handlersByPriority.forEach((group) => {
        group.handlers.forEach((handler) => {
          if (handler.id.includes('react')) reactHandlers += 1;
        });
      });
    });
    return { totalHandlers: registryInfo.totalHandlers, reactHandlers, registryInfo };
  },
};

export class ReactActionError extends Error {
  public readonly timestamp = Date.now();

  public constructor(
    message: string,
    public readonly action: string,
    public readonly payload?: unknown,
    public readonly handlerId?: string,
    originalError?: Error,
  ) {
    super(message);
    this.name = 'ReactActionError';
    if (originalError?.stack) this.stack = originalError.stack;
  }

  static fromActionError(
    originalError: Error,
    action: string,
    payload?: unknown,
    handlerId?: string,
  ): ReactActionError {
    return new ReactActionError(
      `Action '${action}' failed: ${originalError.message}`,
      action,
      payload,
      handlerId,
      originalError,
    );
  }
}

export function isReactActionError(error: unknown): error is ReactActionError {
  return error instanceof ReactActionError;
}
