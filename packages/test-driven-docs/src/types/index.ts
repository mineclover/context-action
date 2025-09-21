/**
 * Core types for the test-driven documentation system
 */

export interface TestExample {
  description: string;
  rawCode: string;
  cleanedCode: string;
  category: ExampleCategory;
  isAsync: boolean;
  apis: string[];
  complexity: ComplexityLevel;
}

export type ExampleCategory =
  | 'basic-usage'
  | 'advanced-patterns'
  | 'error-handling'
  | 'performance'
  | 'integration'
  | 'async-patterns';

export type ComplexityLevel = 'simple' | 'moderate' | 'complex';

export interface TestMetadata {
  fileName: string;
  mainSuite: string | null;
  description: string | null;
  testCount: number;
  tags: string[];
}

export interface ImportInfo {
  module: string;
  isLocal: boolean;
  isTestFramework: boolean;
  statement: string;
}

export interface TypeDefinition {
  type: 'interface' | 'type';
  name: string;
  definition: string;
}

export interface SetupCode {
  type: 'beforeEach' | 'beforeAll' | 'afterEach' | 'afterAll';
  code: string;
  isAsync: boolean;
}

export interface ParsedTestData {
  metadata: TestMetadata;
  imports: ImportInfo[];
  interfaces: TypeDefinition[];
  setup: SetupCode[];
  examples: TestExample[];
  categorizedExamples?: Record<ExampleCategory, TestExample[]>;
  packageName: string;
  filePath: string;
}

export interface GeneratorConfig {
  // Input configuration
  packagesDir: string;
  packages: string[];
  testPatterns: string[];

  // Output configuration
  outputDir: string;
  languages: string[];

  // Enhanced documentation configuration
  githubRepoUrl?: string;
  docsBaseUrl?: string;

  // Processing options
  cleanMocks: boolean;
  extractTypes: boolean;
  categorizeExamples: boolean;
  includeComments: boolean;
  realistic: boolean;

  // Template configuration
  template: TemplateConfig;
}

export interface TemplateConfig {
  type: 'enhanced' | 'minimal' | 'custom';
  customTemplatePath?: string;
  includeSections: {
    overview: boolean;
    quickStart: boolean;
    examples: boolean;
    advanced: boolean;
    errorHandling: boolean;
    performance: boolean;
    testCoverage: boolean;
    relatedAPIs: boolean;
  };
}

export interface CleanerOptions {
  removeComments: boolean;
  removeTestArtifacts: boolean;
  formatCode: boolean;
  addTypeAnnotations: boolean;
  realistic: boolean;
}

export interface ParserOptions {
  cleanMocks: boolean;
  extractTypes: boolean;
  categorizeExamples: boolean;
  includeComments: boolean;
}

export interface GenerationResult {
  success: boolean;
  apisGenerated: string[];
  filesProcessed: number;
  categoriesCovered: number;
  errors: GenerationError[];
}

export interface GenerationError {
  type: 'parsing' | 'cleaning' | 'templating' | 'file-io';
  message: string;
  file?: string;
  api?: string;
}

export interface ApiDocumentationData {
  categorizedExamples: Record<ExampleCategory, TestExample[]>;
  allTestData: ParsedTestData[];
  metadata: {
    testCount: number;
    packageNames: string[];
    fileCount: number;
  };
  packageName: string;
}

export interface LanguageTranslation {
  [key: string]: string;
}

export interface MultiLanguageConfig {
  languages: string[];
  translations: Record<string, LanguageTranslation>;
  defaultLanguage: string;
}

// Types for TestMetadataExtractor (simplified extractor)
export interface TestFileMetadata {
  filePath: string;
  fileName: string;
  extractedAt: string;

  imports: ImportInfo[];
  interfaces: TypeDefinition[];
  testSuites: TestSuite[];
  testCases: TestCase[];
  apiUsage: ApiUsage[];
  metrics: FileMetrics;
}

export interface ProjectTestMetadata {
  projectPath: string;
  extractedAt: string;
  totalFiles: number;
  files: TestFileMetadata[];
  summary: ProjectSummary;
}

export interface TestSuite {
  name: string;
  startIndex: number;
}

export interface TestCase {
  description: string;
  startIndex: number;
  isAsync: boolean;
  bodyLength: number;
  apiCalls: string[];
  hasAssertions: boolean;
}

export interface ApiUsage {
  apiName: string;
  occurrences: number;
  pattern: string;
}

export interface FileMetrics {
  totalLines: number;
  nonEmptyLines: number;
  testCount: number;
  suiteCount: number;
  importCount: number;
  typeDefinitionCount: number;
}

export interface ProjectSummary {
  totalTestFiles: number;
  totalTestCases: number;
  totalTestSuites: number;
  totalLines: number;
  uniqueApis: string[];
  uniqueTypes: string[];
  filesByFramework: Record<string, number>;
}