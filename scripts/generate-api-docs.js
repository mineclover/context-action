#!/usr/bin/env node

/**
 * Enhanced Test-Based API Documentation Generator - Phase 2
 *
 * Intelligent extraction and generation of API documentation from test code
 * with categorization, quality improvements, and multiple example formats.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Try to use the new library, fallback to original implementation
let useLibrary = false;
let createDocumentationGenerator;

try {
  const libModule = await import('../packages/test-driven-docs/dist/index.js');
  createDocumentationGenerator = libModule.createDocumentationGenerator;
  useLibrary = true;
  console.log('🚀 Using @context-action/test-driven-docs library');
} catch (error) {
  console.log('📝 Using original implementation (library not available)');
  // Fallback to original imports
  const { TestParser } = await import('./extract/test-parser.js');
  const { CodeCleaner } = await import('./extract/code-cleaner.js');
  const { generateEnhancedApiDoc } = await import('./templates/enhanced-api-doc.template.js');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.join(__dirname, '../packages');
const docsDir = path.join(__dirname, '../docs');

/**
 * API 문서 템플릿
 */
function createApiDocTemplate(apiName, examples, description = '') {
  return `# ${apiName}

${description}

## Usage Examples

${examples.map((example, index) => `
### Example ${index + 1}

\`\`\`typescript
${example.code}
\`\`\`

${example.description || ''}
`).join('\n')}

## Test Coverage

이 API는 다음 테스트 파일에서 검증됩니다:
${examples.map(ex => `- [${ex.testFile}](../../packages/${ex.packageName}/${ex.testFile})`).join('\n')}

## Related APIs

- 관련 API 링크들이 여기에 추가됩니다.

