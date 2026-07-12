import fs from 'fs/promises';
import path from 'path';
import { TestParser } from '../parsers/TestParser.js';
import { CodeCleaner } from '../cleaners/CodeCleaner.js';
import { AnnotationExtractor, AnnotatedTest } from '../extractors/AnnotationExtractor.js';
import { EnhancedMarkdownGenerator } from '../generators/EnhancedMarkdownGenerator.js';
import { ConsistencyValidator, ProjectValidationReport } from '../validators/ConsistencyValidator.js';
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
  private annotationExtractor: AnnotationExtractor;
  private enhancedGenerator: EnhancedMarkdownGenerator;
  private validator: ConsistencyValidator;

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
    this.annotationExtractor = new AnnotationExtractor();
    this.enhancedGenerator = new EnhancedMarkdownGenerator({
      includeOverview: true,
      includeValidationSection: true,
      includeMetadata: true,
      githubRepoUrl: config.githubRepoUrl
    });

    // Initialize validator with test and docs directories
    const testDir = path.join(this.config.packagesDir, 'react/__tests__');
    const docsDir = path.join(this.config.outputDir, 'enhanced');
    this.validator = new ConsistencyValidator(testDir, docsDir);
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
   * Generate enhanced documentation with annotation support
   */
  async generateEnhanced(): Promise<GenerationResult> {
    const result: GenerationResult = {
      success: false,
      apisGenerated: [],
      filesProcessed: 0,
      categoriesCovered: 0,
      errors: []
    };

    try {
      console.log('🚀 Starting enhanced documentation generation...');

      // Create enhanced output directory
      const enhancedDir = path.join(this.config.outputDir, 'enhanced');
      await fs.mkdir(enhancedDir, { recursive: true });

      // Find all usage test files
      const testFiles = await this.findUsageTestFiles();
      console.log(`📋 Found ${testFiles.length} usage test files`);

      const apiDocumentations = new Map<string, AnnotatedTest[]>();

      // Process each test file
      for (const testFile of testFiles) {
        try {
          const content = await fs.readFile(testFile, 'utf8');
          const apiName = this.extractApiName(testFile);

          // Extract annotated tests
          const annotatedTests = this.annotationExtractor.extractAnnotatedTests(content, testFile);

          if (annotatedTests.length > 0) {
            console.log(`  📝 ${apiName}: Found ${annotatedTests.length} annotated tests`);
            apiDocumentations.set(apiName, annotatedTests);

            // Generate enhanced markdown for this API
            const markdownContent = this.enhancedGenerator.generateApiDocumentation(
              apiName,
              annotatedTests
            );

            // Write enhanced documentation
            const outputPath = path.join(enhancedDir, `${apiName}.enhanced.md`);
            await fs.writeFile(outputPath, markdownContent);

            result.apisGenerated.push(apiName);
          } else {
            console.log(`  ⚠️  ${apiName}: No annotated tests found`);
          }

          result.filesProcessed++;

        } catch (error) {
          const generationError: GenerationError = {
            type: 'file-io',
            message: error instanceof Error ? error.message : 'Unknown error',
            file: testFile
          };
          result.errors.push(generationError);
          console.error(`  ❌ Failed to process ${testFile}:`, generationError.message);
        }
      }

      // Generate index documentation
      if (apiDocumentations.size > 0) {
        const indexContent = this.enhancedGenerator.generateIndexDocumentation(apiDocumentations);
        const indexPath = path.join(enhancedDir, 'README.md');
        await fs.writeFile(indexPath, indexContent);
        console.log('  📄 Generated index documentation');
      }

      // Calculate categories covered
      const allCategories = new Set<string>();
      for (const tests of apiDocumentations.values()) {
        tests.forEach(test => allCategories.add(test.annotation.category));
      }
      result.categoriesCovered = allCategories.size;

      // Summary
      console.log('\n📊 Enhanced Generation Summary:');
      console.log(`  📝 APIs documented: ${result.apisGenerated.length}`);
      console.log(`  📁 Test files processed: ${result.filesProcessed}`);
      console.log(`  🎯 Categories covered: ${result.categoriesCovered}`);

      if (result.apisGenerated.length > 0) {
        console.log('\n🎉 Enhanced documentation generation completed successfully!');
        result.success = true;
      } else {
        console.log('\n⚠️  No enhanced documentation was generated. Add @doc-extract annotations to test files.');
      }

    } catch (error) {
      const generationError: GenerationError = {
        type: 'file-io',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      result.errors.push(generationError);
      console.error('❌ Enhanced documentation generation failed:', generationError.message);
    }

    return result;
  }

  /**
   * Generate enhanced documentation with validation
   */
  async generateWithValidation(): Promise<{ generation: GenerationResult; validation: ProjectValidationReport }> {
    console.log('🔧 Starting enhanced generation with validation...');

    // First generate enhanced documentation
    const generation = await this.generateEnhanced();

    // Then validate consistency
    console.log('\n🔍 Validating documentation consistency...');
    const validation = await this.validator.validateProject();

    // Print validation summary
    console.log('\n📊 Validation Summary:');
    console.log(`  📋 APIs validated: ${validation.summary.totalApis}`);
    console.log(`  ✅ Synced: ${validation.summary.syncedApis}`);
    console.log(`  ⚠️  Outdated: ${validation.summary.outdatedApis}`);
    console.log(`  ❌ Missing: ${validation.summary.missingApis}`);
    console.log(`  📈 Average quality score: ${validation.summary.averageScore}%`);

    if (validation.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      validation.recommendations.forEach(rec => console.log(`  ${rec}`));
    }

    return { generation, validation };
  }

  /**
   * Validate documentation consistency
   */
  async validateConsistency(): Promise<ProjectValidationReport> {
    console.log('🔍 Validating documentation consistency...');
    return await this.validator.validateProject();
  }

  /**
   * Find usage test files across all packages
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

    // Walk through all package test directories
    for (const packageName of this.config.packages) {
      const packageTestDir = path.join(this.config.packagesDir, packageName, '__tests__');
      await walkDir(packageTestDir);
    }

    return files;
  }

  /**
   * Extract API name from test file path
   */
  private extractApiName(testFile: string): string {
    return path.basename(testFile, '.usage.test.tsx');
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
                categorizedExamples: {
                  'basic-usage': [],
                  'advanced-patterns': [],
                  'error-handling': [],
                  performance: [],
                  integration: [],
                  'async-patterns': []
                },
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
