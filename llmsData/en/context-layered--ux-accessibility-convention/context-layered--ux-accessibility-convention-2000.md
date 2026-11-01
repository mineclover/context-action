---
document_id: context-layered--ux-accessibility-convention
category: context-layered
source_path: en/context-layered/ux-accessibility-convention.md
character_limit: 2000
last_update: '2026-11-01T07:56:03.396Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
UX Intent, Implicit Agreement, and Accessibility Convention

UX Intent, Implicit Agreement, and Accessibility Convention Status: Active Last reviewed: 2026-11-01 Scope: interactive examples, public UI, demos, and workflow views This convention makes the behavior users are expected to infer explicit. It records the UX intent and the accessibility contract together so that a fast or convenient interaction does not silently remove keyboard, screen-reader, focus, or recovery support. When to use this convention Use this convention when a change introduces or changes any of these: - automatic execution, live updates, debouncing, or background feedback; - a new control, status, error, reset, or recovery path; - focus movement, keyboard behavior, dialog, popover, or live-region output; - a visual state whose meaning could be inferred differently by different users; - a UX decision that trades fewer steps for less explicit confirmation. Small visual-only changes do not need a separate record, but the owning specification or PR shoul

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
•...