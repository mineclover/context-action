/**
 * Annotation-based test extraction for enhanced documentation generation
 * Integrates the @doc-extract annotation system into test-driven-docs
 */

import { TestExample, ExampleCategory, ComplexityLevel } from '../types/index.js';

export interface DocAnnotation {
  extractId: string;
  category: ExampleCategory | string;
  priority: 'high' | 'medium' | 'low';
  description?: string;
  lineNumber: number;
}

export interface AnnotatedTest {
  annotation: DocAnnotation;
  testName: string;
  testCode: string;
  cleanedCode: string;
  filePath: string;
}

export class AnnotationExtractor {
  /**
   * Extract annotated tests from file content
   */
  extractAnnotatedTests(content: string, filePath: string): AnnotatedTest[] {
    const tests: AnnotatedTest[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Find @doc-extract annotation
      if (line && line.includes('// @doc-extract:')) {
        const extractId = line.split('// @doc-extract:')[1]?.trim() || '';

        // Parse related annotations
        const annotation = this.parseAnnotationBlock(lines, i, extractId);

        // Find the corresponding test
        const testInfo = this.findCorrespondingTest(lines, i);

        if (testInfo) {
          const testCode = this.extractTestCode(content, testInfo.startLine);
          const cleanedCode = this.cleanTestCode(testCode);

          tests.push({
            annotation,
            testName: testInfo.testName,
            testCode,
            cleanedCode,
            filePath
          });
        }
      }
    }

    return tests;
  }

  /**
   * Parse annotation block starting from @doc-extract line
   */
  private parseAnnotationBlock(lines: string[], startLine: number, extractId: string): DocAnnotation {
    const annotation: DocAnnotation = {
      extractId,
      category: 'basic-usage',
      priority: 'medium',
      lineNumber: startLine + 1
    };

    // Parse additional annotations
    let currentLine = startLine + 1;
    while (currentLine < lines.length && lines[currentLine]?.trim().startsWith('//')) {
      const line = lines[currentLine];

      if (line && line.includes('@doc-category:')) {
        const category = line.split('@doc-category:')[1]?.trim() || '';
        annotation.category = this.mapToValidCategory(category);
      } else if (line && line.includes('@doc-priority:')) {
        const priority = line.split('@doc-priority:')[1]?.trim() as 'high' | 'medium' | 'low';
        if (priority) annotation.priority = priority;
      } else if (line && line.includes('@doc-description:')) {
        const description = line.split('@doc-description:')[1]?.trim();
        if (description) annotation.description = description;
      }

      currentLine++;
    }

    return annotation;
  }

  /**
   * Find the test case that follows the annotation
   */
  private findCorrespondingTest(lines: string[], startLine: number): { testName: string; startLine: number } | null {
    let currentLine = startLine + 1;

    // Skip annotation lines
    while (currentLine < lines.length && lines[currentLine].trim().startsWith('//')) {
      currentLine++;
    }

    // Skip empty lines
    while (currentLine < lines.length && !lines[currentLine].trim()) {
      currentLine++;
    }

    // Find it() function
    while (currentLine < lines.length && !lines[currentLine].trim().startsWith("it('")) {
      currentLine++;
    }

    if (currentLine < lines.length && lines[currentLine]) {
      const testNameMatch = lines[currentLine].match(/it\('([^']+)'/);
      if (testNameMatch && testNameMatch[1]) {
        return {
          testName: testNameMatch[1],
          startLine: currentLine
        };
      }
    }

    return null;
  }

  /**
   * Extract the complete test code block
   */
  private extractTestCode(content: string, startLine: number): string {
    const lines = content.split('\n');
    const testLineContent = lines[startLine];

    // Find the start of the test code
    const testStart = content.indexOf(testLineContent);

    // Find the matching brace for the test function
    const braceStart = testStart + testLineContent.indexOf('{');
    const braceEnd = this.findMatchingBrace(content, braceStart);

    return content.substring(testStart, braceEnd + 1);
  }

  /**
   * Find matching closing brace
   */
  private findMatchingBrace(content: string, startIndex: number): number {
    let braceCount = 1;
    let index = startIndex + 1;

    while (index < content.length && braceCount > 0) {
      if (content[index] === '{') braceCount++;
      else if (content[index] === '}') braceCount--;
      index++;
    }

    return index - 1;
  }

