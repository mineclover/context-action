---
name: context-action-implementation-playbook
description: Use when adding or refactoring repository examples to follow the Context-Action implementation-playbook standard. Triggers on requests for standard conventions, implementation playbooks, scenario examples, explicit state machine flows, or reusable Context-Layered example structures.
---

# Context-Action Implementation Playbook

Use this skill when a repository example or scenario should follow the standard implementation-playbook structure.

Do not default every request to a full demo. Start with the smallest shape that still proves the architecture, then iterate upward only if the scenario keeps paying for itself.

## What this skill produces

- a `contexts / business / handlers / actions / hooks / views` split
- pure business modules for draft, validation, result, activity, and state machine
- handlers split by concern such as draft vs submission
- explicit state transitions for async workflow phases
- source registration, docs linkage, and integration tests

## Read these references first

- `references/checklist.md`
- `references/scenario-recipes.md`
- `references/scaffolding.md`
- `references/test-and-doc-linking.md`
- `references/maturity-levels.md`
- `../../docs/ko/context-layered/implementation-convention.md`

If the user is working in English, also read:

- `../../docs/en/context-layered/implementation-convention.md`

## Pick the right target shape first

- Use a **scenario blueprint** when the user wants breadth, pattern transfer, or planning examples across multiple domains
- Use a **discoverable page** when the team needs a visible scenario catalog without full interactivity
- Use a **full interactive example** when the scenario needs real UI behavior, explicit workflow transitions, and integration tests

## Workflow

1. Define the scenario contract
   - What is the draft?
   - What is being validated?
   - What result is produced?
   - Which async phases need an explicit state machine?

2. Create context boundaries
   - Action context for intent
   - Store context for draft, validation, submission/review, activity
   - Ref context only when imperative focus or scrolling is needed

3. Split `business/`
   - `*Draft.ts`
   - `*Validation.ts`
   - `*Result.ts` or domain-specific result module
   - `*Activity.ts`
   - `*StateMachine.ts`
   - optional barrel `*Business.ts`

4. Split `handlers/`
   - draft/edit/reset handlers
   - submission/review/approval handlers
   - support file for mapping domain outputs into view text

5. Keep the view thin
   - render subscribed state
   - emit action helpers
   - no embedded business rules

6. Add verification
   - invalid flow
   - valid flow
   - post-success draft change invalidates old result
   - reset restores baseline

7. Add discoverability
   - source registration
   - example docs
   - scenario library or overview entry

8. Run the iteration loop
   - check whether transitions are explicit enough
   - check whether activity entries derive from domain events
   - check whether the view still contains business logic
   - decide whether the scenario should remain a blueprint or be promoted

## Guardrails

- Do not return UI wording directly from validation functions
- Do not mutate workflow state ad hoc in handlers when a state machine should exist
- Do not log final UI strings directly if domain events can be logged first
- Do not put pricing, scoring, approval, or validation rules into `views/`

## Exit criteria

- the scenario follows the standard layer split
- the async workflow has explicit transitions when needed
- the example is visible from docs or the example app
- tests and builds pass

## Iterative enhancement rule

When this skill is used repeatedly, improve the weakest layer first instead of expanding surface area at random.

Recommended order:

1. split business logic more cleanly
2. add or refine explicit state transitions
3. convert log strings into domain events
4. improve docs and source discoverability
5. only then promote blueprint scenarios into full demos
