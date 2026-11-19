#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { buildExampleRouteIndex, canonicalRoutes } from './example-route-impact.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRepositoryRoot = path.resolve(scriptDirectory, '..');

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sortedStrings(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function diffSets(expected, actual, label, errors) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  for (const item of actualSet) {
    if (!expectedSet.has(item)) errors.push(`${label}: uncataloged entry "${item}"`);
  }
  for (const item of expectedSet) {
    if (!actualSet.has(item)) errors.push(`${label}: missing entry "${item}" on disk`);
  }
}

function assertNonEmptyText(value, label, errors) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${label} must be a non-empty string`);
  }
}

function assertBilingualText(obj, label, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push(`${label} must be an { en, ko } object`);
    return;
  }
  assertNonEmptyText(obj.en, `${label}.en`, errors);
  assertNonEmptyText(obj.ko, `${label}.ko`, errors);
}

function assertUniqueIds(entries, label, errors) {
  const seen = new Set();
  for (const entry of entries) {
    assertNonEmptyText(entry?.id, `${label} entry id`, errors);
    if (entry?.id) {
      if (seen.has(entry.id)) errors.push(`${label}: duplicate id "${entry.id}"`);
      seen.add(entry.id);
    }
  }
}

function assertPathExists(repositoryRoot, relativePath, label, errors) {
  if (typeof relativePath !== 'string' || relativePath.length === 0) {
    errors.push(`${label}: path must be a non-empty string`);
    return false;
  }
  const fullPath = path.join(repositoryRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`${label}: path does not exist on disk: ${relativePath}`);
    return false;
  }
  return true;
}

function collectMarkdownRelative(directory) {
  if (!fs.existsSync(directory)) return [];
  const results = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (entry.name.endsWith('.md')) {
        results.push(toPosix(path.relative(directory, fullPath)));
      }
    }
  };
  visit(directory);
  return sortedStrings(results);
}

function readCanonicalRoutesForRoot(repositoryRoot) {
  if (path.resolve(repositoryRoot) === path.resolve(defaultRepositoryRoot)) {
    return canonicalRoutes(buildExampleRouteIndex());
  }
  const appPath = path.join(repositoryRoot, 'example/src/App.tsx');
  if (!fs.existsSync(appPath)) return [];
  const appSource = fs.readFileSync(appPath, 'utf8');
  const lazyEntries = new Map();
  for (const match of appSource.matchAll(/const\s+(\w+)\s*=\s*lazy\(\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]/g)) {
    lazyEntries.set(match[1], match[2]);
  }
  const seenEntries = new Set();
  const routes = [];
  for (const match of appSource.matchAll(/<Route\b[\s\S]*?\/>/g)) {
    const routeSource = match[0];
    const pathMatch = routeSource.match(/\bpath="([^"]+)"/);
    const elementMatch = routeSource.match(/\belement=\{<(\w+)/);
    if (!pathMatch || !elementMatch) continue;
    const entry = lazyEntries.get(elementMatch[1]);
    if (!entry || seenEntries.has(entry)) continue;
    seenEntries.add(entry);
    routes.push({ path: pathMatch[1], component: elementMatch[1], entry });
  }
  return routes;
}

function verifyApiSurface(repositoryRoot, catalog, errors) {
  if (catalog.schemaVersion !== 'context-action.api-surface/v1') {
    errors.push(`api-surface: invalid schemaVersion "${catalog.schemaVersion}"`);
  }
  if (catalog.specId !== 'CA-SURFACE-CATALOG-001') {
    errors.push(`api-surface: invalid specId "${catalog.specId}"`);
  }
  const layers = new Set(Array.isArray(catalog.layers) ? catalog.layers : []);
  const stabilities = new Set(Array.isArray(catalog.stabilities) ? catalog.stabilities : []);
  const packages = Array.isArray(catalog.packages) ? catalog.packages : [];

  assertUniqueIds(packages, 'api-surface.packages', errors);

  const packagesDir = path.join(repositoryRoot, 'packages');
  const diskManifests = new Map();
  if (fs.existsSync(packagesDir)) {
    for (const entry of fs.readdirSync(packagesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifestPath = path.join(packagesDir, entry.name, 'package.json');
      if (!fs.existsSync(manifestPath)) continue;
      const manifest = readJson(manifestPath);
      diskManifests.set(manifest.name, {
        directory: `packages/${entry.name}`,
        manifest,
      });
    }
  }

  const typedocPath = path.join(repositoryRoot, 'typedoc.json');
  const typedocEntryPoints = fs.existsSync(typedocPath)
    ? (readJson(typedocPath).entryPoints ?? [])
    : [];

  diffSets(
    packages.map((item) => item.packageName),
    [...diskManifests.keys()],
    'api-surface.packages',
    errors,
  );

  for (const entry of packages) {
    const label = `api-surface(${entry.packageName ?? entry.id})`;
    if (!layers.has(entry.layer)) errors.push(`${label}: invalid layer "${entry.layer}"`);
    if (!stabilities.has(entry.stability)) errors.push(`${label}: invalid stability "${entry.stability}"`);
    if (entry.visibility !== 'public' && entry.visibility !== 'private') {
      errors.push(`${label}: invalid visibility "${entry.visibility}"`);
    }
    assertBilingualText(entry.summary, `${label}.summary`, errors);
    if (!Array.isArray(entry.nonGoals) || entry.nonGoals.length === 0) {
      errors.push(`${label}: nonGoals must be a non-empty array`);
    }
    assertNonEmptyText(entry.verificationGate, `${label}.verificationGate`, errors);
    assertPathExists(repositoryRoot, entry.readme, `${label}.readme`, errors);

    if (!Array.isArray(entry.authoritativeDocs) || entry.authoritativeDocs.length === 0) {
      errors.push(`${label}: authoritativeDocs must be a non-empty array`);
    } else {
      for (const docPath of entry.authoritativeDocs) {
        assertPathExists(repositoryRoot, docPath, `${label}.authoritativeDocs`, errors);
      }
    }

    const disk = diskManifests.get(entry.packageName);
    if (!disk) continue;

    if (entry.directory !== disk.directory) {
      errors.push(`${label}: directory "${entry.directory}" does not match "${disk.directory}"`);
    }
    const expectedVisibility = disk.manifest.private === true ? 'private' : 'public';
    if (entry.visibility !== expectedVisibility) {
      errors.push(`${label}: visibility "${entry.visibility}" mismatches package.json private=${Boolean(disk.manifest.private)}`);
    }

    const manifestExports = Object.keys(disk.manifest.exports ?? {});
    const catalogExports = Array.isArray(entry.exports) ? entry.exports.map((item) => item.subpath) : [];
    if (JSON.stringify(catalogExports) !== JSON.stringify(manifestExports)) {
      errors.push(`${label}: exports ${JSON.stringify(catalogExports)} mismatch package.json exports ${JSON.stringify(manifestExports)}`);
    }
    for (const exportEntry of entry.exports ?? []) {
      assertNonEmptyText(exportEntry.purpose, `${label}.exports(${exportEntry.subpath}).purpose`, errors);
      if (!Array.isArray(exportEntry.keySymbols)) {
        errors.push(`${label}.exports(${exportEntry.subpath}).keySymbols must be an array`);
      }
    }

    const actualWsDeps = sortedStrings(
      Object.keys(disk.manifest.dependencies ?? {}).filter((name) => name.startsWith('@context-action/')),
    );
    if (JSON.stringify(entry.workspaceDependencies) !== JSON.stringify(actualWsDeps)) {
      errors.push(`${label}: workspaceDependencies mismatch ${JSON.stringify(actualWsDeps)}`);
    }

    const actualWsPeers = sortedStrings(
      Object.keys(disk.manifest.peerDependencies ?? {}).filter((name) => name.startsWith('@context-action/')),
    );
    if (JSON.stringify(entry.workspacePeerDependencies) !== JSON.stringify(actualWsPeers)) {
      errors.push(`${label}: workspacePeerDependencies mismatch ${JSON.stringify(actualWsPeers)}`);
    }

    const expectedTypedoc = sortedStrings(
      typedocEntryPoints.filter((target) => target.startsWith(`./${disk.directory}/`)),
    );
    const catalogTypedoc = sortedStrings(entry.typedocEntryPoints ?? []);
    if (JSON.stringify(catalogTypedoc) !== JSON.stringify(expectedTypedoc)) {
      errors.push(`${label}: typedocEntryPoints ${JSON.stringify(catalogTypedoc)} mismatch typedoc.json ${JSON.stringify(expectedTypedoc)}`);
    }
  }

  return packages.length;
}

function verifyExampleSurface(repositoryRoot, catalog, errors) {
  if (catalog.schemaVersion !== 'context-action.example-surface/v1') {
    errors.push(`example-surface: invalid schemaVersion "${catalog.schemaVersion}"`);
  }
  if (catalog.specId !== 'CA-SURFACE-CATALOG-001') {
    errors.push(`example-surface: invalid specId "${catalog.specId}"`);
  }

  const appGroups = Array.isArray(catalog.exampleAppGroups) ? catalog.exampleAppGroups : [];
  const standaloneDemos = Array.isArray(catalog.standaloneDemos) ? catalog.standaloneDemos : [];
  const packageExamples = Array.isArray(catalog.packageExamples) ? catalog.packageExamples : [];
  const narrativeDocs = Array.isArray(catalog.narrativeExampleDocs) ? catalog.narrativeExampleDocs : [];

  assertUniqueIds(
    [...appGroups, ...standaloneDemos, ...packageExamples, ...narrativeDocs],
    'example-surface',
    errors,
  );

  const canonical = readCanonicalRoutesForRoot(repositoryRoot);
  const canonicalPaths = canonical.map((item) => item.path);
  const catalogRoutePaths = [];
  const seenRoutes = new Set();

  for (const group of appGroups) {
    const label = `example-surface.group(${group.id})`;
    assertNonEmptyText(group.category, `${label}.category`, errors);
    assertBilingualText(group.summary, `${label}.summary`, errors);
    assertNonEmptyText(group.verificationGate, `${label}.verificationGate`, errors);
    if (!Array.isArray(group.primaryApis) || group.primaryApis.length === 0) {
      errors.push(`${label}: primaryApis must be a non-empty array`);
    }
    for (const docPath of group.relatedDocs ?? []) {
      assertPathExists(repositoryRoot, docPath, `${label}.relatedDocs`, errors);
    }
    for (const route of group.routes ?? []) {
      assertNonEmptyText(route.path, `${label}.route.path`, errors);
      assertBilingualText(route.explains, `${label}.route(${route.path}).explains`, errors);
      if (seenRoutes.has(route.path)) {
        errors.push(`example-surface: duplicate route path "${route.path}"`);
      }
      seenRoutes.add(route.path);
      catalogRoutePaths.push(route.path);
    }
  }

  diffSets(catalogRoutePaths, canonicalPaths, 'example-surface.canonicalRoutes', errors);
  const knownCanonicalSet = new Set(canonicalPaths);

  for (const demo of standaloneDemos) {
    const label = `example-surface.standalone(${demo.id})`;
    assertPathExists(repositoryRoot, demo.path, `${label}.path`, errors);
    assertBilingualText(demo.explains, `${label}.explains`, errors);
    assertNonEmptyText(demo.verificationGate, `${label}.verificationGate`, errors);
    if (!Array.isArray(demo.primaryApis) || demo.primaryApis.length === 0) {
      errors.push(`${label}: primaryApis must be a non-empty array`);
    }
  }

  const diskPackageExamples = [];
  const packagesDir = path.join(repositoryRoot, 'packages');
  if (fs.existsSync(packagesDir)) {
    for (const entry of fs.readdirSync(packagesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (!fs.existsSync(path.join(packagesDir, entry.name, 'package.json'))) continue;
      const examplesPath = path.join(packagesDir, entry.name, 'examples');
      if (fs.existsSync(examplesPath) && fs.statSync(examplesPath).isDirectory()) {
        diskPackageExamples.push(`packages/${entry.name}/examples`);
      }
    }
  }

  diffSets(
    packageExamples.map((item) => item.path),
    diskPackageExamples,
    'example-surface.packageExamples',
    errors,
  );
  for (const pkgExample of packageExamples) {
    const label = `example-surface.packageExample(${pkgExample.id})`;
    assertPathExists(repositoryRoot, pkgExample.path, `${label}.path`, errors);
    assertBilingualText(pkgExample.explains, `${label}.explains`, errors);
    assertNonEmptyText(pkgExample.verificationGate, `${label}.verificationGate`, errors);
  }

  const diskEnNarrative = collectMarkdownRelative(path.join(repositoryRoot, 'docs/en/examples'));
  const diskKoNarrative = collectMarkdownRelative(path.join(repositoryRoot, 'docs/ko/examples'));
  diffSets(
    narrativeDocs.map((item) => item.file),
    diskEnNarrative,
    'example-surface.narrativeExampleDocs(en)',
    errors,
  );
  diffSets(
    narrativeDocs.map((item) => item.file),
    diskKoNarrative,
    'example-surface.narrativeExampleDocs(ko)',
    errors,
  );

  for (const docEntry of narrativeDocs) {
    const label = `example-surface.narrativeDoc(${docEntry.id})`;
    assertPathExists(repositoryRoot, docEntry.enPath, `${label}.enPath`, errors);
    assertPathExists(repositoryRoot, docEntry.koPath, `${label}.koPath`, errors);
    assertBilingualText(docEntry.explains, `${label}.explains`, errors);
    for (const routePath of docEntry.relatedRoutes ?? []) {
      if (!knownCanonicalSet.has(routePath)) {
        errors.push(`${label}: relatedRoute "${routePath}" is not a canonical route in example/src/App.tsx`);
      }
    }
  }

  return {
    canonicalRouteCount: catalogRoutePaths.length,
    groupCount: appGroups.length,
    standaloneDemoCount: standaloneDemos.length,
    packageExampleCount: packageExamples.length,
    narrativeDocCount: narrativeDocs.length,
  };
}

function verifyDocumentSurface(repositoryRoot, catalog, errors) {
  if (catalog.schemaVersion !== 'context-action.document-surface/v1') {
    errors.push(`document-surface: invalid schemaVersion "${catalog.schemaVersion}"`);
  }
  if (catalog.specId !== 'CA-SURFACE-CATALOG-001') {
    errors.push(`document-surface: invalid specId "${catalog.specId}"`);
  }

  const authorityClasses = new Set(Array.isArray(catalog.authorityClasses) ? catalog.authorityClasses : []);
  const pairingPolicies = new Set(Array.isArray(catalog.pairingPolicies) ? catalog.pairingPolicies : []);
  const rootDocs = Array.isArray(catalog.rootDocuments) ? catalog.rootDocuments : [];
  const managedAreas = Array.isArray(catalog.managedAreas) ? catalog.managedAreas : [];
  const derivedSurfaces = Array.isArray(catalog.derivedSurfaces) ? catalog.derivedSurfaces : [];

  assertUniqueIds([...rootDocs, ...managedAreas, ...derivedSurfaces], 'document-surface', errors);

  const diskRootDocs = sortedStrings(
    fs.readdirSync(repositoryRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name),
  );
  diffSets(
    rootDocs.map((item) => item.path),
    diskRootDocs,
    'document-surface.rootDocuments',
    errors,
  );

  for (const doc of rootDocs) {
    const label = `document-surface.root(${doc.path})`;
    if (!authorityClasses.has(doc.authorityClass)) {
      errors.push(`${label}: invalid authorityClass "${doc.authorityClass}"`);
    }
    if (!['active', 'transitional', 'historical'].includes(doc.lifecycle)) {
      errors.push(`${label}: invalid lifecycle "${doc.lifecycle}"`);
    }
    assertNonEmptyText(doc.owner, `${label}.owner`, errors);
    assertBilingualText(doc.purpose, `${label}.purpose`, errors);
    assertPathExists(repositoryRoot, doc.path, `${label}.path`, errors);
  }

  for (const area of managedAreas) {
    const label = `document-surface.area(${area.id})`;
    if (!authorityClasses.has(area.authorityClass)) {
      errors.push(`${label}: invalid authorityClass "${area.authorityClass}"`);
    }
    if (!pairingPolicies.has(area.pairingPolicy)) {
      errors.push(`${label}: invalid pairingPolicy "${area.pairingPolicy}"`);
    }
    assertNonEmptyText(area.owner, `${label}.owner`, errors);
    assertBilingualText(area.purpose, `${label}.purpose`, errors);
    assertNonEmptyText(area.verificationGate, `${label}.verificationGate`, errors);
    if (!Array.isArray(area.paths) || area.paths.length === 0) {
      errors.push(`${label}: paths must be a non-empty array`);
    } else {
      for (const areaPath of area.paths) {
        assertPathExists(repositoryRoot, areaPath, `${label}.paths`, errors);
      }
    }

    if (area.enDir && area.koDir) {
      const enFiles = collectMarkdownRelative(path.join(repositoryRoot, area.enDir));
      const koFiles = collectMarkdownRelative(path.join(repositoryRoot, area.koDir));
      const enSet = new Set(enFiles);
      const koSet = new Set(koFiles);
      const onlyEn = sortedStrings(enFiles.filter((file) => !koSet.has(file)));
      const onlyKo = sortedStrings(koFiles.filter((file) => !enSet.has(file)));

      if (area.pairingPolicy === 'strict-paired') {
        if (onlyEn.length > 0 || onlyKo.length > 0) {
          errors.push(`${label}: strict-paired directory drift detected: ${JSON.stringify({ onlyEn, onlyKo })}`);
        }
      } else if (area.pairingPolicy === 'tracked-partial') {
        const expectedOnlyEn = sortedStrings(area.knownUnpaired?.onlyEn ?? []);
        const expectedOnlyKo = sortedStrings(area.knownUnpaired?.onlyKo ?? []);
        if (JSON.stringify(onlyEn) !== JSON.stringify(expectedOnlyEn)) {
          errors.push(`${label}: tracked-partial onlyEn mismatch. expected=${JSON.stringify(expectedOnlyEn)} actual=${JSON.stringify(onlyEn)}`);
        }
        if (JSON.stringify(onlyKo) !== JSON.stringify(expectedOnlyKo)) {
          errors.push(`${label}: tracked-partial onlyKo mismatch. expected=${JSON.stringify(expectedOnlyKo)} actual=${JSON.stringify(onlyKo)}`);
        }
      }
    }
  }

  for (const derived of derivedSurfaces) {
    const label = `document-surface.derived(${derived.id})`;
    assertPathExists(repositoryRoot, derived.path, `${label}.path`, errors);
    assertNonEmptyText(derived.sourceOfTruth, `${label}.sourceOfTruth`, errors);
    assertNonEmptyText(derived.generatorCommand, `${label}.generatorCommand`, errors);
    assertNonEmptyText(derived.verificationCommand, `${label}.verificationCommand`, errors);
  }

  return {
    rootDocumentCount: rootDocs.length,
    managedAreaCount: managedAreas.length,
    derivedSurfaceCount: derivedSurfaces.length,
  };
}

export function verifyRepositorySurfaceCatalog(repositoryRoot = defaultRepositoryRoot) {
  const errors = [];
  const catalogDirectory = path.join(repositoryRoot, 'catalog', 'repository-surface');
  const apiPath = path.join(catalogDirectory, 'api-surface.v1.json');
  const examplePath = path.join(catalogDirectory, 'example-surface.v1.json');
  const documentPath = path.join(catalogDirectory, 'document-surface.v1.json');

  for (const requiredFile of [apiPath, examplePath, documentPath]) {
    if (!fs.existsSync(requiredFile)) {
      errors.push(`Missing catalog file: ${toPosix(path.relative(repositoryRoot, requiredFile))}`);
    }
  }
  if (errors.length > 0) {
    return { ok: false, errors, summary: null };
  }

  const apiCatalog = readJson(apiPath);
  const exampleCatalog = readJson(examplePath);
  const documentCatalog = readJson(documentPath);

  const packageCount = verifyApiSurface(repositoryRoot, apiCatalog, errors);
  const exampleSummary = verifyExampleSurface(repositoryRoot, exampleCatalog, errors);
  const documentSummary = verifyDocumentSurface(repositoryRoot, documentCatalog, errors);

  return {
    ok: errors.length === 0,
    errors,
    summary: {
      specId: 'CA-SURFACE-CATALOG-001',
      packages: packageCount,
      ...exampleSummary,
      ...documentSummary,
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = verifyRepositorySurfaceCatalog(defaultRepositoryRoot);
  if (!result.ok) {
    console.error(`Repository surface catalog verification failed (${result.errors.length} error(s)):`);
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ status: 'ok', ...result.summary }));
  }
}
