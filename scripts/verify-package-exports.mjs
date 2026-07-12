#!/usr/bin/env node

import { createRequire } from 'node:module';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const runtimeExportSkips = new Map([
  [
    'packages/typedoc-vitepress-sync',
    // This legacy CLI calls program.parse() as soon as it is imported.
    new Set(['./cli']),
  ],
]);

const failures = [];
let targetCount = 0;
let runtimeLoadCount = 0;

async function discoverPublicPackages() {
  const packagesDirectory = path.join(repositoryRoot, 'packages');
  const entries = await readdir(packagesDirectory, { withFileTypes: true });
  const packageConfigs = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const directory = path.posix.join('packages', entry.name);
    const manifestPath = path.join(repositoryRoot, directory, 'package.json');

    try {
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      if (manifest.private !== true) {
        packageConfigs.push({
          directory,
          skipRuntimeExports: runtimeExportSkips.get(directory) ?? new Set(),
        });
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  return packageConfigs.sort((left, right) => left.directory.localeCompare(right.directory));
}

function collectExportTargets(value, exportName, conditions = [], targets = []) {
  if (typeof value === 'string') {
    targets.push({ exportName, conditions, target: value });
    return targets;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectExportTargets(item, exportName, [...conditions, `[${index}]`], targets);
    });
    return targets;
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([condition, target]) => {
      collectExportTargets(target, exportName, [...conditions, condition], targets);
    });
    return targets;
  }

  if (value !== null) {
    failures.push(
      `${exportName}: unsupported export target value ${JSON.stringify(value)}`,
    );
  }

  return targets;
}

function isWithinPackage(packageDirectory, targetPath) {
  const relativePath = path.relative(packageDirectory, targetPath);
  return relativePath !== '..'
    && !relativePath.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relativePath);
}

function isTypeTarget(conditions, target) {
  return conditions.includes('types') || /\.d\.(?:c|m)?ts$/.test(target);
}

async function verifyPackage({ directory: relativePackageDirectory, skipRuntimeExports = new Set() }) {
  const packageDirectory = path.join(repositoryRoot, relativePackageDirectory);
  const packageJsonPath = path.join(packageDirectory, 'package.json');
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  const packageName = packageJson.name ?? relativePackageDirectory;

  console.log(`\n${packageName}`);

  if (!packageJson.exports || typeof packageJson.exports !== 'object') {
    failures.push(`${packageName}: package.json has no object-shaped exports field`);
    return;
  }

  const targets = Object.entries(packageJson.exports).flatMap(([exportName, value]) =>
    collectExportTargets(value, exportName),
  );
  const packageRequire = createRequire(packageJsonPath);

  for (const { exportName, conditions, target } of targets) {
    targetCount += 1;
    const conditionLabel = conditions.join('/');
    const label = `${packageName} ${exportName} (${conditionLabel})`;

    if (!target.startsWith('./')) {
      failures.push(`${label}: target must start with "./": ${target}`);
      continue;
    }

    const targetPath = path.resolve(packageDirectory, target);
    if (!isWithinPackage(packageDirectory, targetPath)) {
      failures.push(`${label}: target escapes the package directory: ${target}`);
      continue;
    }

    try {
      const targetStats = await stat(targetPath);
      if (!targetStats.isFile()) {
        throw new Error('target is not a file');
      }
    } catch (error) {
      failures.push(`${label}: missing target ${target} (${error.message})`);
      continue;
    }

    if (isTypeTarget(conditions, target)) {
      console.log(`  ✓ ${exportName} ${conditionLabel} -> ${target}`);
      continue;
    }

    if (skipRuntimeExports.has(exportName)) {
      console.log(`  ✓ ${exportName} ${conditionLabel} -> ${target} [runtime load skipped: executable CLI]`);
      continue;
    }

    try {
      if (conditions.includes('import')) {
        await import(pathToFileURL(targetPath).href);
        runtimeLoadCount += 1;
        console.log(`  ✓ ${exportName} ${conditionLabel} -> ${target} [ESM loaded]`);
      } else if (conditions.includes('require')) {
        packageRequire(targetPath);
        runtimeLoadCount += 1;
        console.log(`  ✓ ${exportName} ${conditionLabel} -> ${target} [CJS loaded]`);
      } else {
        console.log(`  ✓ ${exportName} ${conditionLabel} -> ${target}`);
      }
    } catch (error) {
      failures.push(`${label}: failed to load ${target}: ${error.stack ?? error.message}`);
    }
  }
}

const packagesToVerify = await discoverPublicPackages();

for (const packageConfig of packagesToVerify) {
  try {
    await verifyPackage(packageConfig);
  } catch (error) {
    failures.push(`${packageConfig.directory}: ${error.stack ?? error.message}`);
  }
}

if (failures.length > 0) {
  console.error(`\nPackage export verification failed with ${failures.length} error(s):`);
  failures.forEach((failure) => console.error(`  ✗ ${failure}`));
  process.exitCode = 1;
} else {
  console.log(
    `\nVerified ${packagesToVerify.length} packages, ${targetCount} export targets, and ${runtimeLoadCount} runtime loads.`,
  );
}
