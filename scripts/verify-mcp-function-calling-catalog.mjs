import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

function readSource(relativeFile) {
  const filePath = path.join(repositoryRoot, relativeFile);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required catalog source: ${relativeFile}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function extractNamedTools(source) {
  return [...source.matchAll(/name:\s*['"]([^'"]+)['"]/g)].map(
    ([, name]) => name
  );
}

function extractCatalogTools(source) {
  const names = [];
  for (const [, arraySource] of source.matchAll(
    /tools:\s*\[([\s\S]*?)\]/g
  )) {
    for (const [, name] of arraySource.matchAll(/['"]([^'"]+)['"]/g)) {
      names.push(name);
    }
  }
  return names;
}

function assertContains(source, pattern, label) {
  if (!pattern.test(source)) {
    throw new Error(`Missing ${label} contract.`);
  }
}

function assertNotContains(source, pattern, label) {
  if (pattern.test(source)) {
    throw new Error(`Unexpected ${label} contract.`);
  }
}

function assertCatalogMatchesSchema({
  catalogSource,
  schemaSource,
  marker,
  endMarker,
  label,
}) {
  const markerIndex = catalogSource.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error(`Catalog marker not found for ${label}: ${marker}`);
  }
  const endIndex = endMarker
    ? catalogSource.indexOf(endMarker, markerIndex)
    : catalogSource.length;
  if (endMarker && endIndex < 0) {
    throw new Error(`Catalog end marker not found for ${label}: ${endMarker}`);
  }

  const catalogNames = [
    ...new Set(extractCatalogTools(catalogSource.slice(markerIndex, endIndex))),
  ];
  const schemaNames = new Set(extractNamedTools(schemaSource));
  const unknownNames = catalogNames.filter((name) => !schemaNames.has(name));

  if (unknownNames.length > 0) {
    throw new Error(
      `${label} references tools missing from its schema: ${unknownNames.join(', ')}`
    );
  }

  return catalogNames.length;
}

const catalogSource = readSource(
  'example/src/lib/mcp-function-calling-catalog.ts'
);
const uiSchemaSource = readSource('example/src/lib/ui-tools-schema.ts');
const standaloneSchemaSource = readSource(
  'demos/bolt-style-editor/src/tool-schema.ts'
);
const aiRunnerContractSource = readSource('example/src/lib/ai-tool-runner.ts');
const aiRunnerSource = readSource('example/src/lib/openrouter-ai-sdk.ts');
const aiDemoSource = readSource(
  'example/src/pages/integrations/ai/ToolContextAIDemo.tsx'
);
const realtimeWebCodingSource = readSource(
  'example/src/pages/integrations/live-web-coding/LiveWebCodingPage.tsx'
);
const realtimeToolActionsSource = readSource(
  'example/src/pages/integrations/live-web-coding/actions/useLiveWebCodingToolActions.ts'
);
const realtimeAgentActionsSource = readSource(
  'example/src/pages/integrations/live-web-coding/actions/useLiveWebCodingAgentExecution.ts'
);
const realtimeToolHandlersSource = readSource(
  'example/src/pages/integrations/live-web-coding/handlers/LiveWebCodingToolHandlers.tsx'
);
const realtimeObservablesSource = readSource(
  'example/src/pages/integrations/live-web-coding/hooks/useLiveWebCodingObservables.ts'
);
const realtimeTraceActionsSource = readSource(
  'example/src/pages/integrations/live-web-coding/actions/useLiveWebCodingTraceActions.ts'
);
const liveEditorToolbarSource = readSource(
  'example/src/pages/integrations/live-code-editor/LiveEditorAIToolbar.tsx'
);
const liveEditorPageSource = readSource(
  'example/src/pages/integrations/live-code-editor/LiveCodeEditorPage.tsx'
);
const liveEditorToolActionsSource = readSource(
  'example/src/pages/integrations/live-code-editor/actions/useLiveEditorToolActions.ts'
);
const liveEditorAgentActionsSource = readSource(
  'example/src/pages/integrations/live-code-editor/actions/useLiveEditorAgentExecution.ts'
);
const liveEditorTraceActionsSource = readSource(
  'example/src/pages/integrations/live-code-editor/actions/useLiveEditorTraceActions.ts'
);
const liveEditorProviderSettingsSource = readSource(
  'example/src/pages/integrations/live-code-editor/actions/useLiveEditorProviderSettings.ts'
);
const liveEditorObservablesSource = readSource(
  'example/src/pages/integrations/live-code-editor/hooks/useLiveEditorObservables.ts'
);
const exampleTraceSource = readSource('example/src/lib/tool-call-trace.ts');

