# Implementation Playbook Standard Convention

This document turns the implementation-playbook example into a reusable standard convention for the repository. The goal is not just to keep one demo readable, but to make it possible to design, implement, test, and document more complex flows in the same way.

## When to Use This Convention

Prefer this convention when at least two of these are true:

- input validation and follow-up processing should be separated
- the workflow has two or more async phases
- success, failure, reset, and retry states all matter
- side effects such as activity logs, analytics, or ref focus move with the workflow
- docs, examples, and tests should all share the same implementation contract

Smaller features may use fewer business or view files, but any action handler still follows the Handler Registry rule below.

## Standard Folder Structure

```text
scenario/
├── ScenarioExample.tsx
├── ScenarioExamplePage.tsx
├── contexts/
│   └── ScenarioContexts.tsx
├── business/
│   ├── scenarioDraft.ts
│   ├── scenarioValidation.ts
│   ├── scenarioResult.ts
│   ├── scenarioActivity.ts
│   ├── scenarioStateMachine.ts
│   └── scenarioBusiness.ts
├── handlers/
│   ├── ScenarioHandlers.tsx
│   ├── scenarioHandlerSupport.ts
│   ├── useScenarioDraftHandlers.tsx
│   └── useScenarioSubmissionHandlers.tsx
├── actions/
│   └── useScenarioActions.ts
├── hooks/
│   └── useScenarioData.ts
└── views/
    └── ScenarioView.tsx
```

## Layer Responsibilities

### `contexts/`

- define Action, Store, and Ref boundaries
- define initial state
- compose the state types used across the scenario

### `business/`

- pure functions only
- draft defaults
- validation issue calculation
- result calculation
- activity event definitions
- explicit state transition function

Do not put UI wording, DOM focus, or analytics calls here.

### `handlers/`

- read the latest store values
- call pure `business` functions
- apply state-machine transitions
- orchestrate side effects such as ref focus, scroll, and logging

Split handlers by concern:

- `useScenarioDraftHandlers`
- `useScenarioSubmissionHandlers`
- and later `useScenarioApprovalHandlers`, `useScenarioSyncHandlers`, etc.

Every handler, including a single-handler feature, is registered through the domain Handler Registry. Pages, views, and context files mount or compose the registry; they do not call `use*ActionHandler` directly.

### `actions/`

- expose dispatch helpers for the view
- allow only light payload shaping

### `hooks/`

- subscribe to stores
- compute view-facing derived values
- interpret state-machine state into labels and messages

### `views/`

- render state and forward user intent only
- do not embed validation rules, result calculation, or workflow transitions

## Structural Convention Gate

`pnpm convention:check` automatically recognizes a canonical feature root when
it contains sibling `contexts/` and `handlers/` directories. The gate then
checks the direct layer folders without applying the canonical naming rules to
advanced or compatibility surfaces that have not entered migration.

The current gate enforces:

- `contexts/` files end in `Context` or `Contexts`.
- `business/` files use lower-camel or kebab-case names and remain free of
  React and `@context-action/*` imports.
- `handlers/` files use `*HandlerRegistry`, `*Handlers`, `*HandlerSupport`, or
  `*HandlerDefinitions` names (plus `index` and `handler-registry` entry
  points).
- `actions/` files use `*Actions` or `*ActionHandlers` names.
- `hooks/` files use `use*` names, with `index` and `types` entry points.
- `views/` files use `*View`, `*Views`, or a named composite such as `*Grid`.
- Context modules do not import downstream layer folders, and views do not
  import framework runtime, business, or handler modules directly.

Derived business values belong in a hook or facade before they reach a view.
For example, the implementation-playbook packet and quote previews are
computed by their Data Hooks, while the views only render the returned model.
Run the gate together with the usecase-specific checks:

```bash
pnpm convention:check
pnpm --filter example check
```

The gate currently covers 31 canonical roots with zero layer-path/name
violations. Advanced and compatibility roots remain explicitly outside this
automatic naming scope until their migration classification changes.

Non-canonical `handlers/` directories are not silently ignored. Their current
classification and rationale live in
`tools/context-action-lint/layered-surface-classification.json`; the checker
requires every such directory to be listed as either `advanced` or
`compatibility`. The current manifest contains no advanced comparison surfaces
and one compatibility object-context surface. The conditional permission,
action-based mouse, context-store mouse, and enhanced context-store mouse
usecases now expose canonical `contexts/` and `handlers/` surfaces. The
enhanced context-store usecase also separates its semantic commands under
`actions/`, pure transitions under `business/`, and provider composition under
`providers/`. The memoization comparison has also migrated into canonical
`contexts/` and `actions/` boundaries with its old model and hook paths
retained as compatibility re-exports.

## Explicit State Machine Rule

Once a workflow becomes meaningfully async, do not leave it as one mutable `status` string. Model it as an explicit state machine.

Minimum rule set:

- name states after workflow phases
- name events after user intent or system outcomes
- keep the transition function pure
- run side effects in handlers
- let the view render interpreted state only

See [Explicit State Machine](/en/context-layered/patterns/explicit-state-machine) for the general concept.

## Activity Log Rule

Do not push final UI strings directly into the activity log.

1. Define domain events in `business/scenarioActivity.ts`
2. Append events from handlers
3. Map them to view text and tone in `scenarioHandlerSupport.ts`

This keeps logs, analytics, and tests aligned to the same event model.

## Testing Rule

At minimum, lock these four behaviors:

1. invalid submit renders field errors and moves focus
2. valid submit calculates the result and reaches success
3. changing the draft after success returns the workflow to idle or a fresh waiting state
4. reset restores a known baseline

Recommended commands:

- `pnpm test:canonical-example`
- `pnpm --dir example type-check`
- `pnpm --dir example build:fast`
- `pnpm --filter example run verify:conditional`
- `pnpm docs:build`

## Documentation Rule

When you add a new scenario, update at least:

- an example doc
- the state-machine doc linkage
- a discovery link in PatternsOverview or a scenario library
- source registration

## Recommended Reading Order

1. `contexts`
2. `business/draft`
3. `business/validation`
4. `business/result`
5. `business/stateMachine`
6. `handlers/submission`
7. `handlers/support`
8. `actions`
9. `hooks`
10. `views`
11. integration point

## Related Material

- [Canonical Order Form Example](/en/examples/canonical-order-form)
- [Explicit State Machine](/en/context-layered/patterns/explicit-state-machine)
- [Stability Test Cycle](/en/context-layered/stability-test-cycle)
- repo-local skill: `skills/context-action-implementation-playbook/SKILL.md`
