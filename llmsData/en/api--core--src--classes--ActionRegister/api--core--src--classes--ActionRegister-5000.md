---
document_id: api--core--src--classes--ActionRegister
category: api
source_path: en/api/core/src/classes/ActionRegister.md
character_limit: 5000
last_update: '2026-08-09T03:26:32.459Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Class: ActionRegister\<T, TResultMap\>

context-action-monorepo v1.0.1 context-action-monorepo / packages/core/src / ActionRegister Class: ActionRegister\<T, TResultMap\> Defined in: packages/core/src/ActionRegister.ts:136 Action Register for managing action handlers with priority-based execution Central action registration and dispatch system providing type-safe action pipeline management. Supports sequential, parallel, and race execution modes with advanced handler filtering, throttling, debouncing, and comprehensive result collection. Template TActionMap Action payload mapping interface extending ActionPayloadMap See - https://mineclover.github.io/context-action/en/guide/patterns/action/ - https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage - https://mineclover.github.io/context-action/en/guide/patterns/action/register-delegation Type Parameters Generic type T T extends ActionPayloadMap = Record\<string, unknown\> TResultMap TResultMap extends ActionResultMap&lt;T&gt; = \{ \} Accessors actions Get Signature > get actions(): { [K in string]: (args: DispatchArgs<T[K]>) => Promise<void> } Defined in: packages/core/src/ActionRegister.ts:257 🆕 Action-based dispatcher Provides function-based access to actions for more convenient dispatching. Each action becomes a callable function that can be invoked directly. Example Returns { [K in string]: (args: DispatchArgs<T[K]>) => Promise<void> } actionsWithResult Get Signature > get actionsWithResult(): { [K in string]: (args: DispatchArgs<T[K]>) => Promise<ExecutionResult<ActionResult<TResultMap, K>>> } Defined in: packages/core/src/ActionRegister.ts:311 Actions-based dispatching with result collection Provides a function-based interface for dispatching actions with detailed execution results. Each registered action becomes a callable function that returns ExecutionResult. Example Returns { [K in string]: (args: DispatchArgs<T[K]>) => Promise<ExecutionResult<ActionResult<TResultMap, K>>> } Proxy object with action functions that return ExecutionResult Constructors Constructor > new ActionRegister\<T, TResultMap\>(config?): ActionRegister\<T, TResultMap\> Defined in: packages/core/src/ActionRegister.ts:199 Parameters config? ActionRegisterConfig = {} Returns ActionRegister\<T, TResultMap\> Methods register() Call Signature > register&lt;K&gt;(action, handler, config?): UnregisterFunction Defined in: packages/core/src/ActionRegister.ts:357 Register an action handler with optional configuration Type Parameters K K extends string Parameters action Type parameter K The action type to register handler for handler ActionResultHandler\<T\[K\], ActionResult\<TResultMap, K\>\> The handler function to execute config? HandlerConfig\<T\[K\]\> Optional handler configuration including priority, timing, and lifecycle options. Ret

Key points:
• 'strict': throw ActionValidationError (default)
• 'warn': console.warn and continue execution
• 'silent': ignore validation errors silently