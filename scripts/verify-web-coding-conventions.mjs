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
  'demos/bolt-style-editor/src/hooks/use-tool-execution.ts',
  'demos/bolt-style-editor/src/hooks/use-editor-observables.ts',
  'demos/bolt-style-editor/src/actions/run-local-agent.ts',
];

for (const relativeFile of requiredFiles) readSource(relativeFile);

const contextSource = readSource(
  'demos/bolt-style-editor/src/bolt-style-tool-context.ts'
);
assertContains(
  'demos/bolt-style-editor/src/bolt-style-tool-context.ts',
  contextSource,
  /createToolContext\(/,
  'the ToolContext provider'
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

const observableSource = readSource(
  'demos/bolt-style-editor/src/hooks/use-editor-observables.ts'
);
assertContains(
  'demos/bolt-style-editor/src/hooks/use-editor-observables.ts',
  observableSource,
  /useSyncExternalStore\(/,
  'external store subscriptions'
);

const editorSource = readSource('demos/bolt-style-editor/src/BoltStyleEditor.tsx');
assertContains(
  'demos/bolt-style-editor/src/BoltStyleEditor.tsx',
  editorSource,
  /useEditorObservables\(/,
  'the observable facade hook'
);

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
  [/\bregistry\.(?:callTool|executeModelToolCall)\(/, 'tool execution'],
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
console.log('- external subscriptions: use-editor-observables.ts');
console.log(`- presentation views checked: ${viewFiles.length}`);
console.log('- direct runtime/mutation crossings: 0');
