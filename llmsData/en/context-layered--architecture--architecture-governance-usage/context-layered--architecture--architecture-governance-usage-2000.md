---
document_id: context-layered--architecture--architecture-governance-usage
category: context-layered
source_path: en/context-layered/architecture/architecture-governance-usage.md
character_limit: 2000
last_update: '2026-07-22T19:56:24.942Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Architecture Governance Usage

Architecture Governance Usage This guide is the shortest path from a repository checkout to a reproducible Architecture Governance symbol catalog. Use the architecture governance overview for concepts and the package README for the complete API and contract reference. This is a Context-Action convention PoC: use it to validate repository-local authored rules and evidence, not as a generic architecture analyzer or a documentation generator. sem-doc remains the separate Symbol Context SSOT for work-context and document bindings. 1. Prepare the repository The current PoC runs inside the context-action workspace and requires Node.js 24 and pnpm. Install dependencies and build the governance package before invoking the CLI directly: The workspace pins @ataraxy-labs/sem@0.21.0. The default command resolution uses that package's sem binary. Set SEMCOMMAND or pass --sem-command only when testing a different executable; the provider must still report the