---
title: sem-doc document binding validation
type: component
status: active
version: 1.0.0
semDocumentKind: code
semEntityId: packages/sem-doc/src/binding-validation.ts::class::DocumentBindingValidationService
semEntityName: DocumentBindingValidationService
semEntityType: class
semEntityFile: packages/sem-doc/src/binding-validation.ts
---

# [[Document Binding Validation]]

## Purpose

`DocumentBindingValidationService` proves that each code-backed documentation checkpoint points to
one current sem entity. It prevents an identically named symbol in another file, type, or scope from
silently becoming the document's source.

## Input and output

The service reads the revision-pinned sem `entities --json` catalog and the selected documentation
root. It returns `sem-doc-binding-validation.v2` with provenance, strict-mode classification counts,
resolution status, and machine-readable issues. The CLI command is `sem-doc docs validate-bindings`.

## Identity logic

The sem adapter normalizes both real v0.21.0 entity shapes to a canonical ID. Top-level identities
use `file::type::name`; scoped identities use `parent_id::name`. Validation then requires exact ID,
name, type, and repository-relative file agreement with [[Document Entity Binding Convention]].
There is no name-only fallback.

## Failure behavior

A declared binding fails when its canonical ID is missing, duplicated, or disagrees with its
declared provenance. Document-only checkpoints may remain unbound and are reported separately.
The repository revision is checked before and after analysis so results cannot combine different
working-tree states.

## Scope

The service validates sem-exposed entities only. It does not promise a complete inventory of every
function-local variable or constant, and it does not use wall-clock thresholds as correctness gates.
