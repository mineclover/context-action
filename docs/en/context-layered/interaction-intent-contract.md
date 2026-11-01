# Interaction Intent Contract (IIC)

**Status:** Active  
**Last reviewed:** 2026-11-01  
**Scope:** interactive examples, public UI, demos, and workflow views

In this convention, accessibility does not mean only screen-reader support. It
also means that someone who did not make the original design can reconstruct why
a button or explanation was removed, what immediate behavior was promised, and
how to undo and verify that choice. We call this **design accessibility**.
Technical UI accessibility (keyboard, screen reader, contrast, and similar
requirements) is a follow-up verification when the surface needs it; it is not a
replacement for documenting UX intent.

## When to use this convention

Use this convention when a change introduces or changes any of these:

- automatic execution, live updates, debouncing, or background feedback;
- a new control, status, error, reset, or recovery path;
- removing or condensing an affordance such as a button, explanation, or confirmation step;
- a visual state whose meaning could be inferred differently by different users;
- a UX decision that trades fewer steps for lower discoverability.

Small visual-only changes do not need a separate record, but the owning
specification or PR should still state the affected design intent and any technical
accessibility invariant.

Use two impact levels to keep the documentation burden proportional:

- **Lite IIC:** local, reversible, and free of persistence or costly external effects;
- **Full IIC:** automatic, asynchronous, costly, persistent, externally visible,
  destructive, or otherwise requiring cancellation or rollback.

Full IIC records must define pending, failure, cancel, and rollback behavior.

## The implicit agreement record

An implicit agreement is a behavior a user, reviewer, or integrator is expected
to understand without reading the implementation. Examples include “changing a
checkbox runs the experiment”, “the latest value is the source of truth”, and
"reset returns to the reproducible failure case". Record these agreements before
implementation when the design removes an affordance or relies on user inference.

Use this template in the feature specification, decision record, or PR body:

```text
Agreement ID: CA-IIC-<number>
Surface and owner:
User goal:
Status: draft | accepted | implemented | superseded | deprecated
Owner:
Reviewer:
Reviewed at:
Review due / revisit:
Impact: lite | full
Reversibility:
Supersedes / superseded by:
Migration / compatibility impact:
Design intent (why this UX is easier):
Removed or condensed affordance (button, explanation, confirmation step):
Implicit agreement (what the user should be able to predict):
Replacement signal (what carries the same meaning):
Discoverability risk (what a first-time user may miss):
Trigger(s):
Observable result:
Source of truth:
Semantic source of truth (what the user sees as current and authoritative):
Runtime owner (Context/Store/element):
Reset / cancel / recovery:
Rollback criteria:
Negative contract (behavior that must not occur):

Design accessibility contract:
- core logic another implementer must be able to reproduce:
- sentence that must stay consistent across docs, UI, and tests:

Technical accessibility follow-up, when applicable:
- semantic control and accessible name:
- keyboard and non-pointer path:
- focus behavior:
- state/value/error announcement:
- color, motion, contrast, and text alternatives:

Trade-off:
- UX benefit:
- accessibility risk:
- chosen resolution:
- rejected alternative and reason:

Evidence:
- implementation anchor:
- behavior test:
- first-time discoverability scenario (trigger and recovery explanation):
- accessibility or keyboard test:
- manual scenario / screenshot, if needed:
- documentation link:
```

The record is complete only when a reviewer can answer why the shortcut is useful,
what was removed, what signal replaces it, which state is authoritative, and how
the user recovers from a wrong inference. When the surface has technical
accessibility requirements, include how keyboard and assistive-technology users
discover the same change as follow-up evidence.

## Design rules

### 1. Make UX shortcuts explicit and recoverable

Automatic behavior must have its intent and result near the trigger. State which
button or explanation was removed and what signal preserves discoverability. Do
not add a second submit or confirm action solely to repeat an already automatic
operation.

If automatic work is expensive, asynchronous, or destructive, specify the
debounce, cancellation, pending, and failure states. “Immediate” means the
interaction contract is synchronous from the user's perspective; it does not
mean that every keystroke must start an unbounded network request.

### 2. Keep one announcement source per state change

Do not announce the same result in a control status, a result panel, and a toast.
Choose one live region for the concise state change and keep detailed output in
the result surface. The live region must specify its politeness (`polite` or
`assertive`) and the events that update it.

High-frequency input should not produce a verbose announcement for every
character. Announce completion, error, or a meaningful threshold instead.

### 3. Verify technical accessibility as a separate contract

