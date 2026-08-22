#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const exampleSourceDirectory = path.join(repositoryRoot, 'example/src');
const appPath = path.join(exampleSourceDirectory, 'App.tsx');
const sourceExtensions = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.css',
  '.json',
];

function toRepositoryPath(filePath) {
  return path.relative(repositoryRoot, filePath).split(path.sep).join('/');
}

function findModuleFile(candidate) {
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }
  for (const extension of sourceExtensions) {
    if (fs.existsSync(`${candidate}${extension}`)) return `${candidate}${extension}`;
  }
  for (const extension of sourceExtensions) {
    const indexPath = path.join(candidate, `index${extension}`);
    if (fs.existsSync(indexPath)) return indexPath;
  }
  return null;
}

function resolveSpecifier(importerPath, specifier) {
  if (specifier.startsWith('.')) {
    return findModuleFile(path.resolve(path.dirname(importerPath), specifier));
  }
  if (specifier === '@' || specifier.startsWith('@/')) {
    return findModuleFile(
      path.join(exampleSourceDirectory, specifier === '@' ? '' : specifier.slice(2))
    );
  }
  return null;
}

function collectModuleSpecifiers(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') || filePath.endsWith('.jsx')
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS
  );
  const specifiers = [];

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

function collectDependencies(entryPath) {
  const pending = [entryPath];
  const dependencies = new Set();

  while (pending.length) {
    const currentPath = pending.pop();
    if (!currentPath || dependencies.has(currentPath)) continue;
    dependencies.add(currentPath);

    for (const specifier of collectModuleSpecifiers(currentPath)) {
      const resolvedPath = resolveSpecifier(currentPath, specifier);
      if (resolvedPath && !dependencies.has(resolvedPath)) pending.push(resolvedPath);
    }
  }

  return [...dependencies].map(toRepositoryPath).sort();
}

function readLazyEntries(appSource) {
  const entries = new Map();
  const expression = /const\s+(\w+)\s*=\s*lazy\(\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]/g;
  for (const match of appSource.matchAll(expression)) {
    const entryPath = resolveSpecifier(appPath, match[2]);
    if (entryPath) entries.set(match[1], entryPath);
  }
  return entries;
}

function readRouteBindings(appSource) {
  const bindings = [];
  for (const match of appSource.matchAll(/<Route\b[\s\S]*?\/>/g)) {
    const routeSource = match[0];
    const pathMatch = routeSource.match(/\bpath="([^"]+)"/);
    const elementMatch = routeSource.match(/\belement=\{<(\w+)/);
    if (pathMatch && elementMatch) {
      bindings.push({ path: pathMatch[1], component: elementMatch[1] });
    }
  }
  return bindings;
}

function findEntryTest(entryPath) {
  const extension = path.extname(entryPath);
  const stem = entryPath.slice(0, -extension.length);
  for (const candidate of [
    `${stem}.test${extension}`,
    `${stem}.spec${extension}`,
  ]) {
    if (fs.existsSync(candidate)) return toRepositoryPath(candidate);
  }
  return null;
}

export function buildExampleRouteIndex() {
  const appSource = fs.readFileSync(appPath, 'utf8');
  const lazyEntries = readLazyEntries(appSource);
  const dependencyCache = new Map();
  const routes = [];

  for (const binding of readRouteBindings(appSource)) {
    const entryPath = lazyEntries.get(binding.component);
    if (!entryPath) continue;
    let dependencies = dependencyCache.get(entryPath);
    if (!dependencies) {
      dependencies = collectDependencies(entryPath);
      dependencyCache.set(entryPath, dependencies);
    }
    routes.push({
      ...binding,
      entry: toRepositoryPath(entryPath),
      dependencies,
      unitTest: findEntryTest(entryPath),
    });
  }
  return routes;
}

export function canonicalRoutes(routes = buildExampleRouteIndex()) {
  const seenEntries = new Set();
  return routes.filter((route) => {
    if (seenEntries.has(route.entry)) return false;
    seenEntries.add(route.entry);
    return true;
  });
}

export function selectAffectedRoutes(changedFiles, routes = buildExampleRouteIndex()) {
  const normalizedChanges = new Set(
    changedFiles.map((file) => file.replaceAll('\\', '/').replace(/^\.\//, ''))
  );
  const sharedExampleRuntimeChanged = [...normalizedChanges].some(
    (file) =>
      file === 'example/src/App.tsx' ||
      file.startsWith('example/src/components/') ||
      file.startsWith('example/src/hooks/') ||
      file.startsWith('example/src/stores/') ||
      file.startsWith('example/src/test/') ||
      file.startsWith('example/src/utils/') ||
      file.startsWith('packages/core/src/') ||
      file.startsWith('packages/react/src/')
  );
  if (sharedExampleRuntimeChanged) return canonicalRoutes(routes);
  return canonicalRoutes(routes).filter((route) =>
    route.dependencies.some((dependency) => normalizedChanges.has(dependency))
  );
}

export function collectChangedFiles(base, head) {
  return execFileSync('git', ['diff', '--name-only', `${base}...${head}`], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  })
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);
}

function parseArguments(argv) {
  const options = {
    all: false,
    base: undefined,
    changedFiles: [],
    head: undefined,
    json: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--') continue;
    if (argument === '--all') options.all = true;
    else if (argument === '--json') options.json = true;
    else if (argument === '--base' || argument === '--head') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${argument} requires a commit SHA or ref.`);
      }
      options[argument.slice(2)] = value;
      index += 1;
    }
    else if (argument === '--changed-files') {
      for (index += 1; index < argv.length && !argv[index].startsWith('--'); index += 1) {
        options.changedFiles.push(argv[index]);
      }
      index -= 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  if (Boolean(options.base) !== Boolean(options.head)) {
    throw new Error('--base and --head must be supplied together.');
  }
  if (options.base && options.head) {
    options.changedFiles.push(...collectChangedFiles(options.base, options.head));
  }
  const routes = buildExampleRouteIndex();
  const selectedRoutes = options.all
    ? canonicalRoutes(routes)
    : selectAffectedRoutes(options.changedFiles, routes);
  const result = {
    changedFiles: options.changedFiles,
    publicRouteCount: routes.length,
    canonicalRouteCount: canonicalRoutes(routes).length,
    selectedRoutes: selectedRoutes.map(({ path: routePath, entry }) => ({
      path: routePath,
      entry,
      unitTest: selectedRoutes.find((route) => route.path === routePath)?.unitTest ?? null,
    })),
  };

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Public routes: ${result.publicRouteCount}`);
  console.log(`Canonical smoke routes: ${result.canonicalRouteCount}`);
  console.log(`Selected smoke routes: ${result.selectedRoutes.length}`);
  for (const route of result.selectedRoutes) {
    console.log(
      `- ${route.path} ← ${route.entry}${route.unitTest ? ` (unit: ${route.unitTest})` : ' (unit: missing)'}`
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
