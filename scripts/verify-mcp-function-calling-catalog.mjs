import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

function readSource(relativeFile) {
  const filePath = path.join(repositoryRoot, relativeFile);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required catalog source: ${relativeFile}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function extractNamedTools(source) {
  return [...source.matchAll(/name:\s*['"]([^'"]+)['"]/g)].map(
    ([, name]) => name
  );
}

function extractCatalogTools(source) {
  const names = [];
  for (const [, arraySource] of source.matchAll(
    /tools:\s*\[([\s\S]*?)\]/g
  )) {
    for (const [, name] of arraySource.matchAll(/['"]([^'"]+)['"]/g)) {
      names.push(name);
    }
  }
  return names;
}

function assertCatalogMatchesSchema({
  catalogSource,
  schemaSource,
  marker,
  endMarker,
  label,
}) {
  const markerIndex = catalogSource.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error(`Catalog marker not found for ${label}: ${marker}`);
  }
  const endIndex = endMarker
    ? catalogSource.indexOf(endMarker, markerIndex)
    : catalogSource.length;
  if (endMarker && endIndex < 0) {
    throw new Error(`Catalog end marker not found for ${label}: ${endMarker}`);
  }

  const catalogNames = [
    ...new Set(extractCatalogTools(catalogSource.slice(markerIndex, endIndex))),
  ];
  const schemaNames = new Set(extractNamedTools(schemaSource));
  const unknownNames = catalogNames.filter((name) => !schemaNames.has(name));

  if (unknownNames.length > 0) {
    throw new Error(
      `${label} references tools missing from its schema: ${unknownNames.join(', ')}`
    );
  }

  return catalogNames.length;
}

const catalogSource = readSource(
  'example/src/lib/mcp-function-calling-catalog.ts'
);
const uiSchemaSource = readSource('example/src/lib/ui-tools-schema.ts');
const standaloneSchemaSource = readSource(
  'demos/bolt-style-editor/src/tool-schema.ts'
);

const uiCount = assertCatalogMatchesSchema({
  catalogSource,
  schemaSource: uiSchemaSource,
  marker: 'export const mcpFunctionCallingCommands',
  endMarker: 'export const mcpStandaloneCommands',
  label: 'UI catalog',
});
const standaloneCount = assertCatalogMatchesSchema({
  catalogSource,
  schemaSource: standaloneSchemaSource,
  marker: 'export const mcpStandaloneCommands',
  label: 'standalone catalog',
});

console.log('MCP/function-calling catalog contract check');
console.log(`- UI catalog tool references checked: ${uiCount}`);
console.log(`- standalone catalog tool references checked: ${standaloneCount}`);
