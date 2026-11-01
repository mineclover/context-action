---
document_id: context-layered--interaction-intent-contract
category: context-layered
source_path: en/context-layered/interaction-intent-contract.md
character_limit: 5000
last_update: '2026-11-01T11:30:48.327Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Interaction Intent Contract (IIC)

Interaction Intent Contract (IIC) Status: Active Last reviewed: 2026-11-01 Scope: interactive examples, public UI, demos, and workflow views In this convention, accessibility does not mean only screen-reader support. It also means that someone who did not make the original design can reconstruct why a button or explanation was removed, what immediate behavior was promised, and how to undo and verify that choice. We call this design accessibility. Technical UI accessibility (keyboard, screen reader, contrast, and similar requirements) is a follow-up verification when the surface needs it; it is not a replacement for documenting UX intent. When to use this convention Use this convention when a change introduces or changes any of these: - automatic execution, live updates, debouncing, or background feedback; - a new control, status, error, reset, or recovery path; - removing or condensing an affordance such as a button, explanation, or confirmation step; - a visual state whose meaning could be inferred differently by different users; - a UX decision that trades fewer steps for lower discoverability. Small visual-only changes do not need a separate record, but the owning specification or PR should still state the affected design intent and any technical accessibility invariant. Use two impact levels to keep the documentation burden proportional: - Lite IIC: local, reversible, and free of persistence or costly external effects; - Full IIC: automatic, asynchronous, costly, persistent, externally visible, destructive, or otherwise requiring cancellation or rollback. Full IIC records must define pending, failure, cancel, and rollback behavior. The implicit agreement record An implicit agreement is a behavior a user, reviewer, or integrator is expected to understand without reading the implementation. Examples include “changing a checkbox runs the experiment”, “the latest value is the source of truth”, and "reset returns to the reproducible failure case". Record these agreements before implementation when the design removes an affordance or relies on user inference. Use this template in the feature specification, decision record, or PR body: The record is complete only when a reviewer can answer why the shortcut is useful, what was removed, what signal replaces it, which state is authoritative, and how the user recovers from a wrong inference. When the surface has technical accessibility requirements, include how keyboard and assistive-technology users discover the same change as follow-up evidence. Design rules 1. Make UX shortcuts explicit and recoverable Automatic behavior must have its intent and result near the trigger. State which button or explanation was removed and what signal preserves discoverability. Do not add a second submit

Key points:
• automatic execution, live updates, debouncing, or background feedback;
• a new control, status, error, reset, or recovery path;
• removing or condensing an affordance such as a button, explanation, or confirmation step;
• a visual state whose meaning could be inferred differently by different users;
• a UX decision that trades fewer steps for lower discoverability.
• **Lite IIC:** local, reversible, and free of persistence or costly external effects;
• **Full IIC:** automatic, asynchronous, costly, persistent, externally visible,
• core logic another implementer must be able to reproduce:
• sentence that must stay consistent across docs, UI, and tests:
• semantic control and accessible name:
• keyboard and non-pointer path:
• focus behavior:
• state/value/error announcement:
• color, motion, contrast, and text alternatives:
• UX benefit:
• accessibility risk:
• chosen resolution:
• rejected alternative and reason:
• implementation anchor:
• behavior test:
• first-time discoverability scenario (trigger and recovery explanation):
• accessibility or keyboard test:
• manual scenario / screenshot, if needed:
• documentation link:
• [ ] The design intent and implicit agreement are written in one sentence and have a stable owner.
• [ ] Removed or condensed affordances and their replacement signals are recorded.
• [ ] First-time discoverability risks are recorded.
• [ ] Trigger, observable result, source of truth, and reset/recovery are named.
• [ ] Semantic source of truth and runtime owner are separate.
• [ ] Status, owner, reviewer, review due, impact, and reversibility are recorded.
• [ ] Supersession and migration impact are checked.
• [ ] Negative contract and rollback criteria are written down.
• [ ] The primary control has a native semantic, visible label, and...