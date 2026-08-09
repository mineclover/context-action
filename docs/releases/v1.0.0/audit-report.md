# v1.0.0 Independent Audit Report

**Status:** `not performed`

This file is intentionally a template. It may be completed only by a reviewer
who did not implement the RC changes.

## Required record

- Reviewer, date, clean checkout commit, and evidence manifest hash.
- GitHub reviewer login, audit pull-request number, immutable review ID,
  reviewed commit, and an `APPROVED` decision. This record makes the claimed
  independence review traceable to GitHub; it is not satisfied by a free-form
  reviewer name alone.
- Result for every replay in [audit-protocol.md](./audit-protocol.md).
- Public API, docs, tarball, consumer, security, and provenance review notes.
- Open P0/P1 findings, or an explicit statement that none exist.
- One verdict: `READY` or `NOT READY`.

## Acceptance record

For a `READY` verdict, preserve the completed report and an evidence manifest,
then update `release-manifest.json` with all of the following before changing
the release status to `audited`:

- the independent reviewer's identity;
- reviewed artifact source commit `63f790a521e3428a7a2825677747338f8f05ccf3`;
- repository-relative paths to this report and the audit evidence manifest; and
- SHA-256 values for both files.
- the GitHub approval identity (`login`, `pullRequest`, `reviewId`,
  `reviewCommit`, and `decision: APPROVED`) under `audit.review`.

The release manifest verifier and `Promote V1 to Latest` workflow reject an
accepted audit when either file is missing, changes after hashing, or is bound
to a different source commit. During promotion, the workflow also retrieves the
recorded GitHub review with read-only API access and rejects a mismatched
reviewer, commit, or decision.

Do not replace this template with implementation self-review evidence.
