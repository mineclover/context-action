/**
 * @context-action/test-driven-docs
 *
 * A powerful test-driven documentation generator that extracts examples from test code
 * to create comprehensive, always-up-to-date API documentation.
 */

export * from './types/index.js';
export * from './core/DocumentationGenerator.js';
export * from './parsers/TestParser.js';
export * from './cleaners/CodeCleaner.js';

// Utils
export * from './utils/index.js';

// Main factory function for easy usage
import { DocumentationGenerator } from './core/DocumentationGenerator.js';
import { GeneratorConfig } from './types/index.js';

/**
 * Create a documentation generator with the given configuration
 */
export function createDocumentationGenerator(config: Partial<GeneratorConfig>): DocumentationGenerator {
  const defaultConfig: GeneratorConfig = {
    packagesDir: './packages',
    packages: ['core', 'react'],
    testPatterns: ['**/*.test.ts', '**/*.spec.ts'],
    outputDir: './docs',
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

  const mergedConfig = {
    ...defaultConfig,
    ...config,
    template: {
      ...defaultConfig.template,
      ...config.template,
      includeSections: {
        ...defaultConfig.template.includeSections,
        ...config.template?.includeSections
      }
    }
  };

  return new DocumentationGenerator(mergedConfig);
}

/**
 * Quick start function for simple use cases
 */
export async function generateDocs(options: {
  packagesDir?: string;
  packages?: string[];
  outputDir?: string;
  languages?: string[];
}) {
  const generator = createDocumentationGenerator(options);
  return await generator.generate();
}