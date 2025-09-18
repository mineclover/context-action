import fs from 'fs/promises';
import path from 'path';
import { TestParser } from '../parsers/TestParser.js';
import { CodeCleaner } from '../cleaners/CodeCleaner.js';
import {
  GeneratorConfig,
  ParsedTestData,
  ApiDocumentationData,
  GenerationResult,
  GenerationError,
  ExampleCategory
} from '../types/index.js';

/**
 * Core documentation generator that orchestrates the entire process
 */
export class DocumentationGenerator {
  private config: GeneratorConfig;
  private parser: TestParser;
  private cleaner: CodeCleaner;

  constructor(config: GeneratorConfig) {
    this.config = config;
    this.parser = new TestParser({
      cleanMocks: config.cleanMocks,
      extractTypes: config.extractTypes,
      categorizeExamples: config.categorizeExamples,
      includeComments: config.includeComments
    });
    this.cleaner = new CodeCleaner({
      removeComments: true,
      removeTestArtifacts: true,
      formatCode: true,
      realistic: config.realistic
    });
  }

  /**
   * Generate documentation for all configured packages
   */
  async generate(): Promise<GenerationResult> {
    const result: GenerationResult = {
      success: false,
      apisGenerated: [],
      filesProcessed: 0,
      categoriesCovered: 0,
      errors: []
    };

    try {
      console.log('🔍 Enhanced test-based API documentation generation starting...');

      // Scan all packages for test data
      const allTestData: ParsedTestData[] = [];

      for (const packageName of this.config.packages) {
        console.log(`📋 Scanning ${packageName} package...`);
        const packageTestData = await this.scanPackageTests(packageName);
        console.log(`  Found ${packageTestData.length} test files with examples`);
        allTestData.push(...packageTestData);
      }

      result.filesProcessed = allTestData.length;

      // Group test data by API
      const groupedData = this.groupTestDataByApi(allTestData);
      const discoveredAPIs = Object.keys(groupedData);

      console.log(`📚 Discovered APIs: ${discoveredAPIs.join(', ')}`);

      // Generate documentation for each API
      for (const [apiName, apiData] of Object.entries(groupedData)) {
        try {
          console.log(`📝 Generating documentation for ${apiName}...`);

          // Generate for each configured language
          for (const language of this.config.languages) {
            const documentation = await this.generateApiDocumentation(apiName, apiData, language);
            const outputPath = path.join(this.config.outputDir, language, 'api', `${apiName.toLowerCase()}.md`);

            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, documentation);
          }

          console.log(`  ✅ ${apiName} documentation generated`);
          result.apisGenerated.push(apiName);
        } catch (error) {
          const generationError: GenerationError = {
            type: 'templating',
            message: error instanceof Error ? error.message : 'Unknown error',
            api: apiName
          };
          result.errors.push(generationError);
          console.error(`  ❌ Failed to generate ${apiName} documentation:`, generationError.message);
        }
      }

      // Calculate categories covered
      const allCategories = new Set<ExampleCategory>();
      Object.values(groupedData).forEach(apiData => {
        Object.keys(apiData.categorizedExamples).forEach(category => {
          allCategories.add(category as ExampleCategory);
        });
      });
      result.categoriesCovered = allCategories.size;

      // Generate summary report
      console.log('\\n📊 Generation Summary:');
      console.log(`  📝 Total APIs documented: ${result.apisGenerated.length}`);
      console.log(`  📁 Test files processed: ${result.filesProcessed}`);
      console.log(`  🎯 Categories covered: ${result.categoriesCovered}`);

      if (result.apisGenerated.length > 0) {
        console.log('\\n🎉 Enhanced API documentation generation completed successfully!');
        result.success = true;
      } else {
        console.log('\\n⚠️  No API documentation was generated. Check test files and API patterns.');
      }

    } catch (error) {
      const generationError: GenerationError = {
        type: 'file-io',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      result.errors.push(generationError);
      console.error('❌ Documentation generation failed:', generationError.message);
    }

    return result;
  }

