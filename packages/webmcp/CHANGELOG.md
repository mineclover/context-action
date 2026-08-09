# Change Log

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
