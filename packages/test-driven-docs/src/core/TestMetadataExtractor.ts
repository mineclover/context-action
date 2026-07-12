import fs from 'fs/promises';
import path from 'path';

/**
 * Simple test metadata extractor that focuses on reliable data extraction
 * without complex processing or document generation
 */
export class TestMetadataExtractor {

  /**
   * Extract metadata from a single test file
   */
  async extractFromFile(filePath: string): Promise<TestFileMetadata> {
    const content = await fs.readFile(filePath, 'utf-8');

    return {
      filePath: path.resolve(filePath),
      fileName: path.basename(filePath),
      extractedAt: new Date().toISOString(),

      // File-level metadata
      imports: this.extractImports(content),
      interfaces: this.extractTypeDefinitions(content),

      // Test structure
      testSuites: this.extractTestSuites(content),
      testCases: this.extractTestCases(content),

      // API usage detection
      apiUsage: this.detectApiUsage(content),

      // Basic metrics
      metrics: this.calculateMetrics(content)
    };
  }

  /**
   * Extract metadata from multiple test files
   */
  async extractFromDirectory(dirPath: string, pattern: RegExp = /\.test\.(ts|js)$/): Promise<ProjectTestMetadata> {
    const testFiles: TestFileMetadata[] = [];

    const scanDir = async (currentPath: string): Promise<void> => {
      let entries;
      try {
        entries = await fs.readdir(currentPath, { withFileTypes: true });
      } catch (error) {
        if (currentPath === dirPath) throw error;
        return;
      }

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if ((typeof entry.isFile === 'function' ? entry.isFile() : true) && pattern.test(entry.name)) {
          try {
            const metadata = await this.extractFromFile(fullPath);
            testFiles.push(metadata);
          } catch (error) {
            console.warn(`Failed to extract from ${fullPath}:`, error);
          }
        }
      }
    };

    await scanDir(dirPath);

