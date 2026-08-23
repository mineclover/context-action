import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogDirectory = path.join(repositoryRoot, 'catalog', 'integration-profiles');
const requiredLifecycle = ['draft', 'registered', 'verified', 'supported', 'deprecated'];
const expectedActions = ['scope.select', 'scene.select', 'compile.run', 'evaluate.run'];
const expectedAuthorities = ['PageDocument', 'StructuralBrief', 'CapabilityDocument', 'VisualIntentDocument', 'SceneDocument'];

const fail = message => { throw new Error(`Integration profile catalog failed: ${message}`); };
if (!fs.existsSync(catalogDirectory)) fail('catalog directory is missing');
const profiles = fs.readdirSync(catalogDirectory).filter(file => file.endsWith('.json')).sort();
if (!profiles.includes('interface-intent-runtime.v1.json')) fail('Interface Intent runtime profile is missing');

for (const file of profiles) {
  const profile = JSON.parse(fs.readFileSync(path.join(catalogDirectory, file), 'utf8'));
  if (profile.schemaVersion !== 'context-action.integration-profile/v1') fail(`${file} has an unsupported schemaVersion`);
  if (typeof profile.id !== 'string' || profile.id.length === 0) fail(`${file} must have an id`);
  if (!requiredLifecycle.includes(profile.status) || profile.lifecycle?.current !== profile.status) fail(`${file} has an invalid lifecycle state`);
  if (JSON.stringify(profile.lifecycle?.states) !== JSON.stringify(requiredLifecycle)) fail(`${file} must preserve the complete lifecycle catalog`);
  if (!Array.isArray(profile.actionCatalog) || JSON.stringify(profile.actionCatalog) !== JSON.stringify(expectedActions)) fail(`${file} has an invalid action catalog`);
  if (JSON.stringify(profile.ownership?.externalAuthorities) !== JSON.stringify(expectedAuthorities)) fail(`${file} must preserve document authority ownership`);
  if (!profile.ownership?.runtimeState?.includes('revision') || !profile.ownership?.runtimeState?.includes('documentRefs')) fail(`${file} must own only runtime refs and revision state`);
  if (!profile.ownership?.forbiddenRuntimeState?.includes('canonicalDocumentCopies')) fail(`${file} must forbid canonical document copies`);
  if (!Array.isArray(profile.requiredEvidence) || profile.requiredEvidence.length < 4) fail(`${file} must require lifecycle evidence`);
  if (!Array.isArray(profile.registeredConsumers) || profile.registeredConsumers.length === 0) fail(`${file} must register at least one consumer`);
}

console.log(JSON.stringify({ status: 'ok', profiles }));
