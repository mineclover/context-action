---
semDocumentKind: architecture
---

# ADR-0001: Use sem-exposed entities without a complete local-scope inventory

- Status: Accepted
- Date: 2026-07-15

## Context

`sem-doc` needs stable symbol identity, definition-source mapping, and bounded relationship traversal
before an engineer changes code. The external `sem` engine provides entity IDs, source ranges,
parent relationships, dependency edges, and impact traversal suitable for that purpose.

`sem` does not expose a complete inventory of every declaration inside a TypeScript function scope.
In particular, function-local `const`/`let` bindings can be used internally for name resolution and
shadowing without becoming independently queryable entities. Adding a second AST extractor solely
to enumerate those declarations would create another identity system and broaden `sem-doc` beyond
its sem-centered ownership boundary.

## Decision

`sem-doc` will:

- use only entities exposed by `sem` for symbol inventories and source mapping;
- preserve the entity type reported by `sem` and not claim exact constant classification when sem
  reports a broader type such as `variable`;
- rely on sem's lexical resolution to distinguish imports from same-named or shadowing bindings;
- treat `hop` as relationship distance in sem's bounded dependency/impact graph, never as lexical
  scope depth or containment;
- keep affected tests without a sem-reported relationship depth outside the hop-labelled inventory;
- continue to exclude exact reference-site line/column tracking.

`sem-doc` will not:

- attempt to completely collect function-local functions, constants, variables, or parameters;
- introduce a separate TypeScript AST/local-scope index for that purpose;
- infer a hop value from lexical containment or from membership in an affected-test list.

This separation was introduced in `sem-doc-work-context.v2` and remains in v5: bounded entities stay
in `symbols`, and the complete test list is returned independently in `affectedTests`.

## Consequences

The code-analysis boundary remains centered on one entity identity system: `sem`. Same-named
external symbols can still be distinguished by sem entity identity and definition provenance, and
shadowed imports can still be excluded by sem's scope resolution.

Function-local declarations that sem does not emit may appear in source excerpts but are not
guaranteed to appear as independently addressable work-context symbols. If complete local-scope
enumeration becomes a requirement later, it requires a new decision record, an explicit identity
and reconciliation contract, and a versioned work-context schema change.
