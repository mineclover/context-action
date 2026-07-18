# Convention Index

This document is the central entry point for the implementation-playbook style conventions in the Context-Action repository. The docs have grown enough that it helps to group which documents define the rules, which ones demonstrate the pattern, and which ones lock the verification model.

## Short Recommended Reading Path

1. [Implementation Convention](/en/context-layered/implementation-convention)
2. [Specification, Issue, and Documentation Management](/en/context-layered/change-management-convention)
3. [Usecase and Recipe Profile](/en/context-layered/usecase-recipe-profile)
4. [Tool-Calling Web Studio Convention](/en/context-layered/usecase-tool-calling-web-studio)
5. [Panel Layout Preference Convention](/en/context-layered/usecase-panel-layout)
6. [Canonical Order Form Example](/en/examples/canonical-order-form)
7. [Playbook Scenario Library](/en/examples/implementation-playbook-scenarios)
8. [Explicit State Machine](/en/context-layered/patterns/explicit-state-machine)
9. [Architecture Governance and Evidence](/en/context-layered/architecture/architecture-governance)
10. [ContextScope Symbol Graph](/en/context-layered/architecture/context-scope-graph)
11. [Stability Test Cycle](/en/context-layered/stability-test-cycle)

The short path above covers:
- folder structure
- workflow transition rules
- domain-level expansion
- capability, symbol, and context identity
- snapshot evidence and context-boundary projection
- testing expectations

## Grouped by Role

### 1. Documents that define the standard

- [Convention Alignment Plan](/en/context-layered/convention-alignment-plan)
  - current-state classification, fixed provider order, and migration gates
- [Implementation Convention](/en/context-layered/implementation-convention)
  - the standard implementation-playbook rule set
- [Specification, Issue, and Documentation Management](/en/context-layered/change-management-convention)
  - issue lifecycle, contract traceability, decision records, and handoff evidence
- [Tool-Calling Web Studio Convention](/en/context-layered/usecase-tool-calling-web-studio)
  - tool registry, policy, workspace mutation, observable subscriptions, and live preview boundaries
- [Panel Layout Preference Convention](/en/context-layered/usecase-panel-layout)
  - presentation-only panel state, bounded resizing, persistence, and Store Context promotion criteria
- [Tool-Calling Editor Architecture](/en/concept/tool-calling-editor-architecture)
  - detailed catalog, approval, trace, persistence, and preview reference implementation
- [Folder Structure](/en/context-layered/architecture/folder-structure)
  - responsibility split across `contexts / business / handlers / actions / hooks / views`
- [Handler Registry](/en/context-layered/architecture/handler-registry)
  - handler registration and separation rules
- [Architecture Governance and Evidence](/en/context-layered/architecture/architecture-governance)
  - capability identity, `SymbolRef`, snapshot evidence, and verification boundaries
- [ContextScope Symbol Graph](/en/context-layered/architecture/context-scope-graph)
  - screen/transaction grouping contract over the complete symbol snapshot

### 2. Documents that explain logic and transitions

- [Explicit State Machine](/en/context-layered/patterns/explicit-state-machine)
  - how to lock complex async flows as `state + event + transition`
- [Context-Layered Overview](/en/context-layered/context-layered-guide)
- [Usecase and Recipe Profile](/en/context-layered/usecase-recipe-profile)
  - the high-level architectural picture
- [Migration Guide](/en/context-layered/migration-guide)
  - how to move older structures into this model

### 3. Documents that demonstrate the implementation

- [Canonical Order Form Example](/en/examples/canonical-order-form)
  - the base canonical example
- [Access Request Playbook Example](/en/examples/access-request-playbook)
  - approval/review workflow example
- [Incident Escalation Playbook Example](/en/examples/incident-escalation-playbook)
  - incident/escalation workflow example
- [Renewal Risk Review Playbook Example](/en/examples/renewal-risk-review-playbook)
  - renewal/customer-success workflow example
- [Playbook Scenario Library](/en/examples/implementation-playbook-scenarios)
  - scenario extensions that follow the same skill and convention

### 4. Documents that define verification

- [Stability Test Cycle](/en/context-layered/stability-test-cycle)
  - how to split contract tests, scenario tests, and stress validation
- [Architecture Governance Usage](/en/context-layered/architecture/architecture-governance-usage)
  - executable snapshot, history, diff, and intersection recipes

The general repository convention gate is:

```bash
pnpm convention:check
```

For the complete Context-Action integration gate, run:

```bash
node scripts/verify-context-action-conventions.mjs
```

It adds the example use-case recipe, MCP/function-calling catalog, and
standalone Web Studio action boundaries. Use `pnpm web-coding:verify` for the
standalone build, filesystem, provider, preview, and browser release checks.

## Reading Paths by Goal

### For architecture alignment

1. [Implementation Convention](/en/context-layered/implementation-convention)
2. [Specification, Issue, and Documentation Management](/en/context-layered/change-management-convention)
3. [Explicit State Machine](/en/context-layered/patterns/explicit-state-machine)
4. [Stability Test Cycle](/en/context-layered/stability-test-cycle)

### For implementer onboarding

1. [Canonical Order Form Example](/en/examples/canonical-order-form)
2. [Access Request Playbook Example](/en/examples/access-request-playbook)
3. [Incident Escalation Playbook Example](/en/examples/incident-escalation-playbook)
4. [Renewal Risk Review Playbook Example](/en/examples/renewal-risk-review-playbook)

### For designing new scenarios

1. [Playbook Scenario Library](/en/examples/implementation-playbook-scenarios)
2. [Implementation Convention](/en/context-layered/implementation-convention)
3. repo-local skill: `skills/context-action-implementation-playbook/SKILL.md`

### For tool-calling web studios

1. [Tool-Calling Web Studio Convention](/en/context-layered/usecase-tool-calling-web-studio)
2. [Specification, Issue, and Documentation Management](/en/context-layered/change-management-convention)
3. [Panel Layout Preference Convention](/en/context-layered/usecase-panel-layout)
4. [Tool-Calling Editor Architecture](/en/concept/tool-calling-editor-architecture)
5. [Standalone Web Studio README](../../../demos/bolt-style-editor/README.md)

## Read Alongside the Example App

The docs make more sense when paired with the live demos:

- `/patterns/implementation-playbook`
- `/patterns/implementation-playbook/access-request`
- `/patterns/implementation-playbook/incident-escalation`
- `/patterns/implementation-playbook/renewal-risk-review`
- `/integrations/live-web-coding`
- standalone `/web-coding/` release

## One-Line Summary

To turn this into a team convention, follow:
`Implementation Convention -> Explicit State Machine -> Canonical Example -> Scenario Demos -> Stability Test Cycle`
