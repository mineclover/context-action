#!/usr/bin/env node

import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const reactDistDirectory = path.join(repositoryRoot, 'packages/react/dist');
const failures = [];

function collectModuleSpecifiers(filePath, content) {
  const source = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  const specifiers = new Set();

  function collect(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      specifiers.add(node.moduleSpecifier.text);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)
      && ts.isStringLiteral(node.argument.literal)) {
      specifiers.add(node.argument.literal.text);
    } else if (ts.isImportEqualsDeclaration(node)
      && ts.isExternalModuleReference(node.moduleReference)
      && node.moduleReference.expression && ts.isStringLiteral(node.moduleReference.expression)) {
      specifiers.add(node.moduleReference.expression.text);
    } else if (ts.isCallExpression(node)
      && (node.expression.kind === ts.SyntaxKind.ImportKeyword
        || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
      && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
      specifiers.add(node.arguments[0].text);
    }
    ts.forEachChild(node, collect);
  }

  collect(source);
  for (const reference of [...source.referencedFiles, ...source.typeReferenceDirectives]) {
    specifiers.add(reference.fileName);
  }
  return specifiers;
}

// Follow runtime and declaration graphs separately: a declaration import of
// ./chunk.js resolves to ./chunk.d.ts, never to the runtime implementation.
export async function collectReachableArtifacts(directory, entries) {
  const errors = [];
  const files = new Map();
  const specifiersByFile = new Map();
  const visited = new Set();

  async function visit(relativePath) {
    if (visited.has(relativePath)) return;
    visited.add(relativePath);
    const filePath = path.resolve(directory, relativePath);
    if (path.relative(directory, filePath).startsWith('..')) {
      errors.push(`${relativePath}: import escapes the artifact directory`);
      return;
    }
    let content;
    try {
      content = await readFile(filePath, 'utf8');
    } catch (error) {
      errors.push(`${relativePath}: missing reachable artifact: ${error.message}`);
      return;
    }

    files.set(relativePath, content);
    const specifiers = collectModuleSpecifiers(filePath, content);
    specifiersByFile.set(relativePath, specifiers);

    for (const specifier of specifiers) {
      if (!specifier.startsWith('.')) continue;
      let target = path.normalize(path.join(path.dirname(relativePath), specifier));
      if (/\.d\.(?:ts|cts|mts)$/.test(relativePath)) {
        target = target.replace(/(?<!\.d)\.(js|cjs|mjs)$/, (_, extension) => ({
          js: '.d.ts', cjs: '.d.cts', mjs: '.d.mts',
        })[extension]);
      }
      await visit(target);
    }
  }

  for (const entry of entries) await visit(entry);
  return { files, specifiersByFile, errors };
}

export async function verifyBasicArtifactGraph(directory, entries) {
  const { specifiersByFile, errors } = await collectReachableArtifacts(directory, entries);
  const allowedPackages = new Set([
    '@context-action/core', '@context-action/store-core', '@context-action/mutative',
  ]);
  for (const [relativePath, specifiers] of specifiersByFile.entries()) {
    for (const specifier of specifiers) {
      if (specifier.startsWith('@context-action/')
        && !allowedPackages.has(specifier.split('/').slice(0, 2).join('/'))) {
        errors.push(`${relativePath}: basic entry reaches integration dependency ${specifier}`);
      }
    }
  }
  return errors;
}

export async function verifyReachableGraphAbsent(directory, entries, pattern, description) {
  const { files, errors } = await collectReachableArtifacts(directory, entries);
  for (const [relativePath, content] of files.entries()) {
    if (pattern.test(content)) {
      errors.push(`${relativePath}: ${description}`);
    }
  }
  return errors;
}

export async function verifyReachableGraphContains(directory, entries, pattern, description) {
  const { files, errors } = await collectReachableArtifacts(directory, entries);
  if (errors.length > 0) return errors;
  const matched = [...files.values()].some((content) => pattern.test(content));
  if (!matched) {
    errors.push(`${entries.join(', ')}: ${description}`);
  }
  return errors;
}

async function readArtifact(relativePath) {
  try {
    return await readFile(path.join(reactDistDirectory, relativePath), 'utf8');
  } catch (error) {
    failures.push(`missing React production artifact ${relativePath}: ${error.message}`);
    return '';
  }
}

