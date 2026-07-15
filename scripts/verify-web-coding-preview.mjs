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