  /**
   * Scan all test files in a package
   */
  private async scanPackageTests(packageName: string): Promise<ParsedTestData[]> {
    const packagePath = path.join(this.config.packagesDir, packageName);
    const testDir = path.join(packagePath, '__tests__');

    try {
      const testResults: ParsedTestData[] = [];
      const files = await this.getAllTestFiles(testDir);

      for (const file of files) {
        const testFilePath = path.join(testDir, file);
        console.log(`  📁 Scanning ${file}...`);

        try {
          const testData = await this.parser.parseTestFile(testFilePath, packageName);

          // Enhance examples with code cleaning
          if (testData.categorizedExamples) {
            Object.keys(testData.categorizedExamples).forEach(category => {
              testData.categorizedExamples![category as ExampleCategory] =
                testData.categorizedExamples![category as ExampleCategory].map(example => ({
                  ...example,
                  cleanedCode: this.cleaner.cleanCode(example.cleanedCode, { category }),
                }));
            });
          }

          if (testData.examples && testData.examples.length > 0) {
            testResults.push(testData);
          }
        } catch (error) {
          const parseError: GenerationError = {
            type: 'parsing',
            message: error instanceof Error ? error.message : 'Unknown parsing error',
            file: testFilePath
          };
          console.warn(`⚠️  Failed to parse ${testFilePath}:`, parseError.message);
        }
      }

      return testResults;
    } catch (error) {
      console.log(`⚠️  No test directory found for ${packageName}`);
      return [];
    }
  }

  /**
   * Get all test files recursively
   */
  private async getAllTestFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    async function scanDir(currentDir: string, relativePath = ''): Promise<void> {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativeEntryPath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          await scanDir(fullPath, relativeEntryPath);
        } else if (entry.isFile() && (entry.name.endsWith('.test.ts') || entry.name.endsWith('.spec.ts'))) {
          files.push(relativeEntryPath);
        }
      }
    }

    await scanDir(dir);
    return files;
  }

  /**
   * Group test results by API
   */
  private groupTestDataByApi(testResults: ParsedTestData[]): Record<string, ApiDocumentationData> {
    const grouped: Record<string, ApiDocumentationData> = {};

    testResults.forEach(testData => {
      if (!testData.categorizedExamples) return;

      // Check all examples across all categories for API usage
      Object.values(testData.categorizedExamples).flat().forEach(example => {
        if (example.apis && example.apis.length > 0) {
          example.apis.forEach(api => {
            if (!grouped[api]) {
              grouped[api] = {
                categorizedExamples: {},
                allTestData: [],
                metadata: { testCount: 0, packageNames: [], fileCount: 0 },
                packageName: testData.packageName
              };
            }

            // Add to categorized examples
            const category = example.category || 'basic-usage';
            if (!grouped[api].categorizedExamples[category]) {
              grouped[api].categorizedExamples[category] = [];
            }
            grouped[api].categorizedExamples[category].push(example);

            // Track test data
            if (!grouped[api].allTestData.find(td => td.filePath === testData.filePath)) {
              grouped[api].allTestData.push(testData);
              grouped[api].metadata.testCount += testData.metadata.testCount || 0;
              grouped[api].metadata.fileCount += 1;

              if (!grouped[api].metadata.packageNames.includes(testData.packageName)) {
                grouped[api].metadata.packageNames.push(testData.packageName);
              }
            }
          });
        }
      });
    });

    return grouped;
  }

  /**
   * Generate API documentation for a specific language
   */
  private async generateApiDocumentation(
    apiName: string,
    apiData: ApiDocumentationData,
    language: string
  ): Promise<string> {
    // This is a placeholder - in a real implementation, we'd load the appropriate template
    // For now, we'll use a simple template similar to the enhanced template
    return this.generateSimpleTemplate(apiName, apiData, language);
  }

  /**
   * Simple template generator (placeholder for template system)
   */
  private generateSimpleTemplate(
    apiName: string,
    apiData: ApiDocumentationData,
    language: string
  ): string {
    const { categorizedExamples, metadata } = apiData;

    let content = `# ${apiName}\n\n`;

    content += `## Overview\n\n`;
    content += `${apiName} is a core API in the framework.\n\n`;

    // Quick Start
    const basicExamples = categorizedExamples['basic-usage'] || [];
    if (basicExamples.length > 0) {
      content += `## Quick Start\n\n`;
      content += `\`\`\`typescript\n${basicExamples[0].cleanedCode}\n\`\`\`\n\n`;
    }

    // Usage Examples
    content += `## Usage Examples\n\n`;
    Object.entries(categorizedExamples).forEach(([category, examples]) => {
      if (examples.length > 0) {
        content += `### ${this.formatCategoryName(category)}\n\n`;
        examples.slice(0, 3).forEach((example, index) => {
          content += `#### Example ${index + 1}: ${example.description}\n\n`;
          content += `\`\`\`typescript\n${example.cleanedCode}\n\`\`\`\n\n`;
        });
      }
    });

    // Test Coverage
    content += `## Test Coverage\n\n`;
    content += `This API is tested with **${metadata.testCount} test cases** across ${metadata.fileCount} test files.\n\n`;

    content += `---\n\n`;
    content += `*This documentation is automatically generated from test code.*\n`;

    return content;
  }

  /**
   * Format category name for display
   */
  private formatCategoryName(category: string): string {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}