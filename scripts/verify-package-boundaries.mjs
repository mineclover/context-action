#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRepositoryRoot = path.resolve(scriptDirectory, '..');
const sourceExtensions = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]);
const packageSourceDirectories = ['src', 'test', '__tests__', 'scripts', 'examples'];

function parseArguments(argv) {
  const rootIndex = argv.indexOf('--root');
  if (rootIndex === -1) return { repositoryRoot: defaultRepositoryRoot };
  const root = argv[rootIndex + 1];
  if (!root) throw new Error('--root requires a directory path');
  return { repositoryRoot: path.resolve(root) };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function collectFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(entryPath));
    } else if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }
  return files;
}

function collectModuleSpecifiers(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const scriptKind = filePath.endsWith('.tsx') || filePath.endsWith('.jsx')
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  const specifiers = [];

  const add = (node, value) => {
    if (typeof value !== 'string') return;
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
    specifiers.push({ value, line });
  };

  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        add(node, node.moduleSpecifier.text);
      }
    } else if (ts.isImportEqualsDeclaration(node)) {
      const reference = node.moduleReference;
      if (ts.isExternalModuleReference(reference) && ts.isStringLiteral(reference.expression)) {
        add(node, reference.expression.text);
      }
    } else if (ts.isCallExpression(node)) {
      const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire = ts.isIdentifier(node.expression) && node.expression.text === 'require';
      if ((isDynamicImport || isRequire) && ts.isStringLiteral(node.arguments[0])) {
        add(node, node.arguments[0].text);
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return specifiers;
}

function readWorkspacePackages(repositoryRoot) {
  const packagesDirectory = path.join(repositoryRoot, 'packages');
  if (!fs.existsSync(packagesDirectory)) return [];
  return fs.readdirSync(packagesDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(packagesDirectory, entry.name))
    .filter((directory) => fs.existsSync(path.join(directory, 'package.json')))
    .map((directory) => ({
      directory,
      manifest: readJson(path.join(directory, 'package.json')),
      kind: 'package',
    }));
}

function readIntegrationHosts(repositoryRoot) {
  const candidates = [path.join(repositoryRoot, 'example')];
  const demosDirectory = path.join(repositoryRoot, 'demos');
  if (fs.existsSync(demosDirectory)) {
    for (const entry of fs.readdirSync(demosDirectory, { withFileTypes: true })) {
      if (entry.isDirectory()) candidates.push(path.join(demosDirectory, entry.name));
    }
  }
  return candidates
    .filter((directory) => fs.existsSync(path.join(directory, 'package.json')))
    .map((directory) => ({
      directory,
      manifest: readJson(path.join(directory, 'package.json')),
      kind: 'host',
    }));
}

function dependencyNames(manifest, includeDevDependencies) {
  const fields = ['dependencies', 'peerDependencies', 'optionalDependencies'];
  if (includeDevDependencies) fields.push('devDependencies');
  return new Set(fields.flatMap((field) => Object.keys(manifest[field] ?? {})));
}

function parseWorkspaceSpecifier(specifier, workspaceNames) {
  const packageName = [...workspaceNames]
    .filter((name) => specifier === name || specifier.startsWith(`${name}/`))
    .sort((left, right) => right.length - left.length)[0];
  if (!packageName) return null;
  return {
    packageName,
    exportKey: specifier === packageName ? '.' : `.${specifier.slice(packageName.length)}`,
  };
}

function exportKeys(manifest) {
  if (typeof manifest.exports === 'string' || Array.isArray(manifest.exports)) return new Set(['.']);
  if (!manifest.exports || typeof manifest.exports !== 'object') return new Set();
  const keys = Object.keys(manifest.exports);
  return keys.some((key) => key.startsWith('.')) ? new Set(keys) : new Set(['.']);
}

function isExported(exportKey, exports) {
  if (exports.has(exportKey)) return true;
  for (const candidate of exports) {
    if (!candidate.includes('*')) continue;
    const pattern = new RegExp(`^${candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\*', '.*')}$`);
    if (pattern.test(exportKey)) return true;
  }
  return false;
}

function relativePath(repositoryRoot, filePath) {
  return path.relative(repositoryRoot, filePath).split(path.sep).join('/');
}

function isInside(directory, candidate) {
  const relative = path.relative(directory, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function sourceScope(owner, filePath) {
  const relative = relativePath(owner.directory, filePath);
  if (owner.kind === 'host') return 'runtime';
  return relative === 'src' || relative.startsWith('src/') ? 'runtime' : 'development';
}

function collectOwnerFiles(owner) {
  if (owner.kind === 'host') return collectFiles(path.join(owner.directory, 'src'));
  return packageSourceDirectories.flatMap((directory) => collectFiles(path.join(owner.directory, directory)));
}

function verify(repositoryRoot) {
  const workspacePackages = readWorkspacePackages(repositoryRoot);
  const owners = [...workspacePackages, ...readIntegrationHosts(repositoryRoot)];
  const workspaceByName = new Map(workspacePackages.map((entry) => [entry.manifest.name, entry]));
  const workspaceNames = new Set(workspaceByName.keys());
  const failures = [];
  let fileCount = 0;
  let importCount = 0;

  for (const owner of owners) {
    const runtimeDependencies = dependencyNames(owner.manifest, false);
    const developmentDependencies = dependencyNames(owner.manifest, true);
    for (const filePath of collectOwnerFiles(owner)) {
      fileCount += 1;
      const scope = sourceScope(owner, filePath);
      for (const specifier of collectModuleSpecifiers(filePath)) {
        const location = `${relativePath(repositoryRoot, filePath)}:${specifier.line}`;
        if (specifier.value.startsWith('.')) {
          const targetPath = path.resolve(path.dirname(filePath), specifier.value);
          if (scope === 'runtime' && !isInside(owner.directory, targetPath)) {
            failures.push(
              `${location}: relative import ${specifier.value} escapes the owning ${owner.kind}`,
            );
          }
          continue;
        }
        const workspaceSpecifier = parseWorkspaceSpecifier(specifier.value, workspaceNames);
        if (!workspaceSpecifier) continue;
        importCount += 1;
        const target = workspaceByName.get(workspaceSpecifier.packageName);

        if (target.manifest.name !== owner.manifest.name) {
          const declared = scope === 'runtime' ? runtimeDependencies : developmentDependencies;
          if (!declared.has(target.manifest.name)) {
            failures.push(
              `${location}: ${scope} import ${specifier.value} is missing ${target.manifest.name} from ${scope === 'runtime' ? 'dependencies, peerDependencies, or optionalDependencies' : 'package dependency declarations'}`,
            );
          }
        }

        if (!isExported(workspaceSpecifier.exportKey, exportKeys(target.manifest))) {
          failures.push(
            `${location}: ${specifier.value} is not exported by ${target.manifest.name}`,
          );
        }
      }
    }
  }

  return { failures, packageCount: workspacePackages.length, hostCount: owners.length - workspacePackages.length, fileCount, importCount };
}

function main() {
  const { repositoryRoot } = parseArguments(process.argv.slice(2));
  const result = verify(repositoryRoot);
  console.log('Workspace package-boundary verification');
  console.log(`- workspace packages: ${result.packageCount}`);
  console.log(`- integration hosts: ${result.hostCount}`);
  console.log(`- source files scanned: ${result.fileCount}`);
  console.log(`- workspace imports checked: ${result.importCount}`);
  if (result.failures.length > 0) {
    console.error(`- violations: ${result.failures.length}`);
    for (const failure of result.failures) console.error(`  ✗ ${failure}`);
    process.exitCode = 1;
  } else {
    console.log('- violations: 0');
  }
}

main();
