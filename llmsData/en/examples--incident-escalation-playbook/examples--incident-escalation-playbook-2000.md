---
document_id: examples--incident-escalation-playbook
category: examples
source_path: en/examples/incident-escalation-playbook.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.359Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Incident Escalation Playbook Example

Incident Escalation Playbook Example This document explains the Incident Escalation example built with the implementation-playbook skill. Unlike the approval-oriented access-request example, this one focuses on an operations workflow that assembles an escalation packet based on severity and impact. What It Demonstrates - separate draft / validation / escalation / activity stores - an explicit state machine with severity-driven rules - separation between validation issues and UI wording - activity logs derived from domain events - invalidating a stale escalation result when severity changes after success Route Key Files State Machine Why This Example Matters This example proves that the implementation-playbook also works for operations and incident response workflows. - escalation-packet creation instead of quote generation - severity, affected-user, and channel rules instead of pricing - operational checklist and escalation target computation The skill is not limited to form-

Key points:
• separate `draft / validation / escalation / activity` stores
• an explicit state machine with severity-driven rules
• separation between validation issues and UI wording
• activity logs derived from domain events
• invalidating a stale escalation result when severity changes after success
• escalation-packet creation instead of quote generation
• severity, affected-user, and channel rules instead of pricing
• operational checklist and escalation target computation
• sev1 incidents without statuspage block submission
• valid incidents assemble an escalation packet
• changing severity after success...