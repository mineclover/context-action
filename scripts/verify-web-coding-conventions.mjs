import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const sourceRoot = path.join(repositoryRoot, 'demos/bolt-style-editor/src');

function relativePath(filePath) {
  return path.relative(repositoryRoot, filePath).split(path.sep).join('/');
}

function readSource(relativeFile) {
  const filePath = path.join(repositoryRoot, relativeFile);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${relativeFile}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function collectSourceFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(entryPath));
      continue;
    }
    if (/\.(?:ts|tsx)$/.test(entry.name)) files.push(entryPath);
  }
  return files;
}

function assertContains(relativeFile, source, pattern, description) {
  if (!pattern.test(source)) {
    throw new Error(`${relativeFile} does not expose ${description}`);
  }
}

function assertNotContains(relativeFile, source, pattern, description) {
  if (pattern.test(source)) {
    throw new Error(`${relativeFile} crosses the ${description} boundary`);
  }
}

const requiredFiles = [
  'demos/bolt-style-editor/src/bolt-style-tool-context.ts',
  'demos/bolt-style-editor/src/tool-schema.ts',
  'demos/bolt-style-editor/src/tool-handlers.tsx',
  'demos/bolt-style-editor/src/tool-result-contract.ts',
  'demos/bolt-style-editor/src/tool-command-catalog.ts',
  'demos/bolt-style-editor/src/hooks/use-tool-execution.ts',
  'demos/bolt-style-editor/src/hooks/use-editor-observables.ts',
  'demos/bolt-style-editor/src/actions/run-local-agent.ts',
  'demos/bolt-style-editor/src/openrouter.ts',
];

for (const relativeFile of requiredFiles) readSource(relativeFile);

