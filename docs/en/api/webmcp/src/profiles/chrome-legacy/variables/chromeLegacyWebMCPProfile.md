[**context-action-monorepo v1.0.1**](../../../../../README.md)

***

[context-action-monorepo](../../../../../README.md) / [packages/webmcp/src/profiles/chrome-legacy](../README.md) / chromeLegacyWebMCPProfile

# Variable: chromeLegacyWebMCPProfile

> `const` **chromeLegacyWebMCPProfile**: [`WebMCPRuntimeProfile`](../../../interfaces/WebMCPRuntimeProfile.md)\<[`ChromeLegacyWebMCPDocument`](../interfaces/ChromeLegacyWebMCPDocument.md)\>

Defined in: [packages/webmcp/src/profiles/chrome-legacy.ts:21](https://github.com/mineclover/context-action/blob/main/packages/webmcp/src/profiles/chrome-legacy.ts#L21)

Chrome's earlier public demos allowed `registerTool` to return `void`.
Keep that API variance in this profile instead of widening the canonical
manager or every consumer of the current profile.
