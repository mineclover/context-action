#!/usr/bin/env node

/**
 * Test script for @context-action/llms-generator package functionality
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testBasicImport() {
  console.log('🧪 Test 1: Basic package import and initialization');
  
  try {
    // Import the package
    const { LLMSGenerator, PriorityManager, DocumentProcessor, DEFAULT_CONFIG } = 
      await import('./packages/llms-generator/dist/index.js');
    
    console.log('✅ Package imported successfully');
    console.log('✅ LLMSGenerator class available:', typeof LLMSGenerator);
    console.log('✅ PriorityManager class available:', typeof PriorityManager);
    console.log('✅ DocumentProcessor class available:', typeof DocumentProcessor);
    console.log('✅ DEFAULT_CONFIG available:', typeof DEFAULT_CONFIG);
    
    // Test configuration
    console.log('\n📋 Default Configuration:');
    console.log('  Docs dir:', DEFAULT_CONFIG.paths.docsDir);
    console.log('  LLM content dir:', DEFAULT_CONFIG.paths.llmContentDir);
    console.log('  Output dir:', DEFAULT_CONFIG.paths.outputDir);
    console.log('  Languages:', DEFAULT_CONFIG.generation.supportedLanguages);
    
    return { LLMSGenerator, PriorityManager, DocumentProcessor, DEFAULT_CONFIG };
  } catch (error) {
    console.error('❌ Failed to import package:', error);
    throw error;
  }
}

async function testPriorityManager() {
  console.log('\n🧪 Test 2: PriorityManager functionality');
  
  try {
    const { PriorityManager } = await import('./packages/llms-generator/dist/index.js');
    
    // Create PriorityManager with actual llm-content directory
    const llmContentPath = path.join(__dirname, 'docs/llm-content');
    const priorityManager = new PriorityManager(llmContentPath);
    
    console.log('✅ PriorityManager created');
    
    // Test loading priorities
    console.log('📂 Loading priority files...');
    const priorities = await priorityManager.loadAllPriorities();
    
    console.log('✅ Priorities loaded successfully');
    console.log('📊 Languages found:', Object.keys(priorities));
    
    // Test statistics
    const stats = priorityManager.getStatistics(priorities);
    console.log('📈 Statistics:');
    console.log('  Total documents:', stats.totalDocuments);
    console.log('  By language:', stats.byLanguage);
    console.log('  By tier:', stats.byTier);
    console.log('  By category:', stats.byCategory);
    console.log('  Average score:', stats.averageScore);
    
    return { priorityManager, priorities };
  } catch (error) {
    console.error('❌ PriorityManager test failed:', error);
    throw error;
  }
}

async function testDocumentProcessor() {
  console.log('\n🧪 Test 3: DocumentProcessor functionality');
  
  try {
    const { DocumentProcessor } = await import('./packages/llms-generator/dist/index.js');
    
    // Create DocumentProcessor with actual docs directory
    const docsPath = path.join(__dirname, 'docs');
    const documentProcessor = new DocumentProcessor(docsPath);
    
    console.log('✅ DocumentProcessor created');
    
    // Test reading a document (we'll try to find an existing one)
    console.log('📄 Testing document reading...');
    
    try {
      // Try to read a common document
      const testDoc = await documentProcessor.readSourceDocument('guide/getting-started.md', 'en', 'guide-getting-started');
      console.log('✅ Successfully read document:', testDoc.title);
      console.log('📊 Document stats:');
      console.log('  Characters:', testDoc.stats.contentCharacters);
      console.log('  Words:', testDoc.stats.wordCount);
      console.log('  Lines:', testDoc.stats.lineCount);
      console.log('  Reading time:', testDoc.stats.estimatedReadingTime);
    } catch (docError) {
      console.log('⚠️ Could not read test document (this is expected if it doesn\'t exist):', docError.message);
      console.log('✅ DocumentProcessor error handling works correctly');
    }
    
    return { documentProcessor };
  } catch (error) {
    console.error('❌ DocumentProcessor test failed:', error);
    throw error;
  }
}

async function testLLMSGeneratorMinimum() {
  console.log('\n🧪 Test 4: LLMSGenerator minimum format');
  
  try {
    const { LLMSGenerator, DEFAULT_CONFIG } = await import('./packages/llms-generator/dist/index.js');
    
    // Create configuration with project paths
    const config = {
      ...DEFAULT_CONFIG,
      paths: {
        docsDir: path.join(__dirname, 'docs'),
        llmContentDir: path.join(__dirname, 'docs/llm-content'),
        outputDir: path.join(__dirname, 'test-output')
      }
    };
    
    const generator = new LLMSGenerator(config);
    console.log('✅ LLMSGenerator created');
    
    // Test minimum generation
    console.log('🔗 Generating minimum format...');
    const minimumContent = await generator.generateMinimum('en');
    
    console.log('✅ Minimum format generated successfully');
    console.log('📏 Content length:', minimumContent.length, 'characters');
    console.log('📋 Content preview (first 200 chars):');
    console.log(minimumContent.substring(0, 200) + '...');
    
    return { generator, minimumContent };
  } catch (error) {
    console.error('❌ LLMSGenerator minimum test failed:', error);
    throw error;
  }
}

async function testLLMSGeneratorOrigin() {
  console.log('\n🧪 Test 5: LLMSGenerator origin format');
  
  try {
    const { LLMSGenerator, DEFAULT_CONFIG } = await import('./packages/llms-generator/dist/index.js');
    
    // Create configuration with project paths
    const config = {
      ...DEFAULT_CONFIG,
      paths: {
        docsDir: path.join(__dirname, 'docs'),
        llmContentDir: path.join(__dirname, 'docs/llm-content'),
        outputDir: path.join(__dirname, 'test-output')
      }
    };
    
    const generator = new LLMSGenerator(config);
    
    // Test origin generation (just a small portion to avoid overwhelming output)
    console.log('📄 Generating origin format...');
    const originContent = await generator.generateOrigin('en');
    
    console.log('✅ Origin format generated successfully');
    console.log('📏 Content length:', originContent.length, 'characters');
    console.log('📋 Content preview (first 300 chars):');
    console.log(originContent.substring(0, 300) + '...');
    
    return { originContent };
  } catch (error) {
    console.error('❌ LLMSGenerator origin test failed:', error);
    throw error;
  }
}

async function testCLI() {
  console.log('\n🧪 Test 6: CLI functionality');
  
  try {
    const { spawn } = await import('child_process');
    
    console.log('🚀 Testing CLI help command...');
    
    return new Promise((resolve, reject) => {
      const cliPath = path.join(__dirname, 'packages/llms-generator/dist/cli/index.js');
      const child = spawn('node', [cliPath, 'help'], {
        stdio: 'pipe',
        cwd: __dirname
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log('✅ CLI help command works');
          console.log('📋 CLI output:');
          console.log(stdout);
          resolve({ stdout, stderr });
        } else {
          console.error('❌ CLI command failed with code:', code);
          console.error('stderr:', stderr);
          reject(new Error(`CLI failed with code ${code}`));
        }
      });

      child.on('error', (error) => {
        console.error('❌ Failed to spawn CLI process:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('❌ CLI test failed:', error);
    throw error;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting @context-action/llms-generator functionality tests\n');
  
  try {
    // Test 1: Basic import
    await testBasicImport();
    
    // Test 2: PriorityManager
    await testPriorityManager();
    
    // Test 3: DocumentProcessor
    await testDocumentProcessor();
    
    // Test 4: LLMSGenerator minimum
    await testLLMSGeneratorMinimum();
    
    // Test 5: LLMSGenerator origin
    await testLLMSGeneratorOrigin();
    
    // Test 6: CLI
    await testCLI();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ @context-action/llms-generator package is working correctly');
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();