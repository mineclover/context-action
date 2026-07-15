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

function resolveJavaScriptAssetReference(reference, source) {
  const cleanReference = reference.split(/[?#]/, 1)[0];
  if (cleanReference.startsWith(expectedBase)) return cleanReference;
  if (cleanReference.startsWith('assets/')) {
    return `${expectedBase}${cleanReference}`;
  }
  if (cleanReference.startsWith('/')) {
    return new URL(cleanReference, 'https://pages.invalid').pathname;
  }
  const sourceDirectory = path.posix.dirname(source.replaceAll(path.sep, '/'));
  const baseDirectory =
    sourceDirectory === '.'
      ? expectedBase
      : `${expectedBase}${sourceDirectory}/`;
  return new URL(cleanReference, `https://pages.invalid${baseDirectory}`).pathname;
}

const transitiveAssetReferences = new Set();
const javascriptQueue = assetReferences
  .filter((reference) => reference.endsWith('.js'))
  .map((reference) => ({
    reference,
    filePath: path.resolve(distDirectory, reference.slice(expectedBase.length)),
  }));
const javascriptAssetPattern = /["'`]((?:\.\.?\/|assets\/|\/)[^"'`]*?\.(?:js|css)(?:\?[^"'`]*)?)["'`]/g;

while (javascriptQueue.length > 0) {
  const current = javascriptQueue.shift();
  if (!current || transitiveAssetReferences.has(current.reference)) continue;
  transitiveAssetReferences.add(current.reference);
  const source = path.relative(distDirectory, current.filePath);
  if (!fs.existsSync(current.filePath)) {
    throw new Error(
      `Standalone JavaScript asset is missing from the build: ${current.filePath}`
    );
  }
  const javascript = fs.readFileSync(current.filePath, 'utf8');
  for (const match of javascript.matchAll(javascriptAssetPattern)) {
    const resolvedReference = resolveJavaScriptAssetReference(match[1], source);
    verifyAssetReference(resolvedReference, source);
    if (
      resolvedReference.endsWith('.js') &&
      !transitiveAssetReferences.has(resolvedReference)
    ) {
      javascriptQueue.push({
        reference: resolvedReference,
        filePath: path.resolve(
          distDirectory,
          resolvedReference.slice(expectedBase.length)
        ),
      });
    }
  }
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
  `Verified standalone web-coding build: ${assetReferences.length} entry asset(s), ${transitiveAssetReferences.size} transitive JS asset(s), ${cssReferences.length} CSS asset(s) under ${expectedBase}`
);
