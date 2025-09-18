/**
 * JSON Schema definitions for test metadata extraction
 * These schemas define the structure of extracted metadata for validation and tooling
 */

export const TestFileMetadataSchema = {
  type: 'object',
  required: ['filePath', 'fileName', 'extractedAt', 'imports', 'interfaces', 'testSuites', 'testCases', 'apiUsage', 'metrics'],
  properties: {
    filePath: { type: 'string', description: 'Absolute path to the test file' },
    fileName: { type: 'string', description: 'Base name of the test file' },
    extractedAt: { type: 'string', format: 'date-time', description: 'ISO timestamp of extraction' },

    imports: {
      type: 'array',
      items: {
        type: 'object',
        required: ['module', 'isLocal', 'isTestFramework', 'statement'],
        properties: {
          module: { type: 'string', description: 'Module path or name' },
          isLocal: { type: 'boolean', description: 'Whether the import is local (relative path)' },
          isTestFramework: { type: 'boolean', description: 'Whether the import is from a test framework' },
          statement: { type: 'string', description: 'Complete import statement' }
        }
      }
    },

    interfaces: {
      type: 'array',
      items: {
        type: 'object',
        required: ['type', 'name', 'definition'],
        properties: {
          type: { enum: ['interface', 'type'], description: 'Type of definition' },
          name: { type: 'string', description: 'Name of the type' },
          definition: { type: 'string', description: 'Complete type definition' }
        }
      }
    },

    testSuites: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'startIndex'],
        properties: {
          name: { type: 'string', description: 'Test suite name (describe block)' },
          startIndex: { type: 'number', description: 'Character index where suite starts' }
        }
      }
    },

    testCases: {
      type: 'array',
      items: {
        type: 'object',
        required: ['description', 'startIndex', 'isAsync', 'bodyLength', 'apiCalls', 'hasAssertions'],
        properties: {
          description: { type: 'string', description: 'Test case description (it/test block)' },
          startIndex: { type: 'number', description: 'Character index where test starts' },
          isAsync: { type: 'boolean', description: 'Whether the test is async' },
          bodyLength: { type: 'number', description: 'Length of test body in characters' },
          apiCalls: {
            type: 'array',
            items: { type: 'string' },
            description: 'API calls detected in test body'
          },
          hasAssertions: { type: 'boolean', description: 'Whether the test contains assertions' }
        }
      }
    },

    apiUsage: {
      type: 'array',
      items: {
        type: 'object',
        required: ['apiName', 'occurrences', 'pattern'],
        properties: {
          apiName: { type: 'string', description: 'Name of the API detected' },
          occurrences: { type: 'number', description: 'Number of times API appears' },
          pattern: { type: 'string', description: 'Regex pattern used for detection' }
        }
      }
    },

    metrics: {
      type: 'object',
      required: ['totalLines', 'nonEmptyLines', 'testCount', 'suiteCount', 'importCount', 'typeDefinitionCount'],
      properties: {
        totalLines: { type: 'number', description: 'Total lines in file' },
        nonEmptyLines: { type: 'number', description: 'Non-empty lines in file' },
        testCount: { type: 'number', description: 'Number of test cases (it/test)' },
        suiteCount: { type: 'number', description: 'Number of test suites (describe)' },
        importCount: { type: 'number', description: 'Number of import statements' },
        typeDefinitionCount: { type: 'number', description: 'Number of type definitions' }
      }
    }
  }
} as const;

export const ProjectTestMetadataSchema = {
  type: 'object',
  required: ['projectPath', 'extractedAt', 'totalFiles', 'files', 'summary'],
  properties: {
    projectPath: { type: 'string', description: 'Absolute path to the project directory' },
    extractedAt: { type: 'string', format: 'date-time', description: 'ISO timestamp of extraction' },
    totalFiles: { type: 'number', description: 'Total number of test files processed' },

    files: {
      type: 'array',
      items: TestFileMetadataSchema,
      description: 'Array of individual file metadata'
    },

    summary: {
      type: 'object',
      required: ['totalTestFiles', 'totalTestCases', 'totalTestSuites', 'totalLines', 'uniqueApis', 'uniqueTypes', 'filesByFramework'],
      properties: {
        totalTestFiles: { type: 'number', description: 'Total number of test files' },
        totalTestCases: { type: 'number', description: 'Total number of test cases across all files' },
        totalTestSuites: { type: 'number', description: 'Total number of test suites across all files' },
        totalLines: { type: 'number', description: 'Total lines across all files' },
        uniqueApis: {
          type: 'array',
          items: { type: 'string' },
          description: 'Unique API names detected across all files'
        },
        uniqueTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Unique type names detected across all files'
        },
        filesByFramework: {
          type: 'object',
          patternProperties: {
            '^[a-zA-Z0-9-_]+$': { type: 'number' }
          },
          description: 'Number of files by test framework'
        }
      }
    }
  }
} as const;

/**
 * Validation utility functions
 */
export class MetadataValidator {
  static isValidTestFileMetadata(data: any): boolean {
    return (
      data &&
      typeof data.filePath === 'string' &&
      typeof data.fileName === 'string' &&
      typeof data.extractedAt === 'string' &&
      Array.isArray(data.imports) &&
      Array.isArray(data.interfaces) &&
      Array.isArray(data.testSuites) &&
      Array.isArray(data.testCases) &&
      Array.isArray(data.apiUsage) &&
      data.metrics &&
      typeof data.metrics.totalLines === 'number'
    );
  }

  static isValidProjectTestMetadata(data: any): boolean {
    return (
      data &&
      typeof data.projectPath === 'string' &&
      typeof data.extractedAt === 'string' &&
      typeof data.totalFiles === 'number' &&
      Array.isArray(data.files) &&
      data.summary &&
      typeof data.summary.totalTestFiles === 'number' &&
      data.files.every((file: any) => this.isValidTestFileMetadata(file))
    );
  }

  static validateAndThrow(data: any): void {
    if (this.isValidTestFileMetadata(data) || this.isValidProjectTestMetadata(data)) {
      return;
    }
    throw new Error('Invalid metadata format: must be TestFileMetadata or ProjectTestMetadata');
  }
}

/**
 * Type guards for runtime type checking
 */
export function isTestFileMetadata(data: any): data is import('../types/index.js').TestFileMetadata {
  return MetadataValidator.isValidTestFileMetadata(data);
}

export function isProjectTestMetadata(data: any): data is import('../types/index.js').ProjectTestMetadata {
  return MetadataValidator.isValidProjectTestMetadata(data);
}

/**
 * JSON Schema for external tools and validation
 */
export const MetadataJsonSchemas = {
  TestFileMetadata: TestFileMetadataSchema,
  ProjectTestMetadata: ProjectTestMetadataSchema
} as const;