# Architecture Decision Records

Decision records keep durable architectural choices close to the conventions
that govern them. They are not a runtime registry and do not duplicate a
package README or public guide.

## What belongs where

| Artifact | Owns | Does not replace |
| --- | --- | --- |
| Decision record | why a durable boundary was chosen, alternatives, invariants, and reversal conditions | implementation details or consumer usage |
| Package README | discovery, public entry points, and a quickstart | the complete behavior or architecture contract |
| Authoritative guide | current behavior, limits, and operating guidance | the decision history |
| Tests and focused gates | executable proof | the explanation of intent |

Use the [Documentation and Development Management Convention](/en/concept/documentation-development-conventions)
to choose the document source and verification command for the wider change.

## When to create one

Create a record for a decision that changes package ownership or dependency
direction, provider/handler/store boundaries, a protocol contract, persistence
or privacy behavior, or a temporary compatibility exception.

Use a stable identifier in the filename, for example
`CA-TOOL-PROTOCOL-001.md`. Keep the identifier when the implementation moves;
link a replacement record when the decision is superseded.

## Required shape

```md
# CA-AREA-001: Short decision title

**Status:** accepted | superseded | deprecated
**Owner:** package or area owner
**Related issue/spec:** #123 or CA-SPEC-001

## Context

## Options considered

## Decision

## Consequences and invariants

## Verification evidence

## Reversal or migration conditions
```

The implementation, focused tests, and authoritative user documentation remain
the evidence for the decision. This index only establishes the durable home and
format for the decision itself.

Before marking a decision accepted, make sure that it has an owner, a stable
identifier, an explicit non-goal or rejected alternative, implementation/test
anchors, and a link to the package or guide whose contract it changes.

## Existing reference decisions

- [PostgreSQL Durable Operation Adapter](../architecture/postgres-durable-operation-adapter.md)
