---
title: sem-doc document entity binding convention
type: convention
status: active
version: 1.1.0
---

# [[Document Entity Binding Convention]]

## Purpose

This convention prevents a document from resolving to an unintended same-named code symbol. It
defines how a documentation checkpoint becomes the SSOT explanation for one exact sem entity.

The key words MUST, MUST NOT, SHOULD, and MAY are normative.

## Checkpoint and code identity

- A double-bracket H1 checkpoint is the unique documentation routing identity.
- A checkpoint name MAY differ from the implementation symbol name.
- A code-backed SSOT document MUST declare all four binding fields:

```yaml
---
semEntityId: src/auth.ts::function::authenticateUser
semEntityName: authenticateUser
semEntityType: function
semEntityFile: src/auth.ts
---
# [[Authentication Entry Point]]
```

- `semEntityFile` MUST be a normalized repository-relative path.
- A bound document MUST contain exactly one canonical H1 checkpoint.
- The index MUST NOT fall back to a display-name match.
- A document-only checkpoint MAY omit the binding fields. It remains valid but is counted as
  `unbound` and cannot be selected as a code entity's SSOT document.

## Resolution

A binding is `resolved` only when a current sem entity matches the declared ID, name, type, and file.
All comparisons are case-sensitive.

sem v0.21.0 exposes the same identity in two JSON shapes. `impact` and `context` return
`entityId`; `entities` returns `parent_id` but omits the entity's own ID. sem-doc MUST normalize an
`entities` row to the canonical ID before validation:

- a top-level entity is `<file>::<type>::<name>`;
- a scoped entity is `<parent_id>::<name>`.

This normalization is an adapter concern. Documents MUST continue to declare the canonical
`semEntityId`; they MUST NOT substitute a display name or a definition line range for identity.
If a catalog row reports an inverted line range, sem-doc omits that range rather than inventing
source evidence. ID, name, type, and file remain the binding contract; line ranges are not locators.

The following conditions are errors:

- only some `semEntity*` fields are present;
- two documents define the same checkpoint;
- two documents bind the same sem entity ID;
- the declared entity ID is absent from the sem entity catalog;
- sem returns the entity ID more than once;
- ID matches but name, type, or file differs.

A same-named entity or document with different provenance MUST NOT be selected. It may be shown as a
diagnostic candidate only.

## Validation command

```bash
sem-doc docs validate-bindings [<docs-root>] [--no-cache] [--json]
```

The command records `sem-doc-binding-validation.v1`, Git revision, sem version and arguments,
document schema, entity count, resolved/unresolved totals, and issues. It exits with status 1 when a
declared binding is invalid. Unbound document-only checkpoints are counted but do not fail the
command.

`SEM_BIN` selects the sem executable. Validation requires the real sem entity catalog for the
repository; fake-sem results are test evidence only.

## Parsing boundary

Only H1 checkpoints outside fenced code blocks are canonical definitions. Double-bracket examples
inside fenced code blocks MUST NOT create definitions, references, or missing-reference diagnostics.

## Change maintenance

After a code symbol is renamed, moved, or reclassified, its SSOT document binding MUST be updated in
the same change. Until then validation reports the binding as missing or provenance-mismatched rather
than silently attaching another same-named symbol.

## Decision references

- [ADR-0001](../decisions/0001-sem-entity-scope-boundary.md)
- [ADR-0003](../decisions/0003-exact-document-entity-binding.md)