    return {
      projectPath: path.resolve(dirPath),
      extractedAt: new Date().toISOString(),
      totalFiles: testFiles.length,
      files: testFiles,

      // Aggregated data
      summary: this.aggregateMetadata(testFiles)
    };
  }

  /**
   * Extract import statements
   */
  private extractImports(content: string): ImportInfo[] {
    const imports: ImportInfo[] = [];
    const importRegex = /import\s+(?:type\s+)?(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"`]([^'"`]+)['"`]/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const modulePath = match[1];
      imports.push({
        module: modulePath,
        isLocal: modulePath.startsWith('.') || modulePath.startsWith('/'),
        isTestFramework: /jest|vitest|@testing-library/.test(modulePath),
        statement: match[0].trim()
      });
    }

    return imports;
  }

  /**
   * Extract TypeScript type definitions
   */
  private extractTypeDefinitions(content: string): TypeDefinition[] {
    const types: TypeDefinition[] = [];

    // Extract interfaces
    const interfaceRegex = /interface\s+(\w+)(?:\s+extends\s+[^{]*)?\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/g;
    let match;
    while ((match = interfaceRegex.exec(content)) !== null) {
      types.push({
        type: 'interface',
        name: match[1],
        definition: match[0].trim()
      });
    }

    // Extract type aliases
    const typeRegex = /type\s+(\w+)\s*=\s*([^;]+);/g;
    while ((match = typeRegex.exec(content)) !== null) {
      types.push({
        type: 'type',
        name: match[1],
        definition: match[0].trim()
      });
    }

    return types;
  }

  /**
   * Extract test suites (describe blocks)
   */
  private extractTestSuites(content: string): TestSuite[] {
    const suites: TestSuite[] = [];
    const suiteRegex = /describe\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\(\s*\)\s*=>\s*{/g;

    let match;
    while ((match = suiteRegex.exec(content)) !== null) {
      suites.push({
        name: match[1],
        startIndex: match.index
      });
    }

    return suites;
  }

  /**
   * Extract test cases (it/test blocks)
   */
  private extractTestCases(content: string): TestCase[] {
    const testCases: TestCase[] = [];
    const testRegex = /(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:async\s+)?\([^)]*\)\s*=>\s*{/g;

    let match;
    while ((match = testRegex.exec(content)) !== null) {
      const startIndex = match.index;
      const testBody = this.extractTestBody(content, startIndex + match[0].length);

      testCases.push({
        description: match[1],
        startIndex,
        isAsync: match[0].includes('async'),
        bodyLength: testBody.length,
        apiCalls: this.extractApiCalls(testBody),
        hasAssertions: this.hasAssertions(testBody)
      });
    }

    return testCases;
  }

  /**
   * Extract test body content
   */
  private extractTestBody(content: string, startIndex: number): string {
    let braceCount = 1;
    let index = startIndex;

    while (braceCount > 0 && index < content.length) {
      const char = content[index];
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      index++;
    }

    return content.substring(startIndex, index - 1);
  }

  /**
   * Detect API usage patterns
   */
  private detectApiUsage(content: string): ApiUsage[] {
    const apiPatterns = [
      { name: 'ActionRegister', pattern: /new\s+ActionRegister|ActionRegister\s*</ },
      { name: 'createActionContext', pattern: /createActionContext\s*<|createActionContext\s*\(/ },
      { name: 'createStoreContext', pattern: /createStoreContext\s*\(/ },
      { name: 'useStoreValue', pattern: /useStoreValue\s*\(/ },
      { name: 'useStoreSelector', pattern: /useStoreSelector\s*\(/ },
      { name: 'createStore', pattern: /createStore\s*\(/ },
      { name: 'useActionHandler', pattern: /useActionHandler\s*\(/ },
      { name: 'dispatch', pattern: /\.dispatch\s*\(/ },
      { name: 'register', pattern: /\.register\s*\(/ }
    ];

    const usage: ApiUsage[] = [];

    for (const api of apiPatterns) {
      const matches = content.match(api.pattern);
      if (matches) {
        usage.push({
          apiName: api.name,
          occurrences: matches.length,
          pattern: api.pattern.source
        });
      }
    }

    return usage;
  }

  /**
   * Extract API calls from test body
   */
  private extractApiCalls(testBody: string): string[] {
    const calls: string[] = [];
    const callPatterns = [
      /(\w+)\.register\s*\(/g,
      /(\w+)\.dispatch\s*\(/g,
      /new\s+(\w+)\s*\(/g,
      /(use\w+)\s*\(/g,
      /(create\w+)\s*\(/g
    ];

    for (const pattern of callPatterns) {
      let match;
      while ((match = pattern.exec(testBody)) !== null) {
        calls.push(match[1] || match[0]);
      }
    }

    return [...new Set(calls)]; // Remove duplicates
  }

  /**
   * Check if test has assertions
   */
  private hasAssertions(testBody: string): boolean {
    return /expect\s*\(/.test(testBody) ||
           /assert\s*\(/.test(testBody) ||
           /\.toBe\(|\.toEqual\(|\.toHaveBeenCalled/.test(testBody);
  }

  /**
   * Calculate basic metrics
   */
  private calculateMetrics(content: string): FileMetrics {
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim()).length;

    return {
      totalLines: lines.length,
      nonEmptyLines,
      testCount: (content.match(/(?:it|test)\s*\(/g) || []).length,
      suiteCount: (content.match(/describe\s*\(/g) || []).length,
      importCount: (content.match(/import\s+/g) || []).length,
      typeDefinitionCount: (content.match(/(?:interface|type)\s+\w+/g) || []).length
    };
  }

  /**
   * Aggregate metadata from multiple files
   */
  private aggregateMetadata(files: TestFileMetadata[]): ProjectSummary {
    const allApis = new Set<string>();
    const allTypes = new Set<string>();

    let totalTests = 0;
    let totalSuites = 0;
    let totalLines = 0;

    for (const file of files) {
      totalTests += file.metrics.testCount;
      totalSuites += file.metrics.suiteCount;
      totalLines += file.metrics.totalLines;

      file.apiUsage.forEach(api => allApis.add(api.apiName));
      file.interfaces.forEach(type => allTypes.add(type.name));
    }

    return {
      totalTestFiles: files.length,
      totalTestCases: totalTests,
      totalTestSuites: totalSuites,
      totalLines,
      uniqueApis: Array.from(allApis),
      uniqueTypes: Array.from(allTypes),
      filesByFramework: this.groupFilesByFramework(files)
    };
  }

  /**
   * Group files by test framework
   */
  private groupFilesByFramework(files: TestFileMetadata[]): Record<string, number> {
    const frameworks: Record<string, number> = {};

    for (const file of files) {
      let framework = 'unknown';

      if (file.imports.some(imp => imp.module.includes('jest'))) {
        framework = 'jest';
      } else if (file.imports.some(imp => imp.module.includes('vitest'))) {
        framework = 'vitest';
      } else if (file.imports.some(imp => imp.module.includes('@testing-library'))) {
        framework = 'testing-library';
      }

      frameworks[framework] = (frameworks[framework] || 0) + 1;
    }

    return frameworks;
  }
}

// Type definitions for extracted metadata
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
