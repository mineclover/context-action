import { cp, rm } from 'node:fs/promises';
import path from 'node:path';

const packageRoot = path.resolve(import.meta.dirname, '..');
const source = path.join(packageRoot, 'dist-standalone');
const target = path.join(packageRoot, 'examples', 'dist-standalone');

await rm(target, { recursive: true, force: true });
await cp(source, target, { recursive: true });
