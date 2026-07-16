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
const liveEditorToolbarSource = readSource(
  'example/src/pages/integrations/live-code-editor/LiveEditorAIToolbar.tsx'
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
  realtimeWebCodingSource,
  /setModelMessages\(\[\.\.\.requestMessages, \.\.\.response\.responseMessages\]\)/,
  'realtime web-coding multi-turn history preservation'
);
assertContains(
  realtimeWebCodingSource,
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
  realtimeWebCodingSource,
  /recordLiveWebCodingToolList\(listedTools\.tools\.length/,
  'realtime web-coding discovery trace'
);
assertContains(
  exampleTraceSource,
  /method:\s*'agent\.request'/,
  'example agent request trace method'
);
assertContains(
  realtimeWebCodingSource,
  /startLiveWebCodingAgentTrace\(agentSource,\s*sessionId\)/,
  'realtime web-coding agent trace lifecycle'
);
assertContains(
  liveEditorToolbarSource,
  /startLiveEditorAgentTrace\('model',\s*sessionId\)/,
  'live editor agent trace lifecycle'
);
assertContains(
  liveEditorToolbarSource,
  /recordLiveEditorToolList\(listedTools\.tools\.length/,
  'live editor discovery trace'
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
