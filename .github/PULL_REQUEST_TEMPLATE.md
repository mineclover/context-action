## Summary
<!-- Describe what changed and why. -->

## Change Class & Traceability
- **Change Class:** `Public API` | `Behavior or pattern` | `Architecture` | `Bug` | `Documentation/maintenance`
- **Issue / Decision ID:** <!-- Required by pnpm change:traceability: e.g. Refs #123 or CA-SURFACE-CATALOG-001 -->

## Surface Catalog & Documentation Impact
- [ ] Updated `catalog/repository-surface/*.v1.json` if packages/exports, canonical `example/` routes/demos, or managed/root docs changed (`pnpm verify:surface-catalog`).
- [ ] Kept paired `docs/en/**` and `docs/ko/**` pages aligned and synced `llmsData/` (`pnpm build:llms-generator && pnpm llms:sync-docs --changed-files a.md,b.md`).

## Verification
- [ ] Local-First receipt refreshed on a clean working tree (`pnpm verify` or `pnpm verify:quick` + `pnpm verify:receipt`).
- [ ] `pnpm docs:check` (when documentation changed)
- [ ] `pnpm verify:surface-catalog && pnpm convention:check && pnpm package-boundary:check`
- [ ] Focused package/example tests (`pnpm test`, `pnpm type-check`, `pnpm --filter example check && pnpm example:build`, as applicable)
