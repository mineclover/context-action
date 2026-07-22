import { ConfigValidator } from '../../../src/shared/config/ConfigValidator.js';
import type {
  AppConfig,
  GenerationConfig,
  PathConfig,
  QualityConfig,
} from '../../../src/shared/types/ConfigTypes.js';

function createConfig(overrides: {
  paths?: Partial<PathConfig>;
  generation?: Partial<GenerationConfig>;
  quality?: Partial<QualityConfig>;
} = {}): AppConfig {
  return {
    paths: {
      docsDir: 'docs',
      llmContentDir: 'llmsData',
      outputDir: 'docs/llms',
      templatesDir: 'templates',
      instructionsDir: 'instructions',
      ...overrides.paths,
    },
    generation: {
      supportedLanguages: ['en', 'ko'],
      characterLimits: [100, 1000],
      defaultCharacterLimits: {
        summary: 100,
        detailed: 1000,
        comprehensive: 5000,
      },
      defaultLanguage: 'en',
      outputFormat: 'txt',
      ...overrides.generation,
    },
    quality: {
      minCompletenessThreshold: 0.8,
      enableValidation: true,
      strictMode: false,
      ...overrides.quality,
    },
  };
}

describe('ConfigValidator', () => {
  it('keeps the historical object API and accepts a valid configuration', () => {
    const result = ConfigValidator.validate(createConfig());

    expect(typeof ConfigValidator.validate).toBe('function');
    expect(result).toEqual({ isValid: true, errors: [] });
  });

  it('reports every required path that is missing or blank', () => {
    const result = ConfigValidator.validate(createConfig({
      paths: {
        docsDir: ' ',
        llmContentDir: '',
        outputDir: undefined,
        templatesDir: undefined,
        instructionsDir: undefined,
      },
    }));

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'paths.docsDir', code: 'REQUIRED_PATH' }),
      expect.objectContaining({ field: 'paths.llmContentDir', code: 'REQUIRED_PATH' }),
      expect.objectContaining({ field: 'paths.outputDir', code: 'REQUIRED_PATH' }),
      expect.objectContaining({ field: 'paths.templatesDir', code: 'REQUIRED_PATH' }),
      expect.objectContaining({ field: 'paths.instructionsDir', code: 'REQUIRED_PATH' }),
    ]));
  });

  it('validates language, character-limit, and default-language invariants together', () => {
    const result = ConfigValidator.validate(createConfig({
      generation: {
        supportedLanguages: [],
        characterLimits: [0, -1],
        defaultLanguage: 'ja',
      },
    }));

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'generation.supportedLanguages', code: 'INVALID_LANGUAGES' }),
      expect.objectContaining({ field: 'generation.characterLimits', code: 'INVALID_CHAR_LIMIT_VALUES' }),
      expect.objectContaining({ field: 'generation.defaultLanguage', code: 'INVALID_DEFAULT_LANGUAGE' }),
    ]));
  });

  it.each([-0.1, 1.1])('rejects quality thresholds outside [0, 1]: %s', threshold => {
    const result = ConfigValidator.validate(createConfig({
      quality: { minCompletenessThreshold: threshold },
    }));

    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'quality.minCompletenessThreshold',
      code: 'INVALID_THRESHOLD',
    }));
  });
});
