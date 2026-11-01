---
document_id: context-layered--ux-accessibility-convention
category: context-layered
source_path: en/context-layered/ux-accessibility-convention.md
character_limit: 5000
last_update: '2026-11-01T07:56:03.397Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
UX Intent, Implicit Agreement, and Accessibility Convention

UX Intent, Implicit Agreement, and Accessibility Convention Status: Active Last reviewed: 2026-11-01 Scope: interactive examples, public UI, demos, and workflow views This convention makes the behavior users are expected to infer explicit. It records the UX intent and the accessibility contract together so that a fast or convenient interaction does not silently remove keyboard, screen-reader, focus, or recovery support. When to use this convention Use this convention when a change introduces or changes any of these: - automatic execution, live updates, debouncing, or background feedback; - a new control, status, error, reset, or recovery path; - focus movement, keyboard behavior, dialog, popover, or live-region output; - a visual state whose meaning could be inferred differently by different users; - a UX decision that trades fewer steps for less explicit confirmation. Small visual-only changes do not need a separate record, but the owning specification or PR should still state the affected accessibility invariant. The implicit agreement record An implicit agreement is a behavior a user, reviewer, or integrator is expected to understand without reading the implementation. Examples include “changing a checkbox runs the experiment”, “the latest value is the source of truth”, and “reset returns to the reproducible failure case”. Record these agreements before implementation when they affect interaction or assistive output. Use this template in the feature specification, decision record, or PR body: The record is complete only when a reviewer can answer what starts the behavior, what changes on screen, how a keyboard or assistive-technology user discovers the same change, and how the user recovers from an unintended change. Design rules 1. Make automatic behavior predictable Automatic behavior must have a visible explanation near its trigger. State the event that causes it and the result it changes. Do not add a second submit or confirm action solely to repeat an already automatic operation. If automatic work is expensive, asynchronous, or destructive, specify the debounce, cancellation, pending, and failure states. “Immediate” means the interaction contract is synchronous from the user's perspective; it does not mean that every keystroke must start an unbounded network request. 2. Keep one announcement source per state change Do not announce the same result in a control status, a result panel, and a toast. Choose one live region for the concise state change and keep detailed output in the result surface. The live region must specify its politeness (polite or assertive) and the events that update it. High-frequency input should not produce a verbose announcement for every character. Announce completion, error, or a meaningful thresho

Key points:
• automatic execution, live updates, debouncing, or background feedback;
• a new control, status, error, reset, or recovery path;
• focus movement, keyboard behavior, dialog, popover, or live-region output;
• a visual state whose meaning could be inferred differently by different users;
• a UX decision that trades fewer steps for less explicit confirmation.
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
• accessibility or keyboard test:
• manual scenario / screenshot, if needed:
• documentation link:
• [ ] The implicit agreement is written in one sentence and has a stable owner.
• [ ] Trigger, observable result, source of truth, and reset/recovery are named.
• [ ] The primary control has a native semantic, visible label, and keyboard path.
• [ ] Focus behavior is intentional and remains visible.
• [ ] Live-region scope and politeness are explicit; duplicate announcements are removed.
• [ ] State meaning does not depend on color, hover, motion, or pointer precision.
• [ ] UX speed/convenience trade-offs and accessibility risks are recorded.
• [ ] A behavior test covers the default and at least one changed state.
• [ ] Keyboard or accessibility verification covers the same interaction path.
• [ ] Human-facing documentation and raw diagnostic evidence are linked separately.
• changing the text input or a rejection checkbox is the trigger;
• the experiment result card is the source of truth for the current run;
• one concise live status reports diagnostic operation count;
• the raw JSON is...