assertContains(
  aiRunnerContractSource,
  /responseMessages:\s*ModelMessage\[\]/,
  'AI runner response-message history'
);
assertContains(
  aiRunnerSource,
  /responseMessages:\s*response\.responseMessages/,
  'OpenRouter response-message propagation'
);
assertContains(
  aiDemoSource,
  /setModelMessages\(\[\.\.\.requestMessages, \.\.\.response\.responseMessages\]\)/,
  'ToolContext AI multi-turn history preservation'
);
assertContains(
  realtimeAgentActionsSource,
  /setModelMessages\(\[\.\.\.requestMessages, \.\.\.response\.responseMessages\]\)/,
  'realtime web-coding multi-turn history preservation'
);
assertContains(
  realtimeToolActionsSource,
  /source:\s*'local',[\s\S]*?mode:\s*'agent',[\s\S]*?provider:\s*'local-fallback'/,
  'realtime web-coding local-agent source and mode'
);
assertContains(
  exampleTraceSource,
  /method:\s*'tools\/list'/,
  'example tools/list trace method'
);
assertContains(
  exampleTraceSource,
  /method:\s*'tools\/call'/,
  'example tools/call trace method'
);
assertContains(
  realtimeToolActionsSource,
  /recordLiveWebCodingToolList\(result\.tools\.length/,
  'realtime web-coding discovery trace'
);
assertContains(
  exampleTraceSource,
  /method:\s*'agent\.request'/,
  'example agent request trace method'
);
assertContains(
  realtimeAgentActionsSource,
  /startLiveWebCodingAgentTrace\(agentSource,\s*sessionId\)/,
  'realtime web-coding agent trace lifecycle'
);
assertContains(
  realtimeToolActionsSource,
  /registry\.callTool\(\s*toToolCallRequest\(/,
  'realtime web-coding direct action boundary'
);
assertContains(
  realtimeToolActionsSource,
  /registry\.executeModelToolCall\(/,
  'realtime web-coding model-shaped action boundary'
);
assertContains(
  realtimeToolActionsSource,
  /registry\.listTools\(toToolListRequest\(\)\)/,
  'realtime web-coding action discovery boundary'
);
assertContains(
  realtimeAgentActionsSource,
  /runner\.generate\([\s\S]*?registry:/,
  'realtime web-coding provider action boundary'
);
assertContains(
  realtimeToolHandlersSource,
  /useLiveWebCodingToolHandler\(/,
  'realtime web-coding handler registration boundary'
);
assertContains(
  realtimeObservablesSource,
  /useSyncExternalStore\(/,
  'realtime web-coding external observable boundary'
);
assertContains(
  realtimeTraceActionsSource,
  /clearLiveWebCodingTrace\(\)/,
  'realtime web-coding trace clear action'
);
assertContains(
  realtimeTraceActionsSource,
  /serializeToolTrace\(/,
  'realtime web-coding trace export action'
);
assertNotContains(
  realtimeWebCodingSource,
  /registry\.(?:callTool|executeModelToolCall|listTools)/,
  'direct runtime registry APIs from the realtime web-coding workbench'
);
assertNotContains(
  realtimeWebCodingSource,
  /useLiveWebCodingToolHandler\(/,
  'handler registration from the realtime web-coding workbench'
);
assertNotContains(
  realtimeWebCodingSource,
  /(?:useSyncExternalStore|liveWebCodingTraceStore|clearLiveWebCodingTrace|serializeToolTrace|downloadTextFile|writeClipboardText)/,
  'observable or trace runtime APIs from the realtime web-coding workbench'
);
assertContains(
  liveEditorAgentActionsSource,
  /startLiveEditorAgentTrace\('model',\s*sessionId\)/,
  'live editor agent trace lifecycle'
);
assertContains(
  liveEditorAgentActionsSource,
  /recordLiveEditorToolList\(listedTools\.tools\.length/,
  'live editor discovery trace'
);
assertContains(
  liveEditorToolActionsSource,
  /registry\.callTool\(\s*toToolCallRequest\(/,
  'live editor direct action boundary'
);
assertContains(
  liveEditorToolActionsSource,
  /registry\.executeModelToolCall\(/,
  'live editor model-shaped action boundary'
);
assertContains(
  liveEditorToolActionsSource,
  /registry\.listTools\(toToolListRequest\(\)\)/,
  'live editor action discovery boundary'
);
assertContains(
  liveEditorAgentActionsSource,
  /registry\.listTools\(toToolListRequest\(\)\)/,
  'live editor agent discovery boundary'
);
assertContains(
  liveEditorAgentActionsSource,
  /runner\.generate\([\s\S]*?registry,/,
  'live editor provider action boundary'
);
assertContains(
  liveEditorTraceActionsSource,
  /clearLiveEditorTrace\(\)/,
  'live editor trace clear action'
);
assertContains(
  liveEditorTraceActionsSource,
  /serializeToolTrace\(/,
  'live editor trace export action'
);
assertContains(
  liveEditorProviderSettingsSource,
  /useStoredOpenRouterApiKey\(\)/,
  'live editor provider key observable'
);
assertContains(
  liveEditorProviderSettingsSource,
  /getFreeModelsWithTools\(\)/,
  'live editor provider model action'
);
assertContains(
  liveEditorObservablesSource,
  /useSyncExternalStore\(/,
  'live editor external observable hook'
);
assertContains(
  liveEditorPageSource,
  /role="dialog"[\s\S]*aria-modal="true"/,
  'live editor reset approval dialog'
);
assertNotContains(
  liveEditorPageSource,
  /window\.confirm\(/,
  'native confirmation from the live editor page'
);
assertContains(
  realtimeWebCodingSource,
  /role="dialog"[\s\S]*aria-modal="true"/,
  'realtime web-coding reset approval dialog'
);
assertNotContains(
  realtimeWebCodingSource,
  /window\.confirm\(/,
  'native confirmation from the realtime web-coding page'
);
assertNotContains(
  liveEditorToolbarSource,
  /(?:registry\.(?:callTool|executeModelToolCall|listTools)|liveEditorTraceStore|useSyncExternalStore|getFreeModelsWithTools|saveOpenRouterApiKey|serializeToolTrace|downloadTextFile|writeClipboardText)/,
  'external runtime APIs from the presentation toolbar'
);

const uiCount = assertCatalogMatchesSchema({
  catalogSource,
  schemaSource: uiSchemaSource,
  marker: 'export const mcpFunctionCallingCommands',
  endMarker: 'export const mcpStandaloneCommands',
  label: 'UI catalog',
});
const standaloneCount = assertCatalogMatchesSchema({
  catalogSource,
  schemaSource: standaloneSchemaSource,
  marker: 'export const mcpStandaloneCommands',
  label: 'standalone catalog',
});

console.log('MCP/function-calling catalog contract check');
console.log(`- UI catalog tool references checked: ${uiCount}`);
console.log(`- standalone catalog tool references checked: ${standaloneCount}`);
console.log('- AI runner response-message history checked: 2 showcases');
console.log('- realtime local-agent source/mode contract checked');
console.log('- example tools/list/tools/call trace methods checked');
console.log('- example agent.request trace lifecycle checked');
console.log('- live editor agent/discovery trace lifecycle checked');
console.log('- live editor action/presentation boundary checked');
console.log('- live editor observability/settings/export boundaries checked');
console.log('- live editor reset approval boundary checked');
console.log('- realtime web-coding handler/action/presentation boundary checked');
console.log('- realtime web-coding observability/trace export boundary checked');
console.log('- realtime web-coding reset approval boundary checked');
