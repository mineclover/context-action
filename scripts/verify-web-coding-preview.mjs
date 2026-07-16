import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const rootDirectory = path.resolve(import.meta.dirname, '..');
const compilerPath = path.join(
  rootDirectory,
  'demos/bolt-style-editor/src/preview-document.ts'
);
const require = createRequire(import.meta.url);
const typescript = require('typescript');
const source = await readFile(compilerPath, 'utf8');
const { outputText } = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
  fileName: compilerPath,
});
const preview = await import(
  'data:text/javascript;base64,' + Buffer.from(outputText).toString('base64')
);

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function expectEqual(actual, expected, message) {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);
  expect(
    actualText === expectedText,
    `${message}\nexpected: ${expectedText}\nactual: ${actualText}`
  );
}

function expectIncludes(sourceText, expected, message) {
  expect(
    sourceText.includes(expected),
    message + '\nexpected to find: ' + expected
  );
}

const files = [
  {
    path: 'index.html',
    language: 'html',
    source:
      '<!doctype html><html><head><link rel="stylesheet" href="styles.css"></head><body><img src="assets/bg.png"><script src="app.js"></script></body></html>',
    kind: 'text',
  },
  {
    path: 'styles.css',
    language: 'css',
    source: 'body { background: url("assets/bg.png"); }',
    kind: 'text',
  },
  {
    path: 'app.js',
    language: 'javascript',
    source: "document.body.dataset.preview = 'ok';",
    kind: 'text',
  },
  {
    path: 'assets/bg.png',
    language: 'asset',
    source: '',
    kind: 'asset',
  },
];

const document = preview.buildPreviewDocument(
  files,
  { 'assets/bg.png': 'blob:asset-proof' },
  9
);

expect(
  preview.findPreviewHtmlFile(files)?.path === 'index.html',
  'index.html must be preferred as the preview entry file.'
);
expectIncludes(
  document,
  'data-workspace-source="styles.css"',
  'Referenced CSS must be inlined with its workspace source marker.'
);
expectIncludes(
  document,
  'url("blob:asset-proof")',
  'Asset URLs inside inlined CSS must resolve to Blob URLs.'
);
expectIncludes(
  document,
  "document.body.dataset.preview = 'ok';",
  'Referenced JavaScript must be inlined into the preview document.'
);
expectIncludes(
  document,
  '<img src="blob:asset-proof">',
  'Asset URLs in HTML elements must resolve to Blob URLs.'
);
expectIncludes(
  document,
  'const revision=9',
  'The preview bridge must carry the workspace revision.'
);
expectIncludes(
  document,
  'context-action.preview.ready',
  'The preview bridge must report its ready message type.'
);

const nestedCssDocument = preview.buildPreviewDocument(
  [
    {
      path: 'index.html',
      language: 'html',
      source:
        '<!doctype html><html><head><link rel="stylesheet" href="css/main.css"></head><body></body></html>',
      kind: 'text',
    },
    {
      path: 'css/main.css',
      language: 'css',
      source:
        '@import "theme/base.css" screen; .hero { background: url("../assets/bg.png"); }',
      kind: 'text',
    },
    {
      path: 'css/theme/base.css',
      language: 'css',
      source: '.hero { background-image: url("../../assets/icon.svg"); }',
      kind: 'text',
    },
    {
      path: 'assets/bg.png',
      language: 'asset',
      source: '',
      kind: 'asset',
    },
    {
      path: 'assets/icon.svg',
      language: 'asset',
      source: '',
      kind: 'asset',
    },
  ],
  {
    'assets/bg.png': 'blob:nested-background',
    'assets/icon.svg': 'blob:nested-icon',
  },
  12
);
expect(
  !nestedCssDocument.includes('@import'),
  'Local CSS @import rules must be inlined into the sandbox document.'
);
expectIncludes(
  nestedCssDocument,
  '@media screen',
  'CSS @import media conditions must be preserved when inlining.'
);
expectIncludes(
  nestedCssDocument,
  'url("blob:nested-background")',
  'Root CSS asset URLs must resolve relative to the importing stylesheet.'
);
expectIncludes(
  nestedCssDocument,
  'url("blob:nested-icon")',
  'Nested CSS asset URLs must resolve relative to their own stylesheet.'
);

