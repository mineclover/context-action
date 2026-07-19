---
semDocumentKind: architecture
---

# ADR-0003: Bind document checkpoints to exact sem entity provenance

- Status: Accepted
- Date: 2026-07-15

## Context

Document checkpoints explain intent, logic, structure, and relationships. Code symbol names alone
cannot safely connect those documents to code because unrelated scopes and files may contain the
same display name.

The checkpoint name is also a documentation routing concern and does not need to equal the code
entity name. Conflating the two would either create accidental links or force documentation names to
mirror implementation details.

## Decision

A document may bind its single canonical double-bracket H1 checkpoint to a sem entity using these required
frontmatter fields:

```yaml
---
semDocumentKind: code
semEntityId: src/auth.ts::function::authenticateUser
semEntityName: authenticateUser
semEntityType: function
semEntityFile: src/auth.ts
---
# [[Authentication Entry Point]]
```

The checkpoint remains the document SSOT routing name. The four `semEntity*` fields form the code
binding and must all match the sem entity returned for work-context.

The index follows these rules:

- it never binds a document to code by display name alone;
- a matching locator resolves to its checkpoint, definitions, references, and backlinks;
- no exact match produces an explicit `unresolved` result;
- same-name bindings for other entities are diagnostics only and are never selected;
- incomplete locator metadata, duplicate checkpoint definitions, and duplicate entity bindings are
  index errors;
- a document with entity metadata must contain exactly one canonical H1 checkpoint.

## Consequences

`sem-documents.v3` carries document classification and entity binding provenance, and `sem-doc-work-context.v4` performs exact
entity lookup. Existing H1-only documents remain valid document checkpoints but do not automatically
bind to code.

Code moves, renames, or identity changes make the binding unresolved instead of silently routing to
a same-named entity. Updating the document locator is therefore an explicit SSOT maintenance action.
