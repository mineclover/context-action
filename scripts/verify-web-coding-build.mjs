import fs from 'node:fs';
import path from 'node:path';

const distDirectory = path.resolve(
  process.argv[2] ?? 'demos/bolt-style-editor/dist'
);
const indexPath = path.join(distDirectory, 'index.html');
const expectedBase = '/context-action/web-coding/';

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

for (const reference of assetReferences) {
  if (!reference.startsWith(`${expectedBase}assets/`)) {
    throw new Error(
      `Standalone asset does not use the GitHub Pages base path: ${reference}`
    );
  }

  const relativeAssetPath = reference.slice(expectedBase.length);
  const assetPath = path.join(distDirectory, relativeAssetPath);
  if (!fs.existsSync(assetPath)) {
    throw new Error(`Standalone asset is missing from the build: ${assetPath}`);
  }
}

console.log(
  `Verified standalone web-coding build: ${assetReferences.length} asset(s) under ${expectedBase}`
);
