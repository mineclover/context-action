import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CombineReferencesCommand } from '../../src/cli/commands/CombineReferencesCommand.js';
import type { CLIConfig } from '../../src/cli/types/CLITypes.js';

describe('CombineReferencesCommand', () => {
  let root: string;
  let config: CLIConfig;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'llms-combine-refs-'));
    await fs.mkdir(path.join(root, 'docs', 'en', 'guide'), { recursive: true });
    await fs.mkdir(path.join(root, 'output'), { recursive: true });

    config = {
      paths: {
        docsDir: path.join(root, 'docs'),
        llmContentDir: path.join(root, 'llmsData'),
        outputDir: path.join(root, 'output'),
        templatesDir: path.join(root, 'templates'),
        instructionsDir: path.join(root, 'instructions')
      },
      generation: {
        supportedLanguages: ['en', 'ko'],
        characterLimits: [100, 300, 1000],
        defaultCharacterLimits: { summary: 100, detailed: 300, comprehensive: 1000 },
        defaultLanguage: 'en',
        outputFormat: 'txt'
      },
      quality: {
        minCompletenessThreshold: 0.8,
        enableValidation: true,
        strictMode: false
      }
    };
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('uses configured outputDir, deduplicates links, and resolves clean URLs with fragments', async () => {
    const sourceDoc = path.join(root, 'docs', 'en', 'guide', 'index.md');
    const cleanTarget = path.join(root, 'docs', 'en', 'guide', 'setup.md');

    await fs.writeFile(cleanTarget, '# Setup Guide\n\nInstall dependencies first.\n');
    await fs.writeFile(
      sourceDoc,
      [
        '# Guide Overview',
        '',
        '**[Setup Guide](./setup#install)** - Initial setup instructions',
        '- [Duplicate link](./setup#install)'
      ].join('\n')
    );

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await new CombineReferencesCommand(config).execute({
        sourceDocument: sourceDoc
      });
    } finally {
      logSpy.mockRestore();
    }

    const expectedOutput = path.join(root, 'output', 'index-combined.md');
    const combined = await fs.readFile(expectedOutput, 'utf-8');
    expect(combined).toContain('Setup Guide');
    expect(combined).toContain('Install dependencies first.');
    expect(combined.match(/# Setup Guide/g)).toHaveLength(1);
  });
});
