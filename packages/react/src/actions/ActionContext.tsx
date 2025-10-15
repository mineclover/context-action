import type {
  ActionContextConfig,
  ActionContextReturn
} from './ActionContext.types';
import { createActionContextCore } from './ActionContextCore';
import { createActionContextAdvanced } from './ActionContextAdvanced';

/**
 * @fileoverview createActionContext - 통합 ActionContext 팩토리
 * 
 * 분리된 모듈들을 조합하여 완전한 ActionContext 기능 제공
 * - ActionContextCore: 핵심 기능 (~20K)
 * - ActionContextAdvanced: 고급 기능 (~15K) 
 * - ActionContextUtils: 유틸리티 (~11K)
 * 
 * @template T Action payload map type for complete type safety
 * @param config - Configuration options for the ActionRegister
 * @returns Object containing Provider, hooks, and utility functions
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/action/
 * @see https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
 * @see https://mineclover.github.io/context-action/en/guide/patterns/action/register-delegation
 */

// Function overload for new API (contextName first)
export function createActionContext<T extends {}>(
  contextName: string,
  config?: ActionContextConfig
): ActionContextReturn<T>;

// Function overload for legacy API (config only)
export function createActionContext<T extends {}>(
  config: ActionContextConfig
): ActionContextReturn<T>;

// Implementation
export function createActionContext<T extends {}>(
  contextNameOrConfig: string | ActionContextConfig = {},
  config?: ActionContextConfig
): ActionContextReturn<T> {
  // 핵심 기능 생성
  const coreContext = typeof contextNameOrConfig === 'string' 
    ? createActionContextCore<T>(contextNameOrConfig, config)
    : createActionContextCore<T>(contextNameOrConfig);
  
  // 고급 기능 생성 (지연 로딩)
  let advancedHooks: ReturnType<typeof createActionContextAdvanced<T>> | null = null;
  const getAdvancedHooks = () => {
    if (!advancedHooks) {
      advancedHooks = createActionContextAdvanced<T>(coreContext.useActionContext());
    }
    return advancedHooks;
  };
  
  // 유틸리티 기능 생성 (현재 사용하지 않음)
  // const utilsHooks = createActionContextUtils<T>(coreContext.useActionContext());

  // 통합된 훅들 반환
  return {
    Provider: coreContext.Provider,
    useActionContext: coreContext.useActionContext,
    useActionDispatch: coreContext.useActionDispatch,
    useActionHandler: <K extends keyof T>(
      action: K,
      handler: import('@context-action/core').ActionHandler<T[K]>,
      config?: import('@context-action/core').HandlerConfig
    ) => getAdvancedHooks().useActionHandler(action, handler, config),
    useActionRegister: coreContext.useActionRegister,
    useActionDispatchWithResult: () => getAdvancedHooks().useActionDispatchWithResult(),
    context: coreContext.context,
  };
}