# Implementation Playbook Scenario Library

This document shows how the canonical order-form rules generalize to other domains. The goal is to prove that the implementation-playbook is not just a single order form, but a reusable convention and skill that can be applied across workflows.

## Shared Assumptions

Each scenario follows the same base rules:

- separate contexts, business, handlers, actions, hooks, and views
- keep validation and result calculation pure
- define review or submission flow as an explicit state machine
- derive activity logs from domain events
- lock invalid, valid, and reset behavior with integration tests

The standard is defined in [Implementation Playbook Standard Convention](/en/context-layered/implementation-convention).

## Scenario 1: Workspace Access Request

### Problem

A new team member submits a workspace access request, and the system validates the request and prepares a review packet.

This scenario is now promoted to a full interactive example.
- route: `/patterns/implementation-playbook/access-request`
- doc: [Access Request Playbook Example](/en/examples/access-request-playbook)

### State Boundaries

- `draft`
  - requester name
  - email
  - access scope
  - justification
  - production access toggle
- `validation`
  - required fields and justification length
- `review`
  - idle → validating → blocked → packaging → ready
- `activity`
  - draft update, validation failure, review packet ready

### Suggested business modules

- `accessDraft.ts`
- `accessValidation.ts`
- `accessReviewPacket.ts`
- `accessStateMachine.ts`
- `accessActivity.ts`

### Testing focus

- short justification blocks submission
- production access adds extra review detail
- changing scope after success returns the workflow to idle

## Scenario 2: Incident Escalation

### Problem

An operator records an incident, and the system prepares an escalation package based on severity and impact.

This scenario is now promoted to a full interactive example.
- route: `/patterns/implementation-playbook/incident-escalation`
- doc: [Incident Escalation Playbook Example](/en/examples/incident-escalation-playbook)

### State Boundaries

- `draft`
  - incident title
  - severity
  - affected users
  - rollback readiness
  - communication channel
- `validation`
  - title, severity, and affected-user checks
- `escalation`
  - idle → validating → blocked → assembling → ready
- `activity`
  - incident capture, validation result, escalation package generation

### Suggested business modules

- `incidentDraft.ts`
- `incidentValidation.ts`
- `incidentEscalationPacket.ts`
- `incidentStateMachine.ts`
- `incidentActivity.ts`

### Testing focus

- severity changes the escalation target
- rollback readiness is reflected in the final packet
- reset returns the screen to a known baseline

## Scenario 3: Renewal Risk Review

### Problem

A customer-success operator reviews renewal risk and generates a follow-up package for an account.

This scenario is now promoted to a full interactive example.
- route: `/patterns/implementation-playbook/renewal-risk-review`
- doc: [Renewal Risk Review Playbook Example](/en/examples/renewal-risk-review-playbook)

### State Boundaries

- `draft`
  - account name
  - renewal window
  - product usage
  - risk notes
  - executive sponsor presence
- `validation`
  - required fields and usage score range
- `review`
  - idle → validating → blocked → scoring → ready
- `activity`
  - draft changes, scoring start, review package ready

### Suggested business modules

- `renewalDraft.ts`
- `renewalValidation.ts`
- `renewalRiskScore.ts`
- `renewalStateMachine.ts`
- `renewalActivity.ts`

### Testing focus

- missing fields transition to blocked
- usage score and sponsor presence shape the recommendation
- editing the draft after success invalidates the review result

## When to Add New Scenario Examples

- when the canonical order form feels too domain-specific
- when the team mostly works on review, escalation, or approval flows
- when you need proof that the same architecture scales across different domains

## Related Material

- [Implementation Playbook Standard Convention](/en/context-layered/implementation-convention)
- [Canonical Order Form Example](/en/examples/canonical-order-form)
- repo-local skill: `skills/context-action-implementation-playbook/SKILL.md`