  /**
   * Map category to valid category type
   */
  private mapToValidCategory(category: string): ExampleCategory {
    const categoryMap: Record<string, ExampleCategory> = {
      'getting-started': 'basic-usage',
      'basic': 'basic-usage',
      'advanced': 'advanced-patterns',
      'patterns': 'advanced-patterns',
      'performance': 'performance',
      'errors': 'error-handling',
      'integration': 'integration',
      'async': 'async-patterns'
    };

    return categoryMap[category] || 'basic-usage';
  }

  // New method for the updated API
  extractAnnotations(content: string): { annotations: DocAnnotation[]; errors: string[] } {
    const annotations: DocAnnotation[] = [];
    const errors: string[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line && line.includes('// @doc-extract:')) {
        try {
          const extractId = line.split('// @doc-extract:')[1]?.trim() || '';
          if (extractId) {
            const annotation = this.parseAnnotationBlock(lines, i, extractId);
            annotations.push(annotation);
          }
        } catch (error) {
          errors.push(`Failed to parse annotation at line ${i + 1}: ${error}`);
        }
      }
    }

    return { annotations, errors };
  }

  extractTestsWithAnnotations(content: string): { tests: AnnotatedTest[]; errors: string[] } {
    const tests: AnnotatedTest[] = [];
    const errors: string[] = [];

    try {
      const extractedTests = this.extractAnnotatedTests(content, 'test-file');
      tests.push(...extractedTests);
    } catch (error) {
      errors.push(`Failed to extract tests: ${error}`);
    }

    return { tests, errors };
  }

  /**
   * Clean test code for documentation
   */
  private cleanTestCode(testCode: string): string {
    // Extract the test function body
    const match = testCode.match(/it\([^,]+,\s*(?:async\s+)?\(\)\s*=>\s*\{([\s\S]*)\}\);?$/);
    if (!match || !match[1]) return testCode;

    let code = match[1];

    // Remove test-specific artifacts
    code = code.replace(/\/\/ @doc-extract:.*\n/g, '');
    code = code.replace(/expect\([^)]*\)[^;]*;?\n?/g, '');
    code = code.replace(/const\s+{\s*[^}]*\s*}\s*=\s*render\([^)]*\);?\n?/g, '');
    code = code.replace(/fireEvent\.[^;]*;?\n?/g, '');
    code = code.replace(/await\s+waitFor\([^}]*}\);?\n?/g, '');
    code = code.replace(/\/\/ Track handler calls.*\n/g, '');
    code = code.replace(/const handlerCalls.*\n/g, '');
    code = code.replace(/handlerCalls\.push.*\n/g, '');

    // Normalize indentation
    const lines = code.split('\n');
    const minIndent = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^\s*/)?.[0].length || 0));
    const cleanLines = lines.map(l => l.substring(minIndent)).filter(l => l.trim());

    return cleanLines.join('\n');
  }


  /**
   * Convert AnnotatedTest to TestExample format
   */
  convertToTestExample(annotatedTest: AnnotatedTest): TestExample {
    return {
      description: annotatedTest.annotation.description || annotatedTest.testName,
      rawCode: annotatedTest.testCode,
      cleanedCode: annotatedTest.cleanedCode,
      category: annotatedTest.annotation.category as ExampleCategory,
      isAsync: annotatedTest.testCode.includes('async'),
      apis: this.extractApiUsage(annotatedTest.cleanedCode),
      complexity: this.calculateComplexity(annotatedTest.cleanedCode)
    };
  }

  /**
   * Extract API usage from cleaned code
   */
  private extractApiUsage(code: string): string[] {
    const apis: string[] = [];

    // Common API patterns
    const patterns = [
      /\b(create\w+Context)\b/g,
      /\b(use\w+)\b/g,
      /\b(Provider)\b/g,
      /\b(dispatch)\b/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        if (!apis.includes(match[1])) {
          apis.push(match[1]);
        }
      }
    }

    return apis;
  }

  /**
   * Calculate complexity level based on code characteristics
   */
  private calculateComplexity(code: string): ComplexityLevel {
    let score = 0;

    // Complexity indicators
    if (code.includes('useCallback')) score += 1;
    if (code.includes('async')) score += 1;
    if (code.includes('interface')) score += 1;
    if (code.includes('priority')) score += 2;
    if (code.includes('error') || code.includes('catch')) score += 2;
    if (code.split('\n').length > 20) score += 1;

    if (score >= 4) return 'complex';
    if (score >= 2) return 'moderate';
    return 'simple';
  }

  /**
   * Get priority score for sorting
   */
  getPriorityScore(priority: 'high' | 'medium' | 'low'): number {
    const scores = { high: 100, medium: 200, low: 300 };
    return scores[priority];
  }
}