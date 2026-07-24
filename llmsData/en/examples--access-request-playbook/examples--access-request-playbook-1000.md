---
document_id: examples--access-request-playbook
category: examples
source_path: en/examples/access-request-playbook.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.366Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Access Request Playbook Example

Access Request Playbook Example This document explains the Workspace Access Request example built with the implementation-playbook skill. It keeps the same layer split as the canonical order form, but replaces quote generation with a review-packet workflow to prove that the same convention also fits approval-oriented scenarios. What It Demonstrates - separate draft / validation / review / acti

Key points:
• separate `draft / validation / review / activity` stores
• an explicit state machine for an approval workflow
• separation between validation issues and UI wording
• activity logs derived from domain events
•...