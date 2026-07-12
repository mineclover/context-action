/**
 * Consistency Validator
 * Validates test-documentation consistency and synchronization
 */

import fs from 'fs/promises';
import path from 'path';
import { AnnotatedTest } from '../extractors/AnnotationExtractor.js';

export interface ValidationResult {
  isValid: boolean;
  status: 'synced' | 'outdated' | 'missing' | 'partial' | 'error';
  message: string;
  action?: string;
  details?: any;
}

export interface ApiValidationResult {
  apiName: string;
  testFile: string;
  docFile: string;
  mapping: ValidationResult;
  examples: ExampleValidationResult[];
  overallScore: number;
}

export interface ExampleValidationResult {
  description: string;
  syntaxValid: boolean;
  importsResolvable: boolean;
  executionScore: number;
  issues: string[];
}

export interface ValidationIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  description: string;
  api?: string;
  file?: string;
  recommendation?: string;
}

export interface ValidationRecommendation {
  type: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ProjectValidationReport {
  overallScore: number;
  syncStatus: string;
  issues: ValidationIssue[];
  recommendations: string[];
  apiCoverage: {
    total: number;
    documented: number;
    percentage: number;
    missing: string[];
  };
  lastValidated: string;
  timestamp: string;
  apiValidations: ApiValidationResult[];
  summary: {
    totalApis: number;
    syncedApis: number;
    outdatedApis: number;
    missingApis: number;
    averageScore: number;
  };
}

export class ConsistencyValidator {
  private config: {
    packagesDir: string;
    packages: string[];
  };
  private testDir: string;
  private docsDir: string;

  constructor(config: { packagesDir: string; packages: string[] } | string, docsDir = './docs') {
    if (typeof config === 'string') {
      this.config = { packagesDir: config, packages: [] };
      this.testDir = config;
      this.docsDir = docsDir;
    } else {
      this.config = config;
      this.testDir = config.packagesDir;
      this.docsDir = docsDir;
    }
  }

  // New methods for the enhanced API
  createValidationReport(): ProjectValidationReport {
    return {
      overallScore: 100,
      syncStatus: 'perfect',
      issues: [],
      recommendations: [],
      apiCoverage: {
        total: 0,
        documented: 0,
        percentage: 100,
        missing: []
      },
      lastValidated: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      apiValidations: [],
      summary: {
        totalApis: 0,
        syncedApis: 0,
        outdatedApis: 0,
        missingApis: 0,
        averageScore: 100
      }
    };
  }

  calculateOverallScore(issues: ValidationIssue[]): number {
    if (issues.length === 0) return 100;

    const errorWeight = 20;
    const warningWeight = 10;
    const infoWeight = 5;

    const totalDeduction = issues.reduce((total, issue) => {
      switch (issue.severity) {
        case 'error': return total + errorWeight;
        case 'warning': return total + warningWeight;
        case 'info': return total + infoWeight;
        default: return total;
      }
    }, 0);

    return Math.max(0, 100 - totalDeduction);
  }

  detectMissingDocumentation(apiNames: string[], documentedApis: string[]): ValidationIssue[] {
    const missing = apiNames.filter(api => !documentedApis.includes(api));

    return missing.map(api => ({
      type: 'missing-documentation',
      severity: 'warning' as const,
      description: `API ${api} is not documented`,
      api,
      recommendation: `Add @doc-extract annotation to tests for ${api}`
    }));
  }

  isDocumentationOutdated(lastModified: Date, docsGenerated: Date): boolean {
    return lastModified > docsGenerated;
  }

  generateRecommendations(issues: ValidationIssue[]): string[] {
    return issues.map(issue => {
      if (issue.api) {
        switch (issue.type) {
          case 'missing-examples':
            return `Add @doc-extract annotations to ${issue.api} tests`;
          case 'outdated-docs':
            return `Update documentation for ${issue.api}`;
          default:
            return `Review ${issue.api}: ${issue.description}`;
        }
      }
      return `Review and address: ${issue.description}`;
    });
  }

  determineSyncStatus(score: number): string {
    if (score >= 95) return 'perfect';
    if (score >= 80) return 'good';
    if (score >= 60) return 'needs-attention';
    return 'poor';
  }

  analyzeApiCoverage(apis: string[], documented: string[]): {
    total: number;
    documented: number;
    percentage: number;
    missing: string[];
  } {
    const total = apis.length;
    const documentedCount = documented.length;
    const percentage = total === 0 ? 100 : Math.round((documentedCount / total) * 100);
    const missing = apis.filter(api => !documented.includes(api));

    return {
      total,
      documented: documentedCount,
      percentage,
      missing
    };
  }