Use native `button`, `input`, `label`, `fieldset`, `legend`, `output`, and form
controls before adding ARIA roles. Every control needs an accessible name and a
visible label. A visual toggle must expose the same state through its native
value or an appropriate ARIA state.

### 4. Preserve non-pointer parity

Every pointer action must have an equivalent keyboard path. Do not require drag,
hover, color, or timing to discover the current state. Focus must remain visible
and must move only when the interaction contract calls for it; automatic focus
movement needs a documented reason and a recovery path.

### 5. Express state with more than color

Use text, labels, values, icons with accessible names, or structure in addition
to color. Error, warning, pending, success, and unchanged states must remain
understandable in monochrome and high-contrast presentation.

### 6. Separate human summary from diagnostic evidence

The primary surface should explain the result in user language. Raw JSON,
operation names, traces, and test identifiers belong in a clearly labelled
developer surface. Keep machine-readable keys stable when external tests or
automation consume them.

### 7. Define reset and recovery explicitly

If controls mutate a scenario, document the default state and provide a reset or
cancel path. Reset must restore both the visible controls and the underlying
state source of truth; changing only the labels is insufficient.

## Review checklist

- [ ] The design intent and implicit agreement are written in one sentence and have a stable owner.
- [ ] Removed or condensed affordances and their replacement signals are recorded.
- [ ] First-time discoverability risks are recorded.
- [ ] Trigger, observable result, source of truth, and reset/recovery are named.
- [ ] Semantic source of truth and runtime owner are separate.
- [ ] Status, owner, reviewer, review due, impact, and reversibility are recorded.
- [ ] Supersession and migration impact are checked.
- [ ] Negative contract and rollback criteria are written down.
- [ ] The primary control has a native semantic, visible label, and keyboard path.
- [ ] Focus behavior is intentional and remains visible.
- [ ] Live-region scope and politeness are explicit; duplicate announcements are removed.
- [ ] State meaning does not depend on color, hover, motion, or pointer precision.
- [ ] UX speed/convenience trade-offs and design-accessibility risks are recorded.
- [ ] A behavior test covers the default and at least one changed state.
- [ ] Keyboard or accessibility verification covers the same interaction path.
- [ ] Human-facing documentation and raw diagnostic evidence are linked separately.
- [ ] If implementation differs from the IIC, the contract is updated before code is accepted.

## Evidence expectations

The minimum evidence depends on the change:

| Change | Required evidence |
| --- | --- |
| New or changed control | behavior test, keyboard path, accessible name check |
| Automatic/live update | trigger/result test, announcement review, cancellation or reset proof |
| Error or validation state | invalid and recovery test, non-color state signal |
| Focus/dialog/popover behavior | keyboard sequence, focus destination, escape/cancel proof |
| Demo or example-only interaction | runnable manual scenario plus focused component test |

For implementation-playbook work, link the record from the scenario document
and include the evidence in the same review as the `contexts / business /
handlers / actions / hooks / views` contract. This keeps UX intent, state
ownership, and accessibility behavior reviewable together.

## FACE playground example

### Example record: `CA-IIC-FACE-001`

- **User goal:** change rejection conditions and compare fallback/native state immediately.
- **Status:** implemented · **Impact:** lite · **Reversibility:** fully reversible
- **Owner/reviewer:** Lit UI maintainers · **Review due:** next release review
- **Implicit agreement:** editing the input or a checkbox reruns the experiment with the current settings.
- **Semantic source of truth:** experiment result card and raw JSON · **Runtime owner:** probe element state
- **Design accessibility:** record why the execute button was removed and how automatic execution is discovered.
- **Technical accessibility follow-up:** use native `input` and `label` controls; one result panel with `aria-live="polite"` reports the diagnostic count.
- **Trade-off:** removing the execute button reduces steps, so the trigger explanation and reset path stay visible.
- **Negative contract:** editing controls must not persist data or start destructive external work.
- **Rollback:** reset restores the rejected-write baseline.
- **Evidence:** the `run()` rerun component test, the runnable playground, and the raw JSON report.

The FACE exception playground uses this convention as follows:

- changing the text input or a rejection checkbox is the trigger;
- the experiment result card is the source of truth for the current run;
- one concise live status reports diagnostic operation count;
- the raw JSON is labelled as developer evidence and keeps stable API keys;
- the reset control restores the default rejected-write scenario;
- the component test covers a rerun where native writes are accepted.

The example is intentionally small, but its record should be copied whenever a
demo introduces a new implicit interaction agreement.
