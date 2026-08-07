import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = join(repositoryRoot, 'docs');
const packageTypes = join(repositoryRoot, 'packages', 'core', 'dist', 'index.d.ts');

async function collectMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectMarkdownFiles(path));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(path);
  }
  return files;
}

const snippets = [];
for (const file of await collectMarkdownFiles(docsRoot)) {
  const source = await readFile(file, 'utf8');
  const expression = /<!--\s*@context-action-compile\s*-->\s*```(?:ts|typescript)\n([\s\S]*?)```/g;
  let match;
  while ((match = expression.exec(source)) !== null) {
    snippets.push({ file, source: match[1] });
  }
}

if (snippets.length === 0) {
  throw new Error('No @context-action-compile Markdown snippets were found.');
}

const temporaryDirectory = await mkdtemp(join(tmpdir(), 'context-action-doc-snippets-'));
try {
  const files = snippets.map((snippet, index) => {
    const output = join(temporaryDirectory, `snippet-${index + 1}.ts`);
    return writeFile(output, snippet.source, 'utf8').then(() => output);
  });
  const snippetFiles = await Promise.all(files);
  const configPath = join(temporaryDirectory, 'tsconfig.json');
  await writeFile(configPath, JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      lib: ['ES2022', 'DOM'],
      module: 'ESNext',
      moduleResolution: 'Bundler',
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      ignoreDeprecations: '6.0',
      baseUrl: temporaryDirectory,
      paths: { '@context-action/core': [packageTypes] },
    },
    files: snippetFiles,
  }, null, 2), 'utf8');

  try {
    await execFileAsync('pnpm', ['exec', 'tsc', '--pretty', 'false', '-p', configPath], {
      cwd: repositoryRoot,
      maxBuffer: 1024 * 1024 * 8,
    });
  } catch (error) {
    const details = [error.stdout, error.stderr].filter(Boolean).join('\n');
    const locations = snippets.map(snippet => `- ${relative(repositoryRoot, snippet.file)}`).join('\n');
    throw new Error(`Documentation snippet compilation failed.\n${locations}\n${details}`);
  }
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

console.log(`Documentation snippets compiled: ${snippets.length}`);
