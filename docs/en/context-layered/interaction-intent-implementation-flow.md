# Interaction Intent Contract to Implementation Flow

This guide connects the Interaction Intent Contract (IIC) to the Context-Action
implementation-playbook. It keeps a design shortcut, its state ownership, its
implementation layers, and its verification evidence in one traceable flow.

## The flow

```text
IIC record
  → Contexts: typed state and intent boundaries
  → Business: pure rules and transitions
  → Handlers: orchestration and side effects
  → Actions: semantic commands from the view
  → Hooks: subscriptions and view-facing model
  → Views: controls, presentation, and observable feedback
  → Evidence: tests, docs, manual scenario, and gates
```

Do not begin implementation with a button or component when the interaction
removes an affordance, changes a trigger, or relies on a user inference. Start
with an IIC record and make the design shortcut explicit first.

## Position in the existing convention hierarchy

IIC is not an additional runtime layer in Context-Action and does not replace any
of the six implementation layers. It is an upstream design contract that fixes
**why the interaction was chosen** before the implementation-playbook decides
where and how to implement it.

| Position | Question answered | Owning artifact |
| --- | --- | --- |
| IIC | What was reduced, and what should the user be able to predict? | feature spec, decision record, PR |
| Context-Action six layers | Where and how are that intent and state implemented? | `contexts / business / handlers / actions / hooks / views` |
| Evidence | Does the implementation still preserve the same intent? | tests, docs, runnable scenario, gates |

IIC therefore extends the existing convention upward as a design source of
truth; it does not add a new runtime boundary. Even a small example records the
IIC first and maps only the Context-Action layers it actually needs.

## Stage responsibilities

| Stage | Context-Action location | IIC question | Required output |
| --- | --- | --- | --- |
| Intent | feature spec, decision record, or PR | What is easier for the user, and what was removed? | IIC ID, trigger, replacement signal, discoverability risk, recovery |
| Contract | `contexts/` | Which state and semantic intents are owned by this feature? | typed Action/Store/Ref contracts and baseline state |
| Rule | `business/` | What does the shortcut mean independent of rendering? | pure validation, result, and state-transition functions |
| Orchestration | `handlers/` | Which effects, persistence, logging, or reset operations follow? | registry-backed handlers with explicit dependencies |
| Command | `actions/` | What semantic intent does the view send? | stable dispatch helpers; no DOM or business rules |
| View model | `hooks/` | Which state is visible, and which status is authoritative? | subscriptions and derived labels/models |
| Surface | `views/` | How does the user trigger, observe, and recover? | labelled controls, visible result, keyboard path, reset |
| Proof | tests/docs/gates | How do we know the shortcut still means what the IIC says? | behavior test, interaction evidence, documentation, focused gates |

The layers are a responsibility map, not a requirement to create every folder for
a small example. A smaller feature may keep fewer files, but its IIC fields and
ownership decisions still need a documented home.

## Implementation sequence

### 1. Write the IIC before coding

Record the user goal, design intent, removed or condensed affordance, replacement
signal, trigger, observable result, source of truth, recovery path, trade-off,
and evidence plan. Use `CA-IIC-<number>` and link the record from the feature
specification or PR.

### 2. Map the contract to Context-Action

Name the state and semantic intent in `contexts/`. Keep a distinction between a
business command and a presentation-only change. For an automatic interaction,
the trigger is still a semantic intent even when there is no submit button.

### 3. Make the rule pure

Put validation, derived result, and state transitions in `business/`. The pure
function should make the IIC observable without a browser. It should answer what
the new state is for both the default case and at least one changed case.

### 4. Orchestrate effects in handlers

Handlers read current state, call the business rule, update Stores, and own side
effects such as persistence, analytics, focus, or reset. Register them through the
Handler Registry. A view must not recreate these rules to make the shortcut feel
fast.

### 5. Expose semantic actions and a view model

Actions express user intent (`changeProbeSettings`, `resetProbe`) rather than
low-level DOM events. Hooks subscribe to the source of truth and produce the
model the view needs: current values, status, errors, and recovery affordances.

### 6. Build the smallest observable surface

The view renders the control, the explanation for an implicit trigger, the current
result, and the reset/cancel path. Keep one owner for concise status feedback;
put detailed diagnostic data in a separate developer surface. If technical UI
accessibility applies, add its keyboard, focus, semantic, and contrast checks as
follow-up evidence to the same IIC.

### 7. Prove the agreement

Lock the default scenario and at least one changed scenario in tests. Add a
manual scenario when discoverability or immediate feedback is part of the design.
Link the implementation anchor, test names, screenshot or runnable URL, and docs
back to the IIC.

## FACE playground mapping

The FACE exception playground uses the IIC `CA-IIC-FACE-001`:

- **Intent:** compare fallback and native state without an extra execute step.
- **Trigger:** typing a form value or changing a rejection checkbox.
- **Source of truth:** the experiment result card and its raw JSON report.
- **Replacement signal:** the control description and immediate result update replace the removed execute button.
- **Recovery:** reset restores the rejected-write baseline.
- **Context-Action mapping:** the example probe owns the scenario state, `run()` is the orchestration seam, the view controls are semantic inputs, and the component test proves an accepted-native rerun.

This mapping is intentionally small. A larger product feature should split the
same responsibilities across the six Context-Action layers rather than moving
business rules into the view to keep an interaction direct.

## Review checklist

- [ ] An IIC ID is linked before implementation begins.
- [ ] Removed or condensed affordances and replacement signals are written down.
- [ ] State ownership and semantic intent are mapped to Context-Action layers.
- [ ] Default and changed behavior are pure-rule or component tested.
- [ ] The view explains implicit triggers and exposes reset/cancel recovery.
- [ ] One status owner is chosen; detailed diagnostics are separated.
- [ ] Technical accessibility checks are linked when the surface requires them.
- [ ] The IIC links to docs, tests, runnable evidence, and the focused gates.

## Focused gates

Run the smallest gates that prove the changed boundary, then broaden when the
change crosses package or release boundaries:

```bash
pnpm convention:check
pnpm docs:management
pnpm llms:check
pnpm docs:build
pnpm --filter @context-action/lit-ui type-check
pnpm --filter @context-action/lit-ui test -- --run test/face-exception-repro.test.ts
```

For canonical Context-Action examples also run `pnpm --filter example check` and
the relevant scenario verification command.
