import fs from 'node:fs';
import path from 'node:path';

const distDirectory = path.resolve(
  process.argv[2] ?? 'demos/bolt-style-editor/dist'
);
const expectedBase = process.argv[3] ?? '/context-action/web-coding/';
const indexPath = path.join(distDirectory, 'index.html');

if (!expectedBase.startsWith('/') || !expectedBase.endsWith('/')) {
  throw new Error(
    `Expected base must start and end with '/': ${expectedBase}`
  );
}

if (!fs.existsSync(indexPath)) {
  throw new Error(`Standalone build is missing ${indexPath}`);
}

const html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes('<div id="root"></div>')) {
  throw new Error('Standalone build does not contain the application root.');
}

const assetReferences = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((reference) => reference.includes('/assets/'));

if (assetReferences.length === 0) {
  throw new Error('Standalone build does not reference compiled assets.');
}

function verifyAssetReference(reference, source, requireAssetDirectory = true) {
  if (
    !reference.startsWith(expectedBase) ||
    (requireAssetDirectory && !reference.startsWith(`${expectedBase}assets/`))
  ) {
    throw new Error(
      `Standalone asset does not use the expected base path (${expectedBase}) in ${source}: ${reference}`
    );
  }

  const relativeAssetPath = reference.slice(expectedBase.length);
  const assetPath = path.resolve(distDirectory, relativeAssetPath);
  if (!assetPath.startsWith(`${distDirectory}${path.sep}`)) {
    throw new Error(`Standalone asset escapes the build directory: ${reference}`);
  }
  if (!fs.existsSync(assetPath)) {
    throw new Error(`Standalone asset is missing from the build: ${assetPath}`);
  }
}

for (const reference of assetReferences) {
  verifyAssetReference(reference, 'index.html');
}

const cssReferences = [];
for (const reference of assetReferences.filter((reference) =>
  reference.endsWith('.css')
)) {
  const cssPath = path.resolve(distDirectory, reference.slice(expectedBase.length));
  const css = fs.readFileSync(cssPath, 'utf8');
  for (const match of css.matchAll(/url\((['"]?)([^'"\)]+)\1\)/g)) {
    const cssReference = match[2];
    if (
      cssReference.startsWith('#') ||
      cssReference.startsWith('data:') ||
      cssReference.startsWith('http')
    ) {
      continue;
    }
    const absoluteReference = new URL(
      cssReference,
      `https://pages.invalid${expectedBase}assets/`
    ).pathname;
    cssReferences.push(absoluteReference);
    verifyAssetReference(
      absoluteReference,
      path.relative(distDirectory, cssPath),
      false
    );
  }
}

console.log(
  `Verified standalone web-coding build: ${assetReferences.length} entry asset(s), ${cssReferences.length} CSS asset(s) under ${expectedBase}`
);
