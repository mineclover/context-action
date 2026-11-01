# UX Intent, Implicit Agreement, and Accessibility Convention

**Status:** Active  
**Last reviewed:** 2026-11-01  
**Scope:** interactive examples, public UI, demos, and workflow views

This convention makes the behavior users are expected to infer explicit. It
records the UX intent and the accessibility contract together so that a fast or
convenient interaction does not silently remove keyboard, screen-reader, focus,
or recovery support.

## When to use this convention

Use this convention when a change introduces or changes any of these:

- automatic execution, live updates, debouncing, or background feedback;
- a new control, status, error, reset, or recovery path;
- focus movement, keyboard behavior, dialog, popover, or live-region output;
- a visual state whose meaning could be inferred differently by different users;
- a UX decision that trades fewer steps for less explicit confirmation.

Small visual-only changes do not need a separate record, but the owning
specification or PR should still state the affected accessibility invariant.

## The implicit agreement record

An implicit agreement is a behavior a user, reviewer, or integrator is expected
to understand without reading the implementation. Examples include “changing a
checkbox runs the experiment”, “the latest value is the source of truth”, and
“reset returns to the reproducible failure case”. Record these agreements
before implementation when they affect interaction or assistive output.

Use this template in the feature specification, decision record, or PR body:

```text
Agreement ID: CA-UXA11Y-<number>
Surface and owner:
User goal:
Implicit agreement (what the user should be able to predict):
Trigger(s):
Observable result:
Source of truth:
Reset / cancel / recovery:

Accessibility contract:
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
- accessibility or keyboard test:
- manual scenario / screenshot, if needed:
- documentation link:
```

The record is complete only when a reviewer can answer what starts the behavior,
what changes on screen, how a keyboard or assistive-technology user discovers
the same change, and how the user recovers from an unintended change.

## Design rules

### 1. Make automatic behavior predictable

Automatic behavior must have a visible explanation near its trigger. State the
event that causes it and the result it changes. Do not add a second submit or
confirm action solely to repeat an already automatic operation.

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

### 3. Prefer native semantics

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

- [ ] The implicit agreement is written in one sentence and has a stable owner.
- [ ] Trigger, observable result, source of truth, and reset/recovery are named.
- [ ] The primary control has a native semantic, visible label, and keyboard path.
- [ ] Focus behavior is intentional and remains visible.
- [ ] Live-region scope and politeness are explicit; duplicate announcements are removed.
- [ ] State meaning does not depend on color, hover, motion, or pointer precision.
- [ ] UX speed/convenience trade-offs and accessibility risks are recorded.
- [ ] A behavior test covers the default and at least one changed state.
- [ ] Keyboard or accessibility verification covers the same interaction path.
- [ ] Human-facing documentation and raw diagnostic evidence are linked separately.

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

### Example record: `CA-UXA11Y-FACE-001`

- **User goal:** change rejection conditions and compare fallback/native state immediately.
- **Implicit agreement:** editing the input or a checkbox reruns the experiment with the current settings.
- **Accessibility contract:** use native `input` and `label` controls; one result panel with `aria-live="polite"` reports the diagnostic count.
- **Trade-off:** removing the execute button reduces steps, so the trigger explanation and reset path stay visible.
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
