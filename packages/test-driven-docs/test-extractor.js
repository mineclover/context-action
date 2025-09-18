import { TestMetadataExtractor } from './dist/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function testExtractor() {
  try {
    console.log('🔍 Testing TestMetadataExtractor...');

    const extractor = new TestMetadataExtractor();

    // Test with a single file
    const testFile = join(__dirname, '../react/__tests__/stores/event-object-prevention.test.tsx');
    console.log(`📄 Processing single file: ${testFile}`);

    const fileMetadata = await extractor.extractFromFile(testFile);
    console.log('✅ Single file extraction successful!');
    console.log(`  - Test cases: ${fileMetadata.testCases.length}`);
    console.log(`  - Test suites: ${fileMetadata.testSuites.length}`);
    console.log(`  - APIs detected: ${fileMetadata.apiUsage.length}`);

    // Test with a directory
    const testDir = join(__dirname, '../react/__tests__/stores');
    console.log(`\n📁 Processing directory: ${testDir}`);

    const dirMetadata = await extractor.extractFromDirectory(testDir);
    console.log('✅ Directory extraction successful!');
    console.log('\n📊 Project Summary:');
    console.log(`  - Total files: ${dirMetadata.totalFiles}`);
    console.log(`  - Total test cases: ${dirMetadata.summary.totalTestCases}`);
    console.log(`  - Total test suites: ${dirMetadata.summary.totalTestSuites}`);
    console.log(`  - Unique APIs: ${dirMetadata.summary.uniqueApis.join(', ') || 'none'}`);
    console.log(`  - Test frameworks: ${JSON.stringify(dirMetadata.summary.filesByFramework)}`);

    console.log('\n📋 File breakdown:');
    dirMetadata.files.forEach(file => {
      console.log(`  - ${file.fileName}: ${file.testCases.length} tests, ${file.testSuites.length} suites`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testExtractor();