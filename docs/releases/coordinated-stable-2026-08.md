# Coordinated stable release: August 2026

This document records the approved release boundary after the stabilization
work. It does not rewrite the immutable [v1.0.0 release record](v1.0.0/index.md).

## Approved cohort

| Package | Version | Reason |
| --- | --- | --- |
| `@context-action/core` | `1.1.0` | Additive shutdown API and corrected runtime lifecycle semantics. |
| `@context-action/react` | `2.0.0` | Store/Action lifecycle and SSR stabilization. |

Durable Operations 0.2 and its ToolContext integration remain a separate
development track. The React 2 artifact intentionally excludes the `./tools`
subpath so the state-management release does not publish an unresolved Durable
dependency.

## Delivery path

1. Commit the versions, changelogs, generated API reference, and this plan to
   `main`; dispatch the candidate workflow using that exact commit SHA.
2. The candidate path performs `release:check`, validates the plan and packed
   cohort dependency closure, publishes the two immutable artifacts only to
   `next`, then records consumer and registry evidence.
3. The promotion path accepts only the same exact main SHA, rechecks the plan
   and `next` consumer matrix, then promotes the whole cohort to `latest`.
   Any post-promotion failure restores only a tag that still points to that
   candidate, using the recorded predecessor map.

Neither workflow publishes a locally chosen version, reuses a version from a
different commit, or treats the v1.0.0 historical manifest as current state.

## Follow-up

After candidate evidence is reviewed, use the coordinated promotion workflow;
do not use the maintenance patch, generic package, Mutative, or historical v1
workflow for this cohort. Store the uploaded candidate and promotion evidence
with the release record before announcing the new `latest` versions.