  /**
   * Validate entire project consistency
   */
  async validateProject(): Promise<ProjectValidationReport> {
    const apiValidations: ApiValidationResult[] = [];

    // Find all usage test files
    const testFiles = await this.findUsageTestFiles();

    for (const testFile of testFiles) {
      const apiName = this.extractApiName(testFile);
      const validation = await this.validateApi(apiName, testFile);
      apiValidations.push(validation);
    }

    const summary = this.calculateSummary(apiValidations);
    const recommendations = this.generateLegacyRecommendations(apiValidations);

    return {
      overallScore: summary.averageScore,
      syncStatus: this.determineSyncStatus(summary.averageScore),
      issues: [],
      recommendations,
      apiCoverage: {
        total: summary.totalApis,
        documented: summary.syncedApis,
        percentage: summary.totalApis > 0 ? Math.round((summary.syncedApis / summary.totalApis) * 100) : 100,
        missing: []
      },
      lastValidated: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      apiValidations,
      summary
    };
  }



  /**
   * Validate specific API consistency
   */
  async validateApi(apiName: string, testFile: string): Promise<ApiValidationResult> {
    const docFile = path.join(this.docsDir, `${apiName}.enhanced.md`);

    // Validate test-doc mapping
    const mapping = await this.validateMapping(testFile, docFile);

    // Validate examples if documentation exists
    let examples: ExampleValidationResult[] = [];
    let overallScore = 0;

    if (mapping.status !== 'missing') {
      try {
        const docContent = await fs.readFile(docFile, 'utf8');
        examples = await this.validateExamples(docContent);
        // Use the public method for calculating overall score
        overallScore = 100; // Default score, to be improved
      } catch (error) {
        // Document exists but can't be read
        mapping.status = 'error';
        mapping.message = `Cannot read documentation file: ${error}`;
      }
    }

    return {
      apiName,
      testFile,
      docFile,
      mapping,
      examples,
      overallScore
    };
  }

  /**
   * Validate test-documentation mapping
   */
  private async validateMapping(testFile: string, docFile: string): Promise<ValidationResult> {
    try {
      // Check if files exist
      const testExists = await this.fileExists(testFile);
      const docExists = await this.fileExists(docFile);

      if (!testExists) {
        return {
          isValid: false,
          status: 'error',
          message: 'Test file does not exist',
          action: 'Check test file path'
        };
      }

      if (!docExists) {
        return {
          isValid: false,
          status: 'missing',
          message: 'Documentation file does not exist',
          action: 'Run npx @context-action/test-driven-docs generate --enhanced'
        };
      }

      // Check modification times
      const testStat = await fs.stat(testFile);
      const docStat = await fs.stat(docFile);

      if (testStat.mtime > docStat.mtime) {
        return {
          isValid: false,
          status: 'outdated',
          message: 'Test file is newer than documentation',
          action: 'Re-generate documentation from tests',
          details: {
            testModified: testStat.mtime.toISOString(),
            docModified: docStat.mtime.toISOString()
          }
        };
      }

      // Check annotation synchronization
      const testContent = await fs.readFile(testFile, 'utf8');
      const docContent = await fs.readFile(docFile, 'utf8');

      const annotations = this.extractAnnotations(testContent);
      const annotationsSynced = annotations.every(ann =>
        docContent.includes(ann.extractId)
      );

      if (!annotationsSynced) {
        return {
          isValid: false,
          status: 'partial',
          message: 'Some annotations not reflected in documentation',
          action: 'Re-generate documentation from tests',
          details: {
            totalAnnotations: annotations.length,
            missingAnnotations: annotations.filter(ann => !docContent.includes(ann.extractId))
          }
        };
      }

      return {
        isValid: true,
        status: 'synced',
        message: 'Documentation is up to date'
      };

    } catch (error) {
      return {
        isValid: false,
        status: 'error',
        message: `Validation error: ${error}`,
        action: 'Check file permissions and paths'
      };
    }
  }

  /**
   * Validate documentation examples
   */
  private async validateExamples(docContent: string): Promise<ExampleValidationResult[]> {
    const codeBlocks = this.extractCodeBlocks(docContent);
    const results: ExampleValidationResult[] = [];

    for (let i = 0; i < codeBlocks.length; i++) {
      const code = codeBlocks[i];
      const description = `Example ${i + 1}`;

      const syntaxValidation = this.validateSyntax(code);
      const importsValidation = this.validateImports(code);
      const executionScore = this.calculateExecutionScore(code);

      results.push({
        description,
        syntaxValid: syntaxValidation.valid,
        importsResolvable: importsValidation.score > 0.8,
        executionScore,
        issues: [
          ...syntaxValidation.issues,
          ...importsValidation.issues
        ]
      });
    }

    return results;
  }

  /**
   * Extract code blocks from markdown
   */
  private extractCodeBlocks(content: string): string[] {
    const codeBlocks: string[] = [];
    const regex = /```typescript\n([\s\S]*?)\n```/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      codeBlocks.push(match[1]);
    }

    return codeBlocks;
  }

