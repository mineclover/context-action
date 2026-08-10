# Change Log

## [0.1.2] (2026-08-10)

### Packaging Correction

- Package the `0.1.1` registry-hygiene entry in the distributed changelog.
  This patch changes no runtime API, declaration, or dist-tag policy.

## [0.1.1] (2026-08-09)

### Registry Hygiene

- Replace the accidental `0.1.0-rc.0` `latest` tag with the versioned
  experimental package patch. This packaging-only correction preserves
  `next=0.1.0` and `rc=0.1.0-rc.0` and changes no runtime API.

## [0.1.0] (2026-08-09)

### Experimental Contract

- Publish the imperative WebMCP adapter and the
  `profiles/chrome-legacy` compatibility subpath as explicitly experimental
  APIs.
- Require consumers of the React integration to import
  `useWebMCPToolScope` from `@context-action/react/webmcp`, not the stable
  `@context-action/react/tools` ToolContext entry.

### Breaking Changes from RC builds

- Remove the `beforeExecute` alias and `errorMode: 'result'`; use the
  documented post-execution and structured-error contracts instead.
