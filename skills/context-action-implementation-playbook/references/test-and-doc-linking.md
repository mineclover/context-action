# Test And Doc Linking

Use this after the scenario structure exists.

## Minimum verification

- invalid flow blocks submission
- valid flow reaches success
- post-success draft change invalidates stale result
- reset restores baseline

## Recommended commands

- `pnpm test:canonical-example -- --runInBand`
- `pnpm --dir example type-check`
- `pnpm --dir example build:fast`
- `pnpm docs:build`

## Discoverability checklist

- register source files for the new page and key modules
- add docs link from the page or overview entry
- add docs sidebar entry if a new document was added
- add route discovery from PatternsOverview or a scenario library page
