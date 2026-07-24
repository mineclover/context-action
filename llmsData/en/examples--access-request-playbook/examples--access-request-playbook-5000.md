---
document_id: examples--access-request-playbook
category: examples
source_path: en/examples/access-request-playbook.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.366Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Access Request Playbook Example

Access Request Playbook Example This document explains the Workspace Access Request example built with the implementation-playbook skill. It keeps the same layer split as the canonical order form, but replaces quote generation with a review-packet workflow to prove that the same convention also fits approval-oriented scenarios. What It Demonstrates - separate draft / validation / review / activity stores - an explicit state machine for an approval workflow - separation between validation issues and UI wording - activity logs derived from domain events - invalidating a stale review result when the draft changes after success Route Key Files State Machine Why This Example Matters The canonical order form is centered on quote calculation. This example shows that the same skill also works for approval and review workflows. - review-packet creation instead of quote creation - reviewer/checklist/priority calculation instead of pricing - review-state transitions instead of submission-state transitions The domain changes, but the architecture stays reusable. Verification Focus - short justification blocks submission - production access without admin scope blocks review - valid submission produces a review packet - changing scope after success returns the workflow to idle - reset restores the baseline state Related Reading - Implementation Playbook Standard Convention - Explicit State Machine - Playbook Scenario Library

Key points:
• separate `draft / validation / review / activity` stores
• an explicit state machine for an approval workflow
• separation between validation issues and UI wording
• activity logs derived from domain events
• invalidating a stale review result when the draft changes after success
• review-packet creation instead of quote creation
• reviewer/checklist/priority calculation instead of pricing
• review-state transitions instead of submission-state transitions
• short justification blocks submission
• production access without admin scope blocks review
• valid submission produces a review packet
• changing scope after success returns the workflow to idle
• reset restores the baseline state
• [Implementation Playbook Standard Convention](/en/context-layered/implementation-convention)
• [Explicit State Machine](/en/context-layered/patterns/explicit-state-machine)
• [Playbook Scenario Library](/en/examples/implementation-playbook-scenarios)