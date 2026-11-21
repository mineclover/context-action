[**context-action-monorepo v1.0.1**](../../../../README.md)

***

[context-action-monorepo](../../../../README.md) / [packages/xstate/src/effect](../README.md) / EffectRunnerPort

# Type Alias: EffectRunnerPort\<TEffect\>

> **EffectRunnerPort**&lt;`TEffect`&gt; = (&lt;`TValue`&gt;(`effect`, `options?`) => `Promise`&lt;`TValue`&gt;) \| \{ `runPromise`: `Promise`&lt;`TValue`&gt;; \}

Defined in: [packages/xstate/src/effect.ts:75](https://github.com/mineclover/context-action/blob/main/packages/xstate/src/effect.ts#L75)

Effect v3/v4 execution port: accepts either an Effect `ManagedRuntime.runPromise`
callable or `{ runPromise(effect, { signal }) }`.

## Type Parameters

### TEffect

`TEffect` = `unknown`
