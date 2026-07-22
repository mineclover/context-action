---
document_id: context-layered--architecture--sem-doc-usage
category: context-layered
source_path: en/context-layered/architecture/sem-doc-usage.md
character_limit: 2000
last_update: '2026-07-22T19:56:24.952Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
sem-doc Usage

sem-doc Usage @context-action/sem-doc is the operational Symbol Context plane. Use it when an implementer or reviewer needs to answer which symbols, dependent files, documents, tests, and Git changes belong to a change. It produces versioned advisory artifacts; it is not the Architecture Governance registry, CI policy gate, complete architecture snapshot, or TypeDoc replacement. 1. Install the published package sem-doc requires Node.js 24. The published package includes the pinned @ataraxy-labs/sem@0.21.0 runtime wrapper and the two Foundation packages, so a clean install provides the default sem executable as well: New releases are owned by the canonical context-action-documentation-tooling repository. This consumer uses the published package; no sem-doc or Foundation source copy is kept in this workspace. SEMBIN is only needed when a repository intentionally uses a different sem executable: 2. Build the implementer context Start with one target symbol and its def