function expectAbsent(content, relativePath, pattern, description) {
  if (pattern.test(content)) {
    failures.push(`${relativePath}: ${description}`);
  }
}

async function expectArtifactAbsent(relativePath, description) {
  try {
    await stat(path.join(reactDistDirectory, relativePath));
    failures.push(`${relativePath}: ${description}`);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      failures.push(`could not inspect React production artifact ${relativePath}: ${error.message}`);
    }
  }
}

async function main() {
  const [rootEsm, rootCjs, rootTypes] = await Promise.all([
    readArtifact('index.js'),
    readArtifact('index.cjs'),
    readArtifact('index.d.ts'),
  ]);

  const toolPublicApiPattern = /\b(?:createToolContext|ToolContextConfig|ToolRegistry)\b/;
  const mutativeRuntimePattern = /@context-action\/mutative(?:["'/]|$)|(?:require|from)\(['"](?:@context-action\/)?mutative(?:["'])/;
  const compilerRuntimePattern = /(?:react\/compiler-runtime|react-compiler-runtime)/;

  failures.push(...await verifyBasicArtifactGraph(reactDistDirectory, [
    'index.js', 'index.cjs', 'index.d.ts', 'index.d.cts',
    'refs.js', 'refs.cjs', 'refs.d.ts', 'refs.d.cts',
    'time-travel.js', 'time-travel.cjs', 'time-travel.d.ts', 'time-travel.d.cts',
    'transactions.js', 'transactions.cjs', 'transactions.d.ts', 'transactions.d.cts',
    'backend.js', 'backend.cjs', 'backend.d.ts', 'backend.d.cts',
    'advanced.js', 'advanced.cjs', 'advanced.d.ts', 'advanced.d.cts',
    'utils.js', 'utils.cjs', 'utils.d.ts', 'utils.d.cts',
  ]));

  failures.push(...await verifyReachableGraphAbsent(
    reactDistDirectory,
    ['backend.js', 'backend.cjs', 'backend.d.ts', 'backend.d.cts'],
    mutativeRuntimePattern,
    'the user-owned backend entry must remain independent of the Mutative runtime',
  ));

  failures.push(...await verifyReachableGraphAbsent(
    reactDistDirectory,
    ['refs.js', 'refs.cjs', 'refs.d.ts', 'refs.d.cts'],
    mutativeRuntimePattern,
    'the refs entry must remain independent of the Mutative runtime',
  ));

  failures.push(...await verifyReachableGraphAbsent(
    reactDistDirectory,
    ['transactions.js', 'transactions.cjs', 'transactions.d.ts', 'transactions.d.cts'],
    mutativeRuntimePattern,
    'the transactions entry must remain independent of the Mutative runtime',
  ));

  for (const entry of ['index.js', 'index.cjs']) {
    failures.push(...await verifyReachableGraphContains(
      reactDistDirectory,
      [entry],
      compilerRuntimePattern,
      'the compiler-annotated store hooks must retain a compatible compiler runtime import',
    ));
  }

  for (const [relativePath, content] of [
    ['index.js', rootEsm],
    ['index.cjs', rootCjs],
  ]) {
    expectAbsent(
      content,
      relativePath,
      /console\.log\(`\[TimeTravelStore:/,
      'development-only TimeTravelStore logging must not be present in the production build',
    );
  }

  expectAbsent(
    rootTypes,
    'index.d.ts',
    toolPublicApiPattern,
    'the default entry must not expose ToolContext types',
  );

  await Promise.all([
    expectArtifactAbsent('tools/index.js', 'React must not ship the development ToolContext entry'),
    expectArtifactAbsent('tools/index.cjs', 'React must not ship the development ToolContext entry'),
    expectArtifactAbsent('tools/index.d.ts', 'React must not ship the development ToolContext declarations'),
  ]);

  if (failures.length > 0) {
    console.error(`React production artifact boundary verification failed with ${failures.length} error(s):`);
    failures.forEach((failure) => console.error(`  ✗ ${failure}`));
    process.exitCode = 1;
  } else {
    console.log('Verified React artifact boundaries: basic runtime/declaration graphs are integration-free; backend, refs, and transactions graphs are Mutative-free.');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
