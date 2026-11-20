#!/usr/bin/env node

/**
 * @context-action/llms-generator programmatic configuration example.
 *
 * Build the package first (`pnpm build:llms-generator`), then run:
 *   node packages/llms-generator/examples/library-usage.js
 */

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DEFAULT_CONFIG, EnhancedConfigManager } from '../dist/index.js';

async function demonstrateLibraryUsage() {
  console.log('@context-action/llms-generator Library Usage Example\n');

  // 1. Inspect built-in DEFAULT_CONFIG
  console.log('1. Default configuration snapshot:');
  console.log('   docsDir:', DEFAULT_CONFIG.paths.docsDir);
  console.log('   llmContentDir:', DEFAULT_CONFIG.paths.llmContentDir);
  console.log('   outputDir:', DEFAULT_CONFIG.paths.outputDir);
  console.log(
    '   languages:',
    DEFAULT_CONFIG.generation.supportedLanguages.join(', ')
  );
  console.log(
    '   characterLimits:',
    DEFAULT_CONFIG.generation.characterLimits.join(', ')
  );
  console.log('');

  // 2. Initialize, validate, save, and reload an enhanced config in a temp directory
  const workDir = await mkdtemp(join(tmpdir(), 'llms-generator-example-'));
  try {
    const configPath = join(workDir, 'llms-generator.config.json');
    const manager = new EnhancedConfigManager(configPath);

    const standardPreset = manager.getConfigPreset('standard');
    console.log('2. Selected preset:', standardPreset.name);
    console.log('   Description:', standardPreset.description);
    console.log(
      '   Preset limits:',
      standardPreset.characterLimits.join(', ')
    );

    const initialized = await manager.initializeConfig('standard');
    manager.validateConfig(initialized);
    const reloaded = await manager.loadConfig();
    const active = manager.getConfig();

    console.log('   Saved config path:', configPath);
    console.log(
      '   Categories loaded:',
      Object.keys(reloaded.categories).join(', ')
    );
    console.log(
      '   Active config validated:',
      Boolean(active && active.generation.characterLimits.length > 0)
    );
    console.log('');
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }

  // 3. CLI commands for generating templates & combined LLMS bundles
  console.log('3. CLI workflows (via @context-action/llms-generator/cli):');
  console.log(
    '   Sync changed docs (comma-separated): pnpm llms:sync-docs --changed-files docs/en/guide/getting-started.md,docs/ko/guide/getting-started.md'
  );
  console.log(
    '   Combine LLMS output: node packages/llms-generator/dist/cli/index.js llms-generate --character-limit 1000 --pattern standard'
  );
  console.log('   Check priority health: pnpm llms:priority-health');
}

demonstrateLibraryUsage().catch((error) => {
  console.error('Example failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
