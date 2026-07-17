#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8'));
const runtimeDependencies = Object.keys({
  ...(packageJson.dependencies ?? {}),
  ...Object.fromEntries(
    Object.entries(packageJson.peerDependencies ?? {}).filter(
      ([name]) => !name.startsWith('@sem-foundation/')
    )
  ),
});
if (runtimeDependencies.length > 0) {
  throw new Error(
    `sem-doc must keep sem as its external runtime engine; unexpected runtime dependencies: ${runtimeDependencies.join(', ')}`
  );
}

const sourceFiles = collectTypeScriptFiles(path.join(repositoryRoot, 'src'));
const violations = [];
for (const filePath of sourceFiles) {
  const source = fs.readFileSync(filePath, 'utf8');
  const forbiddenImport =
    /(?:from\s+|require\(\s*)['"][^'"]*(?:ttsc|lsp|vscode-languageserver)[^'"]*['"]/iu;
  if (forbiddenImport.test(source)) violations.push(path.relative(repositoryRoot, filePath));
}

if (violations.length > 0) {
  throw new Error(`sem-doc boundary violation in: ${violations.join(', ')}`);
}

process.stdout.write(
  `sem-doc boundary verified: external sem engine, no ttsc/LSP runtime imports (${sourceFiles.length} source files)\n`
);

function collectTypeScriptFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectTypeScriptFiles(entryPath));
    else if (entry.isFile() && entry.name.endsWith('.ts')) files.push(entryPath);
  }
  return files.sort();
}