---
*이 문서는 테스트 코드를 기반으로 자동 생성되었습니다.*
`;
}

/**
 * Extract examples from test file using enhanced parser
 */
async function extractExamplesFromTest(testFilePath, packageName) {
  const parser = new TestParser({
    cleanMocks: true,
    extractTypes: true,
    categorizeExamples: true,
    includeComments: false
  });

  const cleaner = new CodeCleaner({
    removeComments: true,
    removeTestArtifacts: true,
    formatCode: true,
    realistic: true
  });

  try {
    const parsed = await parser.parseTestFile(testFilePath, packageName);

    // Clean and enhance examples
    if (parsed.categorizedExamples) {
      Object.keys(parsed.categorizedExamples).forEach(category => {
        parsed.categorizedExamples[category] = parsed.categorizedExamples[category].map(example => ({
          ...example,
          cleanedCode: cleaner.cleanCode(example.cleanedCode, { category }),
          testFile: path.relative(path.join(packagesDir, packageName), testFilePath)
        }));
      });
    }

    return parsed;
  } catch (error) {
    console.warn(`⚠️  Failed to parse ${testFilePath}:`, error.message);
    return { categorizedExamples: {}, examples: [], metadata: { testCount: 0 } };
  }
}

/**
 * Scan all test files in a package
 */
async function scanPackageTests(packageName) {
  const packagePath = path.join(packagesDir, packageName);
  const testDir = path.join(packagePath, '__tests__');

  try {
    const testResults = [];
    const files = await fs.readdir(testDir, { recursive: true });

    for (const file of files) {
      if (file.endsWith('.test.ts') || file.endsWith('.spec.ts')) {
        const testFilePath = path.join(testDir, file);
        console.log(`  📁 Scanning ${file}...`);

        const testData = await extractExamplesFromTest(testFilePath, packageName);
        if (testData.examples && testData.examples.length > 0) {
          testResults.push(testData);
        }
      }
    }

    return testResults;
  } catch (error) {
    console.log(`⚠️  No test directory found for ${packageName}`);
    return [];
  }
}

/**
 * Group test results by API
 */
function groupTestDataByApi(testResults) {
  const grouped = {};

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
              metadata: { testCount: 0 }
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
          }

          // Set package name
          grouped[api].packageName = testData.packageName;
        });
      }
    });
  });

  return grouped;
}

/**
 * Generate enhanced API documentation
 */
async function generateApiDocs() {
  if (useLibrary) {
    return await generateWithLibrary();
  } else {
    return await generateWithOriginal();
  }
}

/**
 * Generate documentation using the new library
 */
async function generateWithLibrary() {
  console.log('🔍 Enhanced test-based API documentation generation starting with library...');

  try {
    const generator = createDocumentationGenerator({
      packagesDir,
      packages: ['core', 'react'],
      outputDir: docsDir,
      languages: ['en', 'ko'],
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
      }
    });

    const result = await generator.generate();

    if (result.success) {
      console.log('\\n🎉 Library-based documentation generation completed successfully!');
      console.log(`📚 Generated documentation for ${result.apisGenerated.length} APIs`);
      console.log(`📊 Processed ${result.filesProcessed} test files`);
      console.log(`🎯 Covered ${result.categoriesCovered} categories`);
    } else {
      console.error('❌ Library-based generation failed');
      result.errors.forEach(error => console.error(`  ${error.type}: ${error.message}`));
    }

    return result;
  } catch (error) {
    console.error('💥 Library generation error:', error.message);
    throw error;
  }
}

/**
 * Generate documentation using original implementation
 */
async function generateWithOriginal() {
  console.log('🔍 Enhanced test-based API documentation generation starting with original...');

  // Scan packages with enhanced parsing
  console.log('📋 Scanning Core package...');
  const coreTestData = await scanPackageTests('core');
  console.log(`  Found ${coreTestData.length} test files with examples`);

  console.log('⚛️ Scanning React package...');
  const reactTestData = await scanPackageTests('react');
  console.log(`  Found ${reactTestData.length} test files with examples`);

  // Combine all test data
  const allTestData = [...coreTestData, ...reactTestData];

  // Group by API
  const groupedData = groupTestDataByApi(allTestData);
  const discoveredAPIs = Object.keys(groupedData);

  console.log(`📚 Discovered APIs: ${discoveredAPIs.join(', ')}`);

  // Generate documentation for each API
  let generatedCount = 0;
  for (const [apiName, apiData] of Object.entries(groupedData)) {
    try {
      console.log(`📝 Generating documentation for ${apiName}...`);

      // Generate enhanced documentation
      const enhancedDoc = generateEnhancedApiDoc(apiName, apiData);

      // Write English documentation
      const enDocPath = path.join(docsDir, 'en', 'api', `${apiName.toLowerCase()}.md`);
      await fs.mkdir(path.dirname(enDocPath), { recursive: true });
      await fs.writeFile(enDocPath, enhancedDoc);

      // Generate Korean version with translations
      const koreanDoc = generateKoreanDoc(enhancedDoc, apiName, apiData);
      const koDocPath = path.join(docsDir, 'ko', 'api', `${apiName.toLowerCase()}.md`);
      await fs.mkdir(path.dirname(koDocPath), { recursive: true });
      await fs.writeFile(koDocPath, koreanDoc);

      console.log(`  ✅ ${apiName} documentation generated`);
      generatedCount++;
    } catch (error) {
      console.error(`  ❌ Failed to generate ${apiName} documentation:`, error.message);
    }
  }

  // Generate summary report
  console.log('\n📊 Generation Summary:');
  console.log(`  📝 Total APIs documented: ${generatedCount}`);
  console.log(`  📁 Test files processed: ${allTestData.length}`);
  console.log(`  🎯 Categories covered: ${getUniqueCategoriesCount(groupedData)}`);

  if (generatedCount > 0) {
    console.log('\n🎉 Enhanced API documentation generation completed successfully!');
    console.log('📍 Next steps: Review generated docs and update navigation if needed');
  } else {
    console.log('\n⚠️  No API documentation was generated. Check test files and API patterns.');
  }
}

/**
 * Generate Korean version of documentation
 */
function generateKoreanDoc(englishDoc, apiName, apiData) {
  // More comprehensive Korean translation
  let koreanDoc = englishDoc
    .replace(/# (.+)/, `# $1`)
    .replace(/## Overview/, '## 개요')
    .replace(/## Quick Start/, '## 빠른 시작')
    .replace(/## Usage Examples/, '## 사용 예제')
    .replace(/## Advanced Usage/, '## 고급 사용법')
    .replace(/## Error Handling/, '## 에러 처리')
    .replace(/## Performance Considerations/, '## 성능 고려사항')
    .replace(/## Test Coverage/, '## 테스트 커버리지')
    .replace(/## Related APIs/, '## 관련 API')
    .replace(/### Basic Usage/, '### 기본 사용법')
    .replace(/### Advanced Patterns/, '### 고급 패턴')
    .replace(/### Integration Examples/, '### 통합 예제')
    .replace(/### Key Features/, '### 주요 기능')
    .replace(/### When to Use/, '### 사용 시점')
    .replace(/Here's the simplest way to use/, '가장 간단한 사용 방법:')
    .replace(/Here are examples of proper error handling patterns:/, '적절한 에러 처리 패턴 예제:')
    .replace(/This API is thoroughly tested with/, '이 API는 철저하게 테스트되었습니다.')
    .replace(/test cases covering:/, '개의 테스트 케이스로 다음을 검증합니다:')
    .replace(/The following test files validate this API:/, '다음 테스트 파일들이 이 API를 검증합니다:')
    .replace(/This API provides full TypeScript support with:/, '이 API는 다음과 같은 완전한 TypeScript 지원을 제공합니다:')
    .replace(/This documentation is automatically generated from test code to ensure accuracy and completeness\./, '이 문서는 테스트 코드를 기반으로 자동 생성되어 정확성과 완성도를 보장합니다.')
    .replace(/\*This documentation is automatically generated\* from test code to ensure accuracy and completeness\./, '*이 문서는 테스트 코드를 기반으로 자동 생성되어* 정확성과 완성도를 보장합니다.')
    // Fix specific mixed language phrases
    .replace(/이 API는 철저하게 테스트되었습니다 with/, '이 API는')
    .replace(/이 문서는 테스트 코드를 기반으로 자동 생성되었습니다 from test code to ensure accuracy and completeness\./, '이 문서는 테스트 코드를 기반으로 자동 생성되어 정확성과 완성도를 보장합니다.');

  return koreanDoc;
}

/**
 * Get count of unique categories across all APIs
 */
function getUniqueCategoriesCount(groupedData) {
  const categories = new Set();
  Object.values(groupedData).forEach(apiData => {
    Object.keys(apiData.categorizedExamples).forEach(category => {
      categories.add(category);
    });
  });
  return categories.size;
}

// 스크립트 실행
generateApiDocs().catch(console.error);