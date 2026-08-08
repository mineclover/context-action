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

/**
 * Connect a canonical tool registry to the current component lifecycle.
 * Memoize `options` so unrelated renders do not re-register WebMCP tools.
 */
export function useWebMCPToolScope(
  manager: ToolManagementInterface | null | undefined,
  options: WebMCPToolScopeOptions,
): WebMCPToolScopeState {
  const [state, setState] = useState<WebMCPToolScopeState>(INITIAL_SCOPE_STATE);

  useEffect(() => {
    if (!manager) {
      setState(INITIAL_SCOPE_STATE);
      return;
    }

    let disposed = false;
    let scope: WebMCPToolScope | undefined;
    void createWebMCPToolScope(manager, options).then((nextScope) => {
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
      scope?.dispose();
    };
  }, [manager, options]);

  return state;
}
