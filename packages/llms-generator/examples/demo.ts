/**
 * Enhanced Configuration Manager Demo for @context-action/llms-generator.
 *
 * Run with:
 *   pnpm --filter @context-action/llms-generator demo
 */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  DEFAULT_CONFIG,
  type EnhancedLLMSConfig,
  EnhancedConfigManager,
} from '../src/index.js';

export interface DemoOptions {
  outputDir?: string;
  preset?: string;
  verbose?: boolean;
}

export async function runEnhancedConfigDemo(
  options: DemoOptions = {}
): Promise<void> {
  const verbose = options.verbose ?? false;
  const presetName = options.preset ?? 'standard';
  const tempRoot = options.outputDir
    ? undefined
    : await mkdtemp(join(tmpdir(), 'llms-demo-'));
  const outputDir = options.outputDir
    ? resolve(options.outputDir)
    : (tempRoot as string);

  console.log('@context-action/llms-generator EnhancedConfigManager Demo\n');

  try {
    await mkdir(outputDir, { recursive: true });
    const docsDir = join(outputDir, 'docs');
    await mkdir(docsDir, { recursive: true });

    await writeFile(
      join(docsDir, 'sample-guide.md'),
      '# Sample Guide\n\nMinimal markdown document for configuration demo.\n',
      'utf-8'
    );

    const configPath = join(outputDir, 'llms-generator.config.json');
    const manager = new EnhancedConfigManager(configPath);
    const initialized = await manager.initializeConfig(presetName);

    const customConfig: EnhancedLLMSConfig = {
      ...initialized,
      paths: {
        ...DEFAULT_CONFIG.paths,
        ...initialized.paths,
        docsDir,
        outputDir: join(outputDir, 'output'),
      },
    };

    manager.validateConfig(customConfig);
    await manager.saveConfig(customConfig);
    const reloaded = await manager.loadConfig();

    console.log(`Initialized preset: ${presetName}`);
    console.log(`Docs directory: ${reloaded.paths.docsDir}`);
    console.log(`Output directory: ${reloaded.paths.outputDir}`);
    console.log(
      `Languages: ${reloaded.generation.supportedLanguages.join(', ')}`
    );
    console.log(
      `Character limits: ${reloaded.generation.characterLimits.join(', ')}`
    );

    if (verbose) {
      console.log('Categories:', Object.keys(reloaded.categories).join(', '));
      console.log('Tags:', Object.keys(reloaded.tags).join(', '));
    }

    console.log('\nCLI workflow examples:');
    console.log(
      '  llms sync-docs --changed-files docs/en/examples/basic-setup.md,docs/ko/examples/basic-setup.md'
    );
    console.log(
      '  llms llms-generate --character-limit 1000 --pattern standard'
    );
  } finally {
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true });
    }
  }
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))
) {
  const args = process.argv.slice(2);
  const outputDir = args
    .find((arg) => arg.startsWith('--output='))
    ?.split('=')[1];
  const preset = args
    .find((arg) => arg.startsWith('--preset='))
    ?.split('=')[1];
  const verbose = args.includes('--verbose');

  runEnhancedConfigDemo({ outputDir, preset, verbose }).catch((error) => {
    console.error(
      'Demo failed:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  });
}