  /**
   * Validate code syntax
   */
  private validateSyntax(code: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check bracket balance
    const brackets = { '(': 0, '[': 0, '{': 0 };
    for (const char of code) {
      if (char === '(') brackets['(']++;
      else if (char === ')') brackets['(']--;
      else if (char === '[') brackets['[']++;
      else if (char === ']') brackets['[']--;
      else if (char === '{') brackets['{']++;
      else if (char === '}') brackets['{']--;
    }

    Object.entries(brackets).forEach(([bracket, count]) => {
      if (count !== 0) {
        issues.push(`Unbalanced ${bracket} brackets`);
      }
    });

    // Check for basic syntax issues
    if (code.includes('function') && !code.includes('{')) {
      issues.push('Function declaration without body');
    }

    if (code.includes('const') && !code.includes('=')) {
      issues.push('Const declaration without assignment');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Validate imports
   */
  private validateImports(code: string): { score: number; issues: string[] } {
    const imports = code.match(/import .* from ['"](.*)['"]/g) || [];
    const resolvable: string[] = [];
    const unresolvable: string[] = [];
    const issues: string[] = [];

    for (const importLine of imports) {
      const match = importLine.match(/from ['"](.*)['"]/);
      if (match) {
        const importPath = match[1];

        if (importPath.startsWith('.') ||
            importPath.startsWith('@context-action/') ||
            importPath === 'react' ||
            importPath.startsWith('@testing-library/')) {
          resolvable.push(importPath);
        } else {
          unresolvable.push(importPath);
          issues.push(`Unresolvable import: ${importPath}`);
        }
      }
    }

    const score = resolvable.length / (resolvable.length + unresolvable.length) || 1;

    return { score, issues };
  }

  /**
   * Calculate execution score
   */
  private calculateExecutionScore(code: string): number {
    let score = 100;

    // Deduct points for test artifacts
    if (code.includes('expect(') || code.includes('assert')) {
      score -= 30;
    }

    if (code.includes('render(') || code.includes('fireEvent')) {
      score -= 20;
    }

    if (code.includes('mock') || code.includes('spy')) {
      score -= 20;
    }

    // Deduct for type safety issues
    if (code.includes(': any') || code.includes('any[]')) {
      score -= 10;
    }

    // Deduct for missing imports
    if (!code.includes('import') &&
        (code.includes('createActionContext') ||
         code.includes('useStoreValue') ||
         code.includes('createStoreContext'))) {
      score -= 15;
    }

    return Math.max(score, 0);
  }

  /**
   * Extract annotations from test content
   */
  private extractAnnotations(content: string): Array<{ extractId: string; lineNumber: number }> {
    const annotations: Array<{ extractId: string; lineNumber: number }> = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('// @doc-extract:')) {
        const extractId = lines[i].split('// @doc-extract:')[1].trim();
        annotations.push({ extractId, lineNumber: i + 1 });
      }
    }

    return annotations;
  }


  /**
   * Calculate project summary
   */
  private calculateSummary(validations: ApiValidationResult[]) {
    const totalApis = validations.length;
    const syncedApis = validations.filter(v => v.mapping.status === 'synced').length;
    const outdatedApis = validations.filter(v => v.mapping.status === 'outdated').length;
    const missingApis = validations.filter(v => v.mapping.status === 'missing').length;
    const averageScore = validations.length > 0 ?
      Math.round(validations.reduce((sum, v) => sum + v.overallScore, 0) / validations.length) : 0;

    return {
      totalApis,
      syncedApis,
      outdatedApis,
      missingApis,
      averageScore
    };
  }

  /**
   * Generate recommendations for legacy compatibility
   */
  private generateLegacyRecommendations(validations: ApiValidationResult[]): string[] {
    const recommendations: string[] = [];

    const outdated = validations.filter(v => v.mapping.status === 'outdated');
    const missing = validations.filter(v => v.mapping.status === 'missing');
    const lowScore = validations.filter(v => v.overallScore < 70);

    if (outdated.length > 0) {
      recommendations.push(
        `🔄 Re-generate documentation for ${outdated.length} outdated APIs: ${outdated.map(v => v.apiName).join(', ')}`
      );
    }

    if (missing.length > 0) {
      recommendations.push(
        `📝 Create documentation for ${missing.length} missing APIs: ${missing.map(v => v.apiName).join(', ')}`
      );
    }

    if (lowScore.length > 0) {
      recommendations.push(
        `⚠️ Improve example quality for ${lowScore.length} APIs with low scores: ${lowScore.map(v => `${v.apiName} (${v.overallScore}%)`).join(', ')}`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All documentation is up to date and high quality!');
    }

    return recommendations;
  }

  /**
   * Utility functions
   */
  private async findUsageTestFiles(): Promise<string[]> {
    const files: string[] = [];

    const walkDir = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            await walkDir(fullPath);
          } else if (entry.name.endsWith('.usage.test.tsx')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Directory doesn't exist or can't be read
      }
    };

    await walkDir(this.testDir);
    return files;
  }

  private extractApiName(testFile: string): string {
    return path.basename(testFile).replace(/\.usage\.test\.tsx$/, '');
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

}
