import fs from 'fs/promises';
import path from 'path';
import {
  TestExample,
  ParsedTestData,
  ParserOptions,
  TestMetadata,
  ImportInfo,
  TypeDefinition,
  SetupCode,
  ExampleCategory,
  ComplexityLevel
} from '../types/index.js';

/**
 * Enhanced test parsing with context awareness
 */
export class TestParser {
  private options: ParserOptions;

  constructor(options: Partial<ParserOptions> = {}) {
    this.options = {
      cleanMocks: true,
      extractTypes: true,
      categorizeExamples: true,
      includeComments: false,
      ...options
    };
  }

  /**
   * Parse test file and extract structured information
   */
  async parseTestFile(testFilePath: string, packageName: string): Promise<ParsedTestData> {
    const content = await fs.readFile(testFilePath, 'utf-8');

    const parsed: ParsedTestData = {
      metadata: this.extractMetadata(content, testFilePath),
      imports: this.extractImports(content),
      interfaces: this.extractInterfaces(content),
      setup: this.extractSetup(content),
      examples: this.extractExamples(content),
      packageName,
      filePath: testFilePath
    };

    if (this.options.categorizeExamples) {
      parsed.categorizedExamples = this.categorizeExamples(parsed.examples);
    }

    return parsed;
  }

  /**
   * Extract file metadata and test structure
   */
  private extractMetadata(content: string, filePath: string): TestMetadata {
    const describeMatch = content.match(/describe\s*\(\s*['"`]([^'"`]+)['"`]/);
    const comments = content.match(/\/\*\*([\s\S]*?)\*\//g) || [];

    return {
      fileName: path.basename(filePath),
      mainSuite: describeMatch ? describeMatch[1] : null,
      description: this.extractFileDescription(comments),
      testCount: (content.match(/(?:it|test)\s*\(/g) || []).length,
      tags: this.extractTags(content)
    };
  }

  /**
   * Extract import statements for context
   */
  private extractImports(content: string): ImportInfo[] {
    const importMatches = content.matchAll(/^import\s+(?:\{[^}]*\}|\w+|\*\s+as\s+\w+)?\s*from\s*['"`]([^'"`]+)['"`];?/gm);

    return Array.from(importMatches).map(match => ({
      statement: match[0].trim(),
      module: match[1],
      isLocal: match[1].startsWith('.') || match[1].startsWith('/'),
      isTestUtility: match[1].includes('test') || match[1].includes('jest')
    })).filter(imp => !imp.isTestUtility); // Exclude test utilities
  }

  /**
   * Extract TypeScript interfaces and types
   */
  private extractInterfaces(content: string): TypeDefinition[] {
    const interfaces: TypeDefinition[] = [];

    // Extract interfaces
    const interfaceMatches = content.matchAll(/interface\s+(\w+)\s*(?:extends\s+[^{]*)?\{([^}]+)\}/g);
    for (const match of interfaceMatches) {
      interfaces.push({
        type: 'interface',
        name: match[1],
        body: match[2].trim(),
        fullDefinition: match[0]
      });
    }

    // Extract type aliases
    const typeMatches = content.matchAll(/type\s+(\w+)\s*=\s*([^;]+);/g);
    for (const match of typeMatches) {
      interfaces.push({
        type: 'type',
        name: match[1],
        body: match[2].trim(),
        fullDefinition: match[0]
      });
    }

    return interfaces;
  }

  /**
   * Extract setup code (beforeEach, beforeAll, etc.)
   */
  private extractSetup(content: string): SetupCode[] {
    const setup: SetupCode[] = [];

    const setupMatches = content.matchAll(/(beforeEach|beforeAll|afterEach|afterAll)\s*\(\s*(?:async\s+)?\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*\);/g);

    for (const match of setupMatches) {
      setup.push({
        type: match[1] as any,
        code: this.cleanCode(match[2]),
        isAsync: match[0].includes('async')
      });
    }

    return setup;
  }

  /**
   * Extract test examples with enhanced parsing
   */
  private extractExamples(content: string): TestExample[] {
    const examples: TestExample[] = [];

    // Use a more robust approach to extract test cases
    // First find all test case starts
    const testCaseRegex = /(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{/g;
    let match: RegExpExecArray | null;

    while ((match = testCaseRegex.exec(content)) !== null) {
      const testName = match[1];
      const startPos = match.index + match[0].length;

      // Find the matching closing brace
      let braceCount = 1;
      let endPos = startPos;

      while (braceCount > 0 && endPos < content.length) {
        const char = content[endPos];
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
        endPos++;
      }

      if (braceCount === 0) {
        const testBody = content.substring(startPos, endPos - 1);

        const example: TestExample = {
          description: testName.trim(),
          rawCode: testBody,
          cleanedCode: this.cleanTestCode(testBody),
          category: this.inferCategory(testName, testBody),
          isAsync: match[0].includes('async'),
          apis: this.extractUsedAPIs(testBody),
          complexity: this.assessComplexity(testBody)
        };

        // Only include examples that use our APIs
        if (example.apis.length > 0) {
          examples.push(example);
        }
      }
    }

    return examples;
  }

  /**
   * Clean test code by removing test artifacts
   */
  private cleanTestCode(code: string): string {
    let cleaned = code;

    // Remove expect statements but keep meaningful code
    cleaned = cleaned.replace(
      /expect\([^)]*\)[^;]*;?\s*/g,
      ''
    );

    // Replace jest.fn() with realistic implementations
    cleaned = cleaned.replace(
      /const\s+(\w+)\s*=\s*jest\.fn\(\)/g,
      'const $1 = async (payload) => {\n  // Your implementation here\n  console.log("Action triggered:", payload);\n}'
    );

    // Replace jest.fn implementations with real ones
    cleaned = cleaned.replace(
      /jest\.fn\(\([^)]*\)\s*=>\s*([^}]+)\)/g,
      'async (payload) => $1'
    );

    // Keep setup and meaningful code, remove only test artifacts
    cleaned = cleaned.replace(
      /(console\.log|console\.debug|debugger)[^;]*;?\s*/g,
      ''
    );

    // Keep ActionRegister instantiation and meaningful operations
    const lines = cleaned.split('\n').map(line => line.trim());
    const meaningfulLines = lines.filter(line => {
      if (!line) return false;
      if (line.startsWith('//') && line.includes('Test assertion')) return false;

      // Keep lines that contain meaningful API usage
      return (
        line.includes('new ActionRegister') ||
        line.includes('.register(') ||
        line.includes('.dispatch(') ||
        line.includes('createActionContext') ||
        line.includes('createStoreContext') ||
        line.includes('useStoreValue') ||
        line.includes('interface ') ||
        line.includes('const ') ||
        line.includes('let ') ||
        line.includes('function ') ||
        line.includes('async ') ||
        line.includes('return ') ||
        line.includes('await ') ||
        line.includes('{') ||
        line.includes('}') ||
        line.includes(');') ||
        line.includes('},')
      );
    });

    return meaningfulLines.join('\n');
  }

  /**
   * General code cleaning utility
   */
  private cleanCode(code: string): string {
    return code
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .join('\n');
  }

  /**
   * Infer example category from description and code
   */
  private inferCategory(description: string, code: string): ExampleCategory {
    const desc = description.toLowerCase();

    if (desc.includes('error') || desc.includes('fail') || desc.includes('throw')) {
      return 'error-handling';
    }

    if (desc.includes('performance') || desc.includes('benchmark') || desc.includes('memory')) {
      return 'performance';
    }

    if (desc.includes('integration') || desc.includes('multiple') || desc.includes('complex')) {
      return 'integration';
    }

    if (desc.includes('basic') || desc.includes('simple') || desc.includes('should create')) {
      return 'basic-usage';
    }

    if (desc.includes('advanced') || desc.includes('edge') || desc.includes('custom')) {
      return 'advanced-patterns';
    }

    // Analyze code complexity
    const codeLines = code.split('\n').length;
    const hasAsyncOperations = code.includes('await') || code.includes('Promise');
    const hasMultipleAPIs = (code.match(/\w+Register|\w+Context|\w+Store/g) || []).length > 1;

    if (codeLines > 20 || hasMultipleAPIs) {
      return 'advanced-patterns';
    }

    if (hasAsyncOperations) {
      return 'async-patterns';
    }

    return 'basic-usage';
  }

  /**
   * Extract API names used in the code
   */
  private extractUsedAPIs(code: string): string[] {
    const apis: string[] = [];
    const apiPatterns = [
      /ActionRegister/g,
      /createActionContext/g,
      /createStoreContext/g,
      /useActionHandler/g,
      /useStoreValue/g,
      /useStoreSelector/g,
      /createStore/g,
      /StoreManager/g
    ];

    apiPatterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        const apiName = pattern.source;
        if (!apis.includes(apiName)) {
          apis.push(apiName);
        }
      }
    });

    return apis;
  }