const packageReadme = readSource('packages/live-code-editor/README.md');
assertContains(
  'packages/live-code-editor/README.md',
  packageReadme,
  /WorkspaceDocumentManager/,
  'the framework-neutral document manager boundary'
);
assertContains(
  'packages/live-code-editor/README.md',
  packageReadme,
  /WorkspaceRepository/,
  'the persistence port boundary'
);
assertContains(
  'packages/live-code-editor/README.md',
  packageReadme,
  /ToolContext schema \+ policy[\s\S]*useToolHandler/,
  'the Context-Action integration order'
);
assertContains(
  'packages/live-code-editor/README.md',
  packageReadme,
  /mode:\s*['"]agent['"]/,
  'the explicit model execution mode'
);

const contextSource = readSource(
  'demos/bolt-style-editor/src/bolt-style-tool-context.ts'
);
assertContains(
  'demos/bolt-style-editor/src/bolt-style-tool-context.ts',
  contextSource,
  /createToolContext\(/,
  'the ToolContext provider'
);
assertContains(
  'demos/bolt-style-editor/src/bolt-style-tool-context.ts',
  contextSource,
  /context\?\.mode\s*===\s*['"]direct['"]/,
  'the explicit direct execution mode policy boundary'
);

const schemaSource = readSource('demos/bolt-style-editor/src/tool-schema.ts');
assertContains(
  'demos/bolt-style-editor/src/tool-schema.ts',
  schemaSource,
  /createActionSchema\(/,
  'the canonical tool schema'
);

const handlerSource = readSource(
  'demos/bolt-style-editor/src/tool-handlers.tsx'
);
assertContains(
  'demos/bolt-style-editor/src/tool-handlers.tsx',
  handlerSource,
  /useBoltStyleToolHandler\(/,
  'the handler registration boundary'
);
const resultContractSource = readSource(
  'demos/bolt-style-editor/src/tool-result-contract.ts'
);
const catalogContractSource = readSource(
  'demos/bolt-style-editor/src/tool-catalog-contract.ts'
);
const commandCatalogSource = readSource(
  'demos/bolt-style-editor/src/tool-command-catalog.ts'
);
const agentChatSource = readSource(
  'demos/bolt-style-editor/src/views/agent-chat-panel.tsx'
);
assertContains(
  'demos/bolt-style-editor/src/tool-command-catalog.ts',
  commandCatalogSource,
  /export const standaloneToolChainRecipes/,
  'the typed standalone tool-chain recipe catalog'
);
assertContains(
  'demos/bolt-style-editor/src/tool-command-catalog.ts',
  commandCatalogSource,
  /satisfies readonly ToolChainRecipe\[\]/,
  'recipe entries checked against the catalog contract'
);
assertContains(
  'demos/bolt-style-editor/src/views/agent-chat-panel.tsx',
  agentChatSource,
  /promptRecipes\.map\(/,
  'prompt recipes injected from the catalog'
);
assertNotContains(
  'demos/bolt-style-editor/src/views/agent-chat-panel.tsx',
  agentChatSource,
  /Make it emerald|Reset demo workspace/,
  'inline prompt recipe definitions'
);
assertContains(
  'demos/bolt-style-editor/src/tool-result-contract.ts',
  resultContractSource,
  /createWorkspacePersistenceMeta[\s\S]*createWorkspaceResultMeta/,
  'the canonical workspace tool-result metadata contract'
);
assertContains(
  'demos/bolt-style-editor/src/tool-handlers.tsx',
  handlerSource,
  /createWorkspacePersistenceMeta|createWorkspaceResultMeta/,
  'the handler-to-result-contract boundary'
);
assertContains(
  'demos/bolt-style-editor/src/tool-catalog-contract.ts',
  catalogContractSource,
  /export type ToolCatalogDefinition = MCPToolDefinition;/,
  'the canonical MCP tool definition type'
);
assertContains(
  'demos/bolt-style-editor/src/tool-catalog-contract.ts',
  catalogContractSource,
  /export type ToolCatalogAnnotations = ToolAnnotations;/,
  'the canonical tool annotation type'
);

const observableSource = readSource(
  'demos/bolt-style-editor/src/hooks/use-editor-observables.ts'
);
assertContains(
  'demos/bolt-style-editor/src/hooks/use-editor-observables.ts',
  observableSource,
  /useSyncExternalStore\(/,
  'external store subscriptions'
);

const localAgentSource = readSource(
  'demos/bolt-style-editor/src/actions/run-local-agent.ts'
);
const canonicalDiscoveryPattern =
  /(?:registry\.listTools\(toToolListRequest\(\)\)|listAllTools\(registry\))/;
assertContains(
  'demos/bolt-style-editor/src/actions/run-local-agent.ts',
  localAgentSource,
  canonicalDiscoveryPattern,
  'canonical tools/list discovery'
);
assertContains(
  'demos/bolt-style-editor/src/actions/run-local-agent.ts',
  localAgentSource,
  /(?:toToolListRequest\(|listAllTools\(registry\))/,
  'canonical tools/list request conversion'
);
assertContains(
  'demos/bolt-style-editor/src/actions/run-local-agent.ts',
  localAgentSource,
  /registry\.executeModelToolCall\(/,
  'canonical model tool-call execution'
);
assertContains(
  'demos/bolt-style-editor/src/actions/run-local-agent.ts',
  localAgentSource,
  /mode:\s*['"]agent['"]/,
  'explicit agent execution mode'
);

const openRouterSource = readSource('demos/bolt-style-editor/src/openrouter.ts');
assertContains(
  'demos/bolt-style-editor/src/openrouter.ts',
  openRouterSource,
  canonicalDiscoveryPattern,
  'provider-side tools/list discovery'
);
assertContains(
  'demos/bolt-style-editor/src/openrouter.ts',
  openRouterSource,
  /toOpenAIToolDefinitions\(\s*listedTools\s*\)/,
  'canonical provider tool adapter'
);
assertNotContains(
  'demos/bolt-style-editor/src/openrouter.ts',
  openRouterSource,
  /tools:\s*registry\.toOpenAI\(\)/,
  'canonical tools/list to provider payload boundary'
);
assertContains(
  'demos/bolt-style-editor/src/openrouter.ts',
  openRouterSource,
  /registry\.executeModelToolCall\(/,
  'provider-side canonical model tool-call execution'
);
assertContains(
  'demos/bolt-style-editor/src/openrouter.ts',
  openRouterSource,
  /mode:\s*['"]agent['"]/,
  'provider agent execution mode'
);

const discoveryRequestAdapters = [
  'demos/bolt-style-editor/src/hooks/use-tool-catalog-model.ts',
  'example/src/lib/openrouter-ai-sdk.ts',
  'example/src/pages/integrations/live-web-coding/actions/useLiveWebCodingToolActions.ts',
];
for (const relativeFile of discoveryRequestAdapters) {
  const source = readSource(relativeFile);
  assertContains(
    relativeFile,
    source,
    /(?:registry\.listTools\(toToolListRequest\(\)\)|listAllTools\(registry\))/,
    'canonical tools/list request construction'
  );
  if (relativeFile === 'example/src/lib/openrouter-ai-sdk.ts') {
    assertNotContains(
      relativeFile,
      source,
      /registry\.getToolNames\(\)/,
      'parallel provider tool-name discovery'
    );
  }
}

const catalogModelSource = readSource(
  'demos/bolt-style-editor/src/hooks/use-tool-catalog-model.ts'
);
assertContains(
  'demos/bolt-style-editor/src/hooks/use-tool-catalog-model.ts',
  catalogModelSource,
  /toolsList\.tools\.map\(\(definition\) => definition\.name\)/,
  'tool names derived from the canonical tools/list result'
);
assertContains(
  'demos/bolt-style-editor/src/hooks/use-tool-catalog-model.ts',
  catalogModelSource,
  /listAllTools\(registry\)/,
  'complete tools/list pagination handling'
);
assertNotContains(
  'demos/bolt-style-editor/src/hooks/use-tool-catalog-model.ts',
  catalogModelSource,
  /registry\.(?:getToolNames|getToolDefinition)\(/,
  'parallel internal tool catalog reads'
);

const executionSource = readSource(
  'demos/bolt-style-editor/src/hooks/use-tool-execution.ts'
);
assertContains(
  'demos/bolt-style-editor/src/hooks/use-tool-execution.ts',
  executionSource,
  /toToolCallRequest\(/,
  'canonical model-to-tools/call request conversion'
);
assertContains(
  'demos/bolt-style-editor/src/hooks/use-tool-execution.ts',
  executionSource,
  /registry\.callTool\(/,
  'canonical direct tools/call execution'
);
assertContains(
  'demos/bolt-style-editor/src/hooks/use-tool-execution.ts',
  executionSource,
  /mode:\s*['"]direct['"]/,
  'explicit direct execution mode'
);

const exportSource = readSource(
  'demos/bolt-style-editor/src/hooks/use-studio-export-actions.ts'
);
assertContains(
  'demos/bolt-style-editor/src/hooks/use-studio-export-actions.ts',
  exportSource,
  /toToolCallRequest\(/,
  'canonical exported tools/call request conversion'
);
assertContains(
  'demos/bolt-style-editor/src/hooks/use-studio-export-actions.ts',
  exportSource,
  /buildPreviewDocument[\s\S]*downloadPreview/,
  'preview HTML export action boundary'
);

const previewPanelSource = readSource(
  'demos/bolt-style-editor/src/views/preview-panel.tsx'
);
assertContains(
  'demos/bolt-style-editor/src/views/preview-panel.tsx',
  previewPanelSource,
  /onExport/,
  'preview export action boundary'
);
assertContains(
  'demos/bolt-style-editor/src/views/preview-panel.tsx',
  previewPanelSource,
  /preview-panel-fullscreen/,
  'preview full-screen presentation state'
);

const editorSource = readSource('demos/bolt-style-editor/src/BoltStyleEditor.tsx');
assertContains(
  'demos/bolt-style-editor/src/BoltStyleEditor.tsx',
  editorSource,
  /useEditorObservables\(/,
  'the observable facade hook'
);
assertNotContains(
  'demos/bolt-style-editor/src/BoltStyleEditor.tsx',
  editorSource,
  /registry\.(?:getToolNames|getToolDefinition|listTools)\(/,
  'tool catalog reads from the editor composition root'
);
assertNotContains(
  'demos/bolt-style-editor/src/BoltStyleEditor.tsx',
  editorSource,
  /workspace\.(?:getDirtyFiles|getDeletedPaths|canUndo|canRedo)\(/,
  'workspace derived-state reads from the editor composition root'
);
assertContains(
  'demos/bolt-style-editor/src/hooks/use-editor-observables.ts',
  observableSource,
  /workspace\.getDirtyFiles\(\)[\s\S]*workspace\.getDeletedPaths\(\)[\s\S]*workspace\.canUndo\(\)[\s\S]*workspace\.canRedo\(\)/,
  'workspace derived-state observable facade'
);

const filesystemPortConsumerFiles = [
  'demos/bolt-style-editor/src/BoltStyleEditor.tsx',
  'demos/bolt-style-editor/src/actions/run-local-agent.ts',
  'demos/bolt-style-editor/src/hooks/use-editor-observables.ts',
  'demos/bolt-style-editor/src/hooks/use-tool-execution.ts',
  'demos/bolt-style-editor/src/hooks/use-workspace-folder-actions.ts',
  'demos/bolt-style-editor/src/tool-handlers.tsx',
];
for (const relativeFile of filesystemPortConsumerFiles) {
  const source = readSource(relativeFile);
  assertNotContains(
    relativeFile,
    source,
    /BrowserWorkspaceFileSystemAdapter/,
    'the public WorkspaceFileSystemAdapter port'
  );
  assertContains(
    relativeFile,
    source,
    /WorkspaceFileSystemAdapter/,
    'the public WorkspaceFileSystemAdapter port'
  );
}
const filesystemFacadeSource = readSource(
  'demos/bolt-style-editor/src/workspace-filesystem.ts'
);
assertContains(
  'demos/bolt-style-editor/src/workspace-filesystem.ts',
  filesystemFacadeSource,
  /type WorkspaceFileSystemAdapter/,
  'the package filesystem port export'
);

const showcaseRequestAdapters = [
  'example/src/pages/integrations/live-code-editor/actions/useLiveEditorToolActions.ts',
  'example/src/pages/integrations/live-web-coding/actions/useLiveWebCodingToolActions.ts',
];
for (const relativeFile of showcaseRequestAdapters) {
  const source = readSource(relativeFile);
  assertContains(
    relativeFile,
    source,
    /toToolCallRequest\(/,
    'the shared model-to-tools/call adapter'
  );
  assertNotContains(
    relativeFile,
    source,
    /method:\s*['"]tools\/call['"]\s*,/,
    'manual tools/call request construction'
  );
}

const protocolDocumentationFiles = [
  'docs/en/context-layered/usecase-tool-calling-web-studio.md',
  'docs/ko/context-layered/usecase-tool-calling-web-studio.md',
  'docs/en/concept/tool-calling-editor-architecture.md',
  'docs/ko/concept/tool-calling-editor-architecture.md',
  'docs/en/llms/conventions.md',
  'docs/ko/llms/conventions.md',
];
const manualToolListRequestPattern =
  /listTools\(\{\s*method:\s*['"]tools\/list['"]\s*\}\)/;
for (const relativeFile of protocolDocumentationFiles) {
  const source = readSource(relativeFile);
  assertContains(
    relativeFile,
    source,
    /toToolListRequest\(/,
    'the canonical tools/list request adapter'
  );
  assertNotContains(
    relativeFile,
    source,
    manualToolListRequestPattern,
    'manual tools/list request construction'
  );
}

const sourceFiles = collectSourceFiles(sourceRoot);
for (const filePath of sourceFiles) {
  const relativeFile = relativePath(filePath);
  const source = fs.readFileSync(filePath, 'utf8');

  if (relativeFile !== 'demos/bolt-style-editor/src/tool-handlers.tsx') {
    assertNotContains(
      relativeFile,
      source,
      /useBoltStyleToolHandler\(/,
      'tool handler registration'
    );
  }

  if (relativeFile !== 'demos/bolt-style-editor/src/bolt-style-tool-context.ts') {
    assertNotContains(
      relativeFile,
      source,
      /createToolContext\(/,
      'tool context creation'
    );
  }
}

const viewFiles = sourceFiles.filter((filePath) =>
  relativePath(filePath).includes('/src/views/')
);
const viewBoundaryRules = [
  [/from ['"]@context-action\/react['"]/, 'framework action runtime'],
  [/from ['"]dexie['"]/, 'browser persistence'],
  [
    /\bworkspace\.(?:createFile|updateFile|renameFile|deleteFile|importFolder|setActivePath|setPreviewStatus)\(/,
    'workspace mutation',
  ],
  [
    /\bregistry\.(?:listTools|toOpenAI|toMCP|callTool|executeModelToolCall)\(/,
    'tool catalog or execution boundary',
  ],
];
for (const filePath of viewFiles) {
  const relativeFile = relativePath(filePath);
  const source = fs.readFileSync(filePath, 'utf8');
  for (const [pattern, description] of viewBoundaryRules) {
    assertNotContains(relativeFile, source, pattern, description);
  }
}

console.log('Web-coding Context-Action convention check');
console.log('- ToolContext creation: bolt-style-tool-context.ts');
console.log('- canonical tool schema: tool-schema.ts');
console.log('- handler registrations: tool-handlers.tsx');
console.log('- canonical workspace tool-result metadata boundary checked');
console.log('- external subscriptions: use-editor-observables.ts');
console.log('- workspace derived-state observable boundary checked');
console.log('- canonical catalog read model: use-tool-catalog-model.ts');
console.log('- provider boundaries: tools/list → registry export → executeModelToolCall');
console.log(`- showcase request adapters checked: ${showcaseRequestAdapters.length}`);
console.log(`- protocol documentation checked: ${protocolDocumentationFiles.length}`);
console.log('- live editor package integration docs checked: 1');
console.log(
  `- filesystem port consumers checked: ${filesystemPortConsumerFiles.length}`
);
console.log(`- presentation views checked: ${viewFiles.length}`);
console.log('- direct runtime/mutation crossings: 0');
