/**
 * @context-action/test-driven-docs
 *
 * A stable and repeatable test metadata extraction library that outputs structured JSON data from test files.
 * Focuses on reliable syntax analysis without complex processing for maximum versatility.
 */

// Core extractor
export { TestMetadataExtractor } from './core/TestMetadataExtractor.js';

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
  ProjectSummary
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