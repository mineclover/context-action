import path from 'path';
import { LLMSOutputPathManager } from '../../../src/core/LLMSOutputPathManager.js';
import type { CLIConfig } from '../../../src/cli/types/CLITypes.js';

describe('LLMSOutputPathManager document identity paths', () => {
  const docsDir = path.join('/workspace', 'docs');
  const config = {
    paths: {
      docsDir,
      llmContentDir: path.join('/workspace', 'llmsData'),
      outputDir: path.join('/workspace', 'output'),
      templatesDir: path.join('/workspace', 'templates'),
      instructionsDir: path.join('/workspace', 'instructions'),
    },
    generation: {
      supportedLanguages: ['en', 'ko'],
      characterLimits: [100],
      defaultCharacterLimits: {
        summary: 100,
        detailed: 300,
        comprehensive: 1000,
      },
      defaultLanguage: 'en',
      outputFormat: 'txt',
    },
    categories: {},
  } as CLIConfig;
  const pathManager = new LLMSOutputPathManager(config);

  it('restores every category-relative segment from a canonical document ID', () => {
    const documentId = 'guide--patterns--action--basic-usage';

    expect(pathManager.documentIdToSourcePath(documentId, 'en')).toBe(
      path.join(docsDir, 'en', 'guide', 'patterns', 'action', 'basic-usage.md'),
    );
    expect(pathManager.getRelativeSourcePath(documentId, 'en', 100)).toBe(
      'en/guide/patterns/action/basic-usage.md',
    );
  });

  it('keeps the existing shallow document ID mapping compatible', () => {
    expect(
      pathManager.getRelativeSourcePath('guide--getting-started', 'ko', 100),
    ).toBe('ko/guide/getting-started.md');
  });
});
