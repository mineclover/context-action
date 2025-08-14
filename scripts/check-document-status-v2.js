#!/usr/bin/env node

/**
 * Document Status Checker V2
 * 
 * Updated for folder-based structure with YAML metadata
 * Checks: docs/llm-content/en/documentId/documentId-charLimit.txt
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LLM_CONTENT_DIR = path.join(__dirname, '../docs/llm-content');
const SUPPORTED_LANGUAGES = ['en', 'ko'];

class DocumentStatusCheckerV2 {
  constructor() {
    this.statistics = {
      total: 0,
      placeholder: 0,
      draft: 0,
      complete: 0,
      review: 0,
      withinTarget: 0,
      overTarget: 0,
      underTarget: 0
    };
    
    console.log('📋 Document Status Checker V2 initialized');
  }
  
  /**
   * Scan all files in folder structure
   */
  scanAllFiles() {
    console.log('\n🔍 Scanning document folders...');
    
    const results = [];
    
    for (const language of SUPPORTED_LANGUAGES) {
      const langDir = path.join(LLM_CONTENT_DIR, language);
      
      if (!fs.existsSync(langDir)) {
        console.warn(`  ⚠️  ${language} directory not found`);
        continue;
      }
      
      console.log(`  📂 Scanning ${language.toUpperCase()} folders...`);
      
      const docFolders = fs.readdirSync(langDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
      
      for (const docFolder of docFolders) {
        const docFolderPath = path.join(langDir, docFolder);
        const files = fs.readdirSync(docFolderPath).filter(f => f.endsWith('.txt'));
        
        console.log(`    📁 ${docFolder}: ${files.length} files`);
        
        for (const fileName of files) {
          const filePath = path.join(docFolderPath, fileName);
          const fileInfo = this.analyzeFile(filePath, fileName, language, docFolder);
          
          if (fileInfo) {
            results.push(fileInfo);
            this.updateStatistics(fileInfo);
          }
        }
      }
    }
    
    return results;
  }
  
  /**
   * Analyze individual file with YAML metadata
   */
  analyzeFile(filePath, fileName, language, docFolder) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extract YAML front matter
      const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!yamlMatch) {
        console.warn(`    ⚠️  No YAML metadata in ${fileName}`);
        return null;
      }
      
      const yamlText = yamlMatch[1];
      const metadata = this.parseYAML(yamlText);
      
      // Calculate content without YAML
      const contentWithoutYaml = content.replace(/^---\n[\s\S]*?\n---\n/, '');
      const actualLength = contentWithoutYaml.length;
      
      const charLimit = metadata.char_limit || 0;
      const targetMin = Math.floor(charLimit * 0.9);
      const targetMax = Math.ceil(charLimit * 1.1);
      
      return {
        language,
        docFolder,
        fileName,
        filePath,
        ...metadata,
        actualLength,
        targetMin,
        targetMax,
        isWithinTarget: actualLength >= targetMin && actualLength <= targetMax,
        isOverTarget: actualLength > targetMax,
        isUnderTarget: actualLength < targetMin,
        targetRatio: charLimit > 0 ? (actualLength / charLimit * 100).toFixed(1) : '0'
      };
      
    } catch (error) {
      console.warn(`    ⚠️  Could not analyze ${fileName}: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Simple YAML parser for metadata
   */
  parseYAML(yamlText) {
    const metadata = {};
    const lines = yamlText.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        
        // Parse different value types
        if (value === 'true') metadata[key] = true;
        else if (value === 'false') metadata[key] = false;
        else if (/^\d+$/.test(value)) metadata[key] = parseInt(value);
        else if (/^".*"$/.test(value)) metadata[key] = value.slice(1, -1);
        else metadata[key] = value;
      }
    }
    
    return metadata;
  }
  
  /**
   * Update statistics based on file info
   */
  updateStatistics(fileInfo) {
    this.statistics.total++;
    
    const status = fileInfo.status || 'placeholder';
    this.statistics[status] = (this.statistics[status] || 0) + 1;
    
    if (status !== 'placeholder') {
      if (fileInfo.isWithinTarget) this.statistics.withinTarget++;
      else if (fileInfo.isOverTarget) this.statistics.overTarget++;
      else this.statistics.underTarget++;
    }
  }
  
  /**
   * Display status report
   */
  displayReport(results) {
    console.log('\n📋 Document Status Report');
    console.log('=' .repeat(50));
    
    console.log(`\n📊 Overall Statistics:`);
    console.log(`  Total Files: ${this.statistics.total}`);
    console.log(`  📝 Placeholder: ${this.statistics.placeholder} (${Math.round(this.statistics.placeholder/this.statistics.total*100)}%)`);
    console.log(`  📄 Draft: ${this.statistics.draft || 0} (${Math.round((this.statistics.draft || 0)/this.statistics.total*100)}%)`);
    console.log(`  ✅ Complete: ${this.statistics.complete || 0} (${Math.round((this.statistics.complete || 0)/this.statistics.total*100)}%)`);
    console.log(`  🔍 Review: ${this.statistics.review || 0} (${Math.round((this.statistics.review || 0)/this.statistics.total*100)}%)`);
    
    const written = this.statistics.total - this.statistics.placeholder;
    if (written > 0) {
      console.log(`\n🎯 Character Count Accuracy (Written Files):`);
      console.log(`  ✅ Within Target: ${this.statistics.withinTarget}`);
      console.log(`  ⚠️  Over Target: ${this.statistics.overTarget}`);
      console.log(`  🔍 Under Target: ${this.statistics.underTarget}`);
    }
    
    // Show high priority incomplete files
    const incomplete = results.filter(f => (f.status === 'placeholder') && (f.priority >= 80));
    if (incomplete.length > 0) {
      console.log(`\n🔥 High Priority Incomplete (${incomplete.length}):`);
      incomplete.slice(0, 10).forEach(file => {
        console.log(`  - ${file.docFolder}/${file.fileName} (priority: ${file.priority})`);
      });
    }
  }
  
  /**
   * Run complete check
   */
  async runCheck() {
    console.log('🚀 Starting document status check...\n');
    
    const results = this.scanAllFiles();
    this.displayReport(results);
    
    console.log('\n✅ Document status check complete!');
    return results;
  }
}

// CLI execution
async function main() {
  const checker = new DocumentStatusCheckerV2();
  
  try {
    await checker.runCheck();
  } catch (error) {
    console.error('❌ Status check failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DocumentStatusCheckerV2 };
export default DocumentStatusCheckerV2;
