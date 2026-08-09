# Release evidence

Each `v1.0.0-*` directory is an immutable record for one release stage. The
manifest schema is [schema.json](./schema.json). A recorded command is not
release certification by itself: use the applicable roadmap gate and strict
verification before marking a gate complete.

Create a new evidence bundle with a fresh, stage-specific directory:

```sh
pnpm release:evidence:write -- \
  --release context-action-v1.0.0 \
  --stage v1.0.0-rc.1 \
  --command core-tests="pnpm test:core" \
  --artifact reports/core-contract.json
```

The writer captures the source working-tree state before creating its own
evidence directory, executes each named command from the repository root,
stores its combined output under `logs/`, copies declared artifacts under
`artifacts/`, and records SHA-256 hashes, exact timing, exit codes, commit,
and runtime versions in `manifest.json`. It refuses to overwrite an evidence
directory.

Validate an existing bundle before using it as gate evidence:

```sh
pnpm release:evidence:verify -- \
  --file release-evidence/v1.0.0-rc.1/manifest.json \
  --require-success
```

`--require-success` rejects an empty manifest, any non-zero recorded command,
or a dirty/unknown working tree.
It does not certify release scope, public API, consumer compatibility, or an
independent audit; those decisions remain governed by the release roadmap.
