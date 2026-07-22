#!/usr/bin/env node

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const foundationPackages = [
  '@context-action/sem-foundation-contracts',
  '@context-action/sem-foundation-repository',
];

const require = createRequire(import.meta.url);
for (const name of foundationPackages) {
  try {
    require.resolve(name, { paths: [packageRoot] });
  } catch (error) {
    throw new Error(
      `Missing published Foundation dependency ${name}. Install the tooling packages before building Architecture Governance.`,
      { cause: error },
    );
  }
}
process.stdout.write('Prepared Architecture Governance with published Foundation packages.\n');
