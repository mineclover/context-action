# Test And Doc Linking

Use this after the scenario structure exists.

## Minimum verification

- invalid flow blocks submission
- valid flow reaches success
- post-success draft change invalidates stale result
- reset restores baseline
- optional `@aspectOf` storage failure degrades gracefully (`Promise.allSettled`) without blocking the root view

## Recommended commands

- `pnpm docs:management`
- `pnpm llms:check`
- `pnpm convention:check`
- `pnpm test:canonical-example -- --runInBand`
- `pnpm --dir example type-check`
- `pnpm --dir example build:fast`
- `pnpm docs:build`

## Discoverability checklist

- register source files for the new page and key modules
- add paired KO/EN docs links (`docs/ko/...` and `docs/en/...`) and sync `llmsData/`
- add docs sidebar entry if a new document was added
- add route discovery from PatternsOverview or a scenario library page
