/**
 * @context-action/test-driven-docs
 *
 * A stable and repeatable test metadata extraction library that outputs structured JSON data from test files.
 * Focuses on reliable syntax analysis without complex processing for maximum versatility.
 */

// Core extractor
export { TestMetadataExtractor } from './core/TestMetadataExtractor.js';
import { TestMetadataExtractor } from './core/TestMetadataExtractor.js';

// Enhanced documentation generation
export { DocumentationGenerator } from './core/DocumentationGenerator.js';
export { TestParser } from './parsers/TestParser.js';
export { CodeCleaner } from './cleaners/CodeCleaner.js';
export * from './utils/index.js';
export { AnnotationExtractor, type AnnotatedTest, type DocAnnotation } from './extractors/AnnotationExtractor.js';
export { EnhancedMarkdownGenerator, type EnhancedDocConfig } from './generators/EnhancedMarkdownGenerator.js';
export { ConsistencyValidator, type ProjectValidationReport, type ApiValidationResult } from './validators/ConsistencyValidator.js';

// Import for internal use
import { DocumentationGenerator } from './core/DocumentationGenerator.js';
import type { GeneratorConfig } from './types/index.js';

// Type definitions
export type {
  TestFileMetadata,
  ProjectTestMetadata,
  ImportInfo,
  TypeDefinition,
  TestSuite,
  TestCase,
  ApiUsage,
  FileMetrics,
  ProjectSummary,
  GeneratorConfig,
  GenerationResult,
  GenerationError,
  TestExample,
  ExampleCategory
} from './types/index.js';

// JSON Schema and validation
export {
  MetadataValidator,
  MetadataJsonSchemas,
  isTestFileMetadata,
  isProjectTestMetadata,
  TestFileMetadataSchema,
  ProjectTestMetadataSchema
} from './schemas/metadata-schema.js';

// Convenience functions
export async function extractFileMetadata(filePath: string) {
  const extractor = new TestMetadataExtractor();
  return extractor.extractFromFile(filePath);
}

export async function extractDirectoryMetadata(
  dirPath: string,
  pattern: RegExp = /\.test\.(ts|js)$/
) {
  const extractor = new TestMetadataExtractor();
  return extractor.extractFromDirectory(dirPath, pattern);
}

// Enhanced documentation generation convenience function
export function createDocumentationGenerator(config: Partial<GeneratorConfig>) {
  // Apply defaults
  const fullConfig: GeneratorConfig = {
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
    },
    ...config
  };

  return new DocumentationGenerator(fullConfig);
}

// Common patterns
export const COMMON_TEST_PATTERNS = {
  typescript: /\.test\.ts$/,
  javascript: /\.test\.js$/,
  typescriptAndJs: /\.test\.(ts|js)$/,
  spec: /\.spec\.(ts|js)$/,
  allTests: /\.(test|spec)\.(ts|js)$/,
  jest: /\.(test|spec)\.(ts|js)$/,
  vitest: /\.(test|spec)\.(ts|js)$/
} as const;

// API detection patterns for Context-Action framework
export const CONTEXT_ACTION_API_PATTERNS = {
  core: [
    'ActionRegister',
    'createStore',
    'ActionPipelineController'
  ],
  react: [
    'createActionContext',
    'createStoreContext',
    'useStoreValue',
    'useStoreSelector',
    'useActionHandler',
    'useActionDispatch'
  ]
} as const;
