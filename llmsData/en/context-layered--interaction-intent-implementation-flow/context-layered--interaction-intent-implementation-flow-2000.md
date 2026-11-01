---
document_id: context-layered--interaction-intent-implementation-flow
category: context-layered
source_path: en/context-layered/interaction-intent-implementation-flow.md
character_limit: 2000
last_update: '2026-11-01T08:36:07.939Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Interaction Intent Contract to Implementation Flow

Interaction Intent Contract to Implementation Flow This guide connects the Interaction Intent Contract (IIC) to the Context-Action implementation-playbook. It keeps a design shortcut, its state ownership, its implementation layers, and its verification evidence in one traceable flow. The flow Do not begin implementation with a button or component when the interaction removes an affordance, changes a trigger, or relies on a user inference. Start with an IIC record and make the design shortcut explicit first. Stage responsibilities | Stage | Context-Action location | IIC question | Required output | | --- | --- | --- | --- | | Intent | feature spec, decision record, or PR | What is easier for the user, and what was removed? | IIC ID, trigger, replacement signal, discoverability risk, recovery | | Contract | contexts/ | Which state and semantic intents are owned by this feature? | typed Action/Store/Ref contracts and baseline state | | Rule | business/ |

Key points:
• **Intent:** compare fallback and native state without an extra execute step.
• **Trigger:** typing a form value or changing a rejection checkbox.
• **Source of truth:** the experiment result card and its raw JSON report.
• **Replacement signal:** the control description and immediate result update replace the removed execute button.
• **Recovery:** reset restores the rejected-write baseline.
• **Context-Action mapping:** the example probe owns the scenario state, `run()` is the orchestration seam, the view controls are semantic inputs, and the component test proves...