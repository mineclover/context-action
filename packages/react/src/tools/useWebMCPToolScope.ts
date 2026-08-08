import {
  createWebMCPToolScope,
  type WebMCPToolScope,
  type WebMCPToolScopeOptions,
} from '@context-action/webmcp';
import type { ToolManagementInterface } from '@context-action/tool-protocol';
import { useEffect, useState } from 'react';

export interface WebMCPToolScopeState {
  readonly supported: boolean;
  readonly activeTools: readonly string[];
  readonly error?: Error;
}

const INITIAL_SCOPE_STATE: WebMCPToolScopeState = {
  supported: false,
  activeTools: [],
};

function stableValueKey(value: unknown): string {
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return String(value);
  }
}

function mergeSignals(
  external: AbortSignal | undefined,
  lifecycle: AbortSignal,
): { signal: AbortSignal; dispose: () => void } {
  if (!external) return { signal: lifecycle, dispose: () => {} };
  if (typeof AbortSignal.any === 'function') {
    return { signal: AbortSignal.any([external, lifecycle]), dispose: () => {} };
  }

  const controller = new AbortController();
  const abort = (signal: AbortSignal) => () => controller.abort(signal.reason);
  const abortExternal = abort(external);
  const abortLifecycle = abort(lifecycle);
  if (external.aborted) abortExternal();
  else external.addEventListener('abort', abortExternal, { once: true });
  if (lifecycle.aborted) abortLifecycle();
  else lifecycle.addEventListener('abort', abortLifecycle, { once: true });
  return {
    signal: controller.signal,
    dispose: () => {
      external.removeEventListener('abort', abortExternal);
      lifecycle.removeEventListener('abort', abortLifecycle);
    },
  };
}

/**
 * Connect a canonical tool registry to the current component lifecycle.
 * Memoize `options` so unrelated renders do not re-register WebMCP tools.
 */
export function useWebMCPToolScope(
  manager: ToolManagementInterface | null | undefined,
  options: WebMCPToolScopeOptions,
): WebMCPToolScopeState {
  const [state, setState] = useState<WebMCPToolScopeState>(INITIAL_SCOPE_STATE);
  const toolNamesKey = stableValueKey(options.toolNames);
  const exposedToKey = stableValueKey(options.exposedTo);
  const contextKey = stableValueKey(options.context);
  const callOptionsKey = stableValueKey(options.callOptions);

  // biome-ignore lint/correctness/useExhaustiveDependencies: WebMCP registration is keyed by the semantic option fields below, not the caller's transient object identity.
  useEffect(() => {
    if (!manager) {
      setState(INITIAL_SCOPE_STATE);
      return;
    }

    const lifecycleController = new AbortController();
    const mergedSignal = mergeSignals(options.signal, lifecycleController.signal);
    const scopeOptions: WebMCPToolScopeOptions = {
      ...options,
      signal: mergedSignal.signal,
    };
    let disposed = false;
    let scope: WebMCPToolScope | undefined;
    void createWebMCPToolScope(manager, scopeOptions).then((nextScope) => {
      if (disposed) {
        nextScope.dispose();
        return;
      }
      scope = nextScope;
      setState({
        supported: nextScope.supported,
        activeTools: nextScope.activeTools,
      });
    }, (error: unknown) => {
      if (!disposed) {
        setState({
          supported: false,
          activeTools: [],
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    });

    return () => {
      disposed = true;
      lifecycleController.abort(new Error('WebMCP scope disposed'));
      mergedSignal.dispose();
      scope?.dispose();
    };
  }, [
    manager,
    options.sessionId,
    options.document,
    options.signal,
    options.getIdempotencyKey,
    options.beforeExecute,
    toolNamesKey,
    exposedToKey,
    contextKey,
    callOptionsKey,
  ]);

  return state;
}
