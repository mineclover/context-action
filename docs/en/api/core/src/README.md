[**context-action-monorepo v1.0.1**](../../../README.md)

***

[context-action-monorepo](../../../README.md) / packages/core/src

# packages/core/src

## Classes

- [ActionRegister](classes/ActionRegister.md)
- [ActionResultProcessingError](classes/ActionResultProcessingError.md)
- [ActionAttemptSupersededError](classes/ActionAttemptSupersededError.md)
- [ActionValidationError](classes/ActionValidationError.md)
- [ActionTimeoutError](classes/ActionTimeoutError.md)
- [ActionRegisterDestroyedError](classes/ActionRegisterDestroyedError.md)

## Interfaces

- [ActionSchemaLike](interfaces/ActionSchemaLike.md)
- [PipelineController](interfaces/PipelineController.md)
- [ActionEffectController](interfaces/ActionEffectController.md)
- [ActionGuardController](interfaces/ActionGuardController.md)
- [ActionResultController](interfaces/ActionResultController.md)
- [ActionObserverEvent](interfaces/ActionObserverEvent.md)
- [ObserverConfig](interfaces/ObserverConfig.md)
- [GuardConfig](interfaces/GuardConfig.md)
- [EffectConfig](interfaces/EffectConfig.md)
- [HandlerConfig](interfaces/HandlerConfig.md)
- [ResolvedHandlerConfig](interfaces/ResolvedHandlerConfig.md)
- [HandlerExecutionOutcome](interfaces/HandlerExecutionOutcome.md)
- [ActionRegisterConfig](interfaces/ActionRegisterConfig.md)
- [DispatchOptions](interfaces/DispatchOptions.md)
- [ExecutionResult](interfaces/ExecutionResult.md)
- [HandlerError](interfaces/HandlerError.md)
- [ActionRegistryInfo](interfaces/ActionRegistryInfo.md)
- [ActionHandlerStats](interfaces/ActionHandlerStats.md)

## Type Aliases

- [ActionPayloadMap](type-aliases/ActionPayloadMap.md)
- [ActionNames](type-aliases/ActionNames.md)
- [ActionPayload](type-aliases/ActionPayload.md)
- [ActionResultMap](type-aliases/ActionResultMap.md)
- [ActionResult](type-aliases/ActionResult.md)
- [HandlerRole](type-aliases/HandlerRole.md)
- [ActionObserverHandler](type-aliases/ActionObserverHandler.md)
- [ActionHandler](type-aliases/ActionHandler.md)
- [ActionEffectHandler](type-aliases/ActionEffectHandler.md)
- [ActionGuardHandler](type-aliases/ActionGuardHandler.md)
- [ActionResultHandler](type-aliases/ActionResultHandler.md)
- [HandlerScheduling](type-aliases/HandlerScheduling.md)
- [HandlerErrorPolicy](type-aliases/HandlerErrorPolicy.md)
- [HandlerExecutionStatus](type-aliases/HandlerExecutionStatus.md)
- [ExecutionMode](type-aliases/ExecutionMode.md)
- [UnregisterFunction](type-aliases/UnregisterFunction.md)
- [DispatchArgs](type-aliases/DispatchArgs.md)
- [ReservedActionKey](type-aliases/ReservedActionKey.md)
- [ProxyActionKey](type-aliases/ProxyActionKey.md)
- [ActionDispatcherWithResult](type-aliases/ActionDispatcherWithResult.md)
- [ActionDispatcher](type-aliases/ActionDispatcher.md)

## Functions

- [isActionResultProcessingError](functions/isActionResultProcessingError.md)
- [isActionValidationError](functions/isActionValidationError.md)
- [isActionTimeoutError](functions/isActionTimeoutError.md)
- [isActionRegisterDestroyedError](functions/isActionRegisterDestroyedError.md)
- [executeSequential](functions/executeSequential.md)
- [executeParallel](functions/executeParallel.md)
- [executeRace](functions/executeRace.md)
- [resolveHandlerConfig](functions/resolveHandlerConfig.md)
