import {
  ActionRegister,
  type ActionCommandController,
  type ActionCommandHandler,
  type ActionDispatcherWithResult,
  type ActionHandlerStats,
  type ActionPayload,
  type ActionPayloadMap,
  type ActionRegistryInfo,
  type ActionResultMap,
  type CommandConfig,
  type ExecutionResult,
  type HandlerError,
  type HandlerExecutionOutcome,
  type HandlerExecutionStatus,
} from '@context-action/core';

interface ConsumerActions extends ActionPayloadMap {
  save: { id: string };
  reset: void;
}

interface ConsumerResults extends ActionResultMap<ConsumerActions> {
  save: { persisted: true };
}

type Assert<T extends true> = T;
type Equal<Left, Right> = (
  <Value>() => Value extends Left ? 1 : 2
) extends (
  <Value>() => Value extends Right ? 1 : 2
)
  ? true
  : false;

type SavePayloadIsPublic = Assert<
  Equal<ActionPayload<ConsumerActions, 'save'>, { id: string }>
>;

describe('public core type exports', () => {
  it('supports consumer imports for diagnostics, registry introspection, and result dispatching', async () => {
    const register = new ActionRegister<ConsumerActions, ConsumerResults>();
    const payload: ActionPayload<ConsumerActions, 'save'> = { id: 'save-1' };

    const commandConfig: CommandConfig<void> = { id: 'reset-command', priority: 10 };
    const commandHandler: ActionCommandHandler<void> = (
      _payload,
      controller: ActionCommandController<void>,
    ) => {
      if (controller.signal?.aborted) return;
    };

    register.registerCommand('reset', commandHandler, commandConfig);
    register.registerResult('save', () => ({ persisted: true } as const));

    const dispatchWithResult: ActionDispatcherWithResult<ConsumerActions, ConsumerResults> =
      register.dispatchWithResult.bind(register);
    const execution: ExecutionResult<ConsumerResults['save']> = await dispatchWithResult(
      'save',
      payload,
    );
    const registryInfo: ActionRegistryInfo<ConsumerActions> = register.getRegistryInfo();
    const actionStats: ActionHandlerStats<ConsumerActions> | null = register.getActionStats('save');
    const errors: HandlerError[] = execution.errors;
    const status: HandlerExecutionStatus = execution.handlers[0]?.status ?? 'skipped';
    const winner: HandlerExecutionOutcome<ConsumerResults['save']> | undefined =
      execution.raceDiagnostics?.winner;

    expect(registryInfo.registeredActions).toEqual(['reset', 'save']);
    expect(actionStats?.action).toBe('save');
    expect(errors).toEqual([]);
    expect(status).toBe('succeeded');
    expect(winner).toBeUndefined();

    register.destroy();
  });
});
