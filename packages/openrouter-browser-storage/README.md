# @context-action/openrouter-browser-storage

Private framework-neutral browser storage for the user-owned OpenRouter API
key used by Context-Action demos.

The package standardizes the `context-action.openrouter.api-key` localStorage
entry and its same-origin subscription behavior. It does not send the key to a
server, provide an OpenRouter client, or attempt to share storage across
different origins. React integrations can wrap the subscription with
`useSyncExternalStore`; non-React demos can consume the plain functions.
