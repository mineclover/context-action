---
document_id: examples--renewal-risk-review-playbook
category: examples
source_path: en/examples/renewal-risk-review-playbook.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.364Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Renewal Risk Review Playbook Example

Renewal Risk Review Playbook Example This document explains the Renewal Risk Review example built with the implementation-playbook skill. It focuses on a customer-success workflow that assembles a renewal review packet from usage score, renewal window, and sponsor status. What It Demonstrates - separate draft / validation / review / activity stores - a scoring-oriented explicit state machine - separation between validation issues and UI wording - activity logs derived from domain events - invalidating stale review output when inputs change after success Route Key Files State Machine Why This Example Matters This example proves that the implementation-playbook also applies to renewal and customer-success workflows. - renewal review packet creation instead of quote generation - usage and sponsor-based risk logic instead of pricing or approval scopes - risk band and next action calculation based on renewal timing The same skill now spans approval, incident, and renewal workflows. Verification Focus - 30-day renewals without sponsor block submission - valid reviews generate a renewal packet - changing usage score after success returns the workflow to idle - reset restores the baseline state Related Reading - Implementation Playbook Standard Convention - Explicit State Machine - Playbook Scenario Library

Key points:
• separate `draft / validation / review / activity` stores
• a scoring-oriented explicit state machine
• separation between validation issues and UI wording
• activity logs derived from domain events
• invalidating stale review output when inputs change after success
• renewal review packet creation instead of quote generation
• usage and sponsor-based risk logic instead of pricing or approval scopes
• risk band and next action calculation based on renewal timing
• 30-day renewals without sponsor block submission
• valid reviews generate a renewal packet
• changing usage score after success returns the workflow to idle
• reset restores the baseline state
• [Implementation Playbook Standard Convention](/en/context-layered/implementation-convention)
• [Explicit State Machine](/en/context-layered/patterns/explicit-state-machine)
• [Playbook Scenario Library](/en/examples/implementation-playbook-scenarios)