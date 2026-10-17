# Checklist

- Define draft, validation, result, activity, workflow state, and 3-Tier State Ownership up front
- Preserve `@context-action/*` zero-dependency boundary (no `@typespec/*`, `@oa-sdk/*`, `ttsc`, or `@wrtnlabs/evidence` in runtime package dependencies)
- Separate `BusinessActionIntent` and `LayoutActionIntent` in `contexts/` (`No Mixed Payloads`)
- Use `business/` for pure functions only, locking generated TS contracts via `@evidenceReview ./generated/dto.ts#... #hash`, Heading-Form `## @evidence`, or detached `evidenceFiles`
- Use a state machine when the flow has more than one async phase
- Split handlers by concern instead of keeping one large registry file, using `Promise.allSettled` for parallel `@entityRoot` + `@aspectOf` aspect hydration
- Convert domain events to UI text in handler support or hooks
- Keep views render-only with file-header `@evidenceExclude`, 6-Level layout hierarchy, Two Golden Rules, and 4-Tier Semantic Z-Index tokens (`--z-base: 1` ~ `--z-toast: 1100`)
- Add at least one integration test for invalid, valid, and reset flows
- Register source files, link paired KO/EN docs, and pass `pnpm docs:management`, `pnpm llms:check`, and `pnpm convention:check`