  /**
   * Assess code complexity
   */
  private assessComplexity(code: string): ComplexityLevel {
    const lines = code.split('\n').length;
    const asyncOps = (code.match(/await|Promise/g) || []).length;
    const conditions = (code.match(/if|else|switch|case/g) || []).length;
    const loops = (code.match(/for|while|forEach|map|filter/g) || []).length;

    let score = 0;
    score += Math.min(lines / 10, 3); // Max 3 points for length
    score += asyncOps; // 1 point per async operation
    score += conditions; // 1 point per condition
    score += loops; // 1 point per loop

    if (score <= 2) return 'simple';
    if (score <= 5) return 'moderate';
    return 'complex';
  }

  /**
   * Categorize examples by type and complexity
   */
  private categorizeExamples(examples: TestExample[]): Record<ExampleCategory, TestExample[]> {
    const categories: Record<ExampleCategory, TestExample[]> = {
      'basic-usage': [],
      'advanced-patterns': [],
      'error-handling': [],
      'performance': [],
      'integration': [],
      'async-patterns': []
    };

    examples.forEach(example => {
      const category = example.category || 'basic-usage';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(example);
    });

    // Sort by complexity within each category
    Object.keys(categories).forEach(category => {
      categories[category as ExampleCategory].sort((a, b) => {
        const complexityOrder = { simple: 0, moderate: 1, complex: 2 };
        return complexityOrder[a.complexity] - complexityOrder[b.complexity];
      });
    });

    return categories;
  }

  /**
   * Extract file description from comments
   */
  private extractFileDescription(comments: string[]): string | null {
    if (comments.length === 0) return null;

    const firstComment = comments[0];
    const lines = firstComment.replace(/\/\*\*|\*\/|\*/g, '').split('\n');
    const description = lines
      .map(line => line.trim())
      .filter(line => line)
      .slice(0, 3) // First 3 meaningful lines
      .join(' ');

    return description || null;
  }

  /**
   * Extract tags from test file (e.g., @category, @performance)
   */
  private extractTags(content: string): string[] {
    const tagMatches = content.matchAll(/@(\w+)/g);
    return Array.from(new Set(Array.from(tagMatches).map(match => match[1])));
  }
}