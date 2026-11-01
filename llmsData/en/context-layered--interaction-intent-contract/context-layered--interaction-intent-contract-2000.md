---
document_id: context-layered--interaction-intent-contract
category: context-layered
source_path: en/context-layered/interaction-intent-contract.md
character_limit: 2000
last_update: '2026-11-01T08:35:36.705Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Interaction Intent Contract (IIC)

Interaction Intent Contract (IIC) Status: Active Last reviewed: 2026-11-01 Scope: interactive examples, public UI, demos, and workflow views In this convention, accessibility does not mean only screen-reader support. It also means that someone who did not make the original design can reconstruct why a button or explanation was removed, what immediate behavior was promised, and how to undo and verify that choice. We call this design accessibility. Technical UI accessibility (keyboard, screen reader, contrast, and similar requirements) is a follow-up verification when the surface needs it; it is not a replacement for documenting UX intent. When to use this convention Use this convention when a change introduces or changes any of these: - automatic execution, live updates, debouncing, or background feedback; - a new control, status, error, reset, or recovery path; - removing or condensing an affordance such as a button, explanation, or confirmation step; - a visual st

Key points:
• automatic execution, live updates, debouncing, or background feedback;
• a new control, status, error, reset, or recovery path;
• removing or condensing an affordance such as a button, explanation, or confirmation step;
• a visual state whose meaning could be inferred differently by different users;
• a UX decision that trades fewer steps for lower discoverability.
• core logic another implementer must be able to reproduce:
• sentence that must stay consistent across docs, UI, and tests:
• semantic control and accessible name:
• keyboard and non-pointer path:
• focus behavior:
•...