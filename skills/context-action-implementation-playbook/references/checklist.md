# Checklist

- Pick the right adoption level up front (**Level 1 Lite** -> **Level 2 Headless-First Symmetric DI** -> **Level 3 Full 6-Layer**, matching `packages/template-react` as the verified starter reference)
- Define draft, validation, result, activity, workflow state, and 3-Tier State Ownership up front
- Preserve `@context-action/*` zero-dependency boundary (no `@typespec/*`, `@oa-sdk/*`, `ttsc`, or `@wrtnlabs/evidence` in runtime package dependencies)
- Separate `BusinessActionIntent` and `LayoutActionIntent` in `contexts/` (`No Mixed Payloads`) and preserve `Action -> Store -> Ref -> HandlerRegistry` provider nesting
- Use `business/` for pure functions only (domain codes/events instead of UI copy), locking generated TS contracts via `@evidenceReview ./generated/dto.ts#... #hash`, Heading-Form `## @evidence`, or detached `evidenceFiles`
- Use a state machine when the flow has more than one async phase
- Split handlers by concern (`Draft` / `Submission` / `Layout`) using the 4-role hooks (`useActionGuard`, `useActionCommandHandler`, `useActionResultHandler`, `useActionObserver`), read stores lazily via `store.getValue()` (zero `useStoreValue` subscriptions in `handlers/`), never use deprecated `useActionEffectHandler` / `registerEffect`, and use `Promise.allSettled` for parallel `@entityRoot` + `@aspectOf` aspect hydration
- Keep `actions/` strictly free of Store imports/mutations (`no-store-access-in-actions`) and pass only semantic `dispatch` helpers
- Convert domain validation codes and activity events to UI text in handler support or `hooks/`
- Keep views render-only with file-header `@evidenceExclude`, 6-Level layout hierarchy, Two Golden Rules, and 4-Tier Semantic Z-Index tokens (`--z-base: 1` ~ `--z-toast: 1100`)
- Register any intentional deviation in `tools/context-action-lint/rule-exceptions.json` or `tools/context-action-lint/layered-surface-classification.json` (fail-closed)
- Add at least one integration test for invalid, valid, and reset flows
- Register source files, update `catalog/repository-surface/example-surface.v1.json` (if canonical routes/demos changed), link paired KO/EN docs, and pass `pnpm verify:surface-catalog`, `pnpm convention:check` (`--root <dir>` for external consumers), `pnpm docs:check`, and `pnpm verify:quick`
