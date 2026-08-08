import {
  createWebMCPToolScope,
  type WebMCPToolScope,
  type WebMCPToolScopeOptions,
} from '@context-action/webmcp';
import type { ToolManagementInterface } from '@context-action/tool-protocol';
import { useEffect, useRef, useState } from 'react';

export interface WebMCPToolScopeState {
  readonly supported: boolean;
  readonly activeTools: readonly string[];
  readonly error?: Error;
}

const INITIAL_SCOPE_STATE: WebMCPToolScopeState = {
  supported: false,
  activeTools: [],
};

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
  const toolNamesKey = options.toolNames.join('\u0000');
  const exposedToKey = (options.exposedTo ?? []).join('\u0000');
  // Execution options are intentionally read through a ref. They can contain
  // non-serializable domain metadata, and should not tear down a browser
  // capability scope merely because a caller recreated an options object.
  const executionOptionsRef = useRef({
    context: options.context,
    callOptions: options.callOptions,
    getIdempotencyKey: options.getIdempotencyKey,
    beforeExecute: options.beforeExecute,
    errorMode: options.errorMode,
  });
  executionOptionsRef.current = {
    context: options.context,
    callOptions: options.callOptions,
    getIdempotencyKey: options.getIdempotencyKey,
    beforeExecute: options.beforeExecute,
    errorMode: options.errorMode,
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: WebMCP registration is keyed by the semantic option fields below, not the caller's transient object identity.
  useEffect(() => {
    if (!manager) {
      setState(INITIAL_SCOPE_STATE);
      return;
    }

    const lifecycleController = new AbortController();
    const mergedSignal = mergeSignals(options.signal, lifecycleController.signal);
    const scopeOptions: WebMCPToolScopeOptions = {
      sessionId: options.sessionId,
      toolNames: options.toolNames,
      document: options.document,
      exposedTo: options.exposedTo,
      signal: mergedSignal.signal,
      get context() { return executionOptionsRef.current.context; },
      get callOptions() { return executionOptionsRef.current.callOptions; },
      get getIdempotencyKey() { return executionOptionsRef.current.getIdempotencyKey; },
      get beforeExecute() { return executionOptionsRef.current.beforeExecute; },
      get errorMode() { return executionOptionsRef.current.errorMode; },
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
    toolNamesKey,
    exposedToKey,
  ]);

  return state;
}