const diagnosticsFiles = [
  {
    path: 'index.html',
    language: 'html',
    source:
      '<!doctype html><html><head><link rel="stylesheet" href="missing.css"><link rel="stylesheet" href="styles.css"></head><body><img src="assets/missing.png"><img src="https://example.com/remote.png"><script src="missing.js"></script></body></html>',
    kind: 'text',
  },
  {
    path: 'styles.css',
    language: 'css',
    source:
      '@import "missing-theme.css"; @import url("https://example.com/theme.css"); body { background: url("missing-bg.png"); }',
    kind: 'text',
  },
];
const previewDiagnostics = preview.collectPreviewDiagnostics(diagnosticsFiles);
expectEqual(
  previewDiagnostics.map(({ kind, sourcePath, requestedPath }) => ({
    kind,
    sourcePath,
    requestedPath,
  })),
  [
    {
      kind: 'missing-reference',
      sourcePath: 'index.html',
      requestedPath: 'missing.css',
    },
    {
      kind: 'missing-reference',
      sourcePath: 'index.html',
      requestedPath: 'missing.js',
    },
    {
      kind: 'missing-reference',
      sourcePath: 'index.html',
      requestedPath: 'assets/missing.png',
    },
    {
      kind: 'missing-reference',
      sourcePath: 'styles.css',
      requestedPath: 'missing-theme.css',
    },
    {
      kind: 'blocked-external-reference',
      sourcePath: 'styles.css',
      requestedPath: 'https://example.com/theme.css',
    },
    {
      kind: 'missing-reference',
      sourcePath: 'styles.css',
      requestedPath: 'missing-bg.png',
    },
  ],
  'Preview diagnostics must report missing local references and blocked CSS imports.'
);
const diagnosticsDocument = preview.buildPreviewDocument(
  diagnosticsFiles,
  {},
  14
);
expect(
  !diagnosticsDocument.includes('@import "missing-theme.css"') &&
    !diagnosticsDocument.includes('@import url("https://example.com/theme.css")'),
  'Unresolved or external CSS imports must not execute inside the preview.'
);

const cyclicCssDocument = preview.buildPreviewDocument(
  [
    {
      path: 'index.html',
      language: 'html',
      source:
        '<!doctype html><html><head><link rel="stylesheet" href="a.css"></head><body></body></html>',
      kind: 'text',
    },
    {
      path: 'a.css',
      language: 'css',
      source: '@import "b.css"; body { color: red; }',
      kind: 'text',
    },
    {
      path: 'b.css',
      language: 'css',
      source: '@import "a.css"; body { color: blue; }',
      kind: 'text',
    },
  ],
  {},
  13
);
expectIncludes(
  cyclicCssDocument,
  'Skipped cyclic workspace @import: a.css',
  'Cyclic CSS imports must terminate with a bounded diagnostic.'
);

const missingHtmlDocument = preview.buildPreviewDocument(
  [
    {
      path: 'README.md',
      language: 'markdown',
      source: '# no preview',
      kind: 'text',
    },
  ],
  {},
  4
);
expectIncludes(
  missingHtmlDocument,
  'Add an HTML entry file',
  'Missing HTML must produce an actionable preview diagnostic.'
);
expectIncludes(
  missingHtmlDocument,
  'const revision=4',
  'Missing HTML diagnostics must still acknowledge the current revision.'
);
expectIncludes(
  missingHtmlDocument,
  'context-action.preview.ready',
  'Missing HTML diagnostics must use the same preview bridge.'
);

console.log('Verified standalone preview document contracts.');
