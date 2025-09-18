import { DocumentationGenerator } from '../src/core/DocumentationGenerator.js';
import { GeneratorConfig } from '../src/types/index.js';

describe('DocumentationGenerator', () => {
  let generator: DocumentationGenerator;
  let mockConfig: GeneratorConfig;

  beforeEach(() => {
    mockConfig = {
      packagesDir: './test-packages',
      packages: ['test-package'],
      testPatterns: ['**/*.test.ts'],
      outputDir: './test-output',
      languages: ['en'],
      cleanMocks: true,
      extractTypes: true,
      categorizeExamples: true,
      includeComments: false,
      realistic: true,
      template: {
        type: 'enhanced',
        includeSections: {
          overview: true,
          quickStart: true,
          examples: true,
          advanced: true,
          errorHandling: true,
          performance: true,
          testCoverage: true,
          relatedAPIs: true
        }
      }
    };

    generator = new DocumentationGenerator(mockConfig);
  });

  it('should create DocumentationGenerator instance', () => {
    expect(generator).toBeInstanceOf(DocumentationGenerator);
  });

  it('should initialize with correct configuration', () => {
    expect(generator).toBeDefined();
    // Test that the generator was created with the expected config
    // Note: In a real implementation, we might expose config for testing
  });

  describe('generate method', () => {
    it('should return a GenerationResult', async () => {
      // Mock the file system operations for testing
      // This would need proper mocking in a real test
      const result = await generator.generate();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('apisGenerated');
      expect(result).toHaveProperty('filesProcessed');
      expect(result).toHaveProperty('categoriesCovered');
      expect(result).toHaveProperty('errors');
    });
  });